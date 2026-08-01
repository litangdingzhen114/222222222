import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page.dto';
import { NamingProfileMode } from '../../../common/utils/naming-profile.util';

export class AdminResourceQueryDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  orderType?: string;
}

export class AdminResourceMutationDto {
  @IsObject()
  data!: Record<string, unknown>;
}

export class ShipOrderDto {
  @IsString()
  logisticsCompany!: string;

  @IsString()
  logisticsNo!: string;
}

export class RefundStatusDto {
  @IsString()
  status!: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ReplyFeedbackDto {
  @IsString()
  adminReply!: string;
}

export class UpdateIntegrationConfigDto {
  @IsObject()
  values!: Record<string, unknown>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clearKeys?: string[];
}

export class UpdateNamingProfileDto {
  @IsIn(['huanghu', 'hailin'])
  mode!: NamingProfileMode;
}
