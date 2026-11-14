import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { AssessmentModule } from './assessment/assessment.module';
import { LeadModule } from './lead/lead.module';
import { PlacementModule } from './placement/placement.module';
import { AiModule } from './ai/ai.module';
import { SupportModule } from './support/support.module';
import { VideoModule } from './video/video.module';
import { ProductModule } from './product/product.module';
import { PaymentModule } from './payment/payment.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { LmsModule } from './lms/lms.module';
import { CampaignModule } from './campaign/campaign.module';
import { HealthController } from './health.controller';
import { AppService } from './app.service';

// Modules that exist in the repo but are not yet scaffolded locally are
// commented out. Uncomment each one as its directory is added.
// import { MarketingModule }  from './marketing/marketing.module';
// import { ResourceModule }   from './resource/resource.module';
// import { DeliveryModule }   from './delivery/delivery.module';
// import { LiveClassModule }  from './live-class/live-class.module';
// import { BatchModule }      from './batch/batch.module';
// import { DashboardModule }  from './dashboard/dashboard.module';
// import { CourseModule }     from './course/course.module';
// import { AssignmentModule } from './assignment/assignment.module';
// import { ProjectModule }    from './project/project.module';
// import { AdminModule }      from './admin/admin.module';
// import { CheckpointModule } from './checkpoint/checkpoint.module';

@Module({
  controllers: [HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
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
    PaymentModule,
    EnrollmentModule,
    LmsModule,
    CampaignModule,
  ],
})
export class AppModule {}
