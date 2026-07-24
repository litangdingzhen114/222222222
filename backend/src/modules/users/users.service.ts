import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TokenSubjectType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthPrincipal } from '../auth/auth.types';
import { UpdateMeDto, UpsertAddressDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(principal: AuthPrincipal) {
    this.assertUser(principal);
    const user = await this.prisma.user.findUnique({
      where: { id: principal.id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        gender: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async updateMe(principal: AuthPrincipal, dto: UpdateMeDto) {
    this.assertUser(principal);
    return this.prisma.user.update({
      where: { id: principal.id },
      data: dto,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        gender: true,
        updatedAt: true,
      },
    });
  }

  listAddresses(principal: AuthPrincipal) {
    this.assertUser(principal);
    return this.prisma.address.findMany({
      where: { userId: principal.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createAddress(principal: AuthPrincipal, dto: UpsertAddressDto) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId: principal.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: { ...dto, userId: principal.id, isDefault: dto.isDefault ?? false },
      });
    });
  }

  async updateAddress(principal: AuthPrincipal, id: string, dto: UpsertAddressDto) {
    this.assertUser(principal);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.address.findFirst({ where: { id, userId: principal.id } });
      if (!current) throw new NotFoundException('address not found');
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId: principal.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: { ...dto, isDefault: dto.isDefault ?? current.isDefault },
      });
    });
  }

  async deleteAddress(principal: AuthPrincipal, id: string) {
    this.assertUser(principal);
    await this.prisma.address.deleteMany({ where: { id, userId: principal.id } });
    return { ok: true };
  }

  private assertUser(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.USER) {
      throw new ForbiddenException('user token required');
    }
  }
}
