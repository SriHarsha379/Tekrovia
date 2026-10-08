import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { DashboardService } from './dashboard.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getDashboardOverview(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getDashboardOverview(request.user.id);
  }

  @Get('courses')
  getEnrolledCourses(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getEnrolledCourses(request.user.id);
  }

  @Get('progress')
  getProgress(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getProgress(request.user.id);
  }

  @Get('assessments')
  getAssessments(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getAssessments(request.user.id);
  }

  @Get('stats')
  getStats(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getUserStats(request.user.id);
  }
}
