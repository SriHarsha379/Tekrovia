import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    isVerified: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async getOverview() {
    const [
      totalStudents,
      totalCandidates,
      totalLeads,
      totalAssessments,
      completedAssessments,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      activeLearners,
      assignmentsAwaitingReview,
      projectSubmissionsAwaitingReview,
      assignmentsApproved,
      projectMilestonesApproved,
      recentCandidates,
      leadStatuses,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.candidate.count(),
      this.prisma.lead.count(),
      this.prisma.assessment.count(),
      this.prisma.assessment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.user.count({
        where: { enrollments: { some: { status: 'ACTIVE' } } },
      }),
      this.prisma.assignmentSubmission.count({
        where: { status: 'SUBMITTED' },
      }),
      this.prisma.projectSubmission.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.assignmentSubmission.count({
        where: { status: 'APPROVED' },
      }),
      this.prisma.projectSubmission.count({ where: { status: 'APPROVED' } }),
      this.prisma.candidate.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          candidateCode: true,
          fullName: true,
          email: true,
          status: true,
          classification: true,
          createdAt: true,
          user: { select: this.safeUserSelect },
        },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return {
      counts: {
        totalStudents,
        totalCandidates,
        totalLeads,
        totalAssessments,
        completedAssessments,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeEnrollments,
      },
      leadStatuses: leadStatuses.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      delivery: {
        activeLearners,
        completedEnrollments,
        completionRate:
          completedEnrollments + activeEnrollments > 0
            ? Math.round(
                (completedEnrollments /
                  (completedEnrollments + activeEnrollments)) *
                  100,
              )
            : null,
        assignmentsAwaitingReview,
        projectSubmissionsAwaitingReview,
        assignmentsApproved,
        projectMilestonesApproved,
      },
      recentCandidates,
    };
  }

  async getStudents(query: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(query.limit ?? '10', 10) || 10),
    );
    const search = query.search?.trim();
    const status = query.status?.trim();

    const where = {
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              {
                candidateCode: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                targetRole: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, candidates] = await Promise.all([
      this.prisma.candidate.count({ where }),
      this.prisma.candidate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          candidateCode: true,
          fullName: true,
          email: true,
          phone: true,
          education: true,
          graduationYear: true,
          experienceYears: true,
          targetRole: true,
          courseInterest: true,
          status: true,
          classification: true,
          createdAt: true,
          updatedAt: true,
          user: { select: this.safeUserSelect },
          _count: {
            select: {
              assessments: true,
              enrollments: true,
            },
          },
        },
      }),
    ]);

    return {
      data: candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudent(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        candidateCode: true,
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        education: true,
        graduationYear: true,
        experienceYears: true,
        currentEmployment: true,
        skills: true,
        previousTraining: true,
        careerGapMonths: true,
        targetRole: true,
        codingPreference: true,
        resumeUrl: true,
        learningAvailability: true,
        preferredSchedule: true,
        courseInterest: true,
        campaignSource: true,
        consentGiven: true,
        communicationPrefs: true,
        status: true,
        classification: true,
        createdAt: true,
        updatedAt: true,
        user: { select: this.safeUserSelect },
        assessments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            score: true,
            maxScore: true,
            classification: true,
            status: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
        registrations: {
          select: {
            id: true,
            courseInterest: true,
            targetRole: true,
            createdAt: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Student profile not found.');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: candidate.userId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            status: true,
            modules: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                sortOrder: true,
                lessons: {
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    duration: true,
                    sortOrder: true,
                    isPublished: true,
                    progress: {
                      where: { userId: candidate.userId },
                      select: {
                        isCompleted: true,
                        completedAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      ...candidate,
      enrollments,
    };
  }
}
