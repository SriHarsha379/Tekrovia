import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ResourceController],
  providers: [ResourceService],
})
export class ResourceModule {}
