import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@ApiTags('candidate')
@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a candidate profile' })
  @ApiResponse({ status: 201, description: 'Candidate created' })
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Get()
  findAll() {
    return this.candidateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') string) {
    return this.candidateService.findOne(id);
  }
}
