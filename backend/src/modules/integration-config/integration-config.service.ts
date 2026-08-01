import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminRole, TokenSubjectType } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { existsSync } from 'fs';
import { toInputJson } from '../../common/utils/json.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthPrincipal } from '../auth/auth.types';

type ConfigSource = 'database' | 'env' | 'none';

interface IntegrationFieldDefinition {
  key: string;
  label: string;
  secret: boolean;
  required?: boolean;
  envKeys?: string[];
  placeholder?: string;
  help?: string;
}

export interface IntegrationLinkDefinition {
  label: string;
  url: string;
}

interface IntegrationGroupDefinition {
  service: string;
  name: string;
  description: string;
  links: IntegrationLinkDefinition[];
  fields: IntegrationFieldDefinition[];
}

export interface IntegrationConfigFieldState {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  configured: boolean;
  source: ConfigSource;
  valuePreview?: string;
  displayValue?: string;
  placeholder?: string;
  help?: string;
}

export interface IntegrationConfigGroupState {
  service: string;
  name: string;
  description: string;
  links: IntegrationLinkDefinition[];
  updatedAt?: Date;
  updatedBy?: string;
  fields: IntegrationConfigFieldState[];
}

export interface IntegrationConfigTestResult {
  service: string;
  ok: boolean;
  mode: 'official' | 'structural' | 'not_configured' | 'failed';
  message: string;
  checkedAt: Date;
}

const ENCRYPTION_PREFIX = 'v1';

