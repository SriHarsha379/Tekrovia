import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { AssessmentModule } from './assessment/assessment.module';
import { LeadModule } from './lead/lead.module';
import { PrismaModule } from './prisma/prisma.module';
import { PlacementModule } from './placement/placement.module';
import { AiModule } from './ai/ai.module';
import { SupportModule } from './support/support.module';
import { VideoModule } from './video/video.module';
import { ProductModule } from './product/product.module';

// TODO: uncomment each module once its scaffold is in place
// import { MarketingModule } from './marketing/marketing.module';
// import { ResourceModule } from './resource/resource.module';
// import { DeliveryModule } from './delivery/delivery.module';
// import { LiveClassModule } from './live-class/live-class.module';
// import { BatchModule } from './batch/batch.module';
// import { DashboardModule } from './dashboard/dashboard.module';
// import { CourseModule } from './course/course.module';
// import { AssignmentModule } from './assignment/assignment.module';
// import { ProjectModule } from './project/project.module';
// import { AdminModule } from './admin/admin.module';
// import { CheckpointModule } from './checkpoint/checkpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    CacheModule.register({ isGlobal: true, ttl: 30_000 }),
    PrismaModule,
    AuthModule,
    CandidateModule,
    AssessmentModule,
    LeadModule,
    PlacementModule,
    AiModule,
    SupportModule,
    VideoModule,
    ProductModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
