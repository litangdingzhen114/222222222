import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthPrincipal } from '../auth/auth.types';
import { UploadsService } from './uploads.service';

@ApiBearerAuth()
@ApiTags('uploads')
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(FilesInterceptor('files', 9))
  upload(@UploadedFiles() files: Express.Multer.File[], @CurrentUser() principal: AuthPrincipal) {
    return this.uploads.upload(files, principal);
  }
}
