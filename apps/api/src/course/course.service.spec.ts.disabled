import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from './course.service';

type LessonInclude = {
  modules: { include: { lessons: { select: Record<string, unknown> } } };
};

type ProgressResult = Array<{
  modules: Array<{ lessons: Array<Record<string, unknown>> }>;
}>;

describe('CourseService lesson content protection', () => {
  const prisma = {
    course: { findMany: jest.fn(), findFirst: jest.fn() },
    enrollment: { findMany: jest.fn() },
  };

  let service: CourseService;

  beforeEach(() => {
    service = new CourseService(prisma as unknown as PrismaService);
  });

  function expectNoProtectedFields(include: LessonInclude) {
    const select = include.modules.include.lessons.select;
    expect(select).not.toHaveProperty('videoUrl');
    expect(select).not.toHaveProperty('content');
    expect(select).toMatchObject({ id: true, title: true });
  }

  describe('catalog queries never select video or content', () => {
    it('findAll', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      await service.findAll({});
      expectNoProtectedFields(
        prisma.course.findMany.mock.calls[0][0].include as LessonInclude,
      );
    });

    it('findOne', async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: 'course-1',
        title: 'Course',
        category: 'Tech',
        description: 'Description',
        duration: '4 weeks',
        level: 'beginner',
        price: 0,
        learningOutcomes: [],
        modules: [],
      });
      await service.findOne('course-1');
      expectNoProtectedFields(
        prisma.course.findFirst.mock.calls[0][0].include as LessonInclude,
      );
    });

    it('myEnrollments', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);
      await service.myEnrollments('user-1');
      expectNoProtectedFields(
        prisma.enrollment.findMany.mock.calls[0][0].include.course
          .include as LessonInclude,
      );
    });
  });

  describe('myProgress releases lesson content only to learners with access', () => {
    const makeEnrollment = (
      status: string,
      lesson: Record<string, unknown> = {},
    ) => ({
      id: 'enr-1',
      courseId: 'course-1',
      status,
      enrolledAt: new Date('2026-10-01T00:00:00Z'),
      completedAt: null,
      course: {
        title: 'Course',
        modules: [
          {
            id: 'mod-1',
            title: 'Module',
            lessons: [
              {
                id: 'les-1',
                title: 'Lesson',
                duration: '10 min',
                content: 'Lesson notes for enrolled learners',
                videoUrl: 'https://video.example.test/1',
                progress: [
                  { isCompleted: true, completedAt: new Date('2026-10-02') },
                ],
                ...lesson,
              },
            ],
          },
        ],
      },
    });

    async function progressFor(status: string, lesson?: Record<string, unknown>) {
      prisma.enrollment.findMany.mockResolvedValue([
        makeEnrollment(status, lesson),
      ]);
      const result = (await service.myProgress(
        'user-1',
      )) as unknown as ProgressResult;
      return result[0].modules[0].lessons[0];
    }

    it.each(['ACTIVE', 'COMPLETED'])(
      'includes content and videoUrl for a %s enrollment',
      async (status) => {
        const lesson = await progressFor(status);
        expect(lesson.content).toBe('Lesson notes for enrolled learners');
        expect(lesson.videoUrl).toBe('https://video.example.test/1');
        expect(lesson.completed).toBe(true);
      },
    );

    it('omits content and videoUrl for a CANCELLED enrollment', async () => {
      const lesson = await progressFor('CANCELLED');
      expect(lesson).not.toHaveProperty('content');
      expect(lesson).not.toHaveProperty('videoUrl');
      expect(lesson).toMatchObject({ id: 'les-1', title: 'Lesson' });
    });

    it('returns null for lessons that have no content or video yet', async () => {
      const lesson = await progressFor('ACTIVE', {
        content: null,
        videoUrl: null,
      });
      expect(lesson.content).toBeNull();
      expect(lesson.videoUrl).toBeNull();
    });

    it('only queries enrollments belonging to the session user', async () => {
      prisma.enrollment.findMany.mockResolvedValue([]);
      await service.myProgress('user-1');
      expect(prisma.enrollment.findMany.mock.calls[0][0].where).toEqual({
        userId: 'user-1',
      });
    });
  });
});
