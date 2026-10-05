import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { AssessmentModule } from './assessment/assessment.module';
import { LeadModule } from './lead/lead.module';
import { CourseModule } from './course/course.module';
import { AdminModule } from './admin/admin.module';
import { PlacementModule } from './placement/placement.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ProjectModule } from './project/project.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CandidateModule,
    AssessmentModule,
    LeadModule,
    CourseModule,
    AdminModule,
    PlacementModule,
    AssignmentModule,
    ProjectModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
