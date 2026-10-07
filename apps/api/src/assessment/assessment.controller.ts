import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './assessment.dto';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Get('free')
  async getFreeAssessment() {
    return this.assessmentService.getFreeAssessment();
  }

  @Post('submit')
  async submitAssessment(@Body() dto: SubmitAssessmentDto) {
    return this.assessmentService.scoreFreeAssessment(dto);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string) {
    return this.assessmentService.getResult(id);
  }
}
