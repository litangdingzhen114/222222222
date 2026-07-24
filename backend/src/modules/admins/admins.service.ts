import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminRole,
  FeedbackStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ReservationOrderStatus,
  ShippingStatus,
  TokenSubjectType,
} from '@prisma/client';
import { getPagination, toPageResult } from '../../common/dto/page.dto';
import { toInputJson } from '../../common/utils/json.util';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { AuthPrincipal } from '../auth/auth.types';
import {
  AdminResourceMutationDto,
  AdminResourceQueryDto,
  ReplyFeedbackDto,
  ShipOrderDto,
} from './dto/admins.dto';

interface CrudDelegate {
  findMany(args: Record<string, unknown>): Promise<unknown[]>;
  count(args: Record<string, unknown>): Promise<number>;
  create(args: Record<string, unknown>): Promise<unknown>;
  update(args: Record<string, unknown>): Promise<unknown>;
  updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
}

interface ResourceConfig {
  delegate: CrudDelegate;
  area: 'content' | 'mall' | 'admin';
  softDelete: boolean;
  statusMap?: { publish: string; offline: string };
}

@Injectable()
export class AdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async overview(principal: AuthPrincipal) {
    this.assertAdmin(principal, 'admin');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [users, orders, reservations, activities, feedbackPending, productLowStock] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.order.count(),
        this.prisma.reservationOrder.count(),
        this.prisma.activity.count({ where: { deletedAt: null } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
        this.prisma.product.count({ where: { stock: { lte: 10 }, deletedAt: null } }),
      ]);
    return { users, orders, reservations, activities, feedbackPending, productLowStock };
  }

  async me(principal: AuthPrincipal) {
    this.assertAdmin(principal, 'admin');
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: principal.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!admin) throw new NotFoundException('admin not found');
    return { admin };
  }

  async dashboard(principal: AuthPrincipal) {
    this.assertAdmin(principal, 'admin');
    const now = new Date();
    const today = this.startOfDay(now);
    const sevenDaysAgo = this.addDays(today, -6);
    const [
      users,
      todayUsers,
      scenicSpots,
      activities,
      pendingReservations,
      pendingShipments,
      todayOrderAgg,
      totalOrderAgg,
      productLowStock,
      feedbackPending,
      recentUsers,
      recentOrders,
      ordersByStatus,
      popularSpots,
      hotProducts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
      this.prisma.scenicSpot.count({ where: { deletedAt: null } }),
      this.prisma.activity.count({ where: { deletedAt: null } }),
      this.prisma.reservationOrder.count({
        where: {
          status: {
            in: [
              ReservationOrderStatus.PENDING_PAYMENT,
              ReservationOrderStatus.PAID,
              ReservationOrderStatus.CONFIRMED,
            ],
          },
        },
      }),
      this.prisma.order.count({
        where: { shippingStatus: ShippingStatus.NOT_SHIPPED, status: OrderStatus.PAID },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: PaymentStatus.PAID },
        _sum: { paidAmount: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { paidAmount: true },
        _count: { _all: true },
      }),
      this.prisma.product.count({ where: { stock: { lte: 10 }, deletedAt: null } }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
      this.prisma.user.findMany({
        where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
        take: 1000,
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, paidAmount: true, paymentStatus: true },
        take: 2000,
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.scenicSpot.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 8,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, sales: true, stock: true },
        orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
    ]);

    const trend = this.buildSevenDayTrend(sevenDaysAgo, recentUsers, recentOrders);
    return {
      metrics: {
        users,
        todayUsers,
        scenicSpots,
        activities,
        pendingReservations,
        pendingShipments,
        todayOrderAmount: todayOrderAgg._sum.paidAmount ?? 0,
        todayOrderCount: todayOrderAgg._count._all,
        totalOrderAmount: totalOrderAgg._sum.paidAmount ?? 0,
        totalOrderCount: totalOrderAgg._count._all,
        productLowStock,
        feedbackPending,
      },
      charts: {
        trend,
        orderStatusDistribution: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count._all,
        })),
        popularSpots: popularSpots.map((item) => ({
          id: item.id,
          name: item.name,
          value: item.viewCount,
        })),
        hotProducts: hotProducts.map((item) => ({
          id: item.id,
          name: item.name,
          sales: item.sales,
          stock: item.stock,
        })),
      },
    };
  }

  configStatus(principal: AuthPrincipal) {
    this.assertAdmin(principal, 'admin');
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const storageDriver = this.config.get<string>('STORAGE_DRIVER', 'local');
    const cosConfigured = this.hasAll([
      'TENCENT_COS_SECRET_ID',
      'TENCENT_COS_SECRET_KEY',
      'TENCENT_COS_BUCKET',
      'TENCENT_COS_REGION',
    ]);
    const items = [
      {
        key: 'postgresql',
        name: 'PostgreSQL',
        status: 'configured',
        mode: 'official',
        message: 'DATABASE_URL 已配置，数据库健康状态请参考 /health/database。',
      },
      {
        key: 'redis',
        name: 'Redis',
        status: this.redis.isAvailable() ? 'configured' : 'abnormal',
        mode: this.redis.isAvailable() ? 'official' : 'degraded',
        message: this.redis.isAvailable()
          ? 'Redis 已连接，可用于缓存、限流和短期幂等状态。'
          : 'Redis 当前不可用，部分能力将以数据库安全路径降级。',
      },
      {
        key: 'wechat',
        name: '微信登录',
        ...this.thirdPartyStatus(
          this.hasAll(['WECHAT_APP_ID', 'WECHAT_APP_SECRET']),
          this.config.get<boolean>('WECHAT_MOCK_ENABLED', false),
          isProduction,
          '等待配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET。',
        ),
      },
      {
        key: 'wechatPay',
        name: '微信支付',
        ...this.thirdPartyStatus(
          this.hasAll([
            'WECHAT_PAY_APP_ID',
            'WECHAT_PAY_MCH_ID',
            'WECHAT_PAY_API_V3_KEY',
            'WECHAT_PAY_SERIAL_NO',
            'WECHAT_PAY_PRIVATE_KEY_PATH',
            'WECHAT_PAY_NOTIFY_URL',
          ]),
          false,
          isProduction,
          '等待配置微信支付商户号、API v3 key、证书路径和回调地址。',
        ),
      },
      {
        key: 'ezviz',
        name: '萤石云',
        ...this.thirdPartyStatus(
          this.hasAll(['EZVIZ_APP_KEY', 'EZVIZ_APP_SECRET']),
          this.config.get<boolean>('EZVIZ_MOCK_ENABLED', false),
          isProduction,
          '等待配置 EZVIZ_APP_KEY 和 EZVIZ_APP_SECRET。',
        ),
      },
      {
        key: 'amap',
        name: '高德地图',
        ...this.thirdPartyStatus(
          this.hasAll(['AMAP_KEY']),
          false,
          isProduction,
          '等待配置 AMAP_KEY；普通地图展示仍可使用后端点位数据。',
        ),
      },
      {
        key: 'storage',
        name: '文件存储',
        status: storageDriver === 'cos' && !cosConfigured ? 'abnormal' : 'configured',
        mode: storageDriver === 'cos' ? 'official' : 'development',
        message:
          storageDriver === 'cos'
            ? cosConfigured
              ? '腾讯云 COS 配置项已填写。'
              : '已选择 COS 但缺少必要配置。'
            : '当前使用本地上传目录，生产环境建议切换 COS。',
      },
      {
        key: 'llm',
        name: 'LLM',
        ...this.thirdPartyStatus(
          this.hasAll(['LLM_API_KEY']),
          !isProduction,
          isProduction,
          '等待配置 LLM_API_KEY；未配置时 AI 导游使用数据库检索 fallback。',
        ),
      },
    ];
    return {
      environment: nodeEnv,
      publicBaseUrl: this.config.get<string>('PUBLIC_BASE_URL', ''),
      items,
    };
  }

  async users(principal: AuthPrincipal, query: AdminResourceQueryDto) {
    this.assertAdmin(principal, 'admin');
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      deletedAt: null,
      ...(query.keyword
        ? { nickname: { contains: query.keyword, mode: 'insensitive' as const } }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          openid: true,
          unionid: true,
          nickname: true,
          avatarUrl: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async auditLogs(principal: AuthPrincipal, query: AdminResourceQueryDto) {
    this.assertAdmin(principal, 'admin');
    const { skip, take, page, pageSize } = getPagination(query);
    const [list, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { admin: true },
      }),
      this.prisma.auditLog.count(),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async detail(principal: AuthPrincipal, resource: string, id: string) {
    if (resource === 'orders') {
      this.assertAdmin(principal, 'mall');
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          user: { select: { id: true, nickname: true, phone: true } },
        },
      });
      if (!order) throw new NotFoundException('order not found');
      return order;
    }
    if (resource === 'reservation-orders') {
      this.assertAdmin(principal, 'content');
      const order = await this.prisma.reservationOrder.findUnique({
        where: { id },
        include: {
          item: { select: { id: true, title: true, type: true, unit: true } },
          slot: { select: { id: true, date: true, startTime: true, endTime: true } },
          user: { select: { id: true, nickname: true, phone: true } },
        },
      });
      if (!order) throw new NotFoundException('reservation order not found');
      return order;
    }
    if (resource === 'feedback') {
      this.assertAdmin(principal, 'content');
      const feedback = await this.prisma.feedback.findUnique({
        where: { id },
        include: { user: { select: { id: true, nickname: true, phone: true, avatarUrl: true } } },
      });
      if (!feedback) throw new NotFoundException('feedback not found');
      return feedback;
    }
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    const where: Record<string, unknown> = { id };
    if (config.softDelete) where.deletedAt = null;
    const item = await config.delegate.findMany({ where, take: 1 }).then((items) => items[0]);
    if (!item) throw new NotFoundException(`${resource} not found`);
    return item;
  }

  async list(principal: AuthPrincipal, resource: string, query: AdminResourceQueryDto) {
    if (resource === 'orders') {
      this.assertAdmin(principal, 'mall');
      return this.listOrders(query);
    }
    if (resource === 'reservation-orders') {
      this.assertAdmin(principal, 'content');
      return this.listReservationOrders(query);
    }
    if (resource === 'feedback') {
      this.assertAdmin(principal, 'content');
      return this.listFeedback(query);
    }
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    const { skip, take, page, pageSize } = getPagination(query);
    const where: Record<string, unknown> = {};
    if (config.softDelete) where.deletedAt = null;
    const [list, total] = await Promise.all([
      config.delegate.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      config.delegate.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  private async listOrders(query: AdminResourceQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const keyword = this.queryKeyword(query);
    const status = this.parseOrderStatus(query.status);
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { orderNo: { contains: keyword, mode: 'insensitive' } },
              { remark: { contains: keyword, mode: 'insensitive' } },
              { logisticsCompany: { contains: keyword, mode: 'insensitive' } },
              { logisticsNo: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { id: true, nickname: true, phone: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  private async listReservationOrders(query: AdminResourceQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const keyword = this.queryKeyword(query);
    const status = this.parseReservationStatus(query.status);
    const where: Prisma.ReservationOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { orderNo: { contains: keyword, mode: 'insensitive' } },
              { contactName: { contains: keyword, mode: 'insensitive' } },
              { contactPhone: { contains: keyword, mode: 'insensitive' } },
              { remark: { contains: keyword, mode: 'insensitive' } },
              { item: { title: { contains: keyword, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.reservationOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          item: { select: { id: true, title: true, type: true, unit: true } },
          slot: { select: { id: true, date: true, startTime: true, endTime: true } },
          user: { select: { id: true, nickname: true, phone: true } },
        },
      }),
      this.prisma.reservationOrder.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  private async listFeedback(query: AdminResourceQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const keyword = this.queryKeyword(query);
    const status = this.parseFeedbackStatus(query.status);
    const where: Prisma.FeedbackWhereInput = {
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { content: { contains: keyword, mode: 'insensitive' } },
              { contact: { contains: keyword, mode: 'insensitive' } },
              { adminReply: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, nickname: true, phone: true, avatarUrl: true } } },
      }),
      this.prisma.feedback.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async create(
    principal: AuthPrincipal,
    resource: string,
    dto: AdminResourceMutationDto,
    requestId?: string,
  ) {
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    const created = await config.delegate.create({ data: this.cleanData(dto.data) });
    await this.log(
      principal,
      'create',
      resource,
      this.getId(created),
      undefined,
      created,
      requestId,
    );
    return created;
  }

  async update(
    principal: AuthPrincipal,
    resource: string,
    id: string,
    dto: AdminResourceMutationDto,
    requestId?: string,
  ) {
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    const before = await config.delegate
      .findMany({ where: { id }, take: 1 })
      .then((items) => items[0]);
    if (!before) throw new NotFoundException(`${resource} not found`);
    const updated = await config.delegate.update({ where: { id }, data: this.cleanData(dto.data) });
    await this.log(principal, 'update', resource, id, before, updated, requestId);
    return updated;
  }

  async remove(principal: AuthPrincipal, resource: string, id: string, requestId?: string) {
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    const before = await config.delegate
      .findMany({ where: { id }, take: 1 })
      .then((items) => items[0]);
    if (!before) throw new NotFoundException(`${resource} not found`);
    if (config.softDelete) {
      await config.delegate.update({ where: { id }, data: { deletedAt: new Date() } });
    } else {
      await config.delegate.update({ where: { id }, data: { status: 'OFFLINE' } });
    }
    await this.log(principal, 'delete', resource, id, before, undefined, requestId);
    return { ok: true };
  }

  async publish(principal: AuthPrincipal, resource: string, id: string, requestId?: string) {
    return this.setStatus(principal, resource, id, 'publish', requestId);
  }

  async offline(principal: AuthPrincipal, resource: string, id: string, requestId?: string) {
    return this.setStatus(principal, resource, id, 'offline', requestId);
  }

  async shipOrder(principal: AuthPrincipal, id: string, dto: ShipOrderDto, requestId?: string) {
    this.assertAdmin(principal, 'mall');
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('order not found');
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        shippingStatus: ShippingStatus.SHIPPED,
        logisticsCompany: dto.logisticsCompany,
        logisticsNo: dto.logisticsNo,
        shippedAt: new Date(),
      },
      include: { items: true },
    });
    await this.log(principal, 'ship', 'orders', id, order, updated, requestId);
    return updated;
  }

  async markRefund(principal: AuthPrincipal, id: string, status: OrderStatus, requestId?: string) {
    this.assertAdmin(principal, 'mall');
    const before = await this.prisma.order.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('order not found');
    const updated = await this.prisma.order.update({ where: { id }, data: { status } });
    await this.log(principal, 'refund-status', 'orders', id, before, updated, requestId);
    return updated;
  }

  async replyFeedback(
    principal: AuthPrincipal,
    id: string,
    dto: ReplyFeedbackDto,
    requestId?: string,
  ) {
    this.assertAdmin(principal, 'content');
    const before = await this.prisma.feedback.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('feedback not found');
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { adminReply: dto.adminReply, status: FeedbackStatus.REPLIED, repliedAt: new Date() },
    });
    await this.log(principal, 'reply', 'feedback', id, before, updated, requestId);
    return updated;
  }

  private async setStatus(
    principal: AuthPrincipal,
    resource: string,
    id: string,
    action: 'publish' | 'offline',
    requestId?: string,
  ) {
    const config = this.resource(resource);
    this.assertAdmin(principal, config.area);
    if (!config.statusMap)
      throw new ForbiddenException(`${resource} does not support publish/offline`);
    const before = await config.delegate
      .findMany({ where: { id }, take: 1 })
      .then((items) => items[0]);
    if (!before) throw new NotFoundException(`${resource} not found`);
    const updated = await config.delegate.update({
      where: { id },
      data: { status: config.statusMap[action] },
    });
    await this.log(principal, action, resource, id, before, updated, requestId);
    return updated;
  }

  private resource(resource: string): ResourceConfig {
    const contentStatus = { publish: 'PUBLISHED', offline: 'OFFLINE' };
    const map: Record<string, ResourceConfig> = {
      banners: {
        delegate: this.prisma.banner as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      shortcuts: {
        delegate: this.prisma.homeShortcut as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      articles: {
        delegate: this.prisma.article as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'scenic-spots': {
        delegate: this.prisma.scenicSpot as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'travel-routes': {
        delegate: this.prisma.travelRoute as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'map-points': {
        delegate: this.prisma.mapPoint as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      homestays: {
        delegate: this.prisma.homestay as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      foods: {
        delegate: this.prisma.food as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      farms: {
        delegate: this.prisma.farm as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'reservation-items': {
        delegate: this.prisma.reservationItem as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'reservation-slots': {
        delegate: this.prisma.reservationSlot as unknown as CrudDelegate,
        area: 'content',
        softDelete: false,
      },
      'reservation-orders': {
        delegate: this.prisma.reservationOrder as unknown as CrudDelegate,
        area: 'content',
        softDelete: false,
      },
      activities: {
        delegate: this.prisma.activity as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
        statusMap: contentStatus,
      },
      'activity-registrations': {
        delegate: this.prisma.activityRegistration as unknown as CrudDelegate,
        area: 'content',
        softDelete: false,
      },
      cameras: {
        delegate: this.prisma.camera as unknown as CrudDelegate,
        area: 'content',
        softDelete: true,
      },
      'product-categories': {
        delegate: this.prisma.productCategory as unknown as CrudDelegate,
        area: 'mall',
        softDelete: true,
        statusMap: contentStatus,
      },
      products: {
        delegate: this.prisma.product as unknown as CrudDelegate,
        area: 'mall',
        softDelete: true,
        statusMap: { publish: 'ON_SALE', offline: 'OFF_SALE' },
      },
      orders: {
        delegate: this.prisma.order as unknown as CrudDelegate,
        area: 'mall',
        softDelete: false,
      },
      feedback: {
        delegate: this.prisma.feedback as unknown as CrudDelegate,
        area: 'content',
        softDelete: false,
      },
    };
    const config = map[resource];
    if (!config) throw new NotFoundException(`admin resource not found: ${resource}`);
    return config;
  }

  private assertAdmin(principal: AuthPrincipal, area: ResourceConfig['area']) {
    if (principal.type !== TokenSubjectType.ADMIN || !principal.role) {
      throw new ForbiddenException('admin token required');
    }
    if (principal.role === AdminRole.SUPER_ADMIN || principal.role === AdminRole.ADMIN) return;
    if (area === 'content' && principal.role === AdminRole.CONTENT_OPERATOR) return;
    if (area === 'mall' && principal.role === AdminRole.MALL_OPERATOR) return;
    throw new ForbiddenException('insufficient admin permission');
  }

  private cleanData(data: Record<string, unknown>) {
    const forbidden = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt', 'passwordHash']);
    return Object.fromEntries(Object.entries(data).filter(([key]) => !forbidden.has(key)));
  }

  private getId(value: unknown) {
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
      return value.id;
    }
    return undefined;
  }

  private startOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private buildSevenDayTrend(
    start: Date,
    users: Array<{ createdAt: Date }>,
    orders: Array<{ createdAt: Date; paidAmount: number; paymentStatus: PaymentStatus }>,
  ) {
    const rows = Array.from({ length: 7 }).map((_, index) => {
      const date = this.addDays(start, index);
      return {
        date: this.dateKey(date),
        newUsers: 0,
        orderCount: 0,
        orderAmount: 0,
      };
    });
    const map = new Map(rows.map((row) => [row.date, row]));
    users.forEach((user) => {
      const row = map.get(this.dateKey(user.createdAt));
      if (row) row.newUsers += 1;
    });
    orders.forEach((order) => {
      const row = map.get(this.dateKey(order.createdAt));
      if (!row) return;
      row.orderCount += 1;
      if (order.paymentStatus === PaymentStatus.PAID) {
        row.orderAmount += order.paidAmount;
      }
    });
    return rows;
  }

  private queryKeyword(query: AdminResourceQueryDto) {
    return String(query.keyword || query.q || '').trim();
  }

  private parseOrderStatus(value?: string) {
    const normalized = String(value || '')
      .trim()
      .toUpperCase() as OrderStatus;
    return Object.values(OrderStatus).includes(normalized) ? normalized : undefined;
  }

  private parseReservationStatus(value?: string) {
    const normalized = String(value || '')
      .trim()
      .toUpperCase() as ReservationOrderStatus;
    return Object.values(ReservationOrderStatus).includes(normalized) ? normalized : undefined;
  }

  private parseFeedbackStatus(value?: string) {
    const normalized = String(value || '')
      .trim()
      .toUpperCase() as FeedbackStatus;
    return Object.values(FeedbackStatus).includes(normalized) ? normalized : undefined;
  }

  private hasAll(keys: string[]) {
    return keys.every((key) => Boolean(String(this.config.get<string>(key, '')).trim()));
  }

  private thirdPartyStatus(
    configured: boolean,
    developmentMode: boolean,
    isProduction: boolean,
    waitingMessage: string,
  ) {
    if (configured) {
      return {
        status: 'configured',
        mode: 'official',
        message: '正式配置项已填写，密钥不会返回前端。',
      };
    }
    if (developmentMode && !isProduction) {
      return {
        status: 'development',
        mode: 'development',
        message: `${waitingMessage} 当前为开发模式，不代表正式接入成功。`,
      };
    }
    return {
      status: 'missing',
      mode: 'waiting_credentials',
      message: waitingMessage,
    };
  }

  private async log(
    principal: AuthPrincipal,
    action: string,
    resource: string,
    resourceId?: string,
    before?: unknown,
    after?: unknown,
    requestId?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        adminId: principal.id,
        action,
        resource,
        resourceId,
        before: before ? toInputJson(before) : undefined,
        after: after ? toInputJson(after) : undefined,
        requestId,
      },
    });
  }
}
