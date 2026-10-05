import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadService } from './lead.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
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

  @Post()
  @ApiOperation({ summary: 'Capture a new CRM lead (public; returns only an acknowledgement)' })
  async create(@Body() body: CreateLeadDto) {
    // Never return the stored record: this endpoint is public, and an existing
    // lead must not be readable by anyone who knows an email or phone number.
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
