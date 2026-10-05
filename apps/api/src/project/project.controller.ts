import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import {
  ReviewProjectSubmissionDto,
  SubmitMilestoneDto,
  UpsertProjectDto,
  validateMilestoneSubmission,
  validateProjectReview,
  validateUpsertProject,
} from './dto/project.dto';
import { ProjectService } from './project.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    name?: string;
    role: string;
  };
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Administrator access required.');
    }
  }

  private assertReviewer(request: AuthenticatedRequest) {
    if (!['TRAINER', 'ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Reviewer access required.');
    }
  }

  private validate(check: () => void, fallback: string) {
    try {
      check();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : fallback,
      );
    }
  }

  @Put('courses/:courseId')
  @ApiOperation({ summary: 'Create or update a course project with its milestones (admin only)' })
  upsertForCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId') courseId: string,
    @Body() dto: UpsertProjectDto,
  ) {
    this.assertAdmin(request);
    this.validate(() => validateUpsertProject(dto), 'Invalid project.');
    return this.projectService.upsertForCourse(courseId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List my projects, milestones and submission history' })
  listMine(@Req() request: AuthenticatedRequest) {
    return this.projectService.listMine(request.user.id);
  }

  @Post('milestones/:milestoneId/submit')
  @ApiOperation({ summary: 'Submit work for a project milestone in a course I am enrolled in' })
  submit(
    @Req() request: AuthenticatedRequest,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: SubmitMilestoneDto,
  ) {
    this.validate(() => validateMilestoneSubmission(dto), 'Invalid submission.');
    return this.projectService.submit(request.user.id, milestoneId, dto);
  }

  @Get('review')
  @ApiOperation({ summary: 'List project submissions for review (trainer or admin)' })
  listForReview(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertReviewer(request);
    return this.projectService.listForReview({ status, page, limit });
  }

  @Patch('submissions/:submissionId/review')
  @ApiOperation({ summary: 'Approve a milestone or request changes (final milestone: admin only)' })
  review(
    @Req() request: AuthenticatedRequest,
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewProjectSubmissionDto,
  ) {
    this.assertReviewer(request);
    this.validate(() => validateProjectReview(dto), 'Invalid review.');
    return this.projectService.review(request.user, submissionId, dto);
  }
}
