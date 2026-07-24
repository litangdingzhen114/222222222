import { Module } from '@nestjs/common';
import { CamerasModule } from '../cameras/cameras.module';
import { CommerceModule } from '../commerce/commerce.module';
import { ContentModule } from '../content/content.module';
import { EngagementModule } from '../engagement/engagement.module';
import { LegacyHailinController } from './legacy-hailin.controller';

@Module({
  imports: [ContentModule, CommerceModule, CamerasModule, EngagementModule],
  controllers: [LegacyHailinController],
})
export class LegacyModule {}
