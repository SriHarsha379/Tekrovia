import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

type CountArgs = { where?: Record<string, unknown> };

describe('AdminService.getOverview', () => {
  const prisma = {
    user: { count: jest.fn() },
    candidate: { count: jest.fn(), findMany: jest.fn() },
    lead: { count: jest.fn(), groupBy: jest.fn() },
    assessment: { count: jest.fn() },
    course: { count: jest.fn() },
    enrollment: { count: jest.fn() },
    assignmentSubmission: { count: jest.fn() },
    projectSubmission: { count: jest.fn() },
  };

  let numbers: {
    active: number;
    completed: number;
    activeLearners: number;
  };

  let service: AdminService;

  beforeEach(() => {
    numbers = { active: 5, completed: 3, activeLearners: 4 };

    prisma.user.count.mockImplementation(async (args?: CountArgs) =>
      args?.where?.enrollments ? numbers.activeLearners : 10,
    );
    prisma.candidate.count.mockResolvedValue(9);
    prisma.candidate.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(8);
    prisma.lead.groupBy.mockResolvedValue([]);
    prisma.assessment.count.mockResolvedValue(7);
    prisma.course.count.mockResolvedValue(6);
    prisma.enrollment.count.mockImplementation(async (args?: CountArgs) => {
      if (args?.where?.status === 'ACTIVE') return numbers.active;
      if (args?.where?.status === 'COMPLETED') return numbers.completed;
      return 12;
    });
    prisma.assignmentSubmission.count.mockImplementation(
      async (args?: CountArgs) => (args?.where?.status === 'APPROVED' ? 31 : 2),
    );
    prisma.projectSubmission.count.mockImplementation(
      async (args?: CountArgs) => (args?.where?.status === 'APPROVED' ? 41 : 1),
    );

    service = new AdminService(prisma as unknown as PrismaService);
  });

  it('keeps the existing platform counts unchanged', async () => {
    const result = await service.getOverview();

    expect(result.counts).toMatchObject({
      totalStudents: 10,
      totalCandidates: 9,
      totalLeads: 8,
      totalEnrollments: 12,
      activeEnrollments: 5,
    });
  });

  it('reports the delivery figures', async () => {
    const result = await service.getOverview();

    expect(result.delivery).toEqual({
      activeLearners: 4,
      completedEnrollments: 3,
      completionRate: 38,
      assignmentsAwaitingReview: 2,
      projectSubmissionsAwaitingReview: 1,
      assignmentsApproved: 31,
      projectMilestonesApproved: 41,
    });
  });

  it('counts learners by active enrollment, not by role', async () => {
    await service.getOverview();

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { enrollments: { some: { status: 'ACTIVE' } } },
    });
  });

  it('reads submissions from the right statuses', async () => {
    await service.getOverview();

    expect(prisma.assignmentSubmission.count).toHaveBeenCalledWith({
      where: { status: 'SUBMITTED' },
    });
    expect(prisma.assignmentSubmission.count).toHaveBeenCalledWith({
      where: { status: 'APPROVED' },
    });
    expect(prisma.projectSubmission.count).toHaveBeenCalledWith({
      where: { status: 'SUBMITTED' },
    });
    expect(prisma.projectSubmission.count).toHaveBeenCalledWith({
      where: { status: 'APPROVED' },
    });
  });

  it('rounds the completion rate over active plus completed enrollments', async () => {
    numbers.active = 1;
    numbers.completed = 2;

    const result = await service.getOverview();

    expect(result.delivery.completionRate).toBe(67);
  });

  it('reports a completion rate of 100 when everyone has finished', async () => {
    numbers.active = 0;
    numbers.completed = 4;

    const result = await service.getOverview();

    expect(result.delivery.completionRate).toBe(100);
  });

  it('reports no completion rate when nobody is enrolled', async () => {
    numbers.active = 0;
    numbers.completed = 0;

    const result = await service.getOverview();

    expect(result.delivery.completionRate).toBeNull();
  });
});
