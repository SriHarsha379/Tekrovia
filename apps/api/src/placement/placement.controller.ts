import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PlacementService } from './placement.service';
import {
  CreateJobPostingDto,
  CreatePlacementDto,
  LogInterviewRoundDto,
  UpdateStageDto,
} from './dto/placement.dto';

interface AuthReq { user: { id: string; role: string } }

const ADMIN = ['ADMIN', 'SUPER_ADMIN', 'PLACEMENT'];

@ApiTags('placement')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('placement')
export class PlacementController {
  constructor(private readonly svc: PlacementService) {}

  // ── Job Postings ──────────────────────────────────────────────────────────
  @Post('jobs')
  @ApiOperation({ summary: 'Create job posting — placement team only' })
  createJob(@Req() req: AuthReq, @Body() dto: CreateJobPostingDto) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.createJobPosting(req.user.id, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List job postings' })
  listJobs(@Query('page') page?: string) {
    return this.svc.listJobPostings(page ? parseInt(page, 10) : 1);
  }

  // ── Candidate pipeline ────────────────────────────────────────────────────
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated candidate placement pipeline' })
  myPipeline(@Req() req: AuthReq) {
    return this.svc.getPipelineForCandidate(req.user.id);
  }

  // ── Admin pipeline ────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Pipeline stage counts — admin only' })
  dashboard(@Req() req: AuthReq) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.getPipelineDashboard();
  }

  @Post('candidates/:candidateId/submit')
  @ApiOperation({ summary: 'Create placement submission for candidate' })
  createSubmission(
    @Req() req: AuthReq,
    @Param('candidateId') candidateId: string,
    @Body() dto: CreatePlacementDto,
  ) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.createSubmission(candidateId, dto);
  }

  @Post('candidates/:candidateId/readiness')
  @ApiOperation({ summary: 'Evaluate readiness gate for candidate' })
  evaluateGate(@Req() req: AuthReq, @Param('candidateId') candidateId: string) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.evaluateReadinessGate(candidateId);
  }

  @Patch('submissions/:id/stage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update placement pipeline stage' })
  updateStage(@Req() req: AuthReq, @Param('id') id: string, @Body() dto: UpdateStageDto) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.updateStage(id, dto);
  }

  @Post('submissions/:id/rounds')
  @ApiOperation({ summary: 'Log interview round outcome' })
  logRound(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Body() dto: LogInterviewRoundDto,
  ) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.logInterviewRound(id, dto);
  }
}
