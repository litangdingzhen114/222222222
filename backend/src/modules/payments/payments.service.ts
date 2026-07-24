import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentChannel,
  PaymentOrderType,
  PaymentRecordStatus,
  PaymentStatus,
  ReservationOrderStatus,
  TokenSubjectType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WechatPayAdapter } from '../../integrations/wechat-pay/wechat-pay.adapter';
import { createOrderNo } from '../../common/utils/order-no.util';
import { toInputJson } from '../../common/utils/json.util';
import { AuthPrincipal } from '../auth/auth.types';
import { CreateWechatPaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wechatPay: WechatPayAdapter,
  ) {}

  async createWechatPayment(principal: AuthPrincipal, dto: CreateWechatPaymentDto) {
    this.assertUser(principal);
    const payable = await this.resolvePayable(principal.id, dto.orderType, dto.orderId);
    const payment = await this.prisma.paymentRecord.create({
      data: {
        paymentNo: createOrderNo('PAY'),
        orderType: dto.orderType,
        orderId: dto.orderId,
        userId: principal.id,
        amount: payable.amount,
        channel: PaymentChannel.WECHAT,
        status: PaymentRecordStatus.CREATED,
        requestData: { orderNo: payable.orderNo, amount: payable.amount },
      },
    });
    const user = await this.prisma.user.findUnique({ where: { id: principal.id } });
    if (!user?.openid) throw new NotFoundException('wechat user not found');
    const payParams = await this.wechatPay.createJsapiPayment({
      paymentNo: payment.paymentNo,
      description: payable.description,
      openid: user.openid,
      amount: payable.amount,
    });
    await this.prisma.paymentRecord.update({
      where: { id: payment.id },
      data: {
        status: PaymentRecordStatus.PAYING,
        requestData: toInputJson({ original: payment.requestData, payParams }),
      },
    });
    return { paymentNo: payment.paymentNo, payParams };
  }

  async status(paymentNo: string) {
    const payment = await this.prisma.paymentRecord.findUnique({ where: { paymentNo } });
    if (!payment) throw new NotFoundException('payment not found');
    return {
      paymentNo: payment.paymentNo,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt,
    };
  }

  async handleWechatNotify(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
    body: unknown,
  ) {
    const valid = this.wechatPay.verifyNotify(headers, rawBody);
    if (!valid) return { code: 'FAIL', message: 'signature invalid' };
    const payload = this.wechatPay.decryptNotifyResource(body);
    if (payload.tradeState !== 'SUCCESS') return { code: 'SUCCESS', message: 'success' };
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRecord.findUnique({
        where: { paymentNo: payload.outTradeNo },
      });
      if (!payment) throw new NotFoundException('payment not found');
      if (payment.status === PaymentRecordStatus.PAID) return;
      if (payment.amount !== payload.amount) throw new ConflictException('payment amount mismatch');
      await tx.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: PaymentRecordStatus.PAID,
          transactionId: payload.transactionId,
          callbackData: toInputJson(payload),
          paidAt: new Date(),
        },
      });
      if (payment.orderType === PaymentOrderType.MALL_ORDER) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
            paidAmount: payment.amount,
            paidAt: new Date(),
          },
        });
      }
      if (payment.orderType === PaymentOrderType.RESERVATION_ORDER) {
        await tx.reservationOrder.update({
          where: { id: payment.orderId },
          data: { status: ReservationOrderStatus.PAID, paidAt: new Date() },
        });
      }
    });
    return { code: 'SUCCESS', message: 'success' };
  }

  private async resolvePayable(userId: string, type: PaymentOrderType, orderId: string) {
    if (type === PaymentOrderType.MALL_ORDER) {
      const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
      if (!order) throw new NotFoundException('order not found');
      if (order.status !== OrderStatus.PENDING_PAYMENT)
        throw new ConflictException('order cannot be paid');
      return {
        orderNo: order.orderNo,
        amount: order.payableAmount,
        description: `海林村农特产订单 ${order.orderNo}`,
      };
    }
    if (type === PaymentOrderType.RESERVATION_ORDER) {
      const order = await this.prisma.reservationOrder.findFirst({
        where: { id: orderId, userId },
      });
      if (!order) throw new NotFoundException('reservation order not found');
      if (order.status !== ReservationOrderStatus.PENDING_PAYMENT)
        throw new ConflictException('reservation cannot be paid');
      return {
        orderNo: order.orderNo,
        amount: order.amount,
        description: `海林村预约订单 ${order.orderNo}`,
      };
    }
    throw new ConflictException('activity payment is reserved for phase one paid events');
  }

  private assertUser(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.USER) {
      throw new ForbiddenException('user token required');
    }
  }
}
