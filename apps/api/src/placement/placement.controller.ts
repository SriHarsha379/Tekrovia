import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PlacementService } from './placement.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@ApiTags('placements')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('placements')
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  private assertPlacementAccess(request: AuthenticatedRequest): void {
    if (!['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_MANAGER'].includes(request.user.role)) {
      throw new ForbiddenException('Placement management access required.');
    }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get placement pipeline metrics and upcoming interviews' })
  overview(
    @Req() request: AuthenticatedRequest,
    @Query('range') range?: string,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.overview(range);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Search and filter placement applications' })
  listApplications(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.listApplications({ search, status, page, limit });
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get a placement application with interviews and offer' })
  getApplication(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.getApplication(id);
  }

  @Post('applications')
  @ApiOperation({ summary: 'Create a placement application' })
  createApplication(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.createApplication(body, request.user.id);
  }

  @Patch('applications/:id')
  @ApiOperation({ summary: 'Update a placement application' })
  updateApplication(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.updateApplication(id, body);
  }

  @Post('applications/:id/interviews')
  @ApiOperation({ summary: 'Schedule an interview for an application' })
  createInterview(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.createInterview(id, body);
  }

  @Patch('interviews/:id')
  @ApiOperation({ summary: 'Update interview schedule, status, outcome, or feedback' })
  updateInterview(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.updateInterview(id, body);
  }

  @Post('applications/:id/offer')
  @ApiOperation({ summary: 'Create an offer for an application' })
  createOffer(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.createOffer(id, body);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update offer status and details' })
  updateOffer(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.updateOffer(id, body);
  }


  @Patch('applications/:id/pipeline')
  @ApiOperation({ summary: 'Update application pipeline stage and record its history' })
  updateApplicationPipeline(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.updateApplicationPipeline(
      id,
      body,
      request.user.id,
    );
  }

  @Get('readiness')
  @ApiOperation({ summary: 'List candidates and their placement-readiness evidence' })
  getReadinessCandidates(@Req() request: AuthenticatedRequest) {
    this.assertPlacementAccess(request);
    return this.placementService.getReadinessCandidates();
  }

  @Get('readiness/:candidateId')
  @ApiOperation({ summary: 'Get one candidate placement-readiness checklist' })
  getCandidateReadiness(
    @Req() request: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.getCandidateReadiness(candidateId);
  }

  @Patch('readiness/:candidateId/review')
  @ApiOperation({ summary: 'Record a human placement-readiness decision' })
  reviewCandidateReadiness(
    @Req() request: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.reviewCandidateReadiness(
      candidateId,
      body,
      request.user.id,
    );
  }


  @Get('candidates/:candidateId/mocks')
  @ApiOperation({ summary: 'List expert mock interviews for a candidate' })
  listCandidateMocks(
    @Req() request: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.listCandidateMocks(candidateId);
  }

  @Post('candidates/:candidateId/mocks')
  @ApiOperation({ summary: 'Schedule an expert mock interview for a candidate' })
  scheduleMockInterview(
    @Req() request: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.scheduleMockInterview(candidateId, body);
  }

  @Patch('mocks/:id')
  @ApiOperation({ summary: 'Record the outcome and score of a mock interview' })
  recordMockInterviewOutcome(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertPlacementAccess(request);
    return this.placementService.recordMockInterviewOutcome(id, body);
  }
}
