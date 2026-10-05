import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentSubmissionStatus } from '@prisma/client';
import { CourseService } from '../course/course.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewSubmissionDto,
  SubmitAssignmentDto,
  UpsertAssignmentDto,
} from './dto/assignment.dto';

const REVIEW_STATUSES: AssignmentSubmissionStatus[] = [
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
export class AssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
  ) {}

  async upsertForLesson(lessonId: string, dto: UpsertAssignmentDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    const title = dto.title.trim();
    const instructions = dto.instructions.trim();

    return this.prisma.assignment.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title,
        instructions,
        isRequired: dto.isRequired ?? true,
      },
      update: {
        title,
        instructions,
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
      },
    });
  }

  async listMine(userId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        lesson: {
          isPublished: true,
          module: {
            course: {
              status: 'PUBLISHED',
              enrollments: {
                some: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
              },
            },
          },
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                courseId: true,
                course: { select: { title: true } },
              },
            },
          },
        },
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
            reviewedAt: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      isRequired: assignment.isRequired,
      lesson: { id: assignment.lesson.id, title: assignment.lesson.title },
      module: {
        id: assignment.lesson.module.id,
        title: assignment.lesson.module.title,
      },
      course: {
        id: assignment.lesson.module.courseId,
        title: assignment.lesson.module.course.title,
      },
      submissions: assignment.submissions,
      latestStatus:
        assignment.submissions[assignment.submissions.length - 1]?.status ??
        null,
    }));
  }

  async submit(userId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        lesson: {
          isPublished: true,
          module: {
            course: {
              status: 'PUBLISHED',
              enrollments: { some: { userId, status: 'ACTIVE' } },
            },
          },
        },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new NotFoundException(
        'Assignment not found, or you are not actively enrolled in its course.',
      );
    }

    const latest = await this.prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId },
      orderBy: { attemptNumber: 'desc' },
      select: { attemptNumber: true, status: true },
    });

    if (latest?.status === 'SUBMITTED') {
      throw new ConflictException(
        'Your latest submission is still awaiting review.',
      );
    }
    if (latest?.status === 'APPROVED') {
      throw new ConflictException('This assignment has already been approved.');
    }

    try {
      return await this.prisma.assignmentSubmission.create({
        data: {
          assignmentId,
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
          'A submission was just recorded for this assignment. Refresh and try again.',
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
    if (!REVIEW_STATUSES.includes(status as AssignmentSubmissionStatus)) {
      throw new BadRequestException('Invalid status filter.');
    }

    const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(filters.limit ?? '20', 10) || 20),
    );
    const where = { status: status as AssignmentSubmissionStatus };

    const [items, total] = await Promise.all([
      this.prisma.assignmentSubmission.findMany({
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
          submittedAt: true,
          reviewedAt: true,
          user: { select: { id: true, name: true, email: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              lesson: {
                select: {
                  id: true,
                  title: true,
                  module: {
                    select: {
                      title: true,
                      course: { select: { id: true, title: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.assignmentSubmission.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async review(
    reviewerId: string,
    submissionId: string,
    dto: ReviewSubmissionDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        status: true,
        assignment: {
          select: {
            lesson: { select: { module: { select: { courseId: true } } } },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }
    if (submission.userId === reviewerId) {
      throw new ForbiddenException('You cannot review your own submission.');
    }
    if (submission.status !== 'SUBMITTED') {
      throw new ConflictException('This submission has already been reviewed.');
    }

    const feedback = dto.feedback?.trim() || null;

    // Guarded on status so two reviewers can't both decide the same submission.
    const result = await this.prisma.assignmentSubmission.updateMany({
      where: { id: submissionId, status: 'SUBMITTED' },
      data: {
        status: dto.status,
        feedback,
        reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new ConflictException('This submission has already been reviewed.');
    }

    let courseCompleted = false;
    if (dto.status === 'APPROVED') {
      courseCompleted = await this.courseService.completeEnrollmentIfEligible(
        submission.userId,
        submission.assignment.lesson.module.courseId,
      );
    }

    return { id: submissionId, status: dto.status, feedback, courseCompleted };
  }
}
