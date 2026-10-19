import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckpointController } from './checkpoint.controller';
import { CheckpointService } from './checkpoint.service';
import { CheckpointAdminController } from './checkpoint-admin.controller';
import { CheckpointAdminService } from './checkpoint-admin.service';

@Module({
  imports: [PrismaModule, AuthModule],
  // Admin first: '/checkpoints/admin' must match before '/checkpoints/:id'.
  controllers: [CheckpointAdminController, CheckpointController],
  providers: [CheckpointService, CheckpointAdminService],
  exports: [CheckpointService],
})
export class CheckpointModule {}
