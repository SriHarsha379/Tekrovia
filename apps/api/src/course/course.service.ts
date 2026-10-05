import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { AdminUpdateLessonDto } from './dto/admin-lesson.dto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly courseInclude = {
    modules: {
      orderBy: { sortOrder: 'asc' as const },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' as const },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            sortOrder: true,
          },
        },
      },
    },
  };

  private toCourseResponse(course: any) {
    return {
      id: course.id,
      title: course.title,
      category: course.category,
      description: course.description,
      duration: course.duration,
      level: course.level,
      price: course.price,
      learningOutcomes: course.learningOutcomes,
      curriculum: (course.modules ?? []).map((module: any) => ({
        module: module.title,
        topics: module.lessons.map((lesson: any) => lesson.title),
      })),
      modules: course.modules ?? [],
    };
  }

  async findAll(filters: { category?: string; level?: string }) {
    const level = filters.level?.toLowerCase();
    if (
      level &&
      !['beginner', 'intermediate', 'advanced'].includes(level)
    ) {
      throw new BadRequestException('Invalid course level.');
    }

    const courses = await this.prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        ...(filters.category
          ? {
              category: {
                equals: filters.category,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(level ? { level: level as any } : {}),
      },
      include: this.courseInclude,
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => this.toCourseResponse(course));
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: this.courseInclude,
    });

    if (!course) {
      throw new NotFoundException('Published course not found.');
    }

    return this.toCourseResponse(course);
  }

  async create(dto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title.trim(),
        category: dto.category?.trim() || 'General',
        description: dto.description.trim(),
        duration: dto.duration.trim(),
        level: dto.level,
        price: dto.price ?? 0,
        learningOutcomes: dto.learningOutcomes ?? [],
        status: 'PUBLISHED',
        modules: {
          create: (dto.curriculum ?? []).map((module, moduleIndex) => ({
            title: module.module.trim(),
            sortOrder: moduleIndex,
            lessons: {
              create: module.topics.map((topic, topicIndex) => ({
                title: topic.trim(),
                sortOrder: topicIndex,
                isPublished: true,
              })),
            },
          })),
        },
      },
      include: this.courseInclude,
    });

    return this.toCourseResponse(course);
  }

      private readonly adminCourseInclude = {
    modules: {
      orderBy: { sortOrder: 'asc' as const },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' as const },
          include: { assignment: true },
        },
      },
    },
  };

  async adminFindAll() {
    const courses = await this.prisma.course.findMany({
      include: {
        ...this.adminCourseInclude,
        _count: { select: { enrollments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return courses.map((course) => ({
      ...this.toCourseResponse(course),
      status: course.status,
      enrollmentCount: course._count.enrollments,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
  }

  async adminCreate(
    dto: CreateCourseDto,
    status: 'DRAFT' | 'PUBLISHED' = 'DRAFT',
  ) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title.trim(),
        category: dto.category?.trim() || 'General',
        description: dto.description.trim(),
        duration: dto.duration.trim(),
        level: dto.level,
        price: dto.price ?? 0,
        learningOutcomes: dto.learningOutcomes ?? [],
        status,
        modules: {
          create: (dto.curriculum ?? []).map((module, moduleIndex) => ({
            title: module.module.trim(),
            sortOrder: moduleIndex,
            lessons: {
              create: module.topics.map((topic, topicIndex) => ({
                title: topic.trim(),
                sortOrder: topicIndex,
                isPublished: status === 'PUBLISHED',
              })),
            },
          })),
        },
      },
      include: this.adminCourseInclude,
    });

    return {
      ...this.toCourseResponse(course),
      status: course.status,
      enrollmentCount: 0,
    };
  }

  async adminUpdate(id: string, dto: Partial<CreateCourseDto>) {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Course not found.');
    }

    if (dto.curriculum !== undefined && existing._count.enrollments > 0) {
      throw new BadRequestException(
        'Curriculum cannot be replaced after learners have enrolled.',
      );
    }

    if (dto.curriculum !== undefined) {
      const assignmentCount = await this.prisma.assignment.count({
        where: { lesson: { module: { courseId: id } } },
      });
      if (assignmentCount > 0) {
        throw new BadRequestException(
          'Curriculum cannot be replaced after assignments have been added.',
        );
      }
      const projectCount = await this.prisma.project.count({
        where: { courseId: id },
      });
      if (projectCount > 0) {
        throw new BadRequestException(
          'Curriculum cannot be replaced after projects have been added.',
        );
      }
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.duration !== undefined && { duration: dto.duration.trim() }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.learningOutcomes !== undefined && {
          learningOutcomes: dto.learningOutcomes,
        }),
        ...(dto.curriculum !== undefined && {
          modules: {
            deleteMany: {},
            create: dto.curriculum.map((module, moduleIndex) => ({
              title: module.module.trim(),
              sortOrder: moduleIndex,
              lessons: {
                create: module.topics.map((topic, topicIndex) => ({
                  title: topic.trim(),
                  sortOrder: topicIndex,
                  isPublished: existing.status === 'PUBLISHED',
                })),
              },
            })),
          },
        }),
      },
      include: this.adminCourseInclude,
    });

    return {
      ...this.toCourseResponse(course),
      status: course.status,
      enrollmentCount: existing._count.enrollments,
    };
  }

  async adminUpdateLesson(lessonId: string, dto: AdminUpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Lesson not found.');
    }

    const text = (value: string | null | undefined) =>
      value === null || value === undefined ? null : value.trim() || null;

    // Updated in place so the lesson id, ordering, publish state and
    // learner progress are never touched.
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: text(dto.description),
        }),
        ...(dto.content !== undefined && { content: text(dto.content) }),
        ...(dto.videoUrl !== undefined && { videoUrl: text(dto.videoUrl) }),
        ...(dto.duration !== undefined && { duration: text(dto.duration) }),
      },
      select: {
        id: true,
        moduleId: true,
        title: true,
        description: true,
        content: true,
        videoUrl: true,
        duration: true,
        sortOrder: true,
        isPublished: true,
      },
    });
  }

  async adminPublish(id: string) {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Course not found.');
    }
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException(
        'Archived courses cannot be published.',
      );
    }
    if (
      existing.modules.length === 0 ||
      existing.modules.some((module) => module.lessons.length === 0)
    ) {
      throw new BadRequestException(
        'Add at least one module and one lesson per module before publishing.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.course.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      }),
      this.prisma.lesson.updateMany({
        where: { module: { courseId: id } },
        data: { isPublished: true },
      }),
    ]);

    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id },
      include: this.adminCourseInclude,
    });

    return {
      ...this.toCourseResponse(course),
      status: course.status,
    };
  }

  async adminArchive(id: string) {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Course not found.');
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return {
      id: course.id,
      title: course.title,
      status: course.status,
    };
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: 'PUBLISHED' },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Published course not found.');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      if (existing.status === 'CANCELLED') {
        return this.prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', enrolledAt: new Date() },
          include: { course: { select: { id: true, title: true } } },
        });
      }
      throw new ConflictException('You are already enrolled in this course.');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        candidateId: candidate?.id,
      },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async myEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          include: this.courseInclude,
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
        module: {
          course: {
            status: 'PUBLISHED',
            enrollments: {
              some: { userId, status: 'ACTIVE' },
            },
          },
        },
      },
      select: { id: true, module: { select: { courseId: true } } },
    });

    if (!lesson) {
      throw new NotFoundException(
        'Published lesson or active course enrollment not found.',
      );
    }

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    const [total, completed] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          isPublished: true,
          module: { courseId: lesson.module.courseId },
        },
      }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          isCompleted: true,
          lesson: {
            isPublished: true,
            module: { courseId: lesson.module.courseId },
          },
        },
      }),
    ]);

    if (total > 0 && completed >= total) {
      await this.completeEnrollmentIfEligible(userId, lesson.module.courseId);
    }

    return { ...progress, courseProgress: { completed, total } };
  }

  /**
   * Marks an ACTIVE enrollment COMPLETED only when every published lesson is
   * complete AND every required assignment has an approved submission.
   * Courses without required assignments follow the original lessons-only rule.
   */
  async completeEnrollmentIfEligible(
    userId: string,
    courseId: string,
  ): Promise<boolean> {
    const [totalLessons, completedLessons, requiredAssignments] =
      await Promise.all([
        this.prisma.lesson.count({
          where: { isPublished: true, module: { courseId } },
        }),
        this.prisma.lessonProgress.count({
          where: {
            userId,
            isCompleted: true,
            lesson: { isPublished: true, module: { courseId } },
          },
        }),
        this.prisma.assignment.findMany({
          where: {
            isRequired: true,
            lesson: { isPublished: true, module: { courseId } },
          },
          select: { id: true },
        }),
      ]);

    if (totalLessons === 0 || completedLessons < totalLessons) {
      return false;
    }

    if (requiredAssignments.length > 0) {
      const approved = await this.prisma.assignmentSubmission.findMany({
        where: {
          userId,
          status: 'APPROVED',
          assignmentId: { in: requiredAssignments.map((item) => item.id) },
        },
        select: { assignmentId: true },
        distinct: ['assignmentId'],
      });

      if (approved.length < requiredAssignments.length) {
        return false;
      }
    }

    const result = await this.prisma.enrollment.updateMany({
      where: { userId, courseId, status: 'ACTIVE' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return result.count > 0;
  }

  async myProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    progress: {
                      where: { userId },
                      select: { isCompleted: true, completedAt: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap(
        (module) => module.lessons,
      );
      const completed = lessons.filter((lesson) =>
        lesson.progress.some((item) => item.isCompleted),
      ).length;

      // Lesson content and video are only released to learners whose
      // enrollment has not been cancelled.
      const hasAccess = enrollment.status !== 'CANCELLED';

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        completedLessons: completed,
        totalLessons: lessons.length,
        progressPercent:
          lessons.length === 0
            ? 0
            : Math.round((completed / lessons.length) * 100),
        modules: enrollment.course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            completed: lesson.progress.some((item) => item.isCompleted),
            ...(hasAccess
              ? {
                  content: lesson.content ?? null,
                  videoUrl: lesson.videoUrl ?? null,
                }
              : {}),
          })),
        })),
      };
    });
  }
}
