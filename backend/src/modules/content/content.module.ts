import { Module } from '@nestjs/common';
import { ContentController, HomeController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [HomeController, ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
