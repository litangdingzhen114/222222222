import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';
import { sha256 } from '../../common/utils/crypto.util';

export interface WechatSession {
  openid: string;
  sessionKey: string;
  unionid?: string;
  mode: 'official' | 'development_mock';
}

interface WechatCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatMiniProgramAdapter {
  private readonly logger = new Logger(WechatMiniProgramAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async code2Session(code: string): Promise<WechatSession> {
    const appId = this.config.get<string>('WECHAT_APP_ID', '');
    const appSecret = this.config.get<string>('WECHAT_APP_SECRET', '');
    const mockEnabled = this.config.get<boolean>('WECHAT_MOCK_ENABLED', false);

    if (!appId || !appSecret) {
      if (mockEnabled && this.config.get<string>('NODE_ENV') !== 'production') {
        const fingerprint = sha256(code).slice(0, 24);
        return {
          openid: `dev_openid_${fingerprint}`,
          sessionKey: `dev_session_${fingerprint}`,
          mode: 'development_mock',
        };
      }
      throw new AppException(
        ErrorCode.THIRD_PARTY_ERROR,
        '微信小程序凭证未配置，等待正式凭证配置',
        502,
      );
    }

    const baseUrl = this.config.getOrThrow<string>('WECHAT_API_BASE_URL');
    const url = new URL('/sns/jscode2session', baseUrl);
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      const json = (await response.json()) as WechatCode2SessionResponse;
      if (!response.ok || json.errcode) {
        throw new AppException(
          ErrorCode.THIRD_PARTY_ERROR,
          `微信登录失败：${json.errmsg ?? response.statusText}`,
          502,
          { errcode: json.errcode },
        );
      }
      if (!json.openid || !json.session_key) {
        throw new AppException(
          ErrorCode.THIRD_PARTY_ERROR,
          '微信登录响应缺少 openid 或 session_key',
          502,
        );
      }
      return {
        openid: json.openid,
        sessionKey: json.session_key,
        unionid: json.unionid,
        mode: 'official',
      };
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.warn(
        `code2Session request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new AppException(ErrorCode.THIRD_PARTY_ERROR, '微信登录服务暂不可用', 502);
    } finally {
      clearTimeout(timer);
    }
  }
}
