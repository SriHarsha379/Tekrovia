import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PlacementApplicationStatus,
  PlacementPipelineStage,
  PlacementInterviewOutcome,
  PlacementInterviewStatus,
  PlacementOfferStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlacementReadinessDecision,
  CandidateProjectStatus,
  ExpertMockInterviewStatus,
  AssessmentStatus,
  AssessmentType,
} from '@prisma/client';


const applicationStatuses = Object.values(PlacementApplicationStatus);
const interviewStatuses = Object.values(PlacementInterviewStatus);
const interviewOutcomes = Object.values(PlacementInterviewOutcome);
const offerStatuses = Object.values(PlacementOfferStatus);

export const RECOVERY_THRESHOLD = 4;

function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${key} is required and must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(body: Record<string, unknown>, key: string): string | null | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${key} must be a string or null.`);
  }
  return value.trim();
}

function optionalDate(body: Record<string, unknown>, key: string): Date | null | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadRequestException(`${key} must be a valid date string.`);
  }
  return new Date(value);
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequestException(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range = '30d') {
    const allowedRanges = ['7d', '30d', '90d', 'all'];
    if (!allowedRanges.includes(range)) {
      throw new BadRequestException(
        `range must be one of: ${allowedRanges.join(', ')}.`,
      );
    }

    const rangeStart =
      range === 'all'
        ? undefined
        : new Date(Date.now() - Number.parseInt(range, 10) * 24 * 60 * 60 * 1000);

    const applicationWhere: Prisma.PlacementApplicationWhereInput = rangeStart
      ? { createdAt: { gte: rangeStart } }
      : {};
    const relatedApplicationWhere = rangeStart
      ? { application: { createdAt: { gte: rangeStart } } }
      : {};

    const [
      applications,
      interviews,
      offers,
      upcomingInterviews,
      pipelineStages,
      completedInterviewApplications,
      applicationsWithOfferAfterInterview,
    ] = await Promise.all([
      this.prisma.placementApplication.groupBy({
        by: ['status'],
        where: applicationWhere,
        _count: { _all: true },
      }),
      this.prisma.placementInterview.count({
        where: {
          status: PlacementInterviewStatus.SCHEDULED,
          ...relatedApplicationWhere,
        },
      }),
      this.prisma.placementOffer.groupBy({
        by: ['status'],
        where: relatedApplicationWhere,
        _count: { _all: true },
      }),
      this.prisma.placementInterview.findMany({
        where: {
          status: PlacementInterviewStatus.SCHEDULED,
          scheduledAt: { gte: new Date() },
          ...relatedApplicationWhere,
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
        by: ['pipelineStage'],
        where: applicationWhere,
        _count: { _all: true },
      }),
      this.prisma.placementApplication.count({
        where: {
          ...applicationWhere,
          interviews: {
            some: { status: PlacementInterviewStatus.COMPLETED },
          },
        },
      }),
      this.prisma.placementApplication.count({
        where: {
          ...applicationWhere,
          interviews: {
            some: { status: PlacementInterviewStatus.COMPLETED },
          },
          offer: { isNot: null },
        },
      }),
    ]);

    return {
      reportingRange: range,
      reportingStart: rangeStart?.toISOString() ?? null,
      applicationCounts: Object.fromEntries(
        applications.map((item) => [item.status, item._count._all]),
      ),
      scheduledInterviewCount: interviews,
      offerCounts: Object.fromEntries(
        offers.map((item) => [item.status, item._count._all]),
      ),
      pipelineStageCounts: Object.fromEntries(
        pipelineStages.map((item) => [
          item.pipelineStage,
          item._count._all,
        ]),
      ),
      interviewConversion: {
        completedInterviewApplications,
        applicationsWithOfferAfterInterview,
      },
      upcomingInterviews,
    };
  }

  async listApplications(filters: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(filters.limit ?? '20', 10) || 20));
    const where: Prisma.PlacementApplicationWhereInput = {};

    if (filters.status) {
      where.status = enumValue(filters.status, applicationStatuses, 'status');
    }
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { candidateId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.placementApplication.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          interviews: { orderBy: { scheduledAt: 'asc' } },
          offer: true,
        },
      }),
      this.prisma.placementApplication.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getApplication(id: string) {
    const application = await this.prisma.placementApplication.findUnique({
      where: { id },
      include: {
        interviews: { orderBy: { scheduledAt: 'asc' } },
        offer: true,
        pipelineHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!application) {
      throw new NotFoundException('Placement application not found.');
    }

    const reviewerIds = [
      ...new Set(
        application.pipelineHistory
          .map((entry) => entry.changedByUserId)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    ];

    const reviewers = reviewerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: reviewerIds } },
          select: { id: true, name: true },
        })
      : [];

    const reviewerNames = new Map(
      reviewers.map((reviewer) => [reviewer.id, reviewer.name]),
    );

    return {
      ...application,
      pipelineHistory: application.pipelineHistory.map((entry) => ({
        ...entry,
        changedByUser: entry.changedByUserId
          ? {
              id: entry.changedByUserId,
              name: reviewerNames.get(entry.changedByUserId) ?? null,
            }
          : null,
      })),
    };
  }

  async createApplication(body: Record<string, unknown>, userId: string) {
    const candidateId = requiredString(body, 'candidateId');
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found.');

    const data: Prisma.PlacementApplicationCreateInput = {
      candidate: { connect: { id: candidateId } },
      companyName: requiredString(body, 'companyName'),
      jobTitle: requiredString(body, 'jobTitle'),
      jobLocation: optionalString(body, 'jobLocation'),
      employmentType: optionalString(body, 'employmentType'),
      jobDescription: optionalString(body, 'jobDescription'),
      source: optionalString(body, 'source'),
      notes: optionalString(body, 'notes'),
      status: body.status === undefined
        ? PlacementApplicationStatus.DRAFT
        : enumValue(body.status, applicationStatuses, 'status'),
      appliedAt: optionalDate(body, 'appliedAt'),
      createdByUser: { connect: { id: userId } },
    };

    return this.prisma.placementApplication.create({
      data,
      include: { interviews: true, offer: true },
    });
  }

  async updateApplication(id: string, body: Record<string, unknown>) {
    await this.ensureApplication(id);
    const data: Prisma.PlacementApplicationUpdateInput = {};

    const companyName = optionalString(body, 'companyName');
    if (companyName !== undefined) {
      if (!companyName) throw new BadRequestException('companyName cannot be empty.');
      data.companyName = companyName;
    }

    const jobTitle = optionalString(body, 'jobTitle');
    if (jobTitle !== undefined) {
      if (!jobTitle) throw new BadRequestException('jobTitle cannot be empty.');
      data.jobTitle = jobTitle;
    }

    const jobLocation = optionalString(body, 'jobLocation');
    if (jobLocation !== undefined) data.jobLocation = jobLocation;

    const employmentType = optionalString(body, 'employmentType');
    if (employmentType !== undefined) data.employmentType = employmentType;

    const jobDescription = optionalString(body, 'jobDescription');
    if (jobDescription !== undefined) data.jobDescription = jobDescription;

    const source = optionalString(body, 'source');
    if (source !== undefined) data.source = source;

    const notes = optionalString(body, 'notes');
    if (notes !== undefined) data.notes = notes;

    if (body.status !== undefined) {
      data.status = enumValue(body.status, applicationStatuses, 'status');
    }
    const appliedAt = optionalDate(body, 'appliedAt');
    if (appliedAt !== undefined) data.appliedAt = appliedAt;

    return this.prisma.placementApplication.update({
      where: { id },
      data,
      include: { interviews: true, offer: true },
    });
  }

  async updateApplicationPipeline(
    id: string,
    body: Record<string, unknown>,
    userId: string,
  ) {
    const stage = enumValue(
      body.stage,
      Object.values(PlacementPipelineStage),
      'stage',
    );
    const note = optionalString(body, 'note');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.placementApplication.findUnique({
        where: { id },
        select: { id: true, candidateId: true, pipelineStage: true },
      });

      if (!existing) {
        throw new NotFoundException('Placement application not found.');
      }

      if (existing.pipelineStage === stage) {
        throw new BadRequestException(
          'Application is already at the requested pipeline stage.',
        );
      }

      if (stage === PlacementPipelineStage.JOB_READY) {
        const readiness = await this.buildReadinessSummary(existing.candidateId);

        if (!readiness.allEvidenceComplete) {
          throw new BadRequestException(
            'Candidate cannot enter JOB_READY: readiness evidence is incomplete.',
          );
        }

        if (readiness.decision !== PlacementReadinessDecision.APPROVED) {
          throw new BadRequestException(
            'Candidate cannot enter JOB_READY: human readiness review must be APPROVED.',
          );
        }
      }

      const updated = await tx.placementApplication.update({
        where: { id },
        data: { pipelineStage: stage },
      });

      await tx.placementPipelineHistory.create({
        data: {
          application: { connect: { id } },
          fromStage: existing.pipelineStage,
          toStage: stage,
          note,
          changedByUserId: userId,
        },
      });

      return updated;
    });
  }

  async createInterview(applicationId: string, body: Record<string, unknown>) {
    await this.ensureApplication(applicationId);
    const duration = body.durationMins === undefined ? null : Number(body.durationMins);
    if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
      throw new BadRequestException('durationMins must be an integer between 1 and 1440.');
    }

    const scheduledAt = optionalDate(body, 'scheduledAt');
    if (!scheduledAt) throw new BadRequestException('scheduledAt is required.');

    return this.prisma.placementInterview.create({
      data: {
        application: { connect: { id: applicationId } },
        round: (() => {
          const value = body.round === undefined ? 1 : Number(body.round);
          if (!Number.isInteger(value) || value < 1) {
            throw new BadRequestException('round must be a positive integer.');
          }
          return value;
        })(),
        title: optionalString(body, 'title'),
        scheduledAt,
        durationMins: duration,
        mode: optionalString(body, 'mode'),
        meetingLink: optionalString(body, 'meetingLink'),
        interviewer: optionalString(body, 'interviewer'),
        feedback: optionalString(body, 'feedback'),
        status: body.status === undefined
          ? PlacementInterviewStatus.SCHEDULED
          : enumValue(body.status, interviewStatuses, 'status'),
        outcome: body.outcome === undefined
          ? PlacementInterviewOutcome.PENDING
          : enumValue(body.outcome, interviewOutcomes, 'outcome'),
      },
    });
  }

  async updateInterview(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.placementInterview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Interview not found.');

    const data: Prisma.PlacementInterviewUpdateInput = {};

    if (body.round !== undefined) {
      const round = Number(body.round);
      if (!Number.isInteger(round) || round < 1) {
        throw new BadRequestException('round must be a positive integer.');
      }
      data.round = round;
    }

    const title = optionalString(body, 'title');
    if (title !== undefined) data.title = title;

    const mode = optionalString(body, 'mode');
    if (mode !== undefined) data.mode = mode;

    const meetingLink = optionalString(body, 'meetingLink');
    if (meetingLink !== undefined) data.meetingLink = meetingLink;

    const interviewer = optionalString(body, 'interviewer');
    if (interviewer !== undefined) data.interviewer = interviewer;

    const feedback = optionalString(body, 'feedback');
    if (feedback !== undefined) data.feedback = feedback;

    const scheduledAt = optionalDate(body, 'scheduledAt');
    if (scheduledAt !== undefined) {
      if (!scheduledAt) throw new BadRequestException('scheduledAt cannot be null.');
      data.scheduledAt = scheduledAt;
    }

    if (body.durationMins !== undefined) {
      const duration = body.durationMins === null ? null : Number(body.durationMins);
      if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
        throw new BadRequestException('durationMins must be an integer between 1 and 1440.');
      }
      data.durationMins = duration;
    }

    if (body.status !== undefined) {
      data.status = enumValue(body.status, interviewStatuses, 'status');
    }
    if (body.outcome !== undefined) {
      data.outcome = enumValue(body.outcome, interviewOutcomes, 'outcome');
    }

    return this.prisma.placementInterview.update({ where: { id }, data });
  }

  async createOffer(applicationId: string, body: Record<string, unknown>) {
    await this.ensureApplication(applicationId);
    const existing = await this.prisma.placementOffer.findUnique({ where: { applicationId } });
    if (existing) throw new BadRequestException('An offer already exists for this application.');

    const compensation = body.compensation === undefined || body.compensation === null
      ? null
      : Number(body.compensation);
    if (compensation !== null && (!Number.isFinite(compensation) || compensation < 0)) {
      throw new BadRequestException('compensation must be a non-negative number.');
    }

    return this.prisma.placementOffer.create({
      data: {
        application: { connect: { id: applicationId } },
        status: body.status === undefined
          ? PlacementOfferStatus.PENDING
          : enumValue(body.status, offerStatuses, 'status'),
        compensation,
        currency: optionalString(body, 'currency') ?? 'INR',
        offeredAt: optionalDate(body, 'offeredAt'),
        expiresAt: optionalDate(body, 'expiresAt'),
        joiningDate: optionalDate(body, 'joiningDate'),
        notes: optionalString(body, 'notes'),
      },
    });
  }

  async updateOffer(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.placementOffer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Offer not found.');

    const data: Prisma.PlacementOfferUpdateInput = {};
    if (body.status !== undefined) {
      data.status = enumValue(body.status, offerStatuses, 'status');
    }

    const currency = optionalString(body, 'currency');
    if (currency !== undefined) {
      if (!currency) throw new BadRequestException('currency cannot be empty.');
      data.currency = currency;
    }

    const notes = optionalString(body, 'notes');
    if (notes !== undefined) data.notes = notes;

    const offeredAt = optionalDate(body, 'offeredAt');
    if (offeredAt !== undefined) data.offeredAt = offeredAt;

    const expiresAt = optionalDate(body, 'expiresAt');
    if (expiresAt !== undefined) data.expiresAt = expiresAt;

    const joiningDate = optionalDate(body, 'joiningDate');
    if (joiningDate !== undefined) data.joiningDate = joiningDate;

    if (body.compensation !== undefined) {
      const value = body.compensation === null ? null : Number(body.compensation);
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        throw new BadRequestException('compensation must be a non-negative number.');
      }
      data.compensation = value;
    }

    return this.prisma.placementOffer.update({ where: { id }, data });
  }

  private async ensureApplication(id: string): Promise<void> {
    const found = await this.prisma.placementApplication.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Placement application not found.');
  }


  /**
   * Builds an evidence-based readiness summary.
   * This is a checklist, not an automated placement approval.
   */
  private async buildReadinessSummary(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        assessments: {
          where: {
            type: AssessmentType.TECHNICAL,
            status: { in: [AssessmentStatus.COMPLETED, AssessmentStatus.REVIEWED] },
          },
          orderBy: { updatedAt: 'desc' },
        },
        expertMockInterviews: {
          orderBy: { sequence: 'asc' },
        },
        projectReviews: {
          orderBy: { updatedAt: 'desc' },
        },
        readinessReview: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    const failedInterviews = await this.prisma.placementInterview.findMany({
      where: {
        outcome: PlacementInterviewOutcome.FAILED,
        application: { candidateId },
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        round: true,
        title: true,
        scheduledAt: true,
        feedback: true,
        application: { select: { companyName: true, jobTitle: true } },
      },
    });

    const completedMocks = candidate.expertMockInterviews.filter(
      (mock) => mock.status === ExpertMockInterviewStatus.COMPLETED,
    );
    const finalMock = completedMocks.find((mock) => mock.isFinal);
    const approvedProjects = candidate.projectReviews.filter(
      (project) =>
        project.status === CandidateProjectStatus.APPROVED &&
        project.expertApproved,
    );

    const formalInteractiveAssessment = candidate.assessments.find(
      (assessment) => {
        const responses = assessment.responses;
        return (
          typeof responses === 'object' &&
          responses !== null &&
          !Array.isArray(responses) &&
          responses.rubricVersion === 'interactive-fullstack-v1'
        );
      },
    );
    const technicalAssessmentPassed =
      !!formalInteractiveAssessment &&
      formalInteractiveAssessment.score !== null &&
      formalInteractiveAssessment.maxScore > 0 &&
      formalInteractiveAssessment.score /
        formalInteractiveAssessment.maxScore >= 0.8;

    const checks = {
      expertMocks: {
        complete: completedMocks.length >= 3,
        completedCount: completedMocks.length,
        requiredCount: 3,
      },
      finalExpertMock: {
        complete:
          !!finalMock &&
          finalMock.score !== null &&
          finalMock.maxScore > 0 &&
          finalMock.score / finalMock.maxScore >= 0.8,
        score: finalMock?.score ?? null,
        maxScore: finalMock?.maxScore ?? null,
        requiredScore: 8,
      },
      expertApprovedProject: {
        complete: approvedProjects.length > 0,
        approvedCount: approvedProjects.length,
      },
      technicalAssessment: {
        complete: technicalAssessmentPassed,
        score: formalInteractiveAssessment?.score ?? null,
        maxScore: formalInteractiveAssessment?.maxScore ?? null,
        evidenceType: formalInteractiveAssessment
          ? 'FORMAL_INTERACTIVE_ASSESSMENT'
          : 'LEGACY_TECHNICAL_ASSESSMENT',
        formalInteractiveAssessmentVerified:
          !!formalInteractiveAssessment,
      },
    };

    const allEvidenceComplete = Object.values(checks).every(
      (check) => check.complete,
    );

    const profileFields = [
      { key: 'fullName', label: 'Full name', complete: Boolean(candidate.fullName?.trim()) },
      { key: 'email', label: 'Email', complete: Boolean(candidate.email?.trim()) },
      { key: 'phone', label: 'Phone', complete: Boolean(candidate.phone?.trim()) },
      { key: 'education', label: 'Education', complete: Boolean(candidate.education?.trim()) },
      { key: 'graduationYear', label: 'Graduation year', complete: candidate.graduationYear != null },
      { key: 'skills', label: 'Skills', complete: (candidate.skills ?? []).length > 0 },
      { key: 'targetRole', label: 'Target role', complete: Boolean(candidate.targetRole?.trim()) },
      { key: 'resumeUrl', label: 'Resume', complete: Boolean(candidate.resumeUrl?.trim()) },
      { key: 'learningAvailability', label: 'Learning availability', complete: Boolean(candidate.learningAvailability?.trim()) },
      { key: 'preferredSchedule', label: 'Preferred schedule', complete: Boolean(candidate.preferredSchedule?.trim()) },
      { key: 'courseInterest', label: 'Course interest', complete: Boolean(candidate.courseInterest?.trim()) },
    ];
    const completedProfileFields = profileFields.filter((field) => field.complete).length;
    const profileCompleteness = {
      percentage: Math.round((completedProfileFields / profileFields.length) * 100),
      completedFields: completedProfileFields,
      totalFields: profileFields.length,
      missingFields: profileFields
        .filter((field) => !field.complete)
        .map((field) => field.label),
    };

    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      profileCompleteness,
      checks,
      allEvidenceComplete,
      decision: candidate.readinessReview?.decision ?? PlacementReadinessDecision.PENDING,
      review: candidate.readinessReview,
      expertMockInterviews: candidate.expertMockInterviews,
      projectReviews: candidate.projectReviews,
      technicalAssessments: candidate.assessments,
      recovery: {
        threshold: RECOVERY_THRESHOLD,
        failedInterviewCount: failedInterviews.length,
        recoveryNeeded: failedInterviews.length >= RECOVERY_THRESHOLD,
        failedInterviews: failedInterviews.map((interview) => ({
          id: interview.id,
          companyName: interview.application.companyName,
          jobTitle: interview.application.jobTitle,
          round: interview.round,
          title: interview.title,
          scheduledAt: interview.scheduledAt,
          feedback: interview.feedback,
        })),
      },
      approvalRequiresHumanReview: true,
    };
  }

  /**
   * The learner's own checklist. It exposes counts, scores and the human
   * decision status only: no reviewer names, notes, feedback or contact
   * details. It is a checklist, never an approval.
   */
  async getStudentReadiness(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!candidate) {
      return { profileComplete: false as const };
    }

    const summary = await this.buildReadinessSummary(candidate.id);
    const { checks } = summary;

    return {
      profileComplete:
        summary.profileCompleteness.missingFields.length === 0,
      checks: {
        expertMocks: {
          complete: checks.expertMocks.complete,
          completedCount: checks.expertMocks.completedCount,
          requiredCount: checks.expertMocks.requiredCount,
        },
        finalExpertMock: {
          complete: checks.finalExpertMock.complete,
          score: checks.finalExpertMock.score,
          maxScore: checks.finalExpertMock.maxScore,
          requiredScore: checks.finalExpertMock.requiredScore,
        },
        expertApprovedProject: {
          complete: checks.expertApprovedProject.complete,
          approvedCount: checks.expertApprovedProject.approvedCount,
        },
        technicalAssessment: {
          complete: checks.technicalAssessment.complete,
          score: checks.technicalAssessment.score,
          maxScore: checks.technicalAssessment.maxScore,
        },
      },
      allEvidenceComplete: summary.allEvidenceComplete,
      decision: summary.decision,
      approvalRequiresHumanReview: true as const,
    };
  }

  async getReadinessCandidates() {
    const candidates = await this.prisma.candidate.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const results = await Promise.all(
      candidates.map((candidate) => this.buildReadinessSummary(candidate.id)),
    );

    return {
      items: results,
      total: results.length,
    };
  }

  async getCandidateReadiness(candidateId: string) {
    return this.buildReadinessSummary(candidateId);
  }

  async reviewCandidateReadiness(
    candidateId: string,
    body: Record<string, unknown>,
    reviewerUserId: string,
  ) {
    const summary = await this.buildReadinessSummary(candidateId);

    const decision = enumValue(
      body.decision,
      Object.values(PlacementReadinessDecision),
      'decision',
    );

    const notes = optionalString(body, 'notes');

    if (decision === PlacementReadinessDecision.APPROVED &&
        !summary.allEvidenceComplete) {
      throw new BadRequestException(
        'Candidate does not meet all recorded readiness evidence requirements.',
      );
    }

    const review = await this.prisma.placementReadinessReview.upsert({
      where: { candidateId },
      create: {
        candidate: { connect: { id: candidateId } },
        decision,
        approvedByUserId: reviewerUserId,
        notes,
        reviewedAt: new Date(),
      },
      update: {
        decision,
        approvedByUserId: reviewerUserId,
        notes,
        reviewedAt: new Date(),
      },
    });

    return {
      candidateId,
      review,
      allEvidenceComplete: summary.allEvidenceComplete,
    };
  }


  // --- Expert mock interviews -------------------------------------------

  async listCandidateMocks(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    return this.prisma.expertMockInterview.findMany({
      where: { candidateId },
      orderBy: { sequence: 'asc' },
    });
  }

  async scheduleMockInterview(
    candidateId: string,
    body: Record<string, unknown>,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    const isFinal = body.isFinal === true;

    const last = await this.prisma.expertMockInterview.findFirst({
      where: { candidateId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const sequence =
      typeof body.sequence === 'number'
        ? body.sequence
        : (last?.sequence ?? 0) + 1;

    const existing = await this.prisma.expertMockInterview.findFirst({
      where: { candidateId, sequence },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `A mock interview with sequence ${sequence} already exists for this candidate.`,
      );
    }

    if (isFinal) {
      const existingFinal = await this.prisma.expertMockInterview.findFirst({
        where: { candidateId, isFinal: true },
        select: { id: true },
      });

      if (existingFinal) {
        throw new ConflictException(
          'This candidate already has a final mock interview.',
        );
      }
    }

    return this.prisma.expertMockInterview.create({
      data: {
        candidateId,
        sequence,
        isFinal,
        status: 'SCHEDULED',
        maxScore: typeof body.maxScore === 'number' ? body.maxScore : 10,
        reviewerName:
          typeof body.reviewerName === 'string' ? body.reviewerName.trim() : null,
        scheduledAt:
          typeof body.scheduledAt === 'string'
            ? new Date(body.scheduledAt)
            : null,
      },
    });
  }

  async recordMockInterviewOutcome(
    id: string,
    body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.expertMockInterview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Mock interview not found.');
    }

    const status =
      body.status === undefined
        ? null
        : enumValue(
            body.status,
            Object.values(ExpertMockInterviewStatus),
            'status',
          );

    const data: Record<string, unknown> = {};

    if (status) {
      data.status = status;

      if (status === ExpertMockInterviewStatus.COMPLETED) {
        data.completedAt = new Date();
      }
    }

    if (body.score !== undefined) {
      if (body.score !== null && typeof body.score !== 'number') {
        throw new BadRequestException('score must be a number.');
      }

      if (
        typeof body.score === 'number' &&
        (body.score < 0 || body.score > existing.maxScore)
      ) {
        throw new BadRequestException(
          `score must be between 0 and ${existing.maxScore}.`,
        );
      }

      data.score = body.score;
    }

    if (typeof body.feedback === 'string') {
      data.feedback = body.feedback.trim() || null;
    }

    if (typeof body.reviewerName === 'string') {
      data.reviewerName = body.reviewerName.trim() || null;
    }

    if (
      data.status === ExpertMockInterviewStatus.COMPLETED &&
      data.score === undefined &&
      existing.score === null
    ) {
      throw new BadRequestException(
        'A completed mock interview needs a score.',
      );
    }

    return this.prisma.expertMockInterview.update({
      where: { id },
      data,
    });
  }
}