@Injectable()
export class IntegrationConfigService {
  private readonly groups: IntegrationGroupDefinition[] = [
    {
      service: 'wechat',
      name: '微信小程序',
      description: '用于 wx.login code2Session、手机号能力和小程序登录。',
      links: [
        { label: '微信公众平台', url: 'https://mp.weixin.qq.com/' },
        {
          label: '小程序开发管理',
          url: 'https://developers.weixin.qq.com/miniprogram/dev/framework/',
        },
      ],
      fields: [
        {
          key: 'WECHAT_APP_ID',
          label: 'AppID',
          secret: false,
          required: true,
          placeholder: 'wx 开头的小程序 AppID',
        },
        {
          key: 'WECHAT_APP_SECRET',
          label: 'AppSecret',
          secret: true,
          required: true,
          envKeys: ['WECHAT_APP_SECRET', 'WECHAT_SECRET'],
          placeholder: '小程序后台生成的 AppSecret',
        },
        {
          key: 'WECHAT_API_BASE_URL',
          label: '微信 API 地址',
          secret: false,
          placeholder: 'https://api.weixin.qq.com',
        },
      ],
    },
    {
      service: 'wechatPay',
      name: '微信支付',
      description: '用于 JSAPI 下单、支付回调验签和支付状态同步。',
      links: [
        { label: '微信支付商户平台', url: 'https://pay.weixin.qq.com/' },
        {
          label: 'API v3 接入文档',
          url: 'https://pay.wechatpay.cn/doc/v3/merchant/4012791850',
        },
      ],
      fields: [
        { key: 'WECHAT_PAY_APP_ID', label: '支付 AppID', secret: false, required: true },
        { key: 'WECHAT_PAY_MCH_ID', label: '商户号', secret: false, required: true },
        {
          key: 'WECHAT_PAY_API_V3_KEY',
          label: 'API v3 Key',
          secret: true,
          required: true,
          envKeys: ['WECHAT_PAY_API_V3_KEY', 'WECHAT_PAY_KEY'],
        },
        { key: 'WECHAT_PAY_SERIAL_NO', label: '商户证书序列号', secret: false, required: true },
        {
          key: 'WECHAT_PAY_PRIVATE_KEY_PATH',
          label: '商户私钥路径',
          secret: false,
          required: true,
          help: '填写服务器内证书文件路径，不要上传到 Git。',
        },
        {
          key: 'WECHAT_PAY_PLATFORM_CERT_PATH',
          label: '平台证书路径',
          secret: false,
          help: '支付回调验签需要平台证书。',
        },
        { key: 'WECHAT_PAY_NOTIFY_URL', label: '支付回调 URL', secret: false, required: true },
        {
          key: 'WECHAT_PAY_API_BASE_URL',
          label: '微信支付 API 地址',
          secret: false,
          placeholder: 'https://api.mch.weixin.qq.com',
        },
      ],
    },
    {
      service: 'ezviz',
      name: '萤石云直播',
      description: '用于缓存萤石云 accessToken 并动态获取直播播放地址。',
      links: [
        { label: '萤石开放平台', url: 'https://open.ys7.com/' },
        { label: '开发者服务', url: 'https://open.ys7.com/help' },
      ],
      fields: [
        { key: 'EZVIZ_APP_KEY', label: 'AppKey', secret: false, required: true },
        { key: 'EZVIZ_APP_SECRET', label: 'AppSecret', secret: true, required: true },
        {
          key: 'EZVIZ_API_BASE_URL',
          label: '萤石云 API 地址',
          secret: false,
          placeholder: 'https://open.ys7.com/api/lapp',
        },
      ],
    },
    {
      service: 'amap',
      name: '高德地图',
      description: '用于服务端地理编码、行政区或后续路径能力。',
      links: [
        { label: '高德开放平台', url: 'https://lbs.amap.com/' },
        { label: 'Key 控制台', url: 'https://console.amap.com/dev/key/app' },
      ],
      fields: [
        {
          key: 'AMAP_KEY',
          label: '高德 Key',
          secret: true,
          required: true,
          envKeys: ['AMAP_KEY', 'MAP_KEY'],
        },
        {
          key: 'AMAP_API_BASE_URL',
          label: '高德 API 地址',
          secret: false,
          placeholder: 'https://restapi.amap.com',
        },
      ],
    },
    {
      service: 'storage',
      name: '文件存储',
      description: '开发环境可用本地存储，生产环境建议切换腾讯云 COS。',
      links: [
        { label: '腾讯云 COS', url: 'https://cloud.tencent.com/product/cos' },
        { label: '访问密钥管理', url: 'https://console.cloud.tencent.com/cam/capi' },
      ],
      fields: [
        {
          key: 'STORAGE_DRIVER',
          label: '存储驱动',
          secret: false,
          placeholder: 'local 或 cos',
          help: '填写 local 或 cos。',
        },
        {
          key: 'TENCENT_COS_SECRET_ID',
          label: 'COS SecretId',
          secret: true,
          envKeys: ['TENCENT_COS_SECRET_ID', 'COS_SECRET_ID'],
        },
        {
          key: 'TENCENT_COS_SECRET_KEY',
          label: 'COS SecretKey',
          secret: true,
          envKeys: ['TENCENT_COS_SECRET_KEY', 'COS_KEY'],
        },
        { key: 'TENCENT_COS_BUCKET', label: 'COS Bucket', secret: false },
        { key: 'TENCENT_COS_REGION', label: 'COS Region', secret: false },
        { key: 'TENCENT_COS_PUBLIC_BASE_URL', label: 'COS 公开访问域名', secret: false },
      ],
    },
    {
      service: 'llm',
      name: 'AI 导游模型',
      description: '用于 AI 导游回答生成；未配置时使用数据库检索 fallback。',
      links: [
        { label: 'Moonshot 控制台', url: 'https://platform.moonshot.cn/console/api-keys' },
        { label: 'OpenAI API Keys', url: 'https://platform.openai.com/api-keys' },
      ],
      fields: [
        { key: 'LLM_PROVIDER', label: '模型供应商', secret: false, placeholder: 'kimi/openai' },
        {
          key: 'LLM_API_KEY',
          label: '模型 API Key',
          secret: true,
          required: true,
          envKeys: ['LLM_API_KEY', 'AI_API_KEY'],
        },
        {
          key: 'LLM_BASE_URL',
          label: 'OpenAI 兼容 Base URL',
          secret: false,
          placeholder: 'https://api.moonshot.cn/v1',
        },
        { key: 'LLM_MODEL', label: '模型名称', secret: false, placeholder: 'moonshot-v1-8k' },
      ],
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listGroups(service?: string) {
    const definitions = service ? [this.groupDefinition(service)] : this.groups;
    const keys = definitions.flatMap((group) => group.fields.map((field) => field.key));
    const records = await this.prisma.integrationConfig.findMany({
      where: { key: { in: keys } },
      include: { updatedBy: { select: { username: true, displayName: true } } },
    });
    const byKey = new Map(records.map((record) => [record.key, record]));

    return definitions.map((group) => {
      const groupRecords = group.fields
        .map((field) => byKey.get(field.key))
        .filter((record): record is NonNullable<typeof record> => Boolean(record));
      const latest = groupRecords.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      return {
        service: group.service,
        name: group.name,
        description: group.description,
        links: group.links,
        updatedAt: latest?.updatedAt,
        updatedBy: latest?.updatedBy?.displayName || latest?.updatedBy?.username,
        fields: group.fields.map((field) => this.fieldState(field, byKey.get(field.key))),
      } satisfies IntegrationConfigGroupState;
    });
  }

  async getValue(key: string, fallback = '') {
    const record = await this.prisma.integrationConfig.findFirst({ where: { key } });
    if (record?.value) return record.isSecret ? this.decrypt(record.value) : record.value;
    const definition = this.fieldDefinition(key);
    return this.envValue(definition) || fallback;
  }

  async hasValue(key: string) {
    return Boolean(String(await this.getValue(key)).trim());
  }

  async hasAll(keys: string[]) {
    const values = await Promise.all(keys.map((key) => this.hasValue(key)));
    return values.every(Boolean);
  }

  async updateGroup(
    service: string,
    values: Record<string, unknown>,
    clearKeys: string[],
    principal: AuthPrincipal,
    requestId?: string,
  ) {
    this.assertSuperAdmin(principal);
    const definition = this.groupDefinition(service);
    const before = (await this.listGroups(service))[0];
    const allowed = new Map(definition.fields.map((field) => [field.key, field]));
    const clearSet = new Set(clearKeys.filter((key) => allowed.has(key)));
    const entries: Array<[string, string]> = Object.entries(values || {})
      .map(([key, value]) => [key, this.normalizeInputValue(value)] as [string, string])
      .filter(([key, value]) => allowed.has(key) && value.length > 0);

    if (!entries.length && !clearSet.size) {
      throw new BadRequestException('没有可保存的配置项');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const key of clearSet) {
        await tx.integrationConfig.deleteMany({ where: { service, key } });
      }
      for (const [key, value] of entries) {
        const field = allowed.get(key);
        if (!field) continue;
        await tx.integrationConfig.upsert({
          where: { service_key: { service, key } },
          create: {
            service,
            key,
            value: field.secret ? this.encrypt(value) : value,
            isSecret: field.secret,
            valuePreview: this.mask(value),
            updatedById: principal.id,
          },
          update: {
            value: field.secret ? this.encrypt(value) : value,
            isSecret: field.secret,
            valuePreview: this.mask(value),
            updatedById: principal.id,
          },
        });
      }
    });

    const after = (await this.listGroups(service))[0];
    await this.prisma.auditLog.create({
      data: {
        adminId: principal.id,
        action: 'update-integration-config',
        resource: 'integration-configs',
        resourceId: service,
        before: toInputJson(before),
        after: toInputJson(after),
        requestId,
      },
    });
    return after;
  }

