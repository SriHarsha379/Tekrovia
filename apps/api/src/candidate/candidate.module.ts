import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

@Module({
  imports: [AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
