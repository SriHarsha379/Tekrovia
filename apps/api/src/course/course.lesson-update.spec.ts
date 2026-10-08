import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from './course.service';

describe('CourseService.adminUpdateLesson', () => {
  const prisma = {
    lesson: { findUnique: jest.fn(), update: jest.fn() },
  };

  let service: CourseService;

  beforeEach(() => {
    service = new CourseService(prisma as unknown as PrismaService);
  });

  it('throws NotFoundException and updates nothing when the lesson does not exist', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(
      service.adminUpdateLesson('missing', { title: 'T' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lesson.update).not.toHaveBeenCalled();
  });

  it('updates only the provided fields, in place', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
    prisma.lesson.update.mockResolvedValue({ id: 'les-1' });

    await service.adminUpdateLesson('les-1', {
      content: 'Notes',
      videoUrl: 'https://video.example.test/1',
    });

    const call = prisma.lesson.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'les-1' });
    expect(call.data).toEqual({
      content: 'Notes',
      videoUrl: 'https://video.example.test/1',
    });
  });

  it('never changes ordering, parent module or publish state', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
    prisma.lesson.update.mockResolvedValue({ id: 'les-1' });

    await service.adminUpdateLesson('les-1', {
      title: 'T',
      ...({ sortOrder: 9, moduleId: 'm-2', isPublished: false } as object),
    });

    const data = prisma.lesson.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('sortOrder');
    expect(data).not.toHaveProperty('moduleId');
    expect(data).not.toHaveProperty('isPublished');
  });

  it('trims text and stores blank or null values as null', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'les-1' });
    prisma.lesson.update.mockResolvedValue({ id: 'les-1' });

    await service.adminUpdateLesson('les-1', {
      title: '  Intro  ',
      description: '   ',
      content: null,
      videoUrl: null,
      duration: ' 12 min ',
    });

    expect(prisma.lesson.update.mock.calls[0][0].data).toEqual({
      title: 'Intro',
      description: null,
      content: null,
      videoUrl: null,
      duration: '12 min',
    });
  });
});
