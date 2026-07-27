import { Module } from '@nestjs/common';
import { LocalStorageAdapter } from '../../integrations/storage/local-storage.adapter';
import { TencentCosStorageAdapter } from '../../integrations/storage/tencent-cos-storage.adapter';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, LocalStorageAdapter, TencentCosStorageAdapter],
})
export class UploadsModule {}
