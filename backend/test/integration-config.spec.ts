import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminRole, TokenSubjectType } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { IntegrationConfigService } from '../src/modules/integration-config/integration-config.service';
import { NamingProfileService } from '../src/modules/naming-profile/naming-profile.service';

const superAdmin = {
  id: 'admin-super',
  type: TokenSubjectType.ADMIN,
  role: AdminRole.SUPER_ADMIN,
  tokenId: 'token-super',
};

const contentAdmin = {
  id: 'admin-content',
  type: TokenSubjectType.ADMIN,
  role: AdminRole.CONTENT_OPERATOR,
  tokenId: 'token-content',
};

function config(values: Record<string, string>) {
  return {
    get: <T>(key: string, fallback?: T) => (values[key] ?? fallback) as T,
    getOrThrow: <T>(key: string) => values[key] as T,
  } as ConfigService;
}

type ConfigRecord = {
  id?: string;
  service: string;
  key: string;
  value?: string | null;
  isSecret?: boolean;
  valuePreview?: string | null;
  updatedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function buildService(records: ConfigRecord[] = []) {
  const store: ConfigRecord[] = [...records];
  const tx = {
    integrationConfig: {
      deleteMany: jest.fn(({ where }: { where: { service: string; key: string } }) => {
        const index = store.findIndex(
          (record) => record.service === where.service && record.key === where.key,
        );
        if (index >= 0) store.splice(index, 1);
        return { count: index >= 0 ? 1 : 0 };
      }),
      upsert: jest.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { service_key: { service: string; key: string } };
          create: ConfigRecord;
          update: Partial<ConfigRecord>;
        }) => {
          const index = store.findIndex(
            (record) =>
              record.service === where.service_key.service && record.key === where.service_key.key,
          );
          const now = new Date('2026-07-29T00:00:00.000Z');
          if (index >= 0) {
            store[index] = { ...store[index], ...update, updatedAt: now };
            return store[index];
          }
          const next = {
            id: `${create.service}-${create.key}`,
            ...create,
            createdAt: now,
            updatedAt: now,
          };
          store.push(next);
          return next;
        },
      ),
    },
  };
  const prisma = {
    integrationConfig: {
      findMany: jest.fn(() =>
        store.map((record) => ({
          ...record,
          updatedBy: { username: 'hailin-admin', displayName: '海林管理员' },
        })),
      ),
      findFirst: jest.fn(({ where }: { where: { key: string } }) =>
        store.find((record) => record.key === where.key),
      ),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
  } as unknown as PrismaService;
  const service = new IntegrationConfigService(
    prisma,
    config({
      JWT_ACCESS_SECRET: 'x'.repeat(32),
      WECHAT_APP_ID: 'env-appid',
      WECHAT_APP_SECRET: 'env-secret',
    }),
  );
  return { service, prisma, tx, store };
}

function buildNamingProfileService(records: ConfigRecord[] = []) {
  const store: ConfigRecord[] = [...records];
  const tx = {
    integrationConfig: {
      upsert: jest.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { service_key: { service: string; key: string } };
          create: ConfigRecord;
          update: Partial<ConfigRecord>;
        }) => {
          const index = store.findIndex(
            (record) =>
              record.service === where.service_key.service && record.key === where.service_key.key,
          );
          const now = new Date('2026-07-29T00:00:00.000Z');
          if (index >= 0) {
            store[index] = { ...store[index], ...update, updatedAt: now };
            return store[index];
          }
          const next = {
            id: `${create.service}-${create.key}`,
            ...create,
            createdAt: now,
            updatedAt: now,
          };
          store.push(next);
          return next;
        },
      ),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    integrationConfig: {
      findUnique: jest.fn(
        ({ where }: { where: { service_key: { service: string; key: string } } }) => {
          const record = store.find(
            (item) =>
              item.service === where.service_key.service && item.key === where.service_key.key,
          );
          if (!record) return null;
          return {
            ...record,
            updatedBy: { username: 'hailin-admin', displayName: '黄湖管理员' },
          };
        },
      ),
    },
    $transaction: jest.fn((callback: (txArg: typeof tx) => Promise<unknown>) => callback(tx)),
  } as unknown as PrismaService;
  return { service: new NamingProfileService(prisma), prisma, tx, store };
}

describe('后台 API Key 配置链路', () => {
  it('保存密钥后加密入库，并且业务读取优先使用数据库配置', async () => {
    const { service, store } = buildService();
    const result = await service.updateGroup(
      'wechat',
      {
        WECHAT_APP_ID: 'wx-db-appid',
        WECHAT_APP_SECRET: 'db-secret',
      },
      [],
      superAdmin,
      'request-1',
    );

    expect(result.links.length).toBeGreaterThan(0);
    const secretRecord = store.find((record) => record.key === 'WECHAT_APP_SECRET');
    expect(secretRecord?.value).toEqual(expect.stringMatching(/^v1:/));
    expect(secretRecord?.value).not.toBe('db-secret');
    await expect(service.getValue('WECHAT_APP_SECRET')).resolves.toBe('db-secret');
    await expect(service.getValue('WECHAT_APP_ID')).resolves.toBe('wx-db-appid');
  });

  it('没有后台配置时回退到环境变量', async () => {
    const { service } = buildService();
    await expect(service.getValue('WECHAT_APP_SECRET')).resolves.toBe('env-secret');
  });

  it('非超级管理员不能保存第三方凭证', async () => {
    const { service } = buildService();
    await expect(
      service.updateGroup(
        'wechat',
        { WECHAT_APP_ID: 'wx-db-appid' },
        [],
        contentAdmin,
        'request-2',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('拒绝保存对象类型配置值', async () => {
    const { service } = buildService();
    await expect(
      service.updateGroup('wechat', { WECHAT_APP_ID: { value: 'wx-db-appid' } }, [], superAdmin),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('内容命名方案配置链路', () => {
  it('默认使用黄湖林场方案并统一转换接口文本', async () => {
    const { service } = buildNamingProfileService();
    const profile = await service.getProfile(true);
    expect(profile.mode).toBe('huanghu');

    const transformed = await service.transformResponse({
      title: '海林村春日慢游',
      cafe: '寻野 cafe',
      scenic: '青田石韵',
    });
    expect(transformed).toEqual({
      title: '黄湖林场春日慢游',
      cafe: '土狗咖啡',
      scenic: '古树年轮',
    });
  });

  it('后台切换方案会落库并写入审计日志', async () => {
    const { service, store, tx } = buildNamingProfileService();
    const result = await service.updateProfile('hailin', superAdmin, 'request-naming');

    expect(result.mode).toBe('hailin');
    expect(store[0]?.service).toBe('content');
    expect(store[0]?.key).toBe('CONTENT_NAMING_PROFILE');
    expect(store[0]?.value).toContain('"mode":"hailin"');
    const auditCalls = tx.auditLog.create.mock.calls as Array<
      [{ data: { action: string; requestId?: string } }]
    >;
    expect(auditCalls[0][0].data.action).toBe('naming-profile.updated');
    expect(auditCalls[0][0].data.requestId).toBe('request-naming');
  });
});
