import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({ description: 'wx.login 返回的 code' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class AdminLoginDto {
  @ApiProperty()
  @IsString()
  @Length(3, 64)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
