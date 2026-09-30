import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AssessmentService } from './assessment.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@ApiTags('assessment')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
  ) {}

  private isAdmin(request: AuthenticatedRequest): boolean {
    return ['ADMIN', 'SUPER_ADMIN'].includes(request.user.role);
  }

  @Post('me/interactive')
  @ApiOperation({
    summary: 'Start an interactive question-based career skills assessment',
  })
  startInteractiveAssessment(@Req() request: AuthenticatedRequest) {
    return this.assessmentService.startInteractiveAssessment(
      request.user.id,
    );
  }

  @Post(':id/interactive-submit')
  @ApiOperation({
    summary: 'Submit answers and receive a server-calculated assessment result',
  })
  submitInteractiveAssessment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('answers') answers: unknown,
  ) {
    return this.assessmentService.submitInteractiveAssessment(
      id,
      request.user.id,
      answers,
    );
  }

  @Post('me/career-readiness')
  @ApiOperation({
    summary: 'Create a career-readiness estimate from your own profile',
  })
  createMyCareerReadiness(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.assessmentService.createCareerReadinessAssessment(
      request.user.id,
    );
  }

  @Get('candidate/:candidateId')
  @ApiOperation({
    summary: 'List assessments for your own candidate profile or, for admins, any candidate',
  })
  findForCandidate(
    @Req() request: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
  ) {
    return this.assessmentService.findForCandidate(
      candidateId,
      request.user.id,
      this.isAdmin(request),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an assessment belonging to your profile; admins may view any assessment',
  })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.assessmentService.findOne(
      id,
      request.user.id,
      this.isAdmin(request),
    );
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Legacy submission route; profile-based results are calculated server-side',
  })
  submit() {
    throw new ForbiddenException(
      'Client-submitted assessment answers are disabled. Create a career-readiness assessment from your profile instead.',
    );
  }
}
