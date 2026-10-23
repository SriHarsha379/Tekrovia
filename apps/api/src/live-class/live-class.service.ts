import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, LiveClassStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER'];

@Injectable()
export class LiveClassService {
  constructor(private readonly prisma: PrismaService) {}

  isStaff(role: string) {
    return STAFF.includes(role);
  }

  /** Classes for one batch, newest first for past, soonest first for upcoming. */
  async forBatch(batchId: string) {
    return this.prisma.liveClass.findMany({
      where: { batchId },
      orderBy: { scheduledAt: 'asc' },
      include: {
        trainer: { select: { id: true, name: true } },
        _count: { select: { attendance: true } },
      },
    });
  }

  async create(data: {
    batchId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMins?: number;
    meetingLink?: string;
    trainerId?: string;
  }) {
    if (!data.title?.trim()) throw new BadRequestException('A class title is required.');
    if (!data.scheduledAt) throw new BadRequestException('A date and time is required.');

    const when = new Date(data.scheduledAt);
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException('That date and time could not be read.');
    }
    const year = when.getFullYear();
    const now = new Date().getFullYear();
    if (year < now - 1 || year > now + 10) {
      throw new BadRequestException('That date looks wrong — check the year.');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: data.batchId },
      select: { id: true, trainerId: true, status: true },
    });
    if (!batch) throw new NotFoundException('Batch not found.');
    if (batch.status === 'CANCELLED') {
      throw new BadRequestException('This batch has been cancelled.');
    }

    const link = data.meetingLink?.trim();
    if (link && !/^https:\/\//i.test(link)) {
      throw new BadRequestException('The meeting link must start with https://');
    }

    return this.prisma.liveClass.create({
      data: {
        batchId: data.batchId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        scheduledAt: when,
        durationMins: Number(data.durationMins) || 60,
        meetingLink: link || null,
        trainerId: data.trainerId || batch.trainerId || null,
      },
      include: { trainer: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.liveClass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Class not found.');

    if (data.meetingLink && !/^https:\/\//i.test(String(data.meetingLink).trim())) {
      throw new BadRequestException('The meeting link must start with https://');
    }
    if (data.recordingUrl && !/^https:\/\//i.test(String(data.recordingUrl).trim())) {
      throw new BadRequestException('The recording link must start with https://');
    }

    return this.prisma.liveClass.update({
      where: { id },
      data: {
        ...(data.title ? { title: String(data.title).trim() } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(data.durationMins !== undefined ? { durationMins: Number(data.durationMins) } : {}),
        ...(data.meetingLink !== undefined ? { meetingLink: data.meetingLink || null } : {}),
        ...(data.recordingUrl !== undefined ? { recordingUrl: data.recordingUrl || null } : {}),
        ...(data.status ? { status: data.status as LiveClassStatus } : {}),
        ...(data.trainerId !== undefined ? { trainerId: data.trainerId || null } : {}),
      },
      include: { trainer: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const marked = await this.prisma.classAttendance.count({ where: { liveClassId: id } });
    if (marked > 0) {
      throw new BadRequestException(
        'Attendance has been recorded for this class. Cancel it instead of deleting it.',
      );
    }
    await this.prisma.liveClass.delete({ where: { id } });
    return { deleted: true };
  }

  /** The register: every batch member, with whatever is already marked. */
  async register(liveClassId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        batch: {
          select: {
            id: true, name: true,
            members: {
              orderBy: { joinedAt: 'asc' },
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        attendance: true,
      },
    });
    if (!liveClass) throw new NotFoundException('Class not found.');

    const marked = new Map(liveClass.attendance.map((a) => [a.userId, a]));

    return {
      id: liveClass.id,
      title: liveClass.title,
      scheduledAt: liveClass.scheduledAt,
      status: liveClass.status,
      batch: { id: liveClass.batch.id, name: liveClass.batch.name },
      register: liveClass.batch.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        status: marked.get(m.user.id)?.status ?? null,
        note: marked.get(m.user.id)?.note ?? null,
      })),
    };
  }

  async mark(
    liveClassId: string,
    entries: { userId: string; status: string; note?: string }[],
  ) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new BadRequestException('No attendance was submitted.');
    }

    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      select: { id: true, batchId: true },
    });
    if (!liveClass) throw new NotFoundException('Class not found.');

    const members = await this.prisma.batchMember.findMany({
      where: { batchId: liveClass.batchId },
      select: { userId: true },
    });
    const allowed = new Set(members.map((m) => m.userId));

    const valid = entries.filter((e) => allowed.has(e.userId));
    if (valid.length === 0) {
      throw new BadRequestException('None of those students are in this batch.');
    }

    await this.prisma.$transaction(
      valid.map((e) =>
        this.prisma.classAttendance.upsert({
          where: { liveClassId_userId: { liveClassId, userId: e.userId } },
          create: {
            liveClassId,
            userId: e.userId,
            status: e.status as AttendanceStatus,
            note: e.note || null,
          },
          update: {
            status: e.status as AttendanceStatus,
            note: e.note || null,
            markedAt: new Date(),
          },
        }),
      ),
    );

    // Marking a register means the class happened.
    await this.prisma.liveClass.updateMany({
      where: { id: liveClassId, status: { in: ['SCHEDULED', 'LIVE'] } },
      data: { status: LiveClassStatus.COMPLETED },
    });

    return this.register(liveClassId);
  }

  // ---- student ----

  /** Upcoming and recent classes for the batches a student belongs to. */
  async mine(userId: string) {
    const memberships = await this.prisma.batchMember.findMany({
      where: { userId },
      select: { batchId: true },
    });
    const batchIds = memberships.map((m) => m.batchId);
    if (batchIds.length === 0) return { upcoming: [], past: [] };

    const cutoff = new Date(Date.now() - 7 * 24 * 3600_000);

    const classes = await this.prisma.liveClass.findMany({
      where: {
        batchId: { in: batchIds },
        scheduledAt: { gte: cutoff },
        status: { not: LiveClassStatus.CANCELLED },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        batch: { select: { id: true, name: true } },
        trainer: { select: { name: true } },
        attendance: { where: { userId }, select: { status: true } },
      },
    });

    const now = new Date();
    const shape = (c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      scheduledAt: c.scheduledAt,
      durationMins: c.durationMins,
      meetingLink: c.meetingLink,
      recordingUrl: c.recordingUrl,
      status: c.status,
      batch: c.batch,
      trainer: c.trainer?.name ?? null,
      myAttendance: c.attendance[0]?.status ?? null,
    });

    return {
      upcoming: classes
        .filter((c) => new Date(c.scheduledAt).getTime() + c.durationMins * 60000 > now.getTime())
        .map(shape),
      past: classes
        .filter((c) => new Date(c.scheduledAt).getTime() + c.durationMins * 60000 <= now.getTime())
        .reverse()
        .map(shape),
    };
  }

  /** A student's attendance rate, for the dashboard and risk alerts. */
  async myAttendanceSummary(userId: string) {
    const records = await this.prisma.classAttendance.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });
    const counts = Object.fromEntries(records.map((r) => [r.status, r._count]));
    const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0);
    const attended = (counts.PRESENT ?? 0) + (counts.LATE ?? 0);
    return {
      ...counts,
      total,
      attended,
      rate: total ? Math.round((attended / total) * 100) : null,
    };
  }
}
