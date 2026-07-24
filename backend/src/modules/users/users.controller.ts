import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthPrincipal } from '../auth/auth.types';
import { UpdateMeDto, UpsertAddressDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() principal: AuthPrincipal) {
    return this.users.me(principal);
  }

  @Patch('me')
  updateMe(@CurrentUser() principal: AuthPrincipal, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(principal, dto);
  }

  @Get('me/addresses')
  addresses(@CurrentUser() principal: AuthPrincipal) {
    return this.users.listAddresses(principal);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() principal: AuthPrincipal, @Body() dto: UpsertAddressDto) {
    return this.users.createAddress(principal, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.users.updateAddress(principal, id, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() principal: AuthPrincipal, @Param('id') id: string) {
    return this.users.deleteAddress(principal, id);
  }
}
