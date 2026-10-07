import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from './course.service';

describe('CourseService completion rule', () => {
  const prisma = {
    lesson: { count: jest.fn(), findFirst: jest.fn() },
    lessonProgress: { count: jest.fn(), upsert: jest.fn() },
    assignment: { findMany: jest.fn(), count: jest.fn() },
    project: { count: jest.fn() },
    assignmentSubmission: { findMany: jest.fn() },
    enrollment: { updateMany: jest.fn() },
    course: { findUnique: jest.fn(), update: jest.fn() },
  };

  let service: CourseService;

  beforeEach(() => {
    service = new CourseService(prisma as unknown as PrismaService);
  });

  function arrange(options: {
    total: number;
    done: number;
    required?: string[];
    approved?: string[];
    updated?: number;
  }) {
    prisma.lesson.count.mockResolvedValue(options.total);
    prisma.lessonProgress.count.mockResolvedValue(options.done);
    prisma.assignment.findMany.mockResolvedValue(
      (options.required ?? []).map((id) => ({ id })),
    );
    prisma.assignmentSubmission.findMany.mockResolvedValue(
      (options.approved ?? []).map((assignmentId) => ({ assignmentId })),
    );
    prisma.enrollment.updateMany.mockResolvedValue({
      count: options.updated ?? 1,
    });
  }

  describe('completeEnrollmentIfEligible', () => {
    it('does nothing for a course with no published lessons', async () => {
      arrange({ total: 0, done: 0 });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(false);
      expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    });

    it('does nothing while lessons remain', async () => {
      arrange({ total: 3, done: 2 });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(false);
      expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    });

    it('keeps the original lessons-only rule when no assignment is required', async () => {
      arrange({ total: 3, done: 3 });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(true);
      expect(prisma.assignmentSubmission.findMany).not.toHaveBeenCalled();
      expect(prisma.enrollment.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', courseId: 'course-1', status: 'ACTIVE' },
        data: { status: 'COMPLETED', completedAt: expect.any(Date) },
      });
    });

    it('does not complete while a required assignment is not approved', async () => {
      arrange({
        total: 3,
        done: 3,
        required: ['asg-1', 'asg-2'],
        approved: ['asg-1'],
      });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(false);
      expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    });

    it('only counts approved submissions by the same learner', async () => {
      arrange({ total: 1, done: 1, required: ['asg-1'], approved: ['asg-1'] });

      await service.completeEnrollmentIfEligible('user-1', 'course-1');

      const where = prisma.assignmentSubmission.findMany.mock.calls[0][0].where;
      expect(where).toEqual({
        userId: 'user-1',
        status: 'APPROVED',
        assignmentId: { in: ['asg-1'] },
      });
    });

    it('completes once every required assignment is approved', async () => {
      arrange({
        total: 3,
        done: 3,
        required: ['asg-1', 'asg-2'],
        approved: ['asg-1', 'asg-2'],
      });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(true);
      expect(prisma.enrollment.updateMany).toHaveBeenCalledTimes(1);
    });

    it('reports false when there is no active enrollment to complete', async () => {
      arrange({ total: 1, done: 1, updated: 0 });

      await expect(
        service.completeEnrollmentIfEligible('user-1', 'course-1'),
      ).resolves.toBe(false);
    });
  });

  describe('completeLesson delegates to the completion rule', () => {
    beforeEach(() => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: 'les-1',
        module: { courseId: 'course-1' },
      });
      prisma.lessonProgress.upsert.mockResolvedValue({ isCompleted: true });
    });

    it('does not check assignments while lessons remain', async () => {
      arrange({ total: 2, done: 1 });

      const result = await service.completeLesson('user-1', 'les-1');

      expect(result.courseProgress).toEqual({ completed: 1, total: 2 });
      expect(prisma.assignment.findMany).not.toHaveBeenCalled();
      expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    });

    it('completes the course when all lessons are done and nothing is required', async () => {
      arrange({ total: 2, done: 2 });

      await service.completeLesson('user-1', 'les-1');

      expect(prisma.enrollment.updateMany).toHaveBeenCalledTimes(1);
    });

    it('does not complete the course while a required assignment is unapproved', async () => {
      arrange({ total: 2, done: 2, required: ['asg-1'], approved: [] });

      const result = await service.completeLesson('user-1', 'les-1');

      expect(result.courseProgress).toEqual({ completed: 2, total: 2 });
      expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('adminUpdate curriculum guard', () => {
    const curriculum = [{ module: 'Module', topics: ['Topic'] }];
    const updatedCourse = {
      id: 'course-1',
      title: 'Course',
      category: 'Tech',
      description: 'Description',
      duration: '4 weeks',
      level: 'beginner',
      price: 0,
      learningOutcomes: [],
      status: 'DRAFT',
      modules: [],
    };

    beforeEach(() => {
      prisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        status: 'DRAFT',
        _count: { enrollments: 0 },
      });
      prisma.course.update.mockResolvedValue(updatedCourse);
    });

    it('refuses to replace the curriculum once assignments exist', async () => {
      prisma.assignment.count.mockResolvedValue(2);

      await expect(
        service.adminUpdate('course-1', { curriculum }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.assignment.count).toHaveBeenCalledWith({
        where: { lesson: { module: { courseId: 'course-1' } } },
      });
      expect(prisma.course.update).not.toHaveBeenCalled();
    });

    it('refuses to replace the curriculum once projects exist', async () => {
      prisma.assignment.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(1);

      await expect(
        service.adminUpdate('course-1', { curriculum }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { courseId: 'course-1' },
      });
      expect(prisma.course.update).not.toHaveBeenCalled();
    });

    it('allows replacing the curriculum when there are no assignments', async () => {
      prisma.assignment.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      await service.adminUpdate('course-1', { curriculum });

      expect(prisma.course.update).toHaveBeenCalledTimes(1);
    });

    it('does not look for assignments when the curriculum is not being replaced', async () => {
      await service.adminUpdate('course-1', { title: 'Renamed' });

      expect(prisma.assignment.count).not.toHaveBeenCalled();
      expect(prisma.course.update).toHaveBeenCalledTimes(1);
    });
  });
});
