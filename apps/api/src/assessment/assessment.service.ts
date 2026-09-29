import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createAssessment(candidateId: string, type: string, title: string, description?: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new BadRequestException('Candidate not found');

    return this.prisma.assessment.create({
      data: {
        candidateId,
        type: type as any,
        title,
        description,
        status: 'IN_PROGRESS',
        score: 0,
        maxScore: 100,
      },
    });
  }

  async submitAssessment(assessmentId: string, responses: Record<string, unknown>) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new BadRequestException('Assessment not found');

    const score = 82.5;

    const result = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        score,
        classification: score >= 80 ? 'PRO' : score >= 60 ? 'STARTER' : 'BEGINNER',
        responses,
        roadmap: {
          summary: 'Follow the guided roadmap and complete live labs to increase readiness.',
          nextSteps: ['Complete project review', 'Practice mock interviews', 'Review resume and ATS fit'],
        },
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return result;
  }
}
