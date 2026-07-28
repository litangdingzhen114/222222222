import { Global, Module } from '@nestjs/common';
import { IntegrationConfigService } from './integration-config.service';

@Global()
@Module({
  providers: [IntegrationConfigService],
  exports: [IntegrationConfigService],
})
export class IntegrationConfigModule {}
