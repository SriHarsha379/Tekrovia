import { Module } from '@nestjs/common';
import { LmsService } from './lms.service';
import { LmsController } from './lms.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [LmsService],
  controllers: [LmsController],
  exports: [LmsService],
})
export class LmsModule {}
