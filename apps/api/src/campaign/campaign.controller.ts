import {
  Body, Controller, ForbiddenException,
  Get, Param, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/campaign.dto';

interface AuthReq { user: { id: string; role: string } }

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly svc: CampaignService) {}

  private assertMarketing(req: AuthReq) {
    if (!['ADMIN', 'SUPER_ADMIN', 'MARKETING'].includes(req.user.role)) {
      throw new ForbiddenException('Marketing team access required.');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create campaign — marketing team only' })
  create(@Req() req: AuthReq, @Body() dto: CreateCampaignDto) {
    this.assertMarketing(req);
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@Req() req: AuthReq, @Query('page') page?: string) {
    this.assertMarketing(req);
    return this.svc.findAll(page ? parseInt(page, 10) : 1);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  findOne(@Req() req: AuthReq, @Param('id') id: string) {
    this.assertMarketing(req);
    return this.svc.findOne(id);
  }

  @Get(':id/funnel')
  @ApiOperation({ summary: 'Get funnel analytics for campaign' })
  funnel(@Req() req: AuthReq, @Param('id') id: string) {
    this.assertMarketing(req);
    return this.svc.getFunnelStats(id);
  }
}