  async testGroup(service: string): Promise<IntegrationConfigTestResult> {
    this.groupDefinition(service);
    try {
      if (service === 'wechat') return this.testWechat();
      if (service === 'wechatPay') return this.testWechatPay();
      if (service === 'ezviz') return this.testEzviz();
      if (service === 'amap') return this.testAmap();
      if (service === 'storage') return this.testStorage();
      if (service === 'llm') return this.testLlm();
      throw new NotFoundException(`integration service not found: ${service}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return {
        service,
        ok: false,
        mode: 'failed',
        message: error instanceof Error ? error.message : '连接测试失败',
        checkedAt: new Date(),
      };
    }
  }

  private fieldState(
    field: IntegrationFieldDefinition,
    record?: {
      value: string | null;
      isSecret: boolean;
      valuePreview: string | null;
    },
  ): IntegrationConfigFieldState {
    const envValue = this.envValue(field);
    const storedValue = record?.value || '';
    const configured = Boolean(storedValue || envValue);
    const source: ConfigSource = storedValue ? 'database' : envValue ? 'env' : 'none';
    const displayValue = field.secret
      ? undefined
      : storedValue
        ? storedValue
        : envValue || undefined;
    return {
      key: field.key,
      label: field.label,
      secret: field.secret,
      required: Boolean(field.required),
      configured,
      source,
      valuePreview: record?.valuePreview || (envValue ? this.mask(envValue) : undefined),
      displayValue,
      placeholder: field.placeholder,
      help: field.help,
    };
  }

  private normalizeInputValue(value: unknown) {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (value === undefined || value === null) return '';
    throw new BadRequestException('配置值只能是字符串、数字或布尔值');
  }

  private async testWechat(): Promise<IntegrationConfigTestResult> {
    const appId = await this.getValue('WECHAT_APP_ID');
    const appSecret = await this.getValue('WECHAT_APP_SECRET');
    if (!appId || !appSecret) return this.notConfigured('wechat', '请先填写 AppID 和 AppSecret。');
    const baseUrl = await this.getValue(
      'WECHAT_API_BASE_URL',
      this.config.get<string>('WECHAT_API_BASE_URL', 'https://api.weixin.qq.com'),
    );
    const url = new URL('/cgi-bin/token', baseUrl);
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);
    const result = await this.fetchJson<{
      access_token?: string;
      errcode?: number;
      errmsg?: string;
    }>(url);
    if (result.ok && result.json?.access_token) {
      return this.success('wechat', '微信 access_token 获取成功。');
    }
    return this.failed(
      'wechat',
      `微信接口返回异常：${result.json?.errmsg || result.error || result.status}`,
    );
  }

  private async testWechatPay(): Promise<IntegrationConfigTestResult> {
    const required = [
      'WECHAT_PAY_APP_ID',
      'WECHAT_PAY_MCH_ID',
      'WECHAT_PAY_API_V3_KEY',
      'WECHAT_PAY_SERIAL_NO',
      'WECHAT_PAY_PRIVATE_KEY_PATH',
      'WECHAT_PAY_NOTIFY_URL',
    ];
    if (!(await this.hasAll(required))) {
      return this.notConfigured(
        'wechatPay',
        '请先填写微信支付 AppID、商户号、API v3 Key、序列号、私钥路径和回调 URL。',
      );
    }
    const privateKeyPath = await this.getValue('WECHAT_PAY_PRIVATE_KEY_PATH');
    const platformCertPath = await this.getValue('WECHAT_PAY_PLATFORM_CERT_PATH');
    if (privateKeyPath && !existsSync(privateKeyPath)) {
      return this.failed('wechatPay', `商户私钥文件不存在：${privateKeyPath}`);
    }
    if (platformCertPath && !existsSync(platformCertPath)) {
      return this.failed('wechatPay', `平台证书文件不存在：${platformCertPath}`);
    }
    return {
      service: 'wechatPay',
      ok: true,
      mode: 'structural',
      message: '微信支付配置结构完整；正式下单和回调仍需商户证书与微信侧联调。',
      checkedAt: new Date(),
    };
  }

  private async testEzviz(): Promise<IntegrationConfigTestResult> {
    const appKey = await this.getValue('EZVIZ_APP_KEY');
    const appSecret = await this.getValue('EZVIZ_APP_SECRET');
    if (!appKey || !appSecret)
      return this.notConfigured('ezviz', '请先填写萤石云 AppKey 和 AppSecret。');
    const baseUrl = await this.getValue(
      'EZVIZ_API_BASE_URL',
      this.config.get<string>('EZVIZ_API_BASE_URL', 'https://open.ys7.com/api/lapp'),
    );
    const result = await this.fetchJson<{ code?: string; msg?: string; data?: unknown }>(
      `${baseUrl}/token/get`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ appKey, appSecret }),
      },
    );
    if (result.ok && result.json?.code === '200') {
      return this.success('ezviz', '萤石云 accessToken 获取成功。');
    }
    return this.failed(
      'ezviz',
      `萤石云接口返回异常：${result.json?.msg || result.json?.code || result.error || result.status}`,
    );
  }

  private async testAmap(): Promise<IntegrationConfigTestResult> {
    const key = await this.getValue('AMAP_KEY');
    if (!key) return this.notConfigured('amap', '请先填写高德 Key。');
    const baseUrl = await this.getValue(
      'AMAP_API_BASE_URL',
      this.config.get<string>('AMAP_API_BASE_URL', 'https://restapi.amap.com'),
    );
    const url = new URL('/v3/config/district', baseUrl);
    url.searchParams.set('keywords', '黄湖林场');
    url.searchParams.set('key', key);
    const result = await this.fetchJson<{ status?: string; info?: string; infocode?: string }>(url);
    if (result.ok && result.json?.status === '1') {
      return this.success('amap', '高德地图 Key 可用。');
    }
    return this.failed(
      'amap',
      `高德接口返回异常：${result.json?.info || result.json?.infocode || result.error || result.status}`,
    );
  }

  private async testStorage(): Promise<IntegrationConfigTestResult> {
    const driver = (await this.getValue('STORAGE_DRIVER', 'local')).toLowerCase();
    if (driver === 'local') {
      return this.success('storage', '当前使用本地上传目录，开发和演示可用。');
    }
    if (driver !== 'cos') return this.failed('storage', 'STORAGE_DRIVER 只能填写 local 或 cos。');
    const required = [
      'TENCENT_COS_SECRET_ID',
      'TENCENT_COS_SECRET_KEY',
      'TENCENT_COS_BUCKET',
      'TENCENT_COS_REGION',
    ];
    if (!(await this.hasAll(required))) {
      return this.notConfigured(
        'storage',
        '已选择 COS，但缺少 SecretId、SecretKey、Bucket 或 Region。',
      );
    }
    return {
      service: 'storage',
      ok: true,
      mode: 'structural',
      message: 'COS 配置项已填写；正式上传前建议用后台上传一张测试图验证 Bucket 权限。',
      checkedAt: new Date(),
    };
  }

  private async testLlm(): Promise<IntegrationConfigTestResult> {
    const apiKey = await this.getValue('LLM_API_KEY');
    if (!apiKey) return this.notConfigured('llm', '请先填写模型 API Key。');
    const baseUrl = await this.getValue(
      'LLM_BASE_URL',
      this.config.get<string>('LLM_BASE_URL', 'https://api.moonshot.cn/v1'),
    );
    const model = await this.getValue(
      'LLM_MODEL',
      this.config.get<string>('LLM_MODEL', 'moonshot-v1-8k'),
    );
    const result = await this.fetchJson<{ choices?: unknown; error?: { message?: string } }>(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          temperature: this.llmTemperatureFor(model),
          max_tokens: 8,
        }),
      },
      12000,
    );
    if (result.ok && result.json?.choices) return this.success('llm', '模型 API 调用成功。');
    return this.failed(
      'llm',
      `模型接口返回异常：${result.json?.error?.message || result.error || result.status}`,
    );
  }

  private async fetchJson<T>(
    url: string | URL,
    init: RequestInit = {},
    timeoutMs = 8000,
  ): Promise<{ ok: boolean; status: number; json?: T; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const text = await response.text();
      const json = text ? (JSON.parse(text) as T) : undefined;
      return { ok: response.ok, status: response.status, json };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'request failed',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private llmTemperatureFor(model: string) {
    return /^kimi-k2/i.test(model) ? 1 : 0.2;
  }

  private groupDefinition(service: string) {
    const definition = this.groups.find((group) => group.service === service);
    if (!definition) throw new NotFoundException(`integration service not found: ${service}`);
    return definition;
  }

  private fieldDefinition(key: string) {
    return this.groups.flatMap((group) => group.fields).find((field) => field.key === key);
  }

  private envValue(definition?: IntegrationFieldDefinition) {
    if (!definition) return '';
    const envKeys = definition.envKeys || [definition.key];
    for (const key of envKeys) {
      const value = String(this.config.get<string>(key, '') || '').trim();
      if (value) return value;
    }
    return '';
  }

  private notConfigured(service: string, message: string): IntegrationConfigTestResult {
    return { service, ok: false, mode: 'not_configured', message, checkedAt: new Date() };
  }

  private success(service: string, message: string): IntegrationConfigTestResult {
    return { service, ok: true, mode: 'official', message, checkedAt: new Date() };
  }

  private failed(service: string, message: string): IntegrationConfigTestResult {
    return { service, ok: false, mode: 'failed', message, checkedAt: new Date() };
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      ENCRYPTION_PREFIX,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  private decrypt(value: string) {
    if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) return value;
    const [, ivText, tagText, encryptedText] = value.split(':');
    if (!ivText || !tagText || !encryptedText) throw new BadRequestException('配置密文格式错误');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey(),
      Buffer.from(ivText, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagText, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private encryptionKey() {
    const secret =
      this.config.get<string>('THIRD_PARTY_CONFIG_ENCRYPTION_KEY', '') ||
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return createHash('sha256').update(secret).digest();
  }

  private mask(value: string) {
    const text = value.trim();
    if (!text) return '';
    if (text.length <= 4) return '*'.repeat(text.length);
    if (text.length <= 10) return `${text.slice(0, 2)}****${text.slice(-2)}`;
    return `${text.slice(0, 4)}****${text.slice(-4)}`;
  }

  private assertSuperAdmin(principal: AuthPrincipal) {
    if (principal.type !== TokenSubjectType.ADMIN || principal.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('only super admin can update integration configs');
    }
  }
}
