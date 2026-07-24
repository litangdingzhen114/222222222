import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AuthPrincipal } from '../auth/auth.types';
import {
  AddCartItemDto,
  CreateOrderDto,
  OrderPreviewDto,
  ProductQueryDto,
  SelectCartDto,
  UpdateCartItemDto,
} from './dto/commerce.dto';
import { CommerceService } from './commerce.service';

@ApiTags('commerce')
@Controller({ path: '', version: '1' })
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Public()
  @Get('product-categories')
  categories() {
    return this.commerce.categories();
  }

  @Public()
  @Get('products')
  products(@Query() query: ProductQueryDto) {
    return this.commerce.products(query);
  }

  @Public()
  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.commerce.product(id);
  }

  @ApiBearerAuth()
  @Get('cart')
  cart(@CurrentUser() principal: AuthPrincipal) {
    return this.commerce.cart(principal);
  }

  @ApiBearerAuth()
  @Post('cart/items')
  addCartItem(@CurrentUser() principal: AuthPrincipal, @Body() dto: AddCartItemDto) {
    return this.commerce.addCartItem(principal, dto);
  }

  @ApiBearerAuth()
  @Patch('cart/items/:id')
  updateCartItem(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.commerce.updateCartItem(principal, id, dto);
  }

  @ApiBearerAuth()
  @Delete('cart/items/:id')
  deleteCartItem(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.commerce.deleteCartItem(principal, id);
  }

  @ApiBearerAuth()
  @Patch('cart/select')
  selectCart(@CurrentUser() principal: AuthPrincipal, @Body() dto: SelectCartDto) {
    return this.commerce.selectCart(principal, dto);
  }

  @ApiBearerAuth()
  @Post('orders/preview')
  previewOrder(@CurrentUser() principal: AuthPrincipal, @Body() dto: OrderPreviewDto) {
    return this.commerce.previewOrder(principal, dto);
  }

  @ApiBearerAuth()
  @Post('orders')
  createOrder(
    @CurrentUser() principal: AuthPrincipal,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.commerce.createOrder(principal, dto, idempotencyKey);
  }

  @ApiBearerAuth()
  @Get('orders')
  orders(@CurrentUser() principal: AuthPrincipal, @Query() query: PageQueryDto) {
    return this.commerce.orders(principal, query);
  }

  @ApiBearerAuth()
  @Get('orders/:id')
  order(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.commerce.order(principal, id);
  }

  @ApiBearerAuth()
  @Post('orders/:id/cancel')
  cancelOrder(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.commerce.cancelOrder(principal, id);
  }

  @ApiBearerAuth()
  @Post('orders/:id/confirm-receipt')
  confirmReceipt(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.commerce.confirmReceipt(principal, id);
  }
}
