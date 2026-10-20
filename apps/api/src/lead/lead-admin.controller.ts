import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { LeadAdminService } from './lead-admin.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'COUNSELLOR'];

@ApiTags('leads-admin')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('leads/admin')
export class LeadAdminController {
  constructor(private readonly service: LeadAdminService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!STAFF.includes(request.user.role)) {
      throw new ForbiddenException('Staff access required.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List and search leads with funnel counts (staff)' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertStaff(request);
    return this.service.list({ search, status, page, limit });
  }

  @Get('owners')
  @ApiOperation({ summary: 'Staff who can own a lead' })
  owners(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.owners();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one lead (staff)' })
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertStaff(request);
    return this.service.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead status, notes or owner (staff)' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { status?: string; notes?: string; ownerId?: string | null },
  ) {
    this.assertStaff(request);
    return this.service.update(id, body);
  }
}
