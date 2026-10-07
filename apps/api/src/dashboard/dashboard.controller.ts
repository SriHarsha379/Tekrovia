import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getDashboardOverview(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getDashboardOverview(userId);
  }

  @Get('courses')
  async getEnrolledCourses(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getEnrolledCourses(userId);
  }

  @Get('progress')
  async getProgress(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getProgress(userId);
  }

  @Get('assessments')
  async getAssessments(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getAssessments(userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.id;
    return this.dashboardService.getUserStats(userId);
  }
}
