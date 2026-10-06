import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectSubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewProjectSubmissionDto,
  SubmitMilestoneDto,
  UpsertProjectDto,
} from './dto/project.dto';

const REVIEW_STATUSES: ProjectSubmissionStatus[] = [
  'SUBMITTED',
  'APPROVED',
  'CHANGES_REQUESTED',
];

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForCourse(courseId: string, dto: UpsertProjectDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    const milestones = dto.milestones.map((milestone, index) => ({
      title: milestone.title.trim(),
      description: milestone.description?.trim() || null,
      dueOffsetDays: milestone.dueOffsetDays ?? null,
      sortOrder: index,
      isFinal: index === dto.milestones.length - 1,
    }));

    const fields = {
      title: dto.title.trim(),
      businessProblem: dto.businessProblem.trim(),
      expectedOutcome: dto.expectedOutcome.trim(),
      resources: dto.resources?.trim() || null,
      ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
    };

    if (!dto.id) {
      const last = await this.prisma.project.findFirst({
        where: { courseId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      return this.prisma.project.create({
        data: {
          courseId,
          ...fields,
          sortOrder: (last?.sortOrder ?? -1) + 1,
          milestones: { create: milestones },
        },
        include: { milestones: { orderBy: { sortOrder: 'asc' } } },
      });
    }

    const existing = await this.prisma.project.findFirst({
      where: { id: dto.id, courseId },
      select: {
        id: true,
        milestones: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            sortOrder: true,
            _count: { select: { submissions: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Project not found in this course.');
    }

    const hasSubmissions = existing.milestones.some(
      (milestone) => milestone._count.submissions > 0,
    );

    if (hasSubmissions) {
      if (milestones.length !== existing.milestones.length) {
        throw new ConflictException(
          'Milestones cannot be added or removed after learners have submitted work.',
        );
      }

      // Text changes only: ids, order and the final milestone stay fixed.
      return this.prisma.$transaction(async (tx) => {
        for (const [index, milestone] of existing.milestones.entries()) {
          await tx.projectMilestone.update({
            where: { id: milestone.id },
            data: {
              title: milestones[index].title,
              description: milestones[index].description,
              dueOffsetDays: milestones[index].dueOffsetDays,
            },
          });
        }

        return tx.project.update({
          where: { id: existing.id },
          data: fields,
          include: { milestones: { orderBy: { sortOrder: 'asc' } } },
        });
      });
    }

    return this.prisma.project.update({
      where: { id: existing.id },
      data: {
        ...fields,
        milestones: { deleteMany: {}, create: milestones },
      },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async listMine(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        course: {
          status: 'PUBLISHED',
          enrollments: {
            some: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
          },
        },
      },
      include: {
        course: { select: { id: true, title: true } },
        milestones: {
          orderBy: { sortOrder: 'asc' },
          include: {
            submissions: {
              where: { userId },
              orderBy: { attemptNumber: 'asc' },
              select: {
                id: true,
                attemptNumber: true,
                submissionText: true,
                submissionUrl: true,
                status: true,
                feedback: true,
                vivaNotes: true,
                reviewedAt: true,
                submittedAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ courseId: 'asc' }, { sortOrder: 'asc' }],
    });

    return projects.map((project) => {
      const milestones = project.milestones.map((milestone, index) => {
        const latest = milestone.submissions[milestone.submissions.length - 1];
        const previousApproved = project.milestones
          .slice(0, index)
          .every((earlier) => {
            const last = earlier.submissions[earlier.submissions.length - 1];
            return last?.status === 'APPROVED';
          });

        return {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          dueOffsetDays: milestone.dueOffsetDays,
          isFinal: milestone.isFinal,
          submissions: milestone.submissions,
          latestStatus: latest?.status ?? null,
          unlocked: previousApproved,
        };
      });

      return {
        id: project.id,
        title: project.title,
        businessProblem: project.businessProblem,
        expectedOutcome: project.expectedOutcome,
        resources: project.resources,
        isRequired: project.isRequired,
        course: project.course,
        milestones,
        approved: milestones.every((item) => item.latestStatus === 'APPROVED'),
      };
    });
  }

  async submit(userId: string, milestoneId: string, dto: SubmitMilestoneDto) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        project: {
          course: {
            status: 'PUBLISHED',
            enrollments: {
                some: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
              },
          },
        },
      },
      select: {
        id: true,
        sortOrder: true,
        projectId: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException(
        'Milestone not found, or you are not actively enrolled in its course.',
      );
    }

    if (milestone.sortOrder > 0) {
      const earlier = await this.prisma.projectMilestone.findMany({
        where: { projectId: milestone.projectId, sortOrder: { lt: milestone.sortOrder } },
        select: {
          submissions: {
            where: { userId },
            orderBy: { attemptNumber: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
      });

      const allApproved = earlier.every(
        (item) => item.submissions[0]?.status === 'APPROVED',
      );

      if (!allApproved) {
        throw new ConflictException(
          'Earlier milestones must be approved before you can submit this one.',
        );
      }
    }

    const latest = await this.prisma.projectSubmission.findFirst({
      where: { milestoneId, userId },
      orderBy: { attemptNumber: 'desc' },
      select: { attemptNumber: true, status: true },
    });

    if (latest?.status === 'SUBMITTED') {
      throw new ConflictException(
        'Your latest submission is still awaiting review.',
      );
    }
    if (latest?.status === 'APPROVED') {
      throw new ConflictException('This milestone has already been approved.');
    }

    try {
      return await this.prisma.projectSubmission.create({
        data: {
          milestoneId,
          userId,
          attemptNumber: (latest?.attemptNumber ?? 0) + 1,
          submissionText: dto.submissionText?.trim() || null,
          submissionUrl: dto.submissionUrl?.trim() || null,
        },
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          submissionText: true,
          submissionUrl: true,
          submittedAt: true,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A submission was just recorded for this milestone. Refresh and try again.',
        );
      }
      throw error;
    }
  }

  async listForReview(filters: {
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const status = (filters.status ?? 'SUBMITTED').toUpperCase();
    if (!REVIEW_STATUSES.includes(status as ProjectSubmissionStatus)) {
      throw new BadRequestException('Invalid status filter.');
    }

    const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(filters.limit ?? '20', 10) || 20),
    );
    const where = { status: status as ProjectSubmissionStatus };

    const [items, total] = await Promise.all([
      this.prisma.projectSubmission.findMany({
        where,
        orderBy: { submittedAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          submissionText: true,
          submissionUrl: true,
          feedback: true,
          vivaNotes: true,
          submittedAt: true,
          reviewedAt: true,
          user: { select: { id: true, name: true, email: true } },
          milestone: {
            select: {
              id: true,
              title: true,
              isFinal: true,
              project: {
                select: {
                  id: true,
                  title: true,
                  course: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.projectSubmission.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async review(
    reviewer: { id: string; name?: string; role: string },
    submissionId: string,
    dto: ReviewProjectSubmissionDto,
  ) {
    const submission = await this.prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        status: true,
        milestone: {
          select: {
            isFinal: true,
            project: { select: { title: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }
    if (submission.userId === reviewer.id) {
      throw new ForbiddenException('You cannot review your own submission.');
    }
    if (
      submission.milestone.isFinal &&
      !['ADMIN', 'SUPER_ADMIN'].includes(reviewer.role)
    ) {
      throw new ForbiddenException(
        'Only an administrator can review the final milestone of a project.',
      );
    }
    if (submission.status !== 'SUBMITTED') {
      throw new ConflictException('This submission has already been reviewed.');
    }

    let candidateId: string | null = null;
    if (dto.status === 'APPROVED' && submission.milestone.isFinal) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId: submission.userId },
        select: { id: true },
      });

      if (!candidate) {
        throw new ConflictException(
          'This learner has no candidate profile yet, so the project cannot be recorded as readiness evidence.',
        );
      }
      candidateId = candidate.id;
    }

    const feedback = dto.feedback?.trim() || null;
    const vivaNotes = dto.vivaNotes?.trim() || null;
    const now = new Date();

    // Guarded on status so two reviewers can't both decide the same submission.
    const result = await this.prisma.projectSubmission.updateMany({
      where: { id: submissionId, status: 'SUBMITTED' },
      data: {
        status: dto.status,
        feedback,
        vivaNotes,
        reviewerId: reviewer.id,
        reviewedAt: now,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('This submission has already been reviewed.');
    }

    let recordedAsReadinessEvidence = false;
    if (candidateId) {
      await this.recordReadinessEvidence({
        candidateId,
        projectName: submission.milestone.project.title,
        reviewerName: reviewer.name ?? null,
        feedback,
        now,
      });
      recordedAsReadinessEvidence = true;
    }

    return {
      id: submissionId,
      status: dto.status,
      feedback,
      recordedAsReadinessEvidence,
    };
  }

  /**
   * Writes the expert-approved project into the evidence the placement
   * readiness gate already reads. It never sets a readiness decision:
   * the human readiness review stays mandatory.
   */
  private async recordReadinessEvidence(input: {
    candidateId: string;
    projectName: string;
    reviewerName: string | null;
    feedback: string | null;
    now: Date;
  }) {
    const existing = await this.prisma.candidateProjectReview.findFirst({
      where: {
        candidateId: input.candidateId,
        projectName: input.projectName,
      },
      select: { id: true },
    });

    const data = {
      status: 'APPROVED' as const,
      expertApproved: true,
      reviewerName: input.reviewerName,
      mentorFeedback: input.feedback,
      reviewedAt: input.now,
    };

    if (existing) {
      await this.prisma.candidateProjectReview.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await this.prisma.candidateProjectReview.create({
      data: {
        candidateId: input.candidateId,
        projectName: input.projectName,
        submittedAt: input.now,
        ...data,
      },
    });
  }
}
