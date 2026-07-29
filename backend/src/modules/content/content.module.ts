import { Module } from '@nestjs/common';
import { AmapAdapter } from '../../integrations/amap/amap.adapter';
import { ContentController, HomeController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [HomeController, ContentController],
  providers: [ContentService, AmapAdapter],
  exports: [ContentService],
})
export class ContentModule {}
