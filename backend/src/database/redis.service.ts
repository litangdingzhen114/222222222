import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private available = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.getOrThrow<string>('REDIS_URL');
    const required = this.config.get<boolean>('REDIS_REQUIRED', false);
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });

    try {
      await this.client.connect();
      this.available = true;
    } catch (error) {
      this.available = false;
      if (required) {
        throw error;
      }
      this.logger.warn(
        'Redis is unavailable; cache, rate-limit and token blocklist fall back to database-safe behavior.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  isAvailable() {
    return this.available;
  }

  async ping() {
    if (!this.client || !this.available) return 'unavailable';
    return this.client.ping();
  }

  async get(key: string) {
    if (!this.client || !this.available) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!this.client || !this.available) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(key: string) {
    if (!this.client || !this.available) return 0;
    return this.client.del(key);
  }

  async incrWithExpire(key: string, ttlSeconds: number) {
    if (!this.client || !this.available) return 1;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }
}
