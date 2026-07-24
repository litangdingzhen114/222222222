import { IsObject, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page.dto';

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
