import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';

@Module({
  imports: [AuthModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
