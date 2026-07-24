import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ActivityRegistrationStatus,
  AdminRole,
  ContentStatus,
  IdempotencyStatus,
  OrderStatus,
  PaymentOrderType,
  PaymentRecordStatus,
  ProductStatus,
  ReservationSlotStatus,
  TokenSubjectType,
} from '@prisma/client';
import { ROLES_KEY } from '../src/common/constants/metadata.constants';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PrismaService } from '../src/database/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { CommerceService } from '../src/modules/commerce/commerce.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { ReservationsService } from '../src/modules/reservations/reservations.service';

const userPrincipal = { id: 'user-1', type: TokenSubjectType.USER, tokenId: 'token-1' };
const adminPrincipal = {
  id: 'admin-1',
  type: TokenSubjectType.ADMIN,
  role: AdminRole.CONTENT_OPERATOR,
  tokenId: 'token-2',
};

function config(values: Record<string, string | number | boolean>) {
  return {
    get: <T>(key: string, fallback?: T) => (values[key] ?? fallback) as T,
    getOrThrow: <T>(key: string) => values[key] as T,
  } as ConfigService;
}

describe('微信登录 Service', () => {
  it('首次登录创建用户并且不返回 session_key', async () => {
    const prisma = {
      user: {
        upsert: jest.fn().mockResolvedValue({
          id: 'user-1',
          nickname: '游客',
          avatarUrl: '/avatar.png',
          phone: null,
        }),
      },
      refreshToken: { create: jest.fn().mockResolvedValue({ id: 'refresh-1' }) },
    } as unknown as PrismaService;
    const jwt = {
      signAsync: jest.fn().mockResolvedValueOnce('access').mockResolvedValueOnce('refresh'),
    };
    const wechat = {
      code2Session: jest.fn().mockResolvedValue({
        openid: 'openid-1',
        sessionKey: 'secret-session',
        mode: 'development_mock',
      }),
    };
    const service = new AuthService(
      prisma,
      jwt as never,
      config({
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      }),
      wechat as never,
    );
    const result = await service.wechatLogin({ code: 'dev:test', nickname: '游客' });
    expect(result.accessToken).toBe('access');
    expect(JSON.stringify(result)).not.toContain('secret-session');
    const upsert = (prisma as unknown as { user: { upsert: jest.Mock } }).user.upsert;
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { openid: 'openid-1' },
      }),
    );
  });
});

describe('RBAC 权限测试', () => {
  it('内容运营不能访问商城运营接口', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === ROLES_KEY ? [AdminRole.MALL_OPERATOR] : undefined,
      ),
    } as unknown as Reflector;
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: adminPrincipal }) }),
    } as unknown as ExecutionContext;
    expect(() => new RolesGuard(reflector).canActivate(context)).toThrow(ForbiddenException);
  });
});

