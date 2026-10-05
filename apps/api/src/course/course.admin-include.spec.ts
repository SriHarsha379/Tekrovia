import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from './course.service';

type LessonsInclude = {
  modules: {
    include: {
      lessons: { include?: Record<string, unknown>; select?: Record<string, unknown> };
    };
  };
};

describe('CourseService assignment visibility', () => {
  const prisma = { course: { findMany: jest.fn() } };

  let service: CourseService;

  beforeEach(() => {
    service = new CourseService(prisma as unknown as PrismaService);
  });

  it('loads each lesson assignment in the administrator course list', async () => {
    prisma.course.findMany.mockResolvedValue([]);

    await service.adminFindAll();

    const include = prisma.course.findMany.mock.calls[0][0]
      .include as LessonsInclude;
    expect(include.modules.include.lessons.include).toEqual({
      assignment: true,
    });
  });

  it('returns the assignment on admin lessons', async () => {
    prisma.course.findMany.mockResolvedValue([
      {
        id: 'course-1',
        title: 'Course',
        category: 'Tech',
        description: 'Description',
        duration: '4 weeks',
        level: 'beginner',
        price: 0,
        learningOutcomes: [],
        status: 'PUBLISHED',
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: new Date('2026-10-02T00:00:00Z'),
        _count: { enrollments: 0 },
        modules: [
          {
            id: 'mod-1',
            title: 'Module',
            lessons: [
              {
                id: 'les-1',
                title: 'Lesson',
                assignment: {
                  id: 'asg-1',
                  title: 'Build an API',
                  instructions: 'Follow the brief.',
                  isRequired: true,
                },
              },
            ],
          },
        ],
      },
    ]);

    const result = await service.adminFindAll();

    const lesson = (
      result[0].modules as unknown as Array<{
        lessons: Array<{ assignment: { title: string } }>;
      }>
    )[0].lessons[0];
    expect(lesson.assignment.title).toBe('Build an API');
  });

  it('never selects assignments in the public catalog', async () => {
    prisma.course.findMany.mockResolvedValue([]);

    await service.findAll({});

    const lessons = (
      prisma.course.findMany.mock.calls[0][0].include as LessonsInclude
    ).modules.include.lessons;
    expect(lessons.include).toBeUndefined();
    expect(lessons.select).not.toHaveProperty('assignment');
  });
});
