import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CourseService } from '../course/course.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentService } from './assignment.service';
import { ReviewSubmissionDto } from './dto/assignment.dto';

describe('AssignmentService', () => {
  const prisma = {
    lesson: { findUnique: jest.fn() },
    assignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    assignmentSubmission: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const courseService = { completeEnrollmentIfEligible: jest.fn() };

  let service: AssignmentService;

  beforeEach(() => {
    service = new AssignmentService(
      prisma as unknown as PrismaService,
      courseService as unknown as CourseService,
    );
  });

  describe('upsertForLesson', () => {
    it('throws NotFoundException when the lesson does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertForLesson('missing', { title: 'T', instructions: 'I' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.assignment.upsert).not.toHaveBeenCalled();
    });

    it('creates a required assignment by default, with trimmed text', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
      prisma.assignment.upsert.mockResolvedValue({ id: 'asg-1' });

      await service.upsertForLesson('les-1', {
        title: '  Build an API  ',
        instructions: '  Follow the brief.  ',
      });

      expect(prisma.assignment.upsert).toHaveBeenCalledWith({
        where: { lessonId: 'les-1' },
        create: {
          lessonId: 'les-1',
          title: 'Build an API',
          instructions: 'Follow the brief.',
          isRequired: true,
        },
        update: { title: 'Build an API', instructions: 'Follow the brief.' },
      });
    });

    it('only changes isRequired on update when it is provided', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
      prisma.assignment.upsert.mockResolvedValue({ id: 'asg-1' });

      await service.upsertForLesson('les-1', {
        title: 'T',
        instructions: 'I',
        isRequired: false,
      });

      const call = prisma.assignment.upsert.mock.calls[0][0];
      expect(call.create.isRequired).toBe(false);
      expect(call.update.isRequired).toBe(false);
    });
  });

  describe('listMine', () => {
    it('is scoped to the user and returns only their own submissions', async () => {
      prisma.assignment.findMany.mockResolvedValue([]);

      await service.listMine('user-1');

      const call = prisma.assignment.findMany.mock.calls[0][0];
      expect(call.where.lesson.module.course.enrollments.some.userId).toBe('user-1');
      expect(call.include.submissions.where).toEqual({ userId: 'user-1' });
    });

    it('does not expose reviewer identity to learners', async () => {
      prisma.assignment.findMany.mockResolvedValue([]);

      await service.listMine('user-1');

      const select = prisma.assignment.findMany.mock.calls[0][0].include.submissions.select;
      expect(select).not.toHaveProperty('reviewerId');
    });

    it('maps assignments with course context and the latest status', async () => {
      prisma.assignment.findMany.mockResolvedValue([
        {
          id: 'asg-1',
          title: 'A',
          instructions: 'Do it',
          isRequired: true,
          lesson: {
            id: 'les-1',
            title: 'Lesson',
            module: {
              id: 'mod-1',
              title: 'Module',
              courseId: 'course-1',
              course: { title: 'Course' },
            },
          },
          submissions: [
            { id: 's1', attemptNumber: 1, status: 'CHANGES_REQUESTED' },
            { id: 's2', attemptNumber: 2, status: 'SUBMITTED' },
          ],
        },
        {
          id: 'asg-2',
          title: 'B',
          instructions: 'Do it too',
          isRequired: false,
          lesson: {
            id: 'les-2',
            title: 'Lesson 2',
            module: {
              id: 'mod-1',
              title: 'Module',
              courseId: 'course-1',
              course: { title: 'Course' },
            },
          },
          submissions: [],
        },
      ]);

      const result = await service.listMine('user-1');

      expect(result[0].latestStatus).toBe('SUBMITTED');
      expect(result[0].course).toEqual({ id: 'course-1', title: 'Course' });
      expect(result[1].latestStatus).toBeNull();
    });
  });

  describe('submit', () => {
    const uniqueError = () =>
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

    beforeEach(() => {
      prisma.assignment.findFirst.mockResolvedValue({ id: 'asg-1' });
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      prisma.assignmentSubmission.create.mockResolvedValue({ id: 'sub-1' });
    });

    it('throws NotFoundException unless the learner is actively enrolled', async () => {
      prisma.assignment.findFirst.mockResolvedValue(null);

      await expect(
        service.submit('user-1', 'asg-1', { submissionText: 'Answer' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      const where = prisma.assignment.findFirst.mock.calls[0][0].where;
      expect(where.lesson.module.course.enrollments.some).toEqual({
        userId: 'user-1',
        status: 'ACTIVE',
      });
      expect(prisma.assignmentSubmission.create).not.toHaveBeenCalled();
    });

    it('records attempt 1 for a first submission', async () => {
      await service.submit('user-1', 'asg-1', { submissionText: 'Answer' });

      const data = prisma.assignmentSubmission.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        assignmentId: 'asg-1',
        userId: 'user-1',
        attemptNumber: 1,
      });
    });

    it('records attempt 2 after changes were requested', async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        attemptNumber: 1,
        status: 'CHANGES_REQUESTED',
      });

      await service.submit('user-1', 'asg-1', { submissionText: 'Better' });

      expect(
        prisma.assignmentSubmission.create.mock.calls[0][0].data.attemptNumber,
      ).toBe(2);
    });

    it('blocks a new attempt while one is awaiting review', async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        attemptNumber: 1,
        status: 'SUBMITTED',
      });

      await expect(
        service.submit('user-1', 'asg-1', { submissionText: 'Again' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.assignmentSubmission.create).not.toHaveBeenCalled();
    });

    it('blocks a new attempt once the assignment is approved', async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        attemptNumber: 2,
        status: 'APPROVED',
      });

      await expect(
        service.submit('user-1', 'asg-1', { submissionText: 'Again' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.assignmentSubmission.create).not.toHaveBeenCalled();
    });

    it('turns a concurrent duplicate attempt into a ConflictException', async () => {
      prisma.assignmentSubmission.create.mockRejectedValue(uniqueError());

      await expect(
        service.submit('user-1', 'asg-1', { submissionText: 'Answer' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows other database errors unchanged', async () => {
      const error = new Error('connection lost');
      prisma.assignmentSubmission.create.mockRejectedValue(error);

      await expect(
        service.submit('user-1', 'asg-1', { submissionText: 'Answer' }),
      ).rejects.toBe(error);
    });

    it('trims text and stores blank fields as null', async () => {
      await service.submit('user-1', 'asg-1', {
        submissionText: '  my answer  ',
        submissionUrl: '   ',
      });

      const data = prisma.assignmentSubmission.create.mock.calls[0][0].data;
      expect(data.submissionText).toBe('my answer');
      expect(data.submissionUrl).toBeNull();
    });
  });

  describe('listForReview', () => {
    beforeEach(() => {
      prisma.assignmentSubmission.findMany.mockResolvedValue([]);
      prisma.assignmentSubmission.count.mockResolvedValue(0);
    });

    it('defaults to submissions awaiting review, oldest first', async () => {
      await service.listForReview({});

      const call = prisma.assignmentSubmission.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ status: 'SUBMITTED' });
      expect(call.orderBy).toEqual({ submittedAt: 'asc' });
      expect(call.skip).toBe(0);
      expect(call.take).toBe(20);
    });

    it('accepts a case-insensitive status and paginates', async () => {
      await service.listForReview({ status: 'approved', page: '3', limit: '10' });

      const call = prisma.assignmentSubmission.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ status: 'APPROVED' });
      expect(call.skip).toBe(20);
      expect(call.take).toBe(10);
    });

    it('caps the page size at 100', async () => {
      await service.listForReview({ limit: '5000' });

      expect(prisma.assignmentSubmission.findMany.mock.calls[0][0].take).toBe(100);
    });

    it('rejects an unknown status filter', async () => {
      await expect(
        service.listForReview({ status: 'DELETED' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.assignmentSubmission.findMany).not.toHaveBeenCalled();
    });
  });

  describe('review', () => {
    const pending = {
      id: 'sub-1',
      userId: 'student-1',
      status: 'SUBMITTED',
      assignment: { lesson: { module: { courseId: 'course-1' } } },
    };
    const approve: ReviewSubmissionDto = { status: 'APPROVED' };
    const requestChanges: ReviewSubmissionDto = {
      status: 'CHANGES_REQUESTED',
      feedback: '  Please add tests  ',
    };

    beforeEach(() => {
      prisma.assignmentSubmission.findUnique.mockResolvedValue(pending);
      prisma.assignmentSubmission.updateMany.mockResolvedValue({ count: 1 });
      courseService.completeEnrollmentIfEligible.mockResolvedValue(false);
    });

    it('throws NotFoundException for an unknown submission', async () => {
      prisma.assignmentSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.review('reviewer-1', 'sub-1', approve),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids reviewing your own submission', async () => {
      await expect(
        service.review('student-1', 'sub-1', approve),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.assignmentSubmission.updateMany).not.toHaveBeenCalled();
      expect(courseService.completeEnrollmentIfEligible).not.toHaveBeenCalled();
    });

    it('rejects a submission that was already reviewed', async () => {
      prisma.assignmentSubmission.findUnique.mockResolvedValue({
        ...pending,
        status: 'APPROVED',
      });

      await expect(
        service.review('reviewer-1', 'sub-1', approve),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.assignmentSubmission.updateMany).not.toHaveBeenCalled();
    });

    it('detects a concurrent review and does not touch completion', async () => {
      prisma.assignmentSubmission.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.review('reviewer-1', 'sub-1', approve),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(courseService.completeEnrollmentIfEligible).not.toHaveBeenCalled();
    });

    it('approves, attributes the reviewer, and re-checks course completion', async () => {
      courseService.completeEnrollmentIfEligible.mockResolvedValue(true);

      const result = await service.review('reviewer-1', 'sub-1', approve);

      expect(prisma.assignmentSubmission.updateMany).toHaveBeenCalledWith({
        where: { id: 'sub-1', status: 'SUBMITTED' },
        data: {
          status: 'APPROVED',
          feedback: null,
          reviewerId: 'reviewer-1',
          reviewedAt: expect.any(Date),
        },
      });
      expect(courseService.completeEnrollmentIfEligible).toHaveBeenCalledWith(
        'student-1',
        'course-1',
      );
      expect(result).toEqual({
        id: 'sub-1',
        status: 'APPROVED',
        feedback: null,
        courseCompleted: true,
      });
    });

    it('stores trimmed feedback and does not touch completion when changes are requested', async () => {
      const result = await service.review('reviewer-1', 'sub-1', requestChanges);

      expect(
        prisma.assignmentSubmission.updateMany.mock.calls[0][0].data,
      ).toMatchObject({
        status: 'CHANGES_REQUESTED',
        feedback: 'Please add tests',
      });
      expect(courseService.completeEnrollmentIfEligible).not.toHaveBeenCalled();
      expect(result.courseCompleted).toBe(false);
    });
  });
});
