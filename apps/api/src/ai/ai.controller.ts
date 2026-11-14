import {
  Body, Controller, Post, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { DoubtDto } from './dto/doubt.dto';
import { ResumeReviewDto } from './dto/resume-review.dto';
import { MockQuestionsDto } from './dto/mock-questions.dto';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('roadmap')
  async roadmap(@Req() req: AuthenticatedRequest) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId: req.user.id },
    });
    if (!candidate) return { error: 'Complete your candidate profile first.' };
    return this.ai.generateRoadmap({
      target_role:           candidate.targetRole          ?? 'Software Developer',
      skills:                candidate.skills              ?? [],
      experience_years:      candidate.experienceYears     ?? 0,
      classification:        candidate.classification      ?? 'BEGINNER',
      course_interest:       candidate.courseInterest      ?? undefined,
      learning_availability: candidate.learningAvailability ?? undefined,
    });
  }

  @Post('mock-questions')
  async mockQuestions(
    @Req() req: AuthenticatedRequest,
    @Body() body: MockQuestionsDto,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId: req.user.id },
    });
    if (!candidate) return { error: 'Complete your candidate profile first.' };
    return this.ai.generateMockQuestions({
      target_role:      candidate.targetRole      ?? 'Software Developer',
      skills:           candidate.skills          ?? [],
      experience_years: candidate.experienceYears ?? 0,
      round_type:       body.round_type           ?? 'TECHNICAL',
      num_questions:    body.num_questions         ?? 10,
    });
  }

  @Post('resume-review')
  async resumeReview(
    @Body() body: ResumeReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId: req.user.id },
    });
    return this.ai.reviewResume({
      resume_text:     body.resume_text,
      target_role:     candidate?.targetRole ?? 'Software Developer',
      job_description: body.job_description,
    });
  }

  @Post('doubt')
  async doubt(@Body() body: DoubtDto) {
    return this.ai.answerDoubt(body);
  }
}
