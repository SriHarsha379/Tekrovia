import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  FreeAssessmentAnswer,
  FreeAssessmentService,
} from './free-assessment.service';

@ApiTags('assessment')
@Controller('assessments/free')
export class FreeAssessmentController {
  constructor(
    private readonly freeAssessmentService: FreeAssessmentService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Public self-assessment questionnaire; no account required',
  })
  getFreeAssessment() {
    return this.freeAssessmentService.getQuestions();
  }

  @Post('submit')
  @ApiOperation({
    summary:
      'Score a public self-assessment. Results are indicative only and are not stored.',
  })
  submitFreeAssessment(
    @Body('answers') answers: FreeAssessmentAnswer[],
  ) {
    return this.freeAssessmentService.score(answers);
  }
}
