import { createSign, createVerify, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';
import { IntegrationConfigService } from '../../modules/integration-config/integration-config.service';

export interface WechatPayCreateParams {
  paymentNo: string;
  description: string;
  openid: string;
  amount: number;
}

export interface WechatPayCreateResult {
  provider: 'wechat';
  prepayId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

export interface WechatPayNotifyPayload {
  outTradeNo: string;
  transactionId: string;
  amount: number;
  mchid: string;
  tradeState: string;
}

@Injectable()
export class WechatPayAdapter {
  constructor(
    private readonly config: ConfigService,
    private readonly integrationConfig: IntegrationConfigService,
  ) {}

  async isConfigured() {
    return this.integrationConfig.hasAll([
      'WECHAT_PAY_APP_ID',
      'WECHAT_PAY_MCH_ID',
      'WECHAT_PAY_API_V3_KEY',
      'WECHAT_PAY_SERIAL_NO',
      'WECHAT_PAY_PRIVATE_KEY_PATH',
      'WECHAT_PAY_NOTIFY_URL',
    ]);
  }

  async createJsapiPayment(params: WechatPayCreateParams): Promise<WechatPayCreateResult> {
    void params;
    if (!(await this.isConfigured())) {
      throw new AppException(
        ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
        '微信支付凭证未配置，等待正式凭证配置',
        503,
      );
    }
    throw new AppException(
      ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
      '微信支付正式下单需要商户号、私钥和平台证书完成联调',
      503,
    );
  }

  async verifyNotify(headers: Record<string, string | string[] | undefined>, rawBody: string) {
    if (!(await this.isConfigured())) {
      throw new AppException(
        ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
        '微信支付回调验签凭证未配置，等待正式凭证配置',
        503,
      );
    }
    const signature = this.getHeader(headers, 'wechatpay-signature');
    const timestamp = this.getHeader(headers, 'wechatpay-timestamp');
    const nonce = this.getHeader(headers, 'wechatpay-nonce');
    const platformCertPath = await this.integrationConfig.getValue(
      'WECHAT_PAY_PLATFORM_CERT_PATH',
      this.config.get<string>('WECHAT_PAY_PLATFORM_CERT_PATH', ''),
    );
    const platformCert = readFileSync(platformCertPath);
    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(platformCert, signature, 'base64');
  }

  decryptNotifyResource(body: unknown): WechatPayNotifyPayload {
    void body;
    throw new AppException(
      ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
      '微信支付回调解密需要正式 API v3 Key 联调，等待正式凭证配置',
      503,
    );
  }

  buildClientPaySign(appId: string, prepayId: string, privateKey: string): WechatPayCreateResult {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = randomUUID().replaceAll('-', '');
    const pkg = `prepay_id=${prepayId}`;
    const message = `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
    const signer = createSign('RSA-SHA256');
    signer.update(message);
    signer.end();
    return {
      provider: 'wechat',
      prepayId,
      timeStamp,
      nonceStr,
      package: pkg,
      signType: 'RSA',
      paySign: signer.sign(privateKey, 'base64'),
    };
  }

  private getHeader(headers: Record<string, string | string[] | undefined>, name: string) {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
  }
}
