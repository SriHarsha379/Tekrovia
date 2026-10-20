import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadAdminController } from './lead-admin.controller';
import { LeadAdminService } from './lead-admin.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadAdminController, LeadController],
  providers: [LeadAdminService, LeadService],
  exports: [LeadService],
})
export class LeadModule {}
