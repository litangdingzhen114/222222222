import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, FeedbackStatus, TokenSubjectType } from '@prisma/client';
import { getPagination, PageQueryDto, toPageResult } from '../../common/dto/page.dto';
import { PrismaService } from '../../database/prisma.service';
import { LlmProvider } from '../../integrations/llm/llm.provider';
import { AuthPrincipal } from '../auth/auth.types';
import {
  AiGuideChatDto,
  BrowsingHistoryDto,
  CreateFeedbackDto,
  FavoriteDto,
} from './dto/engagement.dto';

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmProvider,
  ) {}

  async favorites(principal: AuthPrincipal, query: PageQueryDto) {
    this.assertUser(principal);
    const { skip, take, page, pageSize } = getPagination(query);
    const where = { userId: principal.id };
    const [list, total] = await Promise.all([
      this.prisma.favorite.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.favorite.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async addFavorite(principal: AuthPrincipal, dto: FavoriteDto) {
    this.assertUser(principal);
    return this.prisma.favorite.upsert({
      where: {
        userId_targetType_targetId: {
          userId: principal.id,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
      create: { userId: principal.id, targetType: dto.targetType, targetId: dto.targetId },
      update: {},
    });
  }

  async removeFavorite(principal: AuthPrincipal, dto: FavoriteDto) {
    this.assertUser(principal);
    await this.prisma.favorite.deleteMany({
      where: { userId: principal.id, targetType: dto.targetType, targetId: dto.targetId },
    });
    return { ok: true };
  }

  async history(principal: AuthPrincipal, query: PageQueryDto) {
    this.assertUser(principal);
    const { skip, take, page, pageSize } = getPagination(query);
    const where = { userId: principal.id };
    const [list, total] = await Promise.all([
      this.prisma.browsingHistory.findMany({ where, skip, take, orderBy: { viewedAt: 'desc' } }),
      this.prisma.browsingHistory.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async addHistory(principal: AuthPrincipal, dto: BrowsingHistoryDto) {
    this.assertUser(principal);
    return this.prisma.browsingHistory.create({
      data: { userId: principal.id, targetType: dto.targetType, targetId: dto.targetId },
    });
  }

  createFeedback(principal: AuthPrincipal | undefined, dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        userId: principal?.type === TokenSubjectType.USER ? principal.id : undefined,
        type: dto.type,
        content: dto.content,
        images: dto.images ?? [],
        contact: dto.contact,
        status: FeedbackStatus.PENDING,
      },
    });
  }

  async feedbackDetail(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    const feedback = await this.prisma.feedback.findFirst({ where: { id, userId: principal.id } });
    if (!feedback) throw new NotFoundException('feedback not found');
    return feedback;
  }

  suggestions() {
    return [
      '推荐一条游玩路线',
      '附近有什么美食',
      '附近有什么民宿',
      '停车场在哪里',
      '厕所在哪里',
      '有哪些采摘项目',
      '今天有哪些活动',
    ];
  }

  async aiChat(dto: AiGuideChatDto) {
    const contextItems = await this.searchContext(dto.question);
    const context = contextItems
      .map((item, index) => `${index + 1}. [${item.type}] ${item.title}：${item.summary}`)
      .join('\n');
    const llm = await this.llm.chat({ question: dto.question, context });
    return {
      answer: llm.answer,
      mode: llm.mode,
      relatedItems: contextItems,
      suggestedQuestions: this.suggestions().slice(0, 4),
    };
  }

  private async searchContext(question: string) {
    const keyword = question.trim().slice(0, 30);
    const [spots, routes, foods, homestays, farms, activities, mapPoints] = await Promise.all([
      this.prisma.scenicSpot.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 5,
        orderBy: [{ isRecommended: 'desc' }, { viewCount: 'desc' }],
      }),
      this.prisma.travelRoute.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 3,
        orderBy: [{ isRecommended: 'desc' }, { sort: 'asc' }],
      }),
      this.prisma.food.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 4,
      }),
      this.prisma.homestay.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 4,
      }),
      this.prisma.farm.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 4,
      }),
      this.prisma.activity.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, take: 4 }),
      this.prisma.mapPoint.findMany({
        where: { status: ContentStatus.PUBLISHED, deletedAt: null },
        take: 8,
      }),
    ]);
    const items = [
      ...spots.map((item) => ({
        type: '景点',
        id: item.id,
        title: item.name,
        summary: item.summary,
      })),
      ...routes.map((item) => ({
        type: '路线',
        id: item.id,
        title: item.name,
        summary: item.summary,
      })),
      ...foods.map((item) => ({
        type: '美食',
        id: item.id,
        title: item.name,
        summary: item.description,
      })),
      ...homestays.map((item) => ({
        type: '民宿',
        id: item.id,
        title: item.name,
        summary: item.description,
      })),
      ...farms.map((item) => ({
        type: '采摘',
        id: item.id,
        title: item.name,
        summary: item.description,
      })),
      ...activities.map((item) => ({
        type: '活动',
        id: item.id,
        title: item.title,
        summary: item.summary,
      })),
      ...mapPoints.map((item) => ({
        type: '地图点位',
        id: item.id,
        title: item.name,
        summary: item.description ?? item.address ?? '',
      })),
    ];
    if (!keyword) return items.slice(0, 8);
    return items
      .filter(
        (item) =>
          `${item.title}${item.summary}${item.type}`.includes(keyword) ||
          question.includes(item.type),
      )
      .slice(0, 8);
  }

  private assertUser(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.USER) {
      throw new ForbiddenException('user token required');
    }
  }
}
