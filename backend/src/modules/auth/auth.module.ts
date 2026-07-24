import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { WechatMiniProgramAdapter } from '../../integrations/wechat/wechat.adapter';
import { AuthController, AdminAuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, JwtStrategy, WechatMiniProgramAdapter],
  exports: [AuthService],
})
export class AuthModule {}
