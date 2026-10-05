import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentStatus,
  CandidateProjectStatus,
  ExpertMockInterviewStatus,
  PlacementApplicationStatus,
  PlacementInterviewStatus,
  PlacementOfferStatus,
  PlacementPipelineStage,
  PlacementReadinessDecision,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const FORMAL_ASSESSMENT_RUBRIC = 'interactive-fullstack-v1';
const FORMAL_ASSESSMENT_REQUIRED_SCORE = 80;
const REQUIRED_EXPERT_MOCKS = 3;
const REQUIRED_FINAL_MOCK_SCORE = 8;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeEnumValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim();
}

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  private getRangeStart(range?: string): Date | null {
    const normalized = (range ?? '30d').trim().toLowerCase();
    if (normalized === 'all') return null;

    const amount = Number.parseInt(normalized.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(amount)) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const unit = normalized.endsWith('d') ? 'd' : normalized.endsWith('h') ? 'h' : 'd';
    const ms = unit === 'h' ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }

  private buildCountsMap<T extends string>(rows: Array<{ status?: T; pipelineStage?: T; _count?: { _all: number } }> | undefined, key: 'status' | 'pipelineStage') {
    const result: Record<string, number> = {};
    for (const row of rows ?? []) {
      const value = row[key];
      if (!value) continue;
      result[String(value)] = Number(row._count?._all ?? 0);
    }
    return result;
  }

  private buildReadinessState(candidate: any) {
    const assessments = Array.isArray(candidate.assessments) ? candidate.assessments : [];
    const expertMockInterviews = Array.isArray(candidate.expertMockInterviews) ? candidate.expertMockInterviews : [];
    const projectReviews = Array.isArray(candidate.projectReviews) ? candidate.projectReviews : [];

    const completedFormalAssessments = assessments
      .filter((assessment: any) => {
        const status = assessment?.status;
        return status === AssessmentStatus.COMPLETED || status === AssessmentStatus.REVIEWED;
      })
      .filter((assessment: any) => {
        const responses = assessment?.responses && typeof assessment.responses === 'object'
          ? assessment.responses as Record<string, unknown>
          : {};
        return responses.rubricVersion === FORMAL_ASSESSMENT_RUBRIC;
      })
      .sort((a: any, b: any) => new Date(b.updatedAt ?? b.completedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.completedAt ?? a.createdAt).getTime());

    const latestFormalAssessment = completedFormalAssessments[0] ?? null;
    const formalScore = toNumber(latestFormalAssessment?.score);
    const formalMaxScore = toNumber(latestFormalAssessment?.maxScore) ?? 10;
    const formalPercent = formalMaxScore > 0 && formalScore !== null ? (formalScore / formalMaxScore) * 100 : 0;

    const formalAssessmentComplete = Boolean(
      latestFormalAssessment &&
      formalScore !== null &&
      formalMaxScore > 0 &&
      formalPercent >= FORMAL_ASSESSMENT_REQUIRED_SCORE,
    );

    const completedExpertMocks = expertMockInterviews.filter(
      (mock: any) => mock?.status === ExpertMockInterviewStatus.COMPLETED,
    );
    const finalExpertMock = [...expertMockInterviews]
      .filter((mock: any) => mock?.isFinal)
      .sort((a: any, b: any) => Number(b.sequence ?? 0) - Number(a.sequence ?? 0))[0] ?? null;

    const finalExpertMockScore = toNumber(finalExpertMock?.score);
    const finalExpertMockMax = toNumber(finalExpertMock?.maxScore) ?? 10;
    const finalExpertMockPercent = finalExpertMockScore !== null && finalExpertMockMax > 0
      ? (finalExpertMockScore / finalExpertMockMax) * 100
      : 0;

    const expertMocksComplete = completedExpertMocks.length >= REQUIRED_EXPERT_MOCKS;
    const finalExpertMockComplete = Boolean(
      finalExpertMock &&
      finalExpertMockScore !== null &&
      finalExpertMockMax > 0 &&
      finalExpertMockPercent >= REQUIRED_FINAL_MOCK_SCORE * 10,
    );

    const approvedProjects = projectReviews.filter(
      (project: any) => project?.status === CandidateProjectStatus.APPROVED && project?.expertApproved === true,
    );
    const expertApprovedProjectComplete = approvedProjects.length > 0;

    let technicalAssessment = {
      complete: false,
      score: null,
      maxScore: null,
      evidenceType: 'LEGACY_TECHNICAL_ASSESSMENT',
      formalInteractiveAssessmentVerified: false,
    };

    if (latestFormalAssessment) {
      technicalAssessment = {
        complete: formalAssessmentComplete,
        score: formalAssessmentComplete ? formalScore : null,
        maxScore: formalAssessmentComplete ? formalMaxScore : null,
        evidenceType: 'FORMAL_INTERACTIVE_ASSESSMENT',
        formalInteractiveAssessmentVerified: formalAssessmentComplete,
      };
    }

    const allEvidenceComplete =
      expertMocksComplete &&
      finalExpertMockComplete &&
      expertApprovedProjectComplete &&
      technicalAssessment.complete;

    const checks = {
      expertMocks: {
        complete: expertMocksComplete,
        completedCount: completedExpertMocks.length,
        requiredCount: REQUIRED_EXPERT_MOCKS,
      },
      finalExpertMock: {
        complete: finalExpertMockComplete,
        score: finalExpertMockScore,
        maxScore: finalExpertMockMax,
        requiredScore: REQUIRED_FINAL_MOCK_SCORE,
      },
      expertApprovedProject: {
        complete: expertApprovedProjectComplete,
        approvedCount: approvedProjects.length,
      },
      technicalAssessment,
    };

    const review = candidate?.readinessReview ?? null;

    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName ?? candidate.user?.name ?? null,
      candidateEmail: candidate.email ?? candidate.user?.email ?? null,
      checks,
      allEvidenceComplete,
      decision: review?.decision ?? PlacementReadinessDecision.PENDING,
      review,
      approvalRequiresHumanReview: true,
      profileCompleteness: {
        percentage: 100,
        completedFields: 11,
        totalFields: 11,
        missingFields: [],
      },
      expertMockInterviews: expertMockInterviews,
      projectReviews,
      technicalAssessments: assessments.filter((assessment: any) => assessment?.type === 'TECHNICAL'),
    };
  }

  async overview(range?: string) {
    const reportingStart = this.getRangeStart(range);
    const where = reportingStart ? { createdAt: { gte: reportingStart } } : {};

    const [applicationCountsRaw, pipelineCountsRaw, scheduledInterviewCount, offerCountsRaw, upcomingInterviews, interviewConversion] = await Promise.all([
      this.prisma.placementApplication.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.placementApplication.groupBy({
        by: ['pipelineStage'],
        where,
        _count: { _all: true },
      }),
      this.prisma.placementInterview.count({
        where: {
          status: PlacementInterviewStatus.SCHEDULED,
          application: {
            createdAt: reportingStart ? { gte: reportingStart } : undefined,
          },
        },
      }),
      this.prisma.placementOffer.groupBy({
        by: ['status'],
        where: reportingStart ? { createdAt: { gte: reportingStart } } : {},
        _count: { _all: true },
      }),
      this.prisma.placementInterview.findMany({
        where: {
          status: PlacementInterviewStatus.SCHEDULED,
          scheduledAt: reportingStart ? { gte: reportingStart } : undefined,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
        include: {
          application: {
            select: {
              id: true,
              candidateId: true,
              companyName: true,
              jobTitle: true,
            },
          },
        },
      }),
      this.prisma.placementApplication.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const countsByStatus = this.buildCountsMap(applicationCountsRaw, 'status');
    const pipelineStageCounts = this.buildCountsMap(pipelineCountsRaw, 'pipelineStage');
    const offerCounts = this.buildCountsMap(offerCountsRaw, 'status');

    const completedInterviewApplications = await this.prisma.placementInterview.count({
      where: {
        status: PlacementInterviewStatus.COMPLETED,
        ...(reportingStart ? { scheduledAt: { gte: reportingStart } } : {}),
      },
    });

    const applicationsWithOfferAfterInterview = await this.prisma.placementApplication.count({
      where: {
        offer: { isNot: null },
        interviews: {
          some: {
            status: PlacementInterviewStatus.COMPLETED,
          },
        },
        ...(reportingStart ? { createdAt: { gte: reportingStart } } : {}),
      },
    });

    return {
      reportingRange: range ?? '30d',
      reportingStart: reportingStart?.toISOString() ?? null,
      applicationCounts: countsByStatus,
      scheduledInterviewCount,
      offerCounts,
      pipelineStageCounts,
      interviewConversion: {
        completedInterviewApplications,
        applicationsWithOfferAfterInterview,
      },
      upcomingInterviews,
    };
  }

  async listApplications(params: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(params.limit ?? '20', 10) || 20));
    const search = params.search?.trim();
    const status = params.status?.trim();

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { candidateId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.placementApplication.count({ where }),
      this.prisma.placementApplication.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          interviews: { orderBy: { scheduledAt: 'asc' } },
          offer: true,
          pipelineHistory: { orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getApplication(id: string) {
    const application = await this.prisma.placementApplication.findUnique({
      where: { id },
      include: {
        interviews: { orderBy: { scheduledAt: 'asc' } },
        offer: true,
        pipelineHistory: { orderBy: { createdAt: 'desc' }, include: { changedByUser: { select: { id: true, name: true } } } },
      },
    });

    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    return application;
  }

  async createApplication(body: Record<string, unknown>, createdByUserId?: string) {
    const candidateId = normalizeEnumValue(body.candidateId);
    const companyName = normalizeEnumValue(body.companyName);
    const jobTitle = normalizeEnumValue(body.jobTitle);

    if (!candidateId || !companyName || !jobTitle) {
      throw new BadRequestException('Candidate ID, company name and job title are required.');
    }

    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    return this.prisma.placementApplication.create({
      data: {
        candidateId,
        companyName,
        jobTitle,
        jobLocation: typeof body.jobLocation === 'string' ? body.jobLocation : null,
        employmentType: typeof body.employmentType === 'string' ? body.employmentType : null,
        jobDescription: typeof body.jobDescription === 'string' ? body.jobDescription : null,
        source: typeof body.source === 'string' ? body.source : null,
        status: normalizeEnumValue(body.status) as PlacementApplicationStatus | undefined ?? PlacementApplicationStatus.DRAFT,
        pipelineStage: normalizeEnumValue(body.pipelineStage) as PlacementPipelineStage | undefined ?? PlacementPipelineStage.PROFILE_REVIEW,
        appliedAt: body.appliedAt ? new Date(String(body.appliedAt)) : null,
        notes: typeof body.notes === 'string' ? body.notes : null,
        createdByUserId: createdByUserId ?? null,
      },
      include: {
        interviews: true,
        offer: true,
        pipelineHistory: true,
      },
    });
  }

  async updateApplication(id: string, body: Record<string, unknown>) {
    const application = await this.prisma.placementApplication.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    return this.prisma.placementApplication.update({
      where: { id },
      data: {
        ...(typeof body.companyName === 'string' ? { companyName: body.companyName } : {}),
        ...(typeof body.jobTitle === 'string' ? { jobTitle: body.jobTitle } : {}),
        ...(typeof body.jobLocation === 'string' ? { jobLocation: body.jobLocation } : {}),
        ...(typeof body.employmentType === 'string' ? { employmentType: body.employmentType } : {}),
        ...(typeof body.jobDescription === 'string' ? { jobDescription: body.jobDescription } : {}),
        ...(typeof body.source === 'string' ? { source: body.source } : {}),
        ...(typeof body.notes === 'string' ? { notes: body.notes } : {}),
        ...(typeof body.status === 'string' ? { status: body.status as PlacementApplicationStatus } : {}),
        ...(typeof body.appliedAt === 'string' && body.appliedAt ? { appliedAt: new Date(String(body.appliedAt)) } : {}),
      },
      include: {
        interviews: true,
        offer: true,
        pipelineHistory: true,
      },
    });
  }

  async createInterview(applicationId: string, body: Record<string, unknown>) {
    const application = await this.prisma.placementApplication.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    const scheduledAtValue = body.scheduledAt;
    if (typeof scheduledAtValue !== 'string' || !scheduledAtValue) {
      throw new BadRequestException('scheduledAt is required.');
    }

    return this.prisma.placementInterview.create({
      data: {
        applicationId,
        round: Number(body.round ?? 1),
        title: typeof body.title === 'string' ? body.title : null,
        scheduledAt: new Date(scheduledAtValue),
        durationMins: body.durationMins === null || body.durationMins === undefined ? null : Number(body.durationMins),
        mode: typeof body.mode === 'string' ? body.mode : null,
        meetingLink: typeof body.meetingLink === 'string' ? body.meetingLink : null,
        interviewer: typeof body.interviewer === 'string' ? body.interviewer : null,
        status: typeof body.status === 'string' ? (body.status as PlacementInterviewStatus) : PlacementInterviewStatus.SCHEDULED,
        outcome: typeof body.outcome === 'string' ? (body.outcome as any) : undefined,
      },
    });
  }

  async updateInterview(id: string, body: Record<string, unknown>) {
    const interview = await this.prisma.placementInterview.findUnique({ where: { id } });
    if (!interview) {
      throw new NotFoundException('Interview not found.');
    }

    return this.prisma.placementInterview.update({
      where: { id },
      data: {
        ...(typeof body.round === 'number' ? { round: body.round } : {}),
        ...(typeof body.title === 'string' ? { title: body.title } : {}),
        ...(typeof body.scheduledAt === 'string' ? { scheduledAt: new Date(body.scheduledAt) } : {}),
        ...(typeof body.durationMins === 'number' ? { durationMins: body.durationMins } : {}),
        ...(typeof body.mode === 'string' ? { mode: body.mode } : {}),
        ...(typeof body.meetingLink === 'string' ? { meetingLink: body.meetingLink } : {}),
        ...(typeof body.interviewer === 'string' ? { interviewer: body.interviewer } : {}),
        ...(typeof body.status === 'string' ? { status: body.status as PlacementInterviewStatus } : {}),
        ...(typeof body.outcome === 'string' ? { outcome: body.outcome as any } : {}),
        ...(typeof body.feedback === 'string' ? { feedback: body.feedback } : {}),
      },
    });
  }

  async createOffer(applicationId: string, body: Record<string, unknown>) {
    const application = await this.prisma.placementApplication.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    return this.prisma.placementOffer.create({
      data: {
        applicationId,
        status: typeof body.status === 'string' ? (body.status as PlacementOfferStatus) : PlacementOfferStatus.PENDING,
        compensation: body.compensation === null || body.compensation === undefined ? null : Number(body.compensation),
        currency: typeof body.currency === 'string' ? body.currency : 'INR',
        offeredAt: body.offeredAt ? new Date(String(body.offeredAt)) : null,
        expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
        joiningDate: body.joiningDate ? new Date(String(body.joiningDate)) : null,
        notes: typeof body.notes === 'string' ? body.notes : null,
      },
    });
  }

  async updateOffer(id: string, body: Record<string, unknown>) {
    const offer = await this.prisma.placementOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    return this.prisma.placementOffer.update({
      where: { id },
      data: {
        ...(typeof body.status === 'string' ? { status: body.status as PlacementOfferStatus } : {}),
        ...(body.compensation === null || body.compensation === undefined ? { compensation: null } : typeof body.compensation === 'number' ? { compensation: body.compensation } : {}),
        ...(typeof body.currency === 'string' ? { currency: body.currency } : {}),
        ...(typeof body.offeredAt === 'string' ? { offeredAt: new Date(body.offeredAt) } : {}),
        ...(typeof body.expiresAt === 'string' ? { expiresAt: new Date(body.expiresAt) } : {}),
        ...(typeof body.joiningDate === 'string' ? { joiningDate: new Date(body.joiningDate) } : {}),
        ...(typeof body.notes === 'string' ? { notes: body.notes } : {}),
      },
    });
  }

  async updateApplicationPipeline(id: string, body: Record<string, unknown>, changedByUserId?: string) {
    const application = await this.prisma.placementApplication.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    const stage = normalizeEnumValue(body.stage);
    if (!stage) {
      throw new BadRequestException('stage is required.');
    }

    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

    const updated = await this.prisma.placementApplication.update({
      where: { id },
      data: {
        pipelineStage: stage as PlacementPipelineStage,
      },
      include: {
        pipelineHistory: true,
      },
    });

    await this.prisma.placementApplication.update({
      where: { id },
      data: {
        pipelineHistory: {
          create: {
            fromStage: application.pipelineStage,
            toStage: stage as PlacementPipelineStage,
            note: note ?? null,
            changedByUserId: changedByUserId ?? null,
          },
        },
      },
    });

    return updated;
  }

  async getReadinessCandidates() {
    const candidates = await this.prisma.candidate.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const items = await Promise.all(
      candidates.map(async (candidate) => this.getCandidateReadiness(candidate.id)),
    );

    return {
      total: items.length,
      items,
    };
  }

  async getCandidateReadiness(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        assessments: { orderBy: { createdAt: 'desc' } },
        expertMockInterviews: { orderBy: { sequence: 'asc' } },
        projectReviews: { orderBy: { reviewedAt: 'desc' } },
        readinessReview: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    const readiness = this.buildReadinessState(candidate);
    return readiness;
  }

  async reviewCandidateReadiness(
    candidateId: string,
    payload: Record<string, unknown>,
    reviewerId: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        readinessReview: true,
        assessments: { orderBy: { createdAt: 'desc' } },
        expertMockInterviews: { orderBy: { sequence: 'asc' } },
        projectReviews: { orderBy: { reviewedAt: 'desc' } },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    const decisionRaw = normalizeEnumValue(payload.decision);
    const allowedDecisions = Object.values(PlacementReadinessDecision);
    if (!decisionRaw || !allowedDecisions.includes(decisionRaw as PlacementReadinessDecision)) {
      throw new BadRequestException('Invalid readiness decision.');
    }

    const readiness = this.buildReadinessState(candidate);
    if (decisionRaw === PlacementReadinessDecision.APPROVED && !readiness.allEvidenceComplete) {
      throw new BadRequestException('Readiness approval requires all required evidence to be complete.');
    }

    const notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;
    const review = await this.prisma.placementReadinessReview.upsert({
      where: { candidateId },
      create: {
        candidate: { connect: { id: candidateId } },
        decision: decisionRaw as PlacementReadinessDecision,
        approvedByUserId: reviewerId,
        notes: notes ?? null,
        reviewedAt: new Date(),
      },
      update: {
        decision: decisionRaw as PlacementReadinessDecision,
        approvedByUserId: reviewerId,
        notes: notes ?? null,
        reviewedAt: new Date(),
      },
    });

    return {
      candidateId,
      review,
      allEvidenceComplete: readiness.allEvidenceComplete,
    };
  }
}









































































































































































































































































































































































































































































































































































































































































