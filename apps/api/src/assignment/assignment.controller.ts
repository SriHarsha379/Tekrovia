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
import { AssignmentService } from './assignment.service';
import {
  ReviewSubmissionDto,
  SubmitAssignmentDto,
  UpsertAssignmentDto,
  validateReview,
  validateSubmission,
  validateUpsertAssignment,
} from './dto/assignment.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

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

  @Put('lessons/:lessonId')
  @ApiOperation({ summary: 'Create or update the assignment for a lesson (admin only)' })
  upsertForLesson(
    @Req() request: AuthenticatedRequest,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpsertAssignmentDto,
  ) {
    this.assertAdmin(request);
    this.validate(() => validateUpsertAssignment(dto), 'Invalid assignment.');
    return this.assignmentService.upsertForLesson(lessonId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List my assignments and submission history' })
  listMine(@Req() request: AuthenticatedRequest) {
    return this.assignmentService.listMine(request.user.id);
  }

  @Post(':assignmentId/submit')
  @ApiOperation({ summary: 'Submit work for an assignment in a course I am enrolled in' })
  submit(
    @Req() request: AuthenticatedRequest,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    this.validate(() => validateSubmission(dto), 'Invalid submission.');
    return this.assignmentService.submit(request.user.id, assignmentId, dto);
  }

  @Get('review')
  @ApiOperation({ summary: 'List submissions for review (trainer or admin)' })
  listForReview(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertReviewer(request);
    return this.assignmentService.listForReview({ status, page, limit });
  }

  @Patch('submissions/:submissionId/review')
  @ApiOperation({ summary: 'Approve a submission or request changes (trainer or admin)' })
  review(
    @Req() request: AuthenticatedRequest,
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    this.assertReviewer(request);
    this.validate(() => validateReview(dto), 'Invalid review.');
    return this.assignmentService.review(request.user.id, submissionId, dto);
  }
}