describe('商品库存扣减、创建订单和幂等测试', () => {
  function commerceWithPrisma(prisma: PrismaService) {
    return new CommerceService(prisma);
  }

  it('创建订单时复核价格并扣减库存', async () => {
    const tx = {
      idempotencyRecord: { upsert: jest.fn(), update: jest.fn() },
      cartItem: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'product-1',
            name: '生态米',
            coverImage: '/rice.jpg',
            specification: '1kg',
            price: 3900,
            stock: 10,
            freightTemplate: null,
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      address: {
        findFirst: jest.fn().mockResolvedValue({
          contactName: '张三',
          phone: '13800000000',
          province: '浙江',
          city: '杭州',
          district: '西湖',
          detail: '海林村 1 号',
          postalCode: null,
        }),
      },
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-1',
          payableAmount: 4700,
          items: [{ productId: 'product-1', quantity: 1 }],
        }),
      },
    };
    const prisma = {
      idempotencyRecord: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const result = await commerceWithPrisma(prisma).createOrder(userPrincipal, {
      addressId: 'addr-1',
      items: [{ productId: 'product-1', quantity: 1 }],
      idempotencyKey: 'idem-1',
    });
    expect(result).toHaveProperty('paymentRequired', true);
    const updateManyCalls = tx.product.updateMany.mock.calls as Array<
      [
        {
          where: { stock: { gte: number }; status: ProductStatus };
          data: { stock: { decrement: number } };
        },
      ]
    >;
    const updateManyArg = updateManyCalls[0][0];
    expect(updateManyArg.where.stock.gte).toBe(1);
    expect(updateManyArg.where.status).toBe(ProductStatus.ON_SALE);
    expect(updateManyArg.data.stock.decrement).toBe(1);
  });

  it('重复创建订单命中幂等记录时直接返回原响应', async () => {
    const response = { order: { id: 'order-1' }, paymentRequired: true };
    const prisma = {
      idempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({ status: IdempotencyStatus.SUCCEEDED, response }),
      },
    } as unknown as PrismaService;
    await expect(
      commerceWithPrisma(prisma).createOrder(userPrincipal, {
        addressId: 'addr-1',
        items: [{ productId: 'product-1', quantity: 1 }],
        idempotencyKey: 'idem-1',
      }),
    ).resolves.toEqual(response);
  });

  it('取消未支付订单会恢复库存', async () => {
    const tx = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.PENDING_PAYMENT,
          items: [{ productId: 'product-1', quantity: 2 }],
        }),
        update: jest.fn(),
      },
      product: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    await commerceWithPrisma(prisma).cancelOrder(userPrincipal, 'order-1');
    const updateCalls = tx.product.update.mock.calls as Array<
      [
        {
          data: { stock: { increment: number } };
        },
      ]
    >;
    const updateArg = updateCalls[0][0];
    expect(updateArg.data.stock.increment).toBe(2);
  });
});

describe('预约名额并发测试', () => {
  it('并发时段扣减失败会抛出冲突错误', async () => {
    const tx = {
      reservationItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'item-1',
          price: 6800,
          status: ContentStatus.PUBLISHED,
        }),
      },
      reservationSlot: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'slot-1',
          reservationItemId: 'item-1',
          capacity: 1,
          bookedCount: 0,
          status: ReservationSlotStatus.OPEN,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      reservationOrder: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new ReservationsService(prisma);
    await expect(
      service.createReservation(userPrincipal, {
        reservationItemId: 'item-1',
        reservationSlotId: 'slot-1',
        contactName: '张三',
        contactPhone: '13800000000',
        quantity: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('活动重复报名会被拒绝', async () => {
    const tx = {
      activity: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'activity-1',
          capacity: 10,
          registeredCount: 1,
          fee: 0,
        }),
      },
      activityRegistration: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'reg-1', status: ActivityRegistrationStatus.REGISTERED }),
        create: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    await expect(
      new ReservationsService(prisma).registerActivity(userPrincipal, 'activity-1', {
        contactName: '张三',
        contactPhone: '13800000000',
        participantCount: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('支付回调重复通知测试', () => {
  it('已支付记录重复通知保持幂等', async () => {
    const tx = {
      paymentRecord: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pay-1',
          paymentNo: 'PAY1',
          status: PaymentRecordStatus.PAID,
          amount: 100,
          orderType: PaymentOrderType.MALL_ORDER,
          orderId: 'order-1',
        }),
        update: jest.fn(),
      },
      order: { update: jest.fn() },
      reservationOrder: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const adapter = {
      verifyNotify: jest.fn().mockReturnValue(true),
      decryptNotifyResource: jest.fn().mockReturnValue({
        outTradeNo: 'PAY1',
        transactionId: 'wx-1',
        amount: 100,
        mchid: 'mch',
        tradeState: 'SUCCESS',
      }),
    };
    const service = new PaymentsService(prisma, adapter as never);
    await expect(service.handleWechatNotify({}, '{}', {})).resolves.toEqual({
      code: 'SUCCESS',
      message: 'success',
    });
    expect(tx.paymentRecord.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it('找不到支付记录时抛出错误', async () => {
    const tx = {
      paymentRecord: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const adapter = {
      verifyNotify: jest.fn().mockReturnValue(true),
      decryptNotifyResource: jest.fn().mockReturnValue({
        outTradeNo: 'PAY404',
        transactionId: 'wx-404',
        amount: 100,
        mchid: 'mch',
        tradeState: 'SUCCESS',
      }),
    };
    await expect(
      new PaymentsService(prisma, adapter as never).handleWechatNotify({}, '{}', {}),
    ).rejects.toThrow(NotFoundException);
  });
});
