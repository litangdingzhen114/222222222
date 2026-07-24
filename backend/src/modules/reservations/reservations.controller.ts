import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AuthPrincipal } from '../auth/auth.types';
import { CreateReservationDto, RegisterActivityDto } from './dto/reservations.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@Controller({ path: '', version: '1' })
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Public()
  @Get('reservation-items')
  reservationItems(@Query() query: PageQueryDto) {
    return this.reservations.reservationItems(query);
  }

  @Public()
  @Get('reservation-items/:id')
  reservationItem(@Param('id') id: string) {
    return this.reservations.reservationItem(id);
  }

  @Public()
  @Get('reservation-items/:id/slots')
  slots(@Param('id') id: string) {
    return this.reservations.slots(id);
  }

  @ApiBearerAuth()
  @Post('reservations')
  createReservation(@CurrentUser() principal: AuthPrincipal, @Body() dto: CreateReservationDto) {
    return this.reservations.createReservation(principal, dto);
  }

  @ApiBearerAuth()
  @Get('reservations')
  myReservations(@CurrentUser() principal: AuthPrincipal, @Query() query: PageQueryDto) {
    return this.reservations.myReservations(principal, query);
  }

  @ApiBearerAuth()
  @Get('reservations/:id')
  reservationDetail(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.reservations.reservationDetail(principal, id);
  }

  @ApiBearerAuth()
  @Post('reservations/:id/cancel')
  cancelReservation(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.reservations.cancelReservation(principal, id);
  }

  @Public()
  @Get('activities')
  activities(@Query() query: PageQueryDto) {
    return this.reservations.activities(query);
  }

  @Public()
  @Get('activities/:id')
  activity(@Param('id') id: string) {
    return this.reservations.activity(id);
  }

  @ApiBearerAuth()
  @Post('activities/:id/register')
  registerActivity(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: RegisterActivityDto,
  ) {
    return this.reservations.registerActivity(principal, id, dto);
  }

  @ApiBearerAuth()
  @Get('activity-registrations')
  myActivityRegistrations(@CurrentUser() principal: AuthPrincipal, @Query() query: PageQueryDto) {
    return this.reservations.myActivityRegistrations(principal, query);
  }

  @ApiBearerAuth()
  @Post('activity-registrations/:id/cancel')
  cancelActivityRegistration(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.reservations.cancelActivityRegistration(principal, id);
  }
}
