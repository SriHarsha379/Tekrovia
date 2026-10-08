import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { FreeAssessmentController } from './free-assessment.controller';
import { FreeAssessmentService } from './free-assessment.service';

@Module({
  imports: [AuthModule],
  controllers: [FreeAssessmentController, AssessmentController],
  providers: [AssessmentService, FreeAssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
