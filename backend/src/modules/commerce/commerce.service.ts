import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  IdempotencyStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ShippingStatus,
  TokenSubjectType,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getPagination, PageQueryDto, toPageResult } from '../../common/dto/page.dto';
import { toInputJson } from '../../common/utils/json.util';
import { createOrderNo } from '../../common/utils/order-no.util';
import { addSeconds } from '../../common/utils/time.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthPrincipal } from '../auth/auth.types';
import {
  AddCartItemDto,
  CartItemDto,
  CreateOrderDto,
  ProductQueryDto,
  SelectCartDto,
  UpdateCartItemDto,
} from './dto/commerce.dto';

export interface OrderDraftItem {
  productId: string;
  quantity: number;
  productName: string;
  productImage: string;
  specification: string | null;
  unitPrice: number;
  totalAmount: number;
}

export interface OrderDraft {
  items: OrderDraftItem[];
  productAmount: number;
  freightAmount: number;
  discountAmount: number;
  payableAmount: number;
  addressSnapshot?: Prisma.InputJsonObject;
}

@Injectable()
export class CommerceService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.productCategory.findMany({
      where: { status: ContentStatus.PUBLISHED, deletedAt: null },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
  }

  async products(query: ProductQueryDto) {
    const { skip, take, page, pageSize } = getPagination(query);
    const where = {
      status: ProductStatus.ON_SALE,
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
    };
    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { sales: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async product(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: ProductStatus.ON_SALE, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('product not found');
    return product;
  }

  cart(principal: AuthPrincipal) {
    this.assertUser(principal);
    return this.prisma.cartItem.findMany({
      where: { userId: principal.id },
      include: { product: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addCartItem(principal: AuthPrincipal, dto: AddCartItemDto) {
    this.assertUser(principal);
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, status: ProductStatus.ON_SALE, deletedAt: null },
    });
    if (!product) throw new NotFoundException('product not available');
    if (product.stock < dto.quantity) throw new ConflictException('product stock is not enough');
    return this.prisma.cartItem.upsert({
      where: { userId_productId: { userId: principal.id, productId: dto.productId } },
      create: {
        userId: principal.id,
        productId: dto.productId,
        quantity: dto.quantity,
        selected: true,
      },
      update: { quantity: { increment: dto.quantity }, selected: true },
    });
  }

  updateCartItem(principal: AuthPrincipal, id: string, dto: UpdateCartItemDto) {
    this.assertUser(principal);
    return this.prisma.cartItem.update({
      where: { id, userId: principal.id },
      data: dto,
    });
  }

  async deleteCartItem(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    await this.prisma.cartItem.deleteMany({ where: { id, userId: principal.id } });
    return { ok: true };
  }

  async selectCart(principal: AuthPrincipal, dto: SelectCartDto) {
    this.assertUser(principal);
    await this.prisma.cartItem.updateMany({
      where: { userId: principal.id, id: { in: dto.ids } },
      data: { selected: dto.selected },
    });
    return { ok: true };
  }

  async previewOrder(principal: AuthPrincipal, dto: { addressId?: string; items?: CartItemDto[] }) {
    this.assertUser(principal);
    return this.buildOrderDraft(principal.id, dto);
  }

  async createOrder(principal: AuthPrincipal, dto: CreateOrderDto, headerIdempotencyKey?: string) {
    this.assertUser(principal);
    const idempotencyKey = dto.idempotencyKey ?? headerIdempotencyKey;
    const scope = `mall-order:${principal.id}`;
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { scope_key: { scope, key: idempotencyKey } },
      });
      if (existing?.status === IdempotencyStatus.SUCCEEDED && existing.response) {
        return existing.response;
      }
      if (existing?.status === IdempotencyStatus.PROCESSING) {
        throw new ConflictException('same order request is processing');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        await tx.idempotencyRecord.upsert({
          where: { scope_key: { scope, key: idempotencyKey } },
          create: {
            scope,
            key: idempotencyKey,
            requestHash: JSON.stringify(dto),
            status: IdempotencyStatus.PROCESSING,
            expiresAt: addSeconds(new Date(), 86400),
          },
          update: { status: IdempotencyStatus.PROCESSING, requestHash: JSON.stringify(dto) },
        });
      }

      const draft = await this.buildOrderDraft(principal.id, dto, tx);
      if (!draft.addressSnapshot) throw new NotFoundException('address not found');
      for (const item of draft.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            status: ProductStatus.ON_SALE,
            deletedAt: null,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity }, sales: { increment: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new ConflictException(`product stock changed: ${item.productName}`);
        }
      }

      const order = await tx.order.create({
        data: {
          orderNo: createOrderNo('MALL'),
          userId: principal.id,
          addressSnapshot: draft.addressSnapshot,
          productAmount: draft.productAmount,
          freightAmount: draft.freightAmount,
          discountAmount: draft.discountAmount,
          payableAmount: draft.payableAmount,
          remark: dto.remark,
          idempotencyKey,
          items: {
            create: draft.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              specification: item.specification,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalAmount: item.totalAmount,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: {
          userId: principal.id,
          productId: { in: draft.items.map((item) => item.productId) },
        },
      });

      const response = { order, paymentRequired: order.payableAmount > 0 };
      if (idempotencyKey) {
        await tx.idempotencyRecord.update({
          where: { scope_key: { scope, key: idempotencyKey } },
          data: {
            status: IdempotencyStatus.SUCCEEDED,
            response: toInputJson(response),
          },
        });
      }
      return response;
    });
  }

  async orders(principal: AuthPrincipal, query: PageQueryDto) {
    this.assertUser(principal);
    const { skip, take, page, pageSize } = getPagination(query);
    const where = { userId: principal.id };
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return toPageResult(list, total, page, pageSize);
  }

  async order(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    const order = await this.prisma.order.findFirst({
      where: { id, userId: principal.id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('order not found');
    return order;
  }

  async cancelOrder(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId: principal.id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('order not found');
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new ConflictException('current order cannot be cancelled directly');
      }
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, sales: { decrement: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CLOSED,
          cancelledAt: new Date(),
        },
      });
      return { ok: true };
    });
  }

  async confirmReceipt(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    const order = await this.prisma.order.findFirst({ where: { id, userId: principal.id } });
    if (!order) throw new NotFoundException('order not found');
    if (order.status !== OrderStatus.SHIPPED || order.shippingStatus !== ShippingStatus.SHIPPED) {
      throw new ConflictException('order is not shipped');
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.COMPLETED,
        shippingStatus: ShippingStatus.RECEIVED,
        completedAt: new Date(),
      },
      include: { items: true },
    });
  }

  private async buildOrderDraft(
    userId: string,
    dto: { addressId?: string; items?: CartItemDto[] },
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const requestItems = dto.items?.length
      ? dto.items
      : (
          await tx.cartItem.findMany({
            where: { userId, selected: true },
            select: { productId: true, quantity: true },
          })
        ).map((item) => ({ productId: item.productId, quantity: item.quantity }));
    if (requestItems.length === 0) throw new ConflictException('no product selected');

    const productIds = [...new Set(requestItems.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, status: ProductStatus.ON_SALE, deletedAt: null },
      include: { freightTemplate: true },
    });
    if (products.length !== productIds.length)
      throw new NotFoundException('some products are not available');

    const items: OrderDraftItem[] = requestItems.map((requestItem) => {
      const product = products.find((candidate) => candidate.id === requestItem.productId);
      if (!product) throw new NotFoundException('product not found');
      if (product.stock < requestItem.quantity)
        throw new ConflictException(`product stock is not enough: ${product.name}`);
      return {
        productId: product.id,
        quantity: requestItem.quantity,
        productName: product.name,
        productImage: product.coverImage,
        specification: product.specification,
        unitPrice: product.price,
        totalAmount: product.price * requestItem.quantity,
      };
    });
    const productAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const freightAmount = productAmount >= 9900 ? 0 : 800;
    const discountAmount = 0;
    const payableAmount = productAmount + freightAmount - discountAmount;
    const address = dto.addressId
      ? await tx.address.findFirst({ where: { id: dto.addressId, userId } })
      : await tx.address.findFirst({ where: { userId, isDefault: true } });

    const draft: OrderDraft = {
      items,
      productAmount,
      freightAmount,
      discountAmount,
      payableAmount,
      addressSnapshot: address
        ? {
            contactName: address.contactName,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            detail: address.detail,
            postalCode: address.postalCode ?? null,
          }
        : undefined,
    };
    return draft;
  }

  private assertUser(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.USER) {
      throw new ForbiddenException('user token required');
    }
  }
}
