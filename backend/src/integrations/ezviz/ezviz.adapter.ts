import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Camera } from '@prisma/client';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';
import { RedisService } from '../../database/redis.service';

export interface CameraPlayUrl {
  playUrl: string;
  expireAt: Date;
  mode: 'official' | 'development';
}

interface EzvizTokenResponse {
  code: string;
  msg?: string;
  data?: { accessToken: string; expireTime: number };
}

interface EzvizLiveResponse {
  code: string;
  msg?: string;
  data?: { url?: string; expireTime?: number };
}

@Injectable()
export class EzvizAdapter {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async getPlayUrl(camera: Camera): Promise<CameraPlayUrl> {
    const appKey = this.config.get<string>('EZVIZ_APP_KEY', '');
    const appSecret = this.config.get<string>('EZVIZ_APP_SECRET', '');
    const mockEnabled = this.config.get<boolean>('EZVIZ_MOCK_ENABLED', false);
    if (!appKey || !appSecret) {
      if (mockEnabled && this.config.get<string>('NODE_ENV') !== 'production') {
        return {
          playUrl: `/dev-assets/live/${camera.deviceSerial}-${camera.channelNo}.m3u8`,
          expireAt: new Date(Date.now() + 10 * 60 * 1000),
          mode: 'development',
        };
      }
      throw new AppException(
        ErrorCode.THIRD_PARTY_ERROR,
        '萤石云凭证未配置，等待正式凭证配置',
        502,
      );
    }

    const token = await this.getAccessToken(appKey, appSecret);
    const body = new URLSearchParams({
      accessToken: token,
      deviceSerial: camera.deviceSerial,
      channelNo: String(camera.channelNo),
      protocol: '2',
      quality: '1',
      expireTime: '600',
    });
    const json = await this.post<EzvizLiveResponse>('/live/address/get', body);
    if (json.code !== '200' || !json.data?.url) {
      throw new AppException(
        ErrorCode.THIRD_PARTY_ERROR,
        `萤石云播放地址获取失败：${json.msg ?? json.code}`,
        502,
      );
    }
    return {
      playUrl: json.data.url,
      expireAt: new Date(Date.now() + (json.data.expireTime ?? 600) * 1000),
      mode: 'official',
    };
  }

  private async getAccessToken(appKey: string, appSecret: string) {
    const cacheKey = 'ezviz:access-token';
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;
    const body = new URLSearchParams({ appKey, appSecret });
    const json = await this.post<EzvizTokenResponse>('/token/get', body);
    if (json.code !== '200' || !json.data?.accessToken) {
      throw new AppException(
        ErrorCode.THIRD_PARTY_ERROR,
        `萤石云 token 获取失败：${json.msg ?? json.code}`,
        502,
      );
    }
    const ttl = Math.max(60, Math.floor((json.data.expireTime - Date.now()) / 1000) - 300);
    await this.redis.set(cacheKey, json.data.accessToken, ttl);
    return json.data.accessToken;
  }

  private async post<T>(path: string, body: URLSearchParams) {
    const baseUrl = this.config.getOrThrow<string>('EZVIZ_API_BASE_URL');
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    return (await response.json()) as T;
  }
}
