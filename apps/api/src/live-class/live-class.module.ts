import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LiveClassController } from './live-class.controller';
import { LiveClassService } from './live-class.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LiveClassController],
  providers: [LiveClassService],
  exports: [LiveClassService],
})
export class LiveClassModule {}
