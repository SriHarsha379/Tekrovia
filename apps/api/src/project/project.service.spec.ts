import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  const tx = {
    projectMilestone: { update: jest.fn() },
    project: { update: jest.fn() },
  };
  const prisma = {
    course: { findUnique: jest.fn() },
    project: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    projectMilestone: { findFirst: jest.fn(), findMany: jest.fn() },
    projectSubmission: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    candidate: { findUnique: jest.fn() },
    candidateProjectReview: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: ProjectService;

  beforeEach(() => {
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    service = new ProjectService(prisma as unknown as PrismaService);
  });

  describe('upsertForCourse', () => {
    const dto = {
      title: '  Build an API  ',
      businessProblem: ' Problem ',
      expectedOutcome: ' Outcome ',
      milestones: [
        { title: ' Design ', dueOffsetDays: 7 },
        { title: 'Build' },
        { title: 'Ship', description: '  Final  ' },
      ],
    };

    it('throws NotFoundException for an unknown course', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertForCourse('missing', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    describe('creating', () => {
      beforeEach(() => {
        prisma.course.findUnique.mockResolvedValue({ id: 'course-1' });
        prisma.project.create.mockResolvedValue({ id: 'proj-1' });
      });

      it('appends the project and marks only the last milestone as final', async () => {
        prisma.project.findFirst.mockResolvedValue({ sortOrder: 1 });

        await service.upsertForCourse('course-1', dto);

        const data = prisma.project.create.mock.calls[0][0].data;
        expect(data.courseId).toBe('course-1');
        expect(data.sortOrder).toBe(2);
        expect(data.title).toBe('Build an API');
        expect(data.milestones.create).toEqual([
          { title: 'Design', description: null, dueOffsetDays: 7, sortOrder: 0, isFinal: false },
          { title: 'Build', description: null, dueOffsetDays: null, sortOrder: 1, isFinal: false },
          { title: 'Ship', description: 'Final', dueOffsetDays: null, sortOrder: 2, isFinal: true },
        ]);
      });

      it('starts at sort order 0 for the first project in a course', async () => {
        prisma.project.findFirst.mockResolvedValue(null);

        await service.upsertForCourse('course-1', dto);

        expect(prisma.project.create.mock.calls[0][0].data.sortOrder).toBe(0);
      });

      it('makes a single milestone the final one', async () => {
        prisma.project.findFirst.mockResolvedValue(null);

        await service.upsertForCourse('course-1', {
          ...dto,
          milestones: [{ title: 'Only' }],
        });

        expect(
          prisma.project.create.mock.calls[0][0].data.milestones.create[0].isFinal,
        ).toBe(true);
      });
    });

    describe('updating', () => {
      const existingWith = (counts: number[]) => ({
        id: 'proj-1',
        milestones: counts.map((count, index) => ({
          id: `ms-${index}`,
          sortOrder: index,
          _count: { submissions: count },
        })),
      });

      beforeEach(() => {
        prisma.course.findUnique.mockResolvedValue({ id: 'course-1' });
        prisma.project.update.mockResolvedValue({ id: 'proj-1' });
        tx.project.update.mockResolvedValue({ id: 'proj-1' });
      });

      it('throws NotFoundException when the project is not in this course', async () => {
        prisma.project.findFirst.mockResolvedValue(null);

        await expect(
          service.upsertForCourse('course-1', { ...dto, id: 'proj-9' }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.project.findFirst.mock.calls[0][0].where).toEqual({
          id: 'proj-9',
          courseId: 'course-1',
        });
      });

      it('rebuilds the milestones when nobody has submitted work', async () => {
        prisma.project.findFirst.mockResolvedValue(existingWith([0, 0, 0]));

        await service.upsertForCourse('course-1', { ...dto, id: 'proj-1' });

        const data = prisma.project.update.mock.calls[0][0].data;
        expect(data.milestones.deleteMany).toEqual({});
        expect(data.milestones.create).toHaveLength(3);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });

      it('refuses to add or remove milestones once learners have submitted', async () => {
        prisma.project.findFirst.mockResolvedValue(existingWith([1, 0]));

        await expect(
          service.upsertForCourse('course-1', { ...dto, id: 'proj-1' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(tx.projectMilestone.update).not.toHaveBeenCalled();
      });

      it('edits milestone text in place, keeping ids and order, after submissions exist', async () => {
        prisma.project.findFirst.mockResolvedValue(existingWith([2, 0, 0]));

        await service.upsertForCourse('course-1', { ...dto, id: 'proj-1' });

        expect(tx.projectMilestone.update).toHaveBeenCalledTimes(3);
        expect(tx.projectMilestone.update.mock.calls[0][0]).toEqual({
          where: { id: 'ms-0' },
          data: { title: 'Design', description: null, dueOffsetDays: 7 },
        });
        expect(tx.project.update).toHaveBeenCalledTimes(1);
        expect(prisma.project.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('listMine', () => {
    it('is scoped to published courses the learner is enrolled in', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.listMine('user-1');

      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where.course.status).toBe('PUBLISHED');
      expect(call.where.course.enrollments.some.userId).toBe('user-1');
      expect(
        call.include.milestones.include.submissions.where,
      ).toEqual({ userId: 'user-1' });
    });

    it('unlocks milestones in order and reports overall approval', async () => {
      const submission = (status: string) => ({
        id: 's',
        attemptNumber: 1,
        status,
      });
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          title: 'API',
          businessProblem: 'P',
          expectedOutcome: 'O',
          resources: null,
          isRequired: true,
          course: { id: 'c1', title: 'Course' },
          milestones: [
            { id: 'm0', title: 'A', description: null, dueOffsetDays: null, isFinal: false, submissions: [submission('APPROVED')] },
            { id: 'm1', title: 'B', description: null, dueOffsetDays: null, isFinal: false, submissions: [submission('CHANGES_REQUESTED')] },
            { id: 'm2', title: 'C', description: null, dueOffsetDays: null, isFinal: true, submissions: [] },
          ],
        },
      ]);

      const [project] = await service.listMine('user-1');

      expect(project.milestones.map((item) => item.unlocked)).toEqual([true, true, false]);
      expect(project.milestones[1].latestStatus).toBe('CHANGES_REQUESTED');
      expect(project.approved).toBe(false);
    });

    it('marks a project approved only when every milestone is approved', async () => {
      const approved = [{ id: 's', attemptNumber: 1, status: 'APPROVED' }];
      prisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          title: 'API',
          businessProblem: 'P',
          expectedOutcome: 'O',
          resources: null,
          isRequired: true,
          course: { id: 'c1', title: 'Course' },
          milestones: [
            { id: 'm0', title: 'A', description: null, dueOffsetDays: null, isFinal: false, submissions: approved },
            { id: 'm1', title: 'B', description: null, dueOffsetDays: null, isFinal: true, submissions: approved },
          ],
        },
      ]);

      const [project] = await service.listMine('user-1');

      expect(project.approved).toBe(true);
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      prisma.projectMilestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        sortOrder: 0,
        projectId: 'proj-1',
      });
      prisma.projectSubmission.findFirst.mockResolvedValue(null);
      prisma.projectSubmission.create.mockResolvedValue({ id: 'sub-1' });
    });

    it('throws NotFoundException unless the learner is actively enrolled', async () => {
      prisma.projectMilestone.findFirst.mockResolvedValue(null);

      await expect(
        service.submit('user-1', 'ms-1', { submissionText: 'Work' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      const where = prisma.projectMilestone.findFirst.mock.calls[0][0].where;
      expect(where.project.course.enrollments.some).toEqual({
        userId: 'user-1',
        status: 'ACTIVE',
      });
      expect(prisma.projectSubmission.create).not.toHaveBeenCalled();
    });

    it('records attempt 1 for a first submission on the first milestone', async () => {
      await service.submit('user-1', 'ms-1', { submissionText: '  Work  ' });

      const data = prisma.projectSubmission.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        milestoneId: 'ms-1',
        userId: 'user-1',
        attemptNumber: 1,
        submissionText: 'Work',
        submissionUrl: null,
      });
      expect(prisma.projectMilestone.findMany).not.toHaveBeenCalled();
    });

    describe('milestone order', () => {
      beforeEach(() => {
        prisma.projectMilestone.findFirst.mockResolvedValue({
          id: 'ms-2',
          sortOrder: 2,
          projectId: 'proj-1',
        });
      });

      it('blocks a later milestone while an earlier one is not approved', async () => {
        prisma.projectMilestone.findMany.mockResolvedValue([
          { submissions: [{ status: 'APPROVED' }] },
          { submissions: [{ status: 'SUBMITTED' }] },
        ]);

        await expect(
          service.submit('user-1', 'ms-2', { submissionText: 'Work' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.projectSubmission.create).not.toHaveBeenCalled();
      });

      it('blocks a later milestone when an earlier one has no submission', async () => {
        prisma.projectMilestone.findMany.mockResolvedValue([
          { submissions: [{ status: 'APPROVED' }] },
          { submissions: [] },
        ]);

        await expect(
          service.submit('user-1', 'ms-2', { submissionText: 'Work' }),
        ).rejects.toBeInstanceOf(ConflictException);
      });

      it('allows a later milestone once every earlier one is approved', async () => {
        prisma.projectMilestone.findMany.mockResolvedValue([
          { submissions: [{ status: 'APPROVED' }] },
          { submissions: [{ status: 'APPROVED' }] },
        ]);

        await service.submit('user-1', 'ms-2', { submissionText: 'Work' });

        expect(prisma.projectSubmission.create).toHaveBeenCalledTimes(1);
        expect(prisma.projectMilestone.findMany.mock.calls[0][0].where).toEqual({
          projectId: 'proj-1',
          sortOrder: { lt: 2 },
        });
      });
    });

    it('records attempt 2 after changes were requested', async () => {
      prisma.projectSubmission.findFirst.mockResolvedValue({
        attemptNumber: 1,
        status: 'CHANGES_REQUESTED',
      });

      await service.submit('user-1', 'ms-1', { submissionText: 'Better' });

      expect(
        prisma.projectSubmission.create.mock.calls[0][0].data.attemptNumber,
      ).toBe(2);
    });

    it.each(['SUBMITTED', 'APPROVED'])(
      'blocks a new attempt while the latest is %s',
      async (status) => {
        prisma.projectSubmission.findFirst.mockResolvedValue({
          attemptNumber: 1,
          status,
        });

        await expect(
          service.submit('user-1', 'ms-1', { submissionText: 'Again' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.projectSubmission.create).not.toHaveBeenCalled();
      },
    );

    it('turns a concurrent duplicate attempt into a ConflictException', async () => {
      prisma.projectSubmission.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(
        service.submit('user-1', 'ms-1', { submissionText: 'Work' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows other database errors unchanged', async () => {
      const error = new Error('connection lost');
      prisma.projectSubmission.create.mockRejectedValue(error);

      await expect(
        service.submit('user-1', 'ms-1', { submissionText: 'Work' }),
      ).rejects.toBe(error);
    });
  });

  describe('listForReview', () => {
    beforeEach(() => {
      prisma.projectSubmission.findMany.mockResolvedValue([]);
      prisma.projectSubmission.count.mockResolvedValue(0);
    });

    it('defaults to submissions awaiting review, oldest first', async () => {
      await service.listForReview({});

      const call = prisma.projectSubmission.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ status: 'SUBMITTED' });
      expect(call.orderBy).toEqual({ submittedAt: 'asc' });
      expect(call.take).toBe(20);
    });

    it('paginates, caps the page size and accepts a lowercase status', async () => {
      await service.listForReview({ status: 'approved', page: '3', limit: '5000' });

      const call = prisma.projectSubmission.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ status: 'APPROVED' });
      expect(call.skip).toBe(200);
      expect(call.take).toBe(100);
    });

    it('rejects an unknown status filter', async () => {
      await expect(
        service.listForReview({ status: 'DELETED' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('review', () => {
    const trainer = { id: 'trainer-1', name: 'Tara Trainer', role: 'TRAINER' };
    const admin = { id: 'admin-1', name: 'Ada Admin', role: 'ADMIN' };

    const pending = (isFinal: boolean) => ({
      id: 'sub-1',
      userId: 'student-1',
      status: 'SUBMITTED',
      milestone: { isFinal, project: { title: 'Build an API' } },
    });

    beforeEach(() => {
      prisma.projectSubmission.findUnique.mockResolvedValue(pending(false));
      prisma.projectSubmission.updateMany.mockResolvedValue({ count: 1 });
      prisma.candidate.findUnique.mockResolvedValue({ id: 'cand-1' });
      prisma.candidateProjectReview.findFirst.mockResolvedValue(null);
      prisma.candidateProjectReview.create.mockResolvedValue({});
      prisma.candidateProjectReview.update.mockResolvedValue({});
    });

    it('throws NotFoundException for an unknown submission', async () => {
      prisma.projectSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.review(trainer, 'sub-1', { status: 'APPROVED' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids reviewing your own submission', async () => {
      await expect(
        service.review({ ...admin, id: 'student-1' }, 'sub-1', { status: 'APPROVED' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.projectSubmission.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a submission that was already reviewed', async () => {
      prisma.projectSubmission.findUnique.mockResolvedValue({
        ...pending(false),
        status: 'APPROVED',
      });

      await expect(
        service.review(trainer, 'sub-1', { status: 'APPROVED' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('detects a concurrent review and records no evidence', async () => {
      prisma.projectSubmission.findUnique.mockResolvedValue(pending(true));
      prisma.projectSubmission.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.review(admin, 'sub-1', { status: 'APPROVED' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
      expect(prisma.candidateProjectReview.update).not.toHaveBeenCalled();
    });

    describe('intermediate milestones', () => {
      it('lets a trainer approve one without touching readiness evidence', async () => {
        const result = await service.review(trainer, 'sub-1', {
          status: 'APPROVED',
          feedback: ' Good ',
          vivaNotes: ' Clear ',
        });

        expect(prisma.projectSubmission.updateMany).toHaveBeenCalledWith({
          where: { id: 'sub-1', status: 'SUBMITTED' },
          data: {
            status: 'APPROVED',
            feedback: 'Good',
            vivaNotes: 'Clear',
            reviewerId: 'trainer-1',
            reviewedAt: expect.any(Date),
          },
        });
        expect(prisma.candidate.findUnique).not.toHaveBeenCalled();
        expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
        expect(result.recordedAsReadinessEvidence).toBe(false);
      });

      it('lets a trainer request changes', async () => {
        await service.review(trainer, 'sub-1', {
          status: 'CHANGES_REQUESTED',
          feedback: 'Add tests',
        });

        expect(
          prisma.projectSubmission.updateMany.mock.calls[0][0].data.status,
        ).toBe('CHANGES_REQUESTED');
      });
    });

    describe('final milestone', () => {
      beforeEach(() => {
        prisma.projectSubmission.findUnique.mockResolvedValue(pending(true));
      });

      it.each(['TRAINER', 'COUNSELLOR', 'STUDENT'])(
        'forbids %s from reviewing it',
        async (role) => {
          await expect(
            service.review({ id: 'x-1', role }, 'sub-1', { status: 'APPROVED' }),
          ).rejects.toBeInstanceOf(ForbiddenException);
          expect(prisma.projectSubmission.updateMany).not.toHaveBeenCalled();
          expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
        },
      );

      it.each(['ADMIN', 'SUPER_ADMIN'])('allows %s', async (role) => {
        await service.review({ id: 'x-1', name: 'X', role }, 'sub-1', {
          status: 'APPROVED',
        });

        expect(prisma.projectSubmission.updateMany).toHaveBeenCalledTimes(1);
      });

      it('creates expert-approved readiness evidence on approval', async () => {
        const result = await service.review(admin, 'sub-1', {
          status: 'APPROVED',
          feedback: 'Excellent',
        });

        expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
          where: { userId: 'student-1' },
          select: { id: true },
        });
        expect(prisma.candidateProjectReview.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            candidateId: 'cand-1',
            projectName: 'Build an API',
            status: 'APPROVED',
            expertApproved: true,
            reviewerName: 'Ada Admin',
            mentorFeedback: 'Excellent',
          }),
        });
        expect(result.recordedAsReadinessEvidence).toBe(true);
      });

      it('updates an existing evidence row instead of duplicating it', async () => {
        prisma.candidateProjectReview.findFirst.mockResolvedValue({ id: 'rev-1' });

        await service.review(admin, 'sub-1', { status: 'APPROVED' });

        expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
        expect(prisma.candidateProjectReview.update).toHaveBeenCalledWith({
          where: { id: 'rev-1' },
          data: expect.objectContaining({
            status: 'APPROVED',
            expertApproved: true,
          }),
        });
      });

      it('refuses to approve when the learner has no candidate profile, and changes nothing', async () => {
        prisma.candidate.findUnique.mockResolvedValue(null);

        await expect(
          service.review(admin, 'sub-1', { status: 'APPROVED' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.projectSubmission.updateMany).not.toHaveBeenCalled();
        expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
      });

      it('records no readiness evidence when changes are requested', async () => {
        await service.review(admin, 'sub-1', {
          status: 'CHANGES_REQUESTED',
          feedback: 'Needs work',
        });

        expect(prisma.candidate.findUnique).not.toHaveBeenCalled();
        expect(prisma.candidateProjectReview.create).not.toHaveBeenCalled();
      });

      it('never writes a readiness decision', async () => {
        await service.review(admin, 'sub-1', { status: 'APPROVED' });

        const written = JSON.stringify([
          prisma.candidateProjectReview.create.mock.calls,
          prisma.candidateProjectReview.update.mock.calls,
        ]);
        expect(written).not.toMatch(/decision|JOB_READY|placementReadinessReview/i);
      });
    });
  });
});
