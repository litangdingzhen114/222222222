import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityRegistrationStatus,
  ActivityStatus,
  ContentStatus,
  ReservationOrderStatus,
  ReservationSlotStatus,
  TokenSubjectType,
} from '@prisma/client';
import { getPagination, PageQueryDto, toPageResult } from '../../common/dto/page.dto';
import { createOrderNo } from '../../common/utils/order-no.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthPrincipal } from '../auth/auth.types';
import { CreateReservationDto, RegisterActivityDto } from './dto/reservations.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async reservationItems(query: PageQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      ...(query.keyword
        ? { title: { contains: query.keyword, mode: 'insensitive' as const } }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.reservationItem.findMany({
        where,
        include: { farm: true },
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.reservationItem.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async reservationItem(id: string) {
    const item = await this.prisma.reservationItem.findFirst({
      where: { id, status: ContentStatus.PUBLISHED, deletedAt: null },
      include: { farm: true },
    });
    if (!item) throw new NotFoundException('reservation item not found');
    return item;
  }

  slots(itemId: string) {
    return this.prisma.reservationSlot.findMany({
      where: {
        reservationItemId: itemId,
        status: { in: [ReservationSlotStatus.OPEN, ReservationSlotStatus.FULL] },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createReservation(principal: AuthPrincipal, dto: CreateReservationDto) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.reservationItem.findFirst({
        where: { id: dto.reservationItemId, status: ContentStatus.PUBLISHED, deletedAt: null },
      });
      if (!item) throw new NotFoundException('reservation item not found');
      const slot = await tx.reservationSlot.findFirst({
        where: {
          id: dto.reservationSlotId,
          reservationItemId: item.id,
          status: ReservationSlotStatus.OPEN,
        },
      });
      if (!slot) throw new NotFoundException('reservation slot not available');
      const remain = slot.capacity - slot.bookedCount;
      if (remain < dto.quantity)
        throw new ConflictException('reservation slot capacity is not enough');

      const updated = await tx.reservationSlot.updateMany({
        where: {
          id: slot.id,
          status: ReservationSlotStatus.OPEN,
          bookedCount: { lte: slot.capacity - dto.quantity },
        },
        data: {
          bookedCount: { increment: dto.quantity },
          status: remain === dto.quantity ? ReservationSlotStatus.FULL : ReservationSlotStatus.OPEN,
        },
      });
      if (updated.count !== 1)
        throw new ConflictException('reservation slot capacity changed, please retry');

      const amount = item.price * dto.quantity;
      const order = await tx.reservationOrder.create({
        data: {
          orderNo: createOrderNo('RSV'),
          userId: principal.id,
          reservationItemId: item.id,
          reservationSlotId: slot.id,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          quantity: dto.quantity,
          amount,
          remark: dto.remark,
          status:
            amount > 0 ? ReservationOrderStatus.PENDING_PAYMENT : ReservationOrderStatus.CONFIRMED,
          paidAt: amount > 0 ? null : new Date(),
        },
      });

      return {
        order,
        paymentRequired: amount > 0,
      };
    });
  }

  async myReservations(principal: AuthPrincipal, query: PageQueryDto) {
    this.assertUser(principal);
    const { skip, take, page, pageSize } = getPagination(query);
    const where = { userId: principal.id };
    const [list, total] = await Promise.all([
      this.prisma.reservationOrder.findMany({
        where,
        include: { item: true, slot: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reservationOrder.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async reservationDetail(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    const order = await this.prisma.reservationOrder.findFirst({
      where: { id, userId: principal.id },
      include: { item: true, slot: true },
    });
    if (!order) throw new NotFoundException('reservation order not found');
    return order;
  }

  async cancelReservation(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.reservationOrder.findFirst({ where: { id, userId: principal.id } });
      if (!order) throw new NotFoundException('reservation order not found');
      const cancellable: ReservationOrderStatus[] = [
        ReservationOrderStatus.PENDING_PAYMENT,
        ReservationOrderStatus.CONFIRMED,
      ];
      if (!cancellable.includes(order.status)) {
        throw new ConflictException('current reservation cannot be cancelled directly');
      }
      await tx.reservationOrder.update({
        where: { id },
        data: { status: ReservationOrderStatus.CANCELLED, cancelledAt: new Date() },
      });
      await tx.reservationSlot.update({
        where: { id: order.reservationSlotId },
        data: { bookedCount: { decrement: order.quantity }, status: ReservationSlotStatus.OPEN },
      });
      return { ok: true };
    });
  }

  async activities(query: PageQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const now = new Date();
    const where = {
      status: ActivityStatus.PUBLISHED,
      deletedAt: null,
      endAt: { gte: now },
      ...(query.keyword
        ? { title: { contains: query.keyword, mode: 'insensitive' as const } }
        : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.activity.findMany({ where, skip, take, orderBy: [{ startAt: 'asc' }] }),
      this.prisma.activity.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async activity(id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, status: ActivityStatus.PUBLISHED, deletedAt: null },
    });
    if (!activity) throw new NotFoundException('activity not found');
    return activity;
  }

  async registerActivity(principal: AuthPrincipal, activityId: string, dto: RegisterActivityDto) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const activity = await tx.activity.findFirst({
        where: {
          id: activityId,
          status: ActivityStatus.PUBLISHED,
          deletedAt: null,
          registrationStartAt: { lte: now },
          registrationEndAt: { gte: now },
        },
      });
      if (!activity) throw new NotFoundException('activity not available');
      if (activity.registeredCount + dto.participantCount > activity.capacity) {
        throw new ConflictException('activity capacity is not enough');
      }
      const existing = await tx.activityRegistration.findUnique({
        where: { activityId_userId: { activityId, userId: principal.id } },
      });
      if (existing) throw new ConflictException('same user has already registered this activity');
      const updated = await tx.activity.updateMany({
        where: {
          id: activityId,
          registeredCount: { lte: activity.capacity - dto.participantCount },
        },
        data: { registeredCount: { increment: dto.participantCount } },
      });
      if (updated.count !== 1)
        throw new ConflictException('activity capacity changed, please retry');
      return tx.activityRegistration.create({
        data: {
          activityId,
          userId: principal.id,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          participantCount: dto.participantCount,
          amount: activity.fee * dto.participantCount,
          status:
            activity.fee > 0
              ? ActivityRegistrationStatus.PENDING_PAYMENT
              : ActivityRegistrationStatus.REGISTERED,
          remark: dto.remark,
        },
      });
    });
  }

  async myActivityRegistrations(principal: AuthPrincipal, query: PageQueryDto) {
    this.assertUser(principal);
    const { skip, take, page, pageSize } = getPagination(query);
    const where = { userId: principal.id };
    const [list, total] = await Promise.all([
      this.prisma.activityRegistration.findMany({
        where,
        include: { activity: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityRegistration.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async cancelActivityRegistration(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.activityRegistration.findFirst({
        where: { id, userId: principal.id },
      });
      if (!record) throw new NotFoundException('activity registration not found');
      const cancellable: ActivityRegistrationStatus[] = [
        ActivityRegistrationStatus.REGISTERED,
        ActivityRegistrationStatus.PENDING_PAYMENT,
      ];
      if (!cancellable.includes(record.status)) {
        throw new ConflictException('current registration cannot be cancelled directly');
      }
      await tx.activityRegistration.update({
        where: { id },
        data: { status: ActivityRegistrationStatus.CANCELLED },
      });
      await tx.activity.update({
        where: { id: record.activityId },
        data: { registeredCount: { decrement: record.participantCount } },
      });
      return { ok: true };
    });
  }

  private assertUser(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.USER) {
      throw new ForbiddenException('user token required');
    }
  }
}
