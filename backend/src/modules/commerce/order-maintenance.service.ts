import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  OrderStatus,
  PaymentStatus,
  ReservationOrderStatus,
  ReservationSlotStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrderMaintenanceService {
  private readonly logger = new Logger(OrderMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async closeExpiredOrders() {
    await this.closeMallOrders();
    await this.closeReservationOrders();
  }

  private async closeMallOrders() {
    const timeout = this.config.get<number>('ORDER_PAYMENT_TIMEOUT_MINUTES', 30);
    const expiredBefore = new Date(Date.now() - timeout * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING_PAYMENT, createdAt: { lt: expiredBefore } },
      include: { items: true },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });
    for (const order of orders) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.order.findFirst({
          where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
          include: { items: true },
        });
        if (!current) return;
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, sales: { decrement: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: current.id },
          data: {
            status: OrderStatus.CLOSED,
            paymentStatus: PaymentStatus.CLOSED,
            closedAt: new Date(),
          },
        });
      });
      this.logger.log(`closed expired mall order ${order.orderNo}`);
    }
  }

  private async closeReservationOrders() {
    const timeout = this.config.get<number>('RESERVATION_PAYMENT_TIMEOUT_MINUTES', 30);
    const expiredBefore = new Date(Date.now() - timeout * 60 * 1000);
    const orders = await this.prisma.reservationOrder.findMany({
      where: { status: ReservationOrderStatus.PENDING_PAYMENT, createdAt: { lt: expiredBefore } },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });
    for (const order of orders) {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.reservationOrder.findFirst({
          where: { id: order.id, status: ReservationOrderStatus.PENDING_PAYMENT },
        });
        if (!current) return;
        await tx.reservationOrder.update({
          where: { id: current.id },
          data: { status: ReservationOrderStatus.CANCELLED, cancelledAt: new Date() },
        });
        await tx.reservationSlot.update({
          where: { id: current.reservationSlotId },
          data: {
            bookedCount: { decrement: current.quantity },
            status: ReservationSlotStatus.OPEN,
          },
        });
      });
      this.logger.log(`closed expired reservation order ${order.orderNo}`);
    }
  }
}
