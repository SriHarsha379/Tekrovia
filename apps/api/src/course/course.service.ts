import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

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
            videoUrl: true,
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
      await this.prisma.enrollment.updateMany({
        where: {
          userId,
          courseId: lesson.module.courseId,
          status: 'ACTIVE',
        },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return { ...progress, courseProgress: { completed, total } };
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
          })),
        })),
      };
    });
  }
}
