import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, StoredFile } from './storage.adapter';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly config: ConfigService) {}

  async save(file: Express.Multer.File): Promise<StoredFile> {
    const uploadDir = this.config.getOrThrow<string>('LOCAL_UPLOAD_DIR');
    const publicPrefix = this.config.getOrThrow<string>('UPLOAD_PUBLIC_PREFIX');
    const extension = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const dir = join(process.cwd(), uploadDir);
    await mkdir(dir, { recursive: true });
    const path = join(dir, filename);
    await writeFile(path, file.buffer);
    return {
      filename,
      path,
      url: `${publicPrefix.replace(/\/$/, '')}/${filename}`,
    };
  }
}
