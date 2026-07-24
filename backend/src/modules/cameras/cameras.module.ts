import { Module } from '@nestjs/common';
import { EzvizAdapter } from '../../integrations/ezviz/ezviz.adapter';
import { CamerasController } from './cameras.controller';
import { CamerasService } from './cameras.service';

@Module({
  controllers: [CamerasController],
  providers: [CamerasService, EzvizAdapter],
  exports: [CamerasService],
})
export class CamerasModule {}
