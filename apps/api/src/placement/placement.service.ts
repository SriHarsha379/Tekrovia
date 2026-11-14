import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentType,
  EnrollmentStatus,
  GateStatus,
  MockType,
  PipelineStage,
  RecoveryStatus,
  SubmissionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobPostingDto,
  CreatePlacementDto,
  LogInterviewRoundDto,
  UpdateStageDto,
} from './dto/placement.dto';

export const RECOVERY_THRESHOLD = 4;

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  async createJobPosting(userId: string, dto: CreateJobPostingDto) {
    return this.prisma.jobPosting.create({
      data: {
        clientName: dto.clientName,
        roleTitle: dto.roleTitle,
        jobDescription: dto.jobDescription,
        jobLink: dto.jobLink,
        location: dto.location,
        createdById: userId,
      },
    });
  }

  async listJobPostings(page = 1) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.jobPosting.count(),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }

  async getPipelineForCandidate(candidateId: string) {
    return this.prisma.placementSubmission.findMany({
      where: { candidateId },
      include: {
        jobPosting: { select: { roleTitle: true, clientName: true, location: true } },
        interviewRounds: { orderBy: { roundNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubmission(candidateId: string, dto: CreatePlacementDto) {
    const gate = await this.prisma.readinessGate.findFirst({
      where: { candidateId, status: GateStatus.APPROVED_FOR_PLACEMENT },
    });
    if (!gate) {
      throw new BadRequestException(
        'Candidate has not been approved for placement. Complete the readiness gate first.',
      );
    }

    const job = await this.prisma.jobPosting.findUnique({ where: { id: dto.jobPostingId } });
    if (!job) throw new NotFoundException('Job posting not found.');

    return this.prisma.placementSubmission.create({
      data: { candidateId, jobPostingId: dto.jobPostingId, stage: PipelineStage.PROFILE_REVIEW },
    });
  }

  async updateStage(submissionId: string, dto: UpdateStageDto) {
    const sub = await this.prisma.placementSubmission.findUnique({ where: { id: submissionId } });
    if (!sub) throw new NotFoundException('Submission not found.');

    const updated = await this.prisma.placementSubmission.update({
      where: { id: submissionId },
      data: {
        stage: dto.stage,
        channel: dto.channel,
        blocker: dto.blocker,
        nextAction: dto.nextAction,
        rejectionReason: dto.rejectionReason,
      },
    });

    if (dto.stage === PipelineStage.FEEDBACK_AWAITED && dto.rejectionReason) {
      await this.handleRejection(sub.candidateId);
    }

    return updated;
  }

  async logInterviewRound(submissionId: string, dto: LogInterviewRoundDto) {
    const sub = await this.prisma.placementSubmission.findUnique({
      where: { id: submissionId },
      include: { interviewRounds: true },
    });
    if (!sub) throw new NotFoundException('Submission not found.');

    const roundNumber = sub.interviewRounds.length + 1;
    return this.prisma.interviewRound.create({
      data: { submissionId, roundNumber, outcome: dto.outcome, feedback: dto.feedback },
    });
  }

  async evaluateReadinessGate(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found.');

    const approvedProjectCount = await this.prisma.projectSubmission.count({
      where: { candidateId, status: SubmissionStatus.MENTOR_APPROVED },
    });
    const projectsComplete = approvedProjectCount >= 2;

    const expertMocks = await this.prisma.mockInterview.findMany({
      where: { candidateId, type: MockType.EXPERT_MOCK },
      orderBy: { conductedAt: 'desc' },
    });
    const mocksComplete = expertMocks.length >= 3;

    const formalAssessment = await this.prisma.assessment.findFirst({
      where: { candidateId, type: AssessmentType.FORMAL_READINESS, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
    });
    const formalScore = formalAssessment?.score ? Number(formalAssessment.score) : null;

    const finalMock = expertMocks.find((m) => m.isFinalMock);
    const finalMockScore = finalMock?.score ? Number(finalMock.score) : null;

    const qualified =
      projectsComplete &&
      mocksComplete &&
      formalScore !== null && formalScore >= 8 &&
      finalMockScore !== null && finalMockScore >= 8;

    return this.prisma.readinessGate.create({
      data: {
        candidateId,
        projectsComplete,
        mocksComplete,
        formalScore,
        finalMockScore,
        status: qualified ? GateStatus.APPROVED_FOR_PLACEMENT : GateStatus.PENDING,
      },
    });
  }

  // ── Used by student-readiness.controller.ts ───────────────────────────────
  async getStudentReadiness(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!candidate) throw new NotFoundException('Candidate profile not found.');

    const latestGate = await this.prisma.readinessGate.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { evaluatedAt: 'desc' },
    });

    return {
      candidateId: candidate.id,
      gate: latestGate,
      isApproved: latestGate?.status === GateStatus.APPROVED_FOR_PLACEMENT,
    };
  }

  // ── Used by placement.service.spec.ts & recovery.service.spec.ts ─────────
  async getCandidateReadiness(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found.');

    const latestGate = await this.prisma.readinessGate.findFirst({
      where: { candidateId },
      orderBy: { evaluatedAt: 'desc' },
    });

    return {
      candidateId,
      gate: latestGate,
      isApproved: latestGate?.status === GateStatus.APPROVED_FOR_PLACEMENT,
    };
  }

  async getReadinessCandidates() {
    const gates = await this.prisma.readinessGate.findMany({
      where: { status: GateStatus.APPROVED_FOR_PLACEMENT },
      include: { candidate: { select: { candidateCode: true, fullName: true, email: true } } },
      orderBy: { evaluatedAt: 'desc' },
    });
    return { items: gates };
  }

  async reviewCandidateReadiness(
    candidateId: string,
    decision: GateStatus,
    notes?: string,
  ) {
    const gate = await this.prisma.readinessGate.findFirst({
      where: { candidateId },
      orderBy: { evaluatedAt: 'desc' },
    });
    if (!gate) throw new NotFoundException('No readiness gate found for this candidate.');

    return this.prisma.readinessGate.update({
      where: { id: gate.id },
      data: { status: decision },
    });
  }

  async overview() {
    const [totalCandidates, approved, inPipeline] = await this.prisma.$transaction([
      this.prisma.candidate.count({ where: { isActive: true } }),
      this.prisma.readinessGate.count({ where: { status: GateStatus.APPROVED_FOR_PLACEMENT } }),
      this.prisma.placementSubmission.count(),
    ]);

    const byStage = await this.prisma.placementSubmission.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    return {
      totalCandidates,
      approved,
      inPipeline,
      byStage: byStage.reduce(
        (acc: Record<string, number>, row) => ({ ...acc, [row.stage]: row._count.id }),
        {},
      ),
    };
  }

  async getPipelineDashboard() {
    return this.overview();
  }

  private async handleRejection(candidateId: string) {
    const existing = await this.prisma.placementRecovery.findFirst({
      where: { candidateId, status: { in: [RecoveryStatus.ACTIVE, RecoveryStatus.PAUSED_FOR_BRUSHUP] } },
    });

    if (!existing) {
      await this.prisma.placementRecovery.create({
        data: { candidateId, rejectionCount: 1 },
      });
      return;
    }

    const newCount = existing.rejectionCount + 1;
    await this.prisma.placementRecovery.update({
      where: { id: existing.id },
      data: {
        rejectionCount: newCount,
        ...(newCount >= RECOVERY_THRESHOLD
          ? { status: RecoveryStatus.PAUSED_FOR_BRUSHUP, pausedAt: new Date() }
          : {}),
      },
    });
  }
}
