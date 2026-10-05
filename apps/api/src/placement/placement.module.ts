import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';
import { StudentReadinessController } from './student-readiness.controller';

@Module({
  imports: [AuthModule],
  controllers: [StudentReadinessController, PlacementController],
  providers: [PlacementService],
})
export class PlacementModule {}
