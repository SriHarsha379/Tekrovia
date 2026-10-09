import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckpointController } from './checkpoint.controller';
import { CheckpointService } from './checkpoint.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CheckpointController],
  providers: [CheckpointService],
  exports: [CheckpointService],
})
export class CheckpointModule {}
