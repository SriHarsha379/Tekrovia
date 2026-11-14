import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { LmsService } from './lms.service';
import { UpdateActivityDto, SubmitAssignmentDto, SubmitProjectDto } from './dto/lms.dto';

interface AuthReq { user: { id: string; role: string } }

@ApiTags('lms')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('lms')
export class LmsController {
  constructor(private readonly svc: LmsService) {}

  @Get('courses')
  @ApiOperation({ summary: 'List courses for enrolled products' })
  getMyCourses(@Req() req: AuthReq) {
    return this.svc.getMyCourses(req.user.id);
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get full course structure with activity status' })
  getCourse(@Req() req: AuthReq, @Param('courseId') courseId: string) {
    return this.svc.getCourseStructure(req.user.id, courseId);
  }

  @Patch('lessons/:lessonId/activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lesson activity status' })
  updateActivity(
    @Req() req: AuthReq,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.svc.updateActivity(req.user.id, lessonId, dto);
  }

  @Post('assignments/:assignmentId/submit')
  @ApiOperation({ summary: 'Submit assignment' })
  submitAssignment(
    @Req() req: AuthReq,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.svc.submitAssignment(req.user.id, assignmentId, dto);
  }

  @Post('projects/:projectId/submit')
  @ApiOperation({ summary: 'Submit project' })
  submitProject(
    @Req() req: AuthReq,
    @Param('projectId') projectId: string,
    @Body() dto: SubmitProjectDto,
  ) {
    return this.svc.submitProject(req.user.id, projectId, dto);
  }

  @Get('projects/:projectId/submissions')
  @ApiOperation({ summary: 'List project submissions — admin/trainer only' })
  getProjectSubmissions(
    @Req() req: AuthReq,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
  ) {
    if (!['ADMIN', 'SUPER_ADMIN', 'TRAINER'].includes(req.user.role)) {
      throw new ForbiddenException('Trainer access required.');
    }
    return this.svc.getProjectSubmissions(projectId, page ? parseInt(page, 10) : 1);
  }

  @Patch('submissions/:submissionId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review a project submission — trainer/admin only' })
  reviewProject(
    @Req() req: AuthReq,
    @Param('submissionId') submissionId: string,
    @Body() body: { status: 'MENTOR_APPROVED' | 'REJECTED'; feedback: string },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'MENTOR'].includes(req.user.role)) {
      throw new ForbiddenException('Trainer access required.');
    }
    return this.svc.reviewProject(submissionId, req.user.id, body.status, body.feedback);
  }
}
