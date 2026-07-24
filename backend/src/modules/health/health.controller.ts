import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  app() {
    return this.health.app();
  }

  @Get('database')
  database() {
    return this.health.database();
  }

  @Get('redis')
  redis() {
    return this.health.redisHealth();
  }
}
