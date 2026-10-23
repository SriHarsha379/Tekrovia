import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER'];

@Injectable()
export class ResourceService {
  constructor(private readonly prisma: PrismaService) {}

  isStaff(role: string) {
    return STAFF.includes(role);
  }

  /** Everything attached to a lesson. Students see published items only. */
  async forLesson(userId: string, role: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, module: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const staff = this.isStaff(role);

    if (!staff) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: lesson.module.courseId },
        },
        select: { status: true },
      });
      if (!enrollment || enrollment.status === 'CANCELLED') {
        throw new ForbiddenException('You are not enrolled in this course.');
      }
    }

    return this.prisma.lessonResource.findMany({
      where: { lessonId, ...(staff ? {} : { isPublished: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private validate(data: { title?: string; url?: string; type?: string }) {
    if (!data.title?.trim()) {
      throw new BadRequestException('A title is required.');
    }
    const url = data.url?.trim();
    if (url && !/^https:\/\//i.test(url)) {
      throw new BadRequestException('Links must start with https://');
    }
    return url || null;
  }

  async create(
    lessonId: string,
    data: {
      type?: string;
      title: string;
      body?: string;
      url?: string;
      isPublished?: boolean;
    },
  ) {
    const url = this.validate(data);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const last = await this.prisma.lessonResource.findFirst({
      where: { lessonId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.lessonResource.create({
      data: {
        lessonId,
        type: (data.type as ResourceType) ?? ResourceType.READING,
        title: data.title.trim(),
        body: data.body?.trim() || null,
        url,
        isPublished: data.isPublished ?? true,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.lessonResource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Resource not found.');

    const url =
      data.url !== undefined ? this.validate({ title: data.title ?? existing.title, url: data.url }) : undefined;

    return this.prisma.lessonResource.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type as ResourceType } : {}),
        ...(data.title ? { title: String(data.title).trim() } : {}),
        ...(data.body !== undefined ? { body: data.body || null } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(data.isPublished !== undefined
          ? { isPublished: Boolean(data.isPublished) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.lessonResource.delete({ where: { id } });
    return { deleted: true };
  }

  /** Move one resource up or down within its lesson. */
  async reorder(id: string, direction: 'up' | 'down') {
    const item = await this.prisma.lessonResource.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Resource not found.');

    const neighbour = await this.prisma.lessonResource.findFirst({
      where: {
        lessonId: item.lessonId,
        sortOrder: direction === 'up'
          ? { lt: item.sortOrder }
          : { gt: item.sortOrder },
      },
      orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!neighbour) return item;

    // sortOrder is unique per lesson, so park one value out of the way first.
    await this.prisma.$transaction([
      this.prisma.lessonResource.update({
        where: { id: item.id }, data: { sortOrder: -1 },
      }),
      this.prisma.lessonResource.update({
        where: { id: neighbour.id }, data: { sortOrder: item.sortOrder },
      }),
      this.prisma.lessonResource.update({
        where: { id: item.id }, data: { sortOrder: neighbour.sortOrder },
      }),
    ]);

    return this.prisma.lessonResource.findUnique({ where: { id } });
  }
}
