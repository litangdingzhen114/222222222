import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole, OrderStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestWithContext } from '../../common/interfaces/http.interface';
import { AuthPrincipal } from '../auth/auth.types';
import { AdminsService } from './admins.service';
import {
  AdminResourceMutationDto,
  AdminResourceQueryDto,
  ReplyFeedbackDto,
  ShipOrderDto,
} from './dto/admins.dto';

@ApiBearerAuth()
@ApiTags('admin')
@Roles(AdminRole.CONTENT_OPERATOR, AdminRole.MALL_OPERATOR, AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get('overview')
  overview(@CurrentUser() principal: AuthPrincipal) {
    return this.admins.overview(principal);
  }

  @Get('me')
  me(@CurrentUser() principal: AuthPrincipal) {
    return this.admins.me(principal);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() principal: AuthPrincipal) {
    return this.admins.dashboard(principal);
  }

  @Get('config-status')
  configStatus(@CurrentUser() principal: AuthPrincipal) {
    return this.admins.configStatus(principal);
  }

  @Get('users')
  users(@CurrentUser() principal: AuthPrincipal, @Query() query: AdminResourceQueryDto) {
    return this.admins.users(principal, query);
  }

  @Get('audit-logs')
  auditLogs(@CurrentUser() principal: AuthPrincipal, @Query() query: AdminResourceQueryDto) {
    return this.admins.auditLogs(principal, query);
  }

  @Post('orders/:id/ship')
  shipOrder(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: ShipOrderDto,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.shipOrder(principal, id, dto, request.requestId);
  }

  @Post('orders/:id/refunding')
  markRefunding(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.markRefund(principal, id, OrderStatus.REFUNDING, request.requestId);
  }

  @Post('orders/:id/refunded')
  markRefunded(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.markRefund(principal, id, OrderStatus.REFUNDED, request.requestId);
  }

  @Post('feedback/:id/reply')
  replyFeedback(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: ReplyFeedbackDto,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.replyFeedback(principal, id, dto, request.requestId);
  }

  @Get(':resource')
  list(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Query() query: AdminResourceQueryDto,
  ) {
    return this.admins.list(principal, resource, query);
  }

  @Get(':resource/:id')
  detail(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ) {
    return this.admins.detail(principal, resource, id);
  }

  @Post(':resource')
  create(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Body() dto: AdminResourceMutationDto,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.create(principal, resource, dto, request.requestId);
  }

  @Patch(':resource/:id')
  update(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() dto: AdminResourceMutationDto,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.update(principal, resource, id, dto, request.requestId);
  }

  @Delete(':resource/:id')
  remove(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.remove(principal, resource, id, request.requestId);
  }

  @Post(':resource/:id/publish')
  publish(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.publish(principal, resource, id, request.requestId);
  }

  @Post(':resource/:id/offline')
  offline(
    @CurrentUser() principal: AuthPrincipal,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.admins.offline(principal, resource, id, request.requestId);
  }
}
