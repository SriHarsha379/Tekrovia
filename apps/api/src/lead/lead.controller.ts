import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
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
  @ApiOperation({ summary: 'Capture a new CRM lead' })
  create(@Body() body: any) {
    return this.leadService.createLead(body);
  }

  @Get(':id/convert/:candidateId')
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
