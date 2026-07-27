import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadStorageDriver } from '@prisma/client';
import { extname } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { LocalStorageAdapter } from '../../integrations/storage/local-storage.adapter';
import { TencentCosStorageAdapter } from '../../integrations/storage/tencent-cos-storage.adapter';
import { AuthPrincipal } from '../auth/auth.types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4']);

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly local: LocalStorageAdapter,
    private readonly cos: TencentCosStorageAdapter,
  ) {}

  async upload(files: Express.Multer.File[], principal: AuthPrincipal) {
    const maxFiles = this.config.get<number>('UPLOAD_MAX_FILES', 9);
    const maxSize = this.config.get<number>('UPLOAD_MAX_FILE_SIZE', 5242880);
    if (!files?.length) {
      throw new BadRequestException('请选择要上传的文件');
    }
    if (files.length > maxFiles) {
      throw new BadRequestException(`最多上传 ${maxFiles} 个文件`);
    }
    const driverName =
      this.config.get<string>('STORAGE_DRIVER', 'local') === 'cos' ? 'cos' : 'local';
    const adapter = driverName === 'cos' ? this.cos : this.local;
    const driver =
      driverName === 'cos' ? UploadStorageDriver.TENCENT_COS : UploadStorageDriver.LOCAL;

    const result = [];
    for (const file of files) {
      const extension = extname(file.originalname).toLowerCase();
      if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(extension)) {
        throw new BadRequestException(`不允许上传的文件类型：${file.originalname}`);
      }
      if (file.size > maxSize) throw new BadRequestException(`文件过大：${file.originalname}`);
      const stored = await adapter.save(file);
      result.push(
        await this.prisma.uploadFile.create({
          data: {
            filename: stored.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            extension,
            size: file.size,
            driver,
            url: stored.url,
            path: stored.path,
            uploaderType: principal.type,
            uploaderId: principal.id,
          },
        }),
      );
    }
    return result;
  }
}
