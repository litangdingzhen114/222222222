import { Global, Module } from '@nestjs/common';
import { NamingProfileService } from './naming-profile.service';

@Global()
@Module({
  providers: [NamingProfileService],
  exports: [NamingProfileService],
})
export class NamingProfileModule {}
