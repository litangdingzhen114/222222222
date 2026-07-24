import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  app() {
    return { status: 'ok', service: 'hailin-backend', timestamp: Date.now() };
  }

  async database() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }

  async redisHealth() {
    const pong = await this.redis.ping();
    return { status: pong === 'PONG' ? 'ok' : 'unavailable', response: pong };
  }
}
