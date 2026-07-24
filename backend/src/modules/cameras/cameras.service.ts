import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CameraStatus } from '@prisma/client';
import { RedisService } from '../../database/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { EzvizAdapter } from '../../integrations/ezviz/ezviz.adapter';

@Injectable()
export class CamerasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ezviz: EzvizAdapter,
    private readonly redis: RedisService,
  ) {}

  cameras() {
    return this.prisma.camera.findMany({
      where: { deletedAt: null },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async camera(id: string) {
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera) throw new NotFoundException('camera not found');
    return camera;
  }

  async playUrl(id: string, requester: string) {
    const count = await this.redis.incrWithExpire(`rate:camera:${id}:${requester}`, 60);
    if (count > 20)
      throw new HttpException('play url request is too frequent', HttpStatus.TOO_MANY_REQUESTS);
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera || camera.status === CameraStatus.DISABLED)
      throw new NotFoundException('camera not available');
    return this.ezviz.getPlayUrl(camera);
  }
}
