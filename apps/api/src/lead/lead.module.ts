import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [LeadService],
  controllers: [LeadController],
  exports: [LeadService],
})
export class LeadModule {}
