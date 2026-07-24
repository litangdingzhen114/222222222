import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';
import { StorageAdapter, StoredFile } from './storage.adapter';

@Injectable()
export class TencentCosStorageAdapter implements StorageAdapter {
  constructor(private readonly config: ConfigService) {}

  save(file: Express.Multer.File): Promise<StoredFile> {
    void file;
    const configured = Boolean(
      this.config.get<string>('TENCENT_COS_SECRET_ID') &&
      this.config.get<string>('TENCENT_COS_SECRET_KEY') &&
      this.config.get<string>('TENCENT_COS_BUCKET') &&
      this.config.get<string>('TENCENT_COS_REGION'),
    );
    if (!configured) {
      return Promise.reject(
        new AppException(
          ErrorCode.THIRD_PARTY_ERROR,
          '腾讯云 COS 凭证未配置，等待正式凭证配置',
          503,
        ),
      );
    }
    return Promise.reject(
      new AppException(ErrorCode.THIRD_PARTY_ERROR, '腾讯云 COS 上传需要正式凭证联调后启用', 503),
    );
  }
}
