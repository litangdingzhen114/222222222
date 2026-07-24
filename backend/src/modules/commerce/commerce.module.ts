import { Module } from '@nestjs/common';
import { CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';
import { OrderMaintenanceService } from './order-maintenance.service';

@Module({
  controllers: [CommerceController],
  providers: [CommerceService, OrderMaintenanceService],
  exports: [CommerceService],
})
export class CommerceModule {}
