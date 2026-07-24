import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page.dto';

export class ReservationItemQueryDto extends PageQueryDto {}

export class CreateReservationDto {
  @IsString()
  reservationItemId!: string;

  @IsString()
  reservationSlotId!: string;

  @IsString()
  @Length(1, 30)
  contactName!: string;

  @IsString()
  @Length(6, 30)
  contactPhone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class RegisterActivityDto {
  @IsString()
  @Length(1, 30)
  contactName!: string;

  @IsString()
  @Length(6, 30)
  contactPhone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  participantCount!: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
