import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { AssessmentModule } from './assessment/assessment.module';
import { LeadModule } from './lead/lead.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CourseModule } from './course/course.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ProjectModule } from './project/project.module';
import { PlacementModule } from './placement/placement.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CandidateModule,
    AssessmentModule,
    LeadModule,
    ProductModule,
    DashboardModule,
    CourseModule,
    AssignmentModule,
    ProjectModule,
    PlacementModule,
    AdminModule,
  ],
})
export class AppModule {}
