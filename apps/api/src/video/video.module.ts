import { Global, Module } from '@nestjs/common';
import { VideoService } from './video.service';

// Global so any module serving a lesson can issue playback without
// re-importing it everywhere.
@Global()
@Module({
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
