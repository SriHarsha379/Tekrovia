import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseModule } from '../course/course.module';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

@Module({
  imports: [AuthModule, CourseModule],
  controllers: [AssignmentController],
  providers: [AssignmentService],
})
export class AssignmentModule {}
