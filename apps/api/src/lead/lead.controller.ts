import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadService } from './lead.service';

@ApiTags('lead')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Capture a new CRM lead' })
  create(@Body() body: any) {
    return this.leadService.createLead(body);
  }

  @Get(':id/convert/:candidateId')
  convert(@Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.leadService.convertLeadToCandidate(id, candidateId);
  }
}
