import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async getCandidateId(userId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { candidate: { select: { id: true } } },
    });

    return user?.candidate?.id;
  }

  async getDashboardOverview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true },
    });

    const candidateId = user?.candidate?.id;

    const [enrolledCount, assessmentCount, completedCount] =
      await Promise.all([
        this.prisma.enrollment.count({ where: { userId } }),
        candidateId
          ? this.prisma.assessment.count({ where: { candidateId } })
          : Promise.resolve(0),
        candidateId
          ? this.prisma.assessment.count({
              where: { candidateId, status: 'COMPLETED' },
            })
          : Promise.resolve(0),
      ]);

    return {
      user: {
        name: user?.name ?? null,
        email: user?.email ?? null,
        phone: user?.phone ?? null,
        avatar: null,
      },
      stats: {
        coursesEnrolled: enrolledCount,
        assessmentsTaken: assessmentCount,
        assessmentsCompleted: completedCount,
        lessonsCompleted: await this.prisma.lessonProgress.count({
          where: { userId, isCompleted: true },
        }),
      },
    };
  }

  async getEnrolledCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
          },
        },
      },
      take: 5,
    });

    return Promise.all(
      enrollments.map(async (enrollment) => ({
        ...enrollment,
        progress: await this.courseProgress(userId, enrollment.courseId),
      })),
    );
  }

  async getProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
    });

    return Promise.all(
      enrollments.map(async (enrollment) => ({
        courseId: enrollment.courseId,
        progress: await this.courseProgress(userId, enrollment.courseId),
        status: enrollment.status,
        lastAccessed: enrollment.updatedAt,
      })),
    );
  }

  private async courseProgress(
    userId: string,
    courseId: string,
  ): Promise<number> {
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: { module: { courseId }, isPublished: true },
      }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          isCompleted: true,
          lesson: { module: { courseId }, isPublished: true },
        },
      }),
    ]);

    if (totalLessons === 0) return 0;

    return Math.round((completedLessons / totalLessons) * 100);
  }

  async getAssessments(userId: string) {
    const candidateId = await this.getCandidateId(userId);

    if (!candidateId) return [];

    return this.prisma.assessment.findMany({
      where: { candidateId },
      select: {
        id: true,
        title: true,
        type: true,
        score: true,
        status: true,
        completedAt: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserStats(userId: string) {
    const candidateId = await this.getCandidateId(userId);

    const assessments = candidateId
      ? await this.prisma.assessment.findMany({
          where: { candidateId, status: 'COMPLETED' },
          select: { score: true },
        })
      : [];

    const scored = assessments.filter(
      (assessment) => typeof assessment.score === 'number',
    );

    const averageScore =
      scored.length > 0
        ? Math.round(
            scored.reduce(
              (sum, assessment) => sum + (assessment.score ?? 0),
              0,
            ) / scored.length,
          )
        : null;

    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          isPublished: true,
          module: { course: { enrollments: { some: { userId } } } },
        },
      }),
      this.prisma.lessonProgress.count({
        where: { userId, isCompleted: true },
      }),
    ]);

    return {
      lessonsCompleted: completedLessons,
      lessonsTotal: totalLessons,
      completionRate:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      averageScore,
    };
  }
}
