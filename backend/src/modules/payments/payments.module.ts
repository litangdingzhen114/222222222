import { Module } from '@nestjs/common';
import { WechatPayAdapter } from '../../integrations/wechat-pay/wechat-pay.adapter';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, WechatPayAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}
