import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { MarketingService } from './marketing.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'COUNSELLOR'];

@ApiTags('marketing')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!STAFF.includes(request.user.role)) {
      throw new ForbiddenException('Staff access required.');
    }
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Lead funnel and conversion for a window (staff)' })
  funnel(@Req() request: AuthenticatedRequest, @Query('days') days?: string) {
    this.assertStaff(request);
    return this.service.funnel(Number(days) || 30);
  }

  @Get('attribution')
  @ApiOperation({ summary: 'Leads and conversion by source, campaign and interest (staff)' })
  attribution(@Req() request: AuthenticatedRequest, @Query('days') days?: string) {
    this.assertStaff(request);
    return this.service.attribution(Number(days) || 30);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Daily lead volume (staff)' })
  daily(@Req() request: AuthenticatedRequest, @Query('days') days?: string) {
    this.assertStaff(request);
    return this.service.daily(Number(days) || 14);
  }
}
