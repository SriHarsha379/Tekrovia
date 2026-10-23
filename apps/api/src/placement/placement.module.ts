import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';
import { JobPostingController } from './job-posting.controller';
import { JobPostingService } from './job-posting.service';
import { StudentReadinessController } from './student-readiness.controller';

@Module({
  imports: [AuthModule],
  controllers: [JobPostingController, StudentReadinessController, PlacementController],
  providers: [JobPostingService, PlacementService],
})
export class PlacementModule {}
