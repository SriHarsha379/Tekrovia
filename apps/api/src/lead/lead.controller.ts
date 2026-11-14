import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadService } from './lead.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@ApiTags('lead')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Administrator access required.');
    }
  }

  // Fix 6: 10 lead submissions per IP per minute for the public endpoint
  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Capture a new CRM lead (public)' })
  async create(@Body() body: CreateLeadDto) {
    await this.leadService.createLead(body);
    return { received: true };
  }

  @Post(':id/convert/:candidateId')
  @UseGuards(SessionAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert a lead to a candidate (admin only)' })
  convert(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string,
  ) {
    this.assertAdmin(request);
    return this.leadService.convertLeadToCandidate(id, candidateId);
  }
}
