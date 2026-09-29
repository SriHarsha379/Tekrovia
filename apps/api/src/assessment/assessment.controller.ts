import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';

@ApiTags('assessment')
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assessment for a candidate' })
  create(@Body() body: { candidateId: string; type: string; title: string; description?: string }) {
    return this.assessmentService.createAssessment(body.candidateId, body.type, body.title, body.description);
  }

  @Get(':id')
  findOne(@Param('id') string) {
    return this.assessmentService.submitAssessment(id, {});
  }
}
