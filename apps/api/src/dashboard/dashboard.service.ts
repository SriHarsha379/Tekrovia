import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardOverview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true }
    });

    const enrolledCount = await this.prisma.enrollment.count({
      where: { userId }
    });

    const assessmentCount = await this.prisma.assessment.count({
      where: { candidateId: user?.candidate?.id }
    });

    const completedCount = await this.prisma.assessment.count({
      where: {
        candidateId: user?.candidate?.id,
        status: 'COMPLETED'
      }
    });

    return {
      user: {
        name: user?.name ?? null,
        email: user?.email ?? null,
        phone: user?.phone ?? null,
        avatar: null
      },
      stats: {
        coursesEnrolled: enrolledCount,
        assessmentsTaken: assessmentCount,
        assessmentsCompleted: completedCount,
        currentStreak: 5
      }
    };
  }

  async getEnrolledCourses(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            progress: true
          }
        }
      },
      take: 5
    });
  }

  async getProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId }
    });

    return enrollments.map(e => ({
      courseId: e.courseId,
      progress: 45,
      status: 'In Progress',
      lastAccessed: e.updatedAt
    }));
  }

  async getAssessments(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true }
    });

    return this.prisma.assessment.findMany({
      where: { candidateId: user?.candidate?.id },
      select: {
        id: true,
        title: true,
        type: true,
        score: true,
        status: true,
        completedAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidate: true }
    });

    const assessments = await this.prisma.assessment.findMany({
      where: { candidateId: user?.candidate?.id }
    });

    const avgScore = assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length)
      : 0;

    return {
      totalLearningHours: 24,
      averageScore: avgScore,
      completionRate: 65,
      readinessScore: avgScore
    };
  }
}
