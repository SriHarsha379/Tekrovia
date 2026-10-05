import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PlacementService } from './placement.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('placements')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('placements')
export class StudentReadinessController {
  constructor(private readonly placementService: PlacementService) {}

  @Get('me/readiness')
  @ApiOperation({
    summary: 'Get my own placement-readiness checklist (no staff notes)',
  })
  getMine(@Req() request: AuthenticatedRequest) {
    return this.placementService.getStudentReadiness(request.user.id);
  }
}
