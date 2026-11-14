import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityStatus, EnrollmentStatus, SubmissionStatus } from '@prisma/client';
import { UpdateActivityDto, SubmitAssignmentDto, SubmitProjectDto } from './dto/lms.dto';

@Injectable()
export class LmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourseStructure(candidateId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        product: true,
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        candidateId,
        productId: course.productId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
      },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course.');

    const activities = await this.prisma.activity.findMany({
      where: { candidateId, lesson: { module: { courseId } } },
      select: { lessonId: true, status: true, score: true, completedAt: true },
    });

    const activityMap = new Map(activities.map((a) => [a.lessonId, a]));

    return {
      ...course,
      modules: course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => ({
          ...lesson,
          activity: activityMap.get(lesson.id) ?? { status: ActivityStatus.NOT_STARTED, score: null },
        })),
        progress: {
          total: mod.lessons.length,
          completed: mod.lessons.filter(
            (l) => activityMap.get(l.id)?.status === ActivityStatus.COMPLETED,
          ).length,
        },
      })),
    };
  }

  async getMyCourses(candidateId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        candidateId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED, EnrollmentStatus.COMPLETED] },
      },
      include: {
        product: {
          include: {
            courses: {
              include: {
                modules: {
                  select: { id: true, title: true, orderIndex: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    return enrollments.map((e) => ({
      enrollmentId: e.id,
      status: e.status,
      product: e.product,
    }));
  }

  async updateActivity(candidateId: string, lessonId: string, dto: UpdateActivityDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: { include: { product: true } } },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        candidateId,
        productId: lesson.module.course.productId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
      },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course.');

    const isCompleted = dto.status === ActivityStatus.COMPLETED;

    return this.prisma.activity.upsert({
      where: { candidateId_lessonId: { candidateId, lessonId } },
      update: {
        status: dto.status,
        score: dto.score,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        candidateId,
        lessonId,
        status: dto.status,
        score: dto.score,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });
  }

  async submitAssignment(candidateId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: { include: { course: { select: { productId: true } } } },
          },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found.');

    if (assignment.lesson) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          candidateId,
          productId: assignment.lesson.module.course.productId,
          status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
        },
      });
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course.');
    }

    // Atomic upsert — eliminates findFirst→create race condition
    return this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_candidateId: { assignmentId, candidateId } },
      update: {
        submissionUrl: dto.submissionUrl,
        status: SubmissionStatus.SUBMITTED,
        reviewedAt: null,
      },
      create: {
        assignmentId,
        candidateId,
        submissionUrl: dto.submissionUrl,
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  async submitProject(candidateId: string, projectId: string, dto: SubmitProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { course: { select: { productId: true } } },
    });
    if (!project) throw new NotFoundException('Project not found.');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        candidateId,
        productId: project.course.productId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED] },
      },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course.');

    const existing = await this.prisma.projectSubmission.findFirst({
      where: { candidateId, projectId, status: SubmissionStatus.MENTOR_APPROVED },
    });
    if (existing) throw new BadRequestException('Project already approved — resubmission not allowed.');

    return this.prisma.projectSubmission.create({
      data: {
        projectId,
        candidateId,
        submissionUrl: dto.submissionUrl,
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  async getProjectSubmissions(projectId: string, page = 1) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.projectSubmission.findMany({
        where: { projectId },
        skip,
        take,
        include: {
          candidate: { select: { candidateCode: true, fullName: true } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.projectSubmission.count({ where: { projectId } }),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }

  async reviewProject(
    submissionId: string,
    reviewerId: string,
    status: SubmissionStatus,
    feedback: string,
  ) {
    const sub = await this.prisma.projectSubmission.findUnique({ where: { id: submissionId } });
    if (!sub) throw new NotFoundException('Submission not found.');
    if (sub.status === SubmissionStatus.MENTOR_APPROVED) {
      throw new BadRequestException('Submission already approved.');
    }
    return this.prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        mentorId: reviewerId,
        mentorFeedback: feedback,
        reviewedAt: new Date(),
      },
    });
  }
}
