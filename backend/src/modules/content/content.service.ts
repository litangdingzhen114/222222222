import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleType, ContentStatus, MapPointType, ProductStatus } from '@prisma/client';
import { getPagination, PageQueryDto, toPageResult } from '../../common/dto/page.dto';
import { decimalToNumber, haversineDistanceMeters } from '../../common/utils/geo.util';
import { PrismaService } from '../../database/prisma.service';
import {
  ArticleQueryDto,
  MapPointQueryDto,
  NearbyMapPointQueryDto,
  PublishedContentQueryDto,
} from './dto/content.dto';

type PublicMapPoint = {
  id: string;
  name: string;
  type: MapPointType;
  imageUrl?: string | null;
  longitude: number | null;
  latitude: number | null;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  businessHours?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async home() {
    const now = new Date();
    const [banners, shortcuts, scenicSpots, routes, activities, products, cameras, notices] =
      await Promise.all([
        this.prisma.banner.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            deletedAt: null,
            OR: [{ startAt: null }, { startAt: { lte: now } }],
            AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
          },
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
          take: 6,
        }),
        this.prisma.homeShortcut.findMany({
          where: { status: ContentStatus.PUBLISHED, deletedAt: null },
          orderBy: [{ sort: 'asc' }],
          take: 12,
        }),
        this.prisma.scenicSpot.findMany({
          where: { status: ContentStatus.PUBLISHED, deletedAt: null, isRecommended: true },
          orderBy: [{ sort: 'asc' }, { viewCount: 'desc' }],
          take: 5,
        }),
        this.prisma.travelRoute.findMany({
          where: { status: ContentStatus.PUBLISHED, deletedAt: null, isRecommended: true },
          orderBy: [{ sort: 'asc' }],
          take: 3,
        }),
        this.prisma.activity.findMany({
          where: { status: 'PUBLISHED', deletedAt: null, endAt: { gte: now } },
          orderBy: [{ startAt: 'asc' }],
          take: 3,
        }),
        this.prisma.product.findMany({
          where: { status: ProductStatus.ON_SALE, deletedAt: null },
          orderBy: [{ sort: 'asc' }, { sales: 'desc' }],
          take: 6,
        }),
        this.prisma.camera.findMany({
          where: { status: 'ONLINE', deletedAt: null },
          orderBy: [{ sort: 'asc' }],
          take: 3,
        }),
        this.prisma.article.findMany({
          where: { type: ArticleType.NOTICE, status: ContentStatus.PUBLISHED, deletedAt: null },
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
          take: 5,
        }),
      ]);

    return {
      banners,
      shortcuts,
      scenicSpots: scenicSpots.map((item) => this.withCoordinates(item)),
      routes,
      activities: activities.map((item) => this.withCoordinates(item)),
      products,
      liveEntry: cameras[0] ?? null,
      notices,
    };
  }

  banners() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async articles(query: ArticleQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.keyword
        ? { title: { contains: query.keyword, mode: 'insensitive' as const } }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.article.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async article(id: string) {
    const article = await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    if (article.status !== ContentStatus.PUBLISHED || article.deletedAt) {
      throw new NotFoundException('article not found');
    }
    return article;
  }

  async scenicSpots(query: PublishedContentQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.scenicSpot.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { viewCount: 'desc' }],
      }),
      this.prisma.scenicSpot.count({ where }),
    ]);
    return toPageResult(
      list.map((item) => this.withCoordinates(item)),
      total,
      page,
      pageSize,
    );
  }

  async scenicSpot(id: string) {
    const item = await this.prisma.scenicSpot.findFirst({
      where: { id, status: ContentStatus.PUBLISHED, deletedAt: null },
    });
    if (!item) throw new NotFoundException('scenic spot not found');
    await this.prisma.scenicSpot.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return this.withCoordinates(item);
  }

  async viewScenicSpot(id: string) {
    await this.prisma.scenicSpot.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return { ok: true };
  }

  async travelRoutes(query: PublishedContentQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.travelRoute.findMany({ where, skip, take, orderBy: [{ sort: 'asc' }] }),
      this.prisma.travelRoute.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async travelRoute(id: string) {
    const route = await this.prisma.travelRoute.findFirst({
      where: { id, status: ContentStatus.PUBLISHED, deletedAt: null },
      include: { spots: { include: { scenicSpot: true }, orderBy: { sort: 'asc' } } },
    });
    if (!route) throw new NotFoundException('travel route not found');
    return {
      ...route,
      spots: route.spots.map((spot) => ({
        id: spot.id,
        sort: spot.sort,
        stayDuration: spot.stayDuration,
        scenicSpot: this.withCoordinates(spot.scenicSpot),
      })),
    };
  }

  async mapPoints(query: MapPointQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: query.status ?? ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.mapPoint.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.mapPoint.count({ where }),
    ]);
    return toPageResult(
      list.map((item) => this.withCoordinates(item)),
      total,
      page,
      pageSize,
    );
  }

  async nearbyMapPoints(query: NearbyMapPointQueryDto) {
    const maxRadius = this.config.get<number>('MAP_MAX_RADIUS_METERS', 20000);
    const radius = Math.min(query.radius, maxRadius);
    const list = await this.prisma.mapPoint.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        ...(query.type ? { type: query.type } : {}),
      },
      take: 500,
    });
    return list
      .map((item) => {
        const point = this.withCoordinates(item);
        const distance = haversineDistanceMeters(
          { longitude: query.longitude, latitude: query.latitude },
          { longitude: point.longitude ?? 0, latitude: point.latitude ?? 0 },
        );
        return { ...point, distance: Math.round(distance) };
      })
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  async mapPoint(id: string) {
    const item = await this.prisma.mapPoint.findFirst({
      where: { id, status: ContentStatus.PUBLISHED, deletedAt: null },
    });
    if (!item) throw new NotFoundException('map point not found');
    return this.withCoordinates(item);
  }

  async legacyMapPoints(query: PageQueryDto) {
    const result = await this.mapPoints({
      ...query,
      pageSize: query.pageSize ?? 100,
    });
    return result.list.map((item, index) => this.toLegacyMapPoint(item as PublicMapPoint, index));
  }

  homestays(query: PageQueryDto) {
    return this.listHomestays(query);
  }

  foods(query: PageQueryDto) {
    return this.listFoods(query);
  }

  farms(query: PageQueryDto) {
    return this.listFarms(query);
  }

  private async listHomestays(query: PageQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.homestay.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.homestay.count({ where }),
    ]);
    return toPageResult(
      list.map((item) => this.withCoordinates(item)),
      total,
      page,
      pageSize,
    );
  }

  private async listFoods(query: PageQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.food.count({ where }),
    ]);
    return toPageResult(
      list.map((item) => this.withCoordinates(item)),
      total,
      page,
      pageSize,
    );
  }

  private async listFarms(query: PageQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.farm.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.farm.count({ where }),
    ]);
    return toPageResult(
      list.map((item) => this.withCoordinates(item)),
      total,
      page,
      pageSize,
    );
  }

  private withCoordinates<T extends { longitude?: unknown; latitude?: unknown }>(item: T) {
    return {
      ...item,
      longitude: decimalToNumber(item.longitude as { toNumber(): number } | null | undefined),
      latitude: decimalToNumber(item.latitude as { toNumber(): number } | null | undefined),
    };
  }

  private toLegacyMapPoint(point: PublicMapPoint, index: number) {
    const view = this.mapPointView(point.type, point.relatedEntityType);
    const refType = point.relatedEntityType === 'SCENIC_SPOT' ? 'spot' : undefined;
    return {
      id: point.id,
      markerId: index + 1,
      title: point.name,
      type: view.type,
      subType: view.subType,
      distance: '村内点位',
      desc: point.description ?? point.address ?? point.name,
      openTime: point.businessHours ?? '以现场公示为准',
      tips: point.address ? `地址：${point.address}` : '可点击导航前往该点位。',
      actionText: view.actionText,
      imageUrl: point.imageUrl ?? view.imageUrl,
      latitude: point.latitude ?? 0,
      longitude: point.longitude ?? 0,
      phone: point.phone ?? '',
      refType,
      refId: refType ? (point.relatedEntityId ?? '') : '',
      targetUrl: view.targetUrl,
    };
  }

  private mapPointView(type: MapPointType, relatedEntityType?: string | null) {
    if (relatedEntityType === 'PRODUCT') {
      return {
        type: '购物',
        subType: '网红打卡点',
        actionText: '采购预约',
        imageUrl: '/assets/photos/ai-stone-souvenir.jpg',
        targetUrl: '/pages/mine-feature/mine-feature?id=mall',
      };
    }
    const views: Record<
      MapPointType,
      { type: string; subType: string; actionText: string; imageUrl: string; targetUrl?: string }
    > = {
      SCENIC_SPOT: {
        type: '景点',
        subType: '乡村景点',
        actionText: '查看景点',
        imageUrl: '/assets/scenes/ricefish-field.png',
      },
      PARKING: {
        type: '公共服务',
        subType: '便民服务',
        actionText: '导航前往',
        imageUrl: '/assets/scenes/village-gate.png',
      },
      TOILET: {
        type: '公共服务',
        subType: '便民服务',
        actionText: '导航前往',
        imageUrl: '/assets/scenes/creek-trail.png',
      },
      SERVICE_CENTER: {
        type: '公共服务',
        subType: '核心景区',
        actionText: '服务咨询',
        imageUrl: '/assets/scenes/village-gate.png',
        targetUrl: '/pages/mine-feature/mine-feature?id=guide',
      },
      HOMESTAY: {
        type: '住宿',
        subType: '乡村景点',
        actionText: '民宿预约',
        imageUrl: '/assets/scenes/overseas-yard.png',
        targetUrl: '/pages/mine-feature/mine-feature?id=stay',
      },
      FOOD: {
        type: '美食',
        subType: '核心景区',
        actionText: '寻味美食',
        imageUrl: '/assets/scenes/ricefish-banquet.png',
        targetUrl: '/pages/food/food',
      },
      FARM: {
        type: '体验',
        subType: '乡村景点',
        actionText: '预约体验',
        imageUrl: '/assets/scenes/ricefish-field.png',
        targetUrl: '/pages/mine-feature/mine-feature?id=booking',
      },
      MEDICAL: {
        type: '公共服务',
        subType: '便民服务',
        actionText: '导航前往',
        imageUrl: '/assets/scenes/village-gate.png',
      },
      CAMERA: {
        type: '体验',
        subType: '网红打卡点',
        actionText: '查看直播',
        imageUrl: '/assets/scenes/ricefish-field.png',
        targetUrl: '/pages/live-list/live-list',
      },
      OTHER: {
        type: '公共服务',
        subType: '便民服务',
        actionText: '导航前往',
        imageUrl: '/assets/scenes/village-gate.png',
      },
    };
    return views[type];
  }
}
