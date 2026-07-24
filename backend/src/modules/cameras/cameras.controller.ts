import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RequestWithContext } from '../../common/interfaces/http.interface';
import { CamerasService } from './cameras.service';

@Public()
@ApiTags('cameras')
@Controller({ path: 'cameras', version: '1' })
export class CamerasController {
  constructor(private readonly cameras: CamerasService) {}

  @Get()
  list() {
    return this.cameras.cameras();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.cameras.camera(id);
  }

  @Post(':id/play-url')
  playUrl(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.cameras.playUrl(id, request.ip ?? 'unknown');
  }
}
