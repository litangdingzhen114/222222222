import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminRole,
  FeedbackStatus,
  OrderStatus,
  ShippingStatus,
  TokenSubjectType,
} from '@prisma/client';
import { getPagination, toPageResult } from '../../common/dto/page.dto';
import { toInputJson } from '../../common/utils/json.util';
import { PrismaService } from '../../database/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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

  async list(principal: AuthPrincipal, resource: string, query: AdminResourceQueryDto) {
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
