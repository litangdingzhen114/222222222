import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { HealthService } from '../src/modules/health/health.service';

describe('Health E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://hailin:test@127.0.0.1:5432/hailin_test?schema=public';
    process.env.REDIS_URL = 'redis://127.0.0.1:6379/0';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-change-before-production';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-change-before-production';

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) })
      .overrideProvider(RedisService)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        incrWithExpire: jest.fn().mockResolvedValue(1),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('bootstraps the health module in the Nest app context', () => {
    const body = app.get(HealthService).app();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('hailin-backend');
  });
});
