import { Module } from '@nestjs/common';
import { LlmProvider } from '../../integrations/llm/llm.provider';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  controllers: [EngagementController],
  providers: [EngagementService, LlmProvider],
  exports: [EngagementService],
})
export class EngagementModule {}
