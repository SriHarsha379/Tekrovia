import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { UnlockService } from './unlock.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LearningController],
  providers: [LearningService, UnlockService],
  exports: [UnlockService],
})
export class LearningModule {}
