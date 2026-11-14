import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CampaignService],
  controllers: [CampaignController],
  exports: [CampaignService],
})
export class CampaignModule {}
