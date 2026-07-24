import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminStatus, TokenSubjectType, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { WechatMiniProgramAdapter } from '../../integrations/wechat/wechat.adapter';
import { sha256 } from '../../common/utils/crypto.util';
import { addSeconds, parseDurationSeconds } from '../../common/utils/time.util';
import { AdminLoginDto, RefreshTokenDto, WechatLoginDto } from './dto/auth.dto';
import { JwtPayload, TokenPair } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly wechat: WechatMiniProgramAdapter,
  ) {}

  async wechatLogin(dto: WechatLoginDto) {
    const session = await this.wechat.code2Session(dto.code);
    const user = await this.prisma.user.upsert({
      where: { openid: session.openid },
      create: {
        openid: session.openid,
        unionid: session.unionid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        sessionKeyHash: sha256(session.sessionKey),
        lastLoginAt: new Date(),
      },
      update: {
        unionid: session.unionid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        sessionKeyHash: sha256(session.sessionKey),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
    const tokens = await this.issueTokens(TokenSubjectType.USER, user.id);
    return {
      user: this.serializeUser(user),
      ...tokens,
      authMode: session.mode,
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username: dto.username } });
    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const ok = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const tokens = await this.issueTokens(TokenSubjectType.ADMIN, admin.id, admin.role);
    return {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const payload = await this.jwt
      .verifyAsync<JwtPayload>(dto.refreshToken, { secret })
      .catch(() => undefined);
    if (!payload) {
      throw new UnauthorizedException('refresh token invalid');
    }
    const tokenHash = sha256(dto.refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('refresh token expired');
    }

    const tokens = await this.issueTokens(payload.typ, payload.sub, payload.role);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: tokens.refreshTokenId },
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken
      .update({
        where: { tokenHash: sha256(refreshToken) },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
    return { ok: true };
  }

  private async issueTokens(
    subjectType: TokenSubjectType,
    subjectId: string,
    role?: JwtPayload['role'],
  ) {
    const tokenId = randomUUID();
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
    const refreshExpiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    const payload: JwtPayload = { sub: subjectId, typ: subjectType, role, tokenId };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: parseDurationSeconds(accessExpiresIn),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: parseDurationSeconds(refreshExpiresIn),
    });
    const refreshSeconds = parseDurationSeconds(refreshExpiresIn);
    const record = await this.prisma.refreshToken.create({
      data: {
        subjectType,
        tokenHash: sha256(refreshToken),
        expiresAt: addSeconds(new Date(), refreshSeconds),
        userId: subjectType === TokenSubjectType.USER ? subjectId : undefined,
        adminId: subjectType === TokenSubjectType.ADMIN ? subjectId : undefined,
      },
    });
    const result: TokenPair & { refreshTokenId: string } = {
      accessToken,
      refreshToken,
      expiresIn: parseDurationSeconds(accessExpiresIn),
      refreshTokenId: record.id,
    };
    return result;
  }

  private serializeUser(user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    phone: string | null;
  }) {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };
  }
}
