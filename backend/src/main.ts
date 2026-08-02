import 'reflect-metadata';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const trustProxy = config.get<boolean>('TRUST_PROXY', false);
  if (trustProxy) {
    const instance = app.getHttpAdapter().getInstance() as {
      set(name: string, value: unknown): void;
    };
    instance.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(compression());
  app.use(
    '/uploads',
    express.static(join(process.cwd(), config.get<string>('LOCAL_UPLOAD_DIR', 'uploads'))),
  );
  app.enableCors({
    origin: parseOrigins(config.get<string>('ALLOWED_ORIGINS', '')),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get<boolean>('SWAGGER_ENABLED', true)) {
    const documentConfig = new DocumentBuilder()
      .setTitle('一部手机游海林村 API')
      .setDescription('微信小程序、管理后台和第三方服务联调用 RESTful API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('PORT', 8787);
  const host = config.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
}

function parseOrigins(value: string) {
  const origins = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (origins.length === 0) return true;
  return origins;
}

void bootstrap();
