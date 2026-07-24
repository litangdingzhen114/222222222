import { IsEnum, IsString } from 'class-validator';
import { PaymentOrderType } from '@prisma/client';

export class CreateWechatPaymentDto {
  @IsEnum(PaymentOrderType)
  orderType!: PaymentOrderType;

  @IsString()
  orderId!: string;
}
