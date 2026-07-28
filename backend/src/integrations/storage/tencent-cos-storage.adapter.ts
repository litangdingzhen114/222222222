import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';
import { IntegrationConfigService } from '../../modules/integration-config/integration-config.service';
import { StorageAdapter, StoredFile } from './storage.adapter';

@Injectable()
export class TencentCosStorageAdapter implements StorageAdapter {
  constructor(private readonly integrationConfig: IntegrationConfigService) {}

  async save(file: Express.Multer.File): Promise<StoredFile> {
    void file;
    const configured = Boolean(
      (await this.integrationConfig.getValue('TENCENT_COS_SECRET_ID')) &&
      (await this.integrationConfig.getValue('TENCENT_COS_SECRET_KEY')) &&
      (await this.integrationConfig.getValue('TENCENT_COS_BUCKET')) &&
      (await this.integrationConfig.getValue('TENCENT_COS_REGION')),
    );
    if (!configured) {
      throw new AppException(
        ErrorCode.THIRD_PARTY_ERROR,
        '腾讯云 COS 凭证未配置，等待正式凭证配置',
        503,
      );
    }
    throw new AppException(
      ErrorCode.THIRD_PARTY_ERROR,
      '腾讯云 COS 上传需要正式凭证联调后启用',
      503,
    );
  }
}
