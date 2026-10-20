import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { BatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  private code() {
    return `BAT-${new Date().getFullYear()}-${randomInt(1000, 10000)}`;
  }

  async list(params: { status?: string; courseId?: string }) {
    const where: Prisma.BatchWhereInput = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as BatchStatus;
    }
    if (params.courseId) where.courseId = params.courseId;

    const [batches, byStatus] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          course: { select: { id: true, title: true } },
          trainer: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
      }),
      this.prisma.batch.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      batches,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    };
  }

  async get(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        trainer: { select: { id: true, name: true, email: true } },
        members: {
          orderBy: { joinedAt: 'asc' },
          include: {
            user: {
              select: {
                id: true, name: true, email: true, phone: true,
                candidate: { select: { candidateCode: true } },
              },
            },
          },
        },
      },
    });
    if (!batch) throw new NotFoundException('Batch not found.');
    return batch;
  }

  async create(data: {
    name: string;
    courseId: string;
    capacity?: number;
    schedule?: string;
    startDate?: string;
    endDate?: string;
    trainerId?: string;
    notes?: string;
  }) {
    if (!data.name?.trim()) throw new BadRequestException('A batch name is required.');

    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId }, select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found.');

    const capacity = Number(data.capacity) || 15;
    if (capacity < 1) throw new BadRequestException('Capacity must be at least 1.');

    const start = data.startDate ? new Date(data.startDate) : null;
    const end = data.endDate ? new Date(data.endDate) : null;

    // A mistyped year is the common case here, so say so plainly.
    const yearOf = (d: Date) => d.getFullYear();
    const thisYear = new Date().getFullYear();
    for (const [label, d] of [['start', start], ['end', end]] as const) {
      if (d && (Number.isNaN(d.getTime()) || yearOf(d) < thisYear - 1 || yearOf(d) > thisYear + 10)) {
        throw new BadRequestException(
          `The ${label} date looks wrong — check the year.`,
        );
      }
    }
    if (start && end && end < start) {
      throw new BadRequestException('The end date cannot be before the start date.');
    }

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        return await this.prisma.batch.create({
          data: {
            batchCode: this.code(),
            name: data.name.trim(),
            courseId: data.courseId,
            capacity,
            schedule: data.schedule?.trim() || null,
            startDate: start,
            endDate: end,
            trainerId: data.trainerId || null,
            notes: data.notes?.trim() || null,
          },
          include: { course: { select: { title: true } } },
        });
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt === 5) throw error;
      }
    }
    throw new Error('Unable to generate a unique batch code.');
  }

  async update(id: string, data: any) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('Batch not found.');

    if (data.capacity !== undefined) {
      const count = await this.prisma.batchMember.count({ where: { batchId: id } });
      if (Number(data.capacity) < count) {
        throw new BadRequestException(
          `This batch already has ${count} students. Remove some before lowering the capacity.`,
        );
      }
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        ...(data.name ? { name: String(data.name).trim() } : {}),
        ...(data.status ? { status: data.status as BatchStatus } : {}),
        ...(data.capacity !== undefined ? { capacity: Number(data.capacity) } : {}),
        ...(data.schedule !== undefined ? { schedule: data.schedule || null } : {}),
        ...(data.startDate !== undefined
          ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
        ...(data.endDate !== undefined
          ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
        ...(data.trainerId !== undefined ? { trainerId: data.trainerId || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
      include: {
        course: { select: { title: true } },
        trainer: { select: { id: true, name: true } },
      },
    });
  }

  /** Adding to a batch also enrols in its course, so the two cannot drift apart. */
  async addMember(batchId: string, userId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { members: true } } },
    });
    if (!batch) throw new NotFoundException('Batch not found.');
    if (batch.status === BatchStatus.CANCELLED) {
      throw new BadRequestException('This batch has been cancelled.');
    }
    if (batch._count.members >= batch.capacity) {
      throw new BadRequestException(
        `This batch is full (${batch.capacity} places).`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { id: true, isActive: true },
    });
    if (!user) throw new NotFoundException('Student not found.');
    if (!user.isActive) throw new BadRequestException('That account is deactivated.');

    const [member] = await this.prisma.$transaction([
      this.prisma.batchMember.upsert({
        where: { batchId_userId: { batchId, userId } },
        create: { batchId, userId },
        update: {},
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: batch.courseId } },
        create: { userId, courseId: batch.courseId },
        update: { status: 'ACTIVE' },
      }),
    ]);

    return member;
  }

  /** Removes from the batch only. Course access and progress are untouched. */
  async removeMember(batchId: string, userId: string) {
    const member = await this.prisma.batchMember.findUnique({
      where: { batchId_userId: { batchId, userId } },
    });
    if (!member) throw new NotFoundException('That student is not in this batch.');
    await this.prisma.batchMember.delete({
      where: { batchId_userId: { batchId, userId } },
    });
    return { removed: true };
  }

  /** Students not already in this batch, for the add-student picker. */
  async candidates(batchId: string, search?: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId }, select: { id: true },
    });
    if (!batch) throw new NotFoundException('Batch not found.');

    const existing = await this.prisma.batchMember.findMany({
      where: { batchId }, select: { userId: true },
    });

    const where: Prisma.UserWhereInput = {
      role: 'STUDENT',
      isActive: true,
      id: { notIn: existing.map((m) => m.userId) },
    };
    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true,
        candidate: { select: { candidateCode: true } },
      },
    });
  }

  async trainers() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['TRAINER', 'ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
