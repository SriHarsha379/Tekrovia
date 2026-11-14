import { Module } from '@nestjs/common';
import { PlacementService } from './placement.service';
import { PlacementController } from './placement.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PlacementService],
  controllers: [PlacementController],
  exports: [PlacementService],
})
export class PlacementModule {}
