import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [EnrollmentService],
  controllers: [EnrollmentController],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
