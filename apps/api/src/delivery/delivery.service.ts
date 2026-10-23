import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** A student is at risk after this many days with no completed lesson. */
const INACTIVE_DAYS = 7;
/** Or if their attendance falls below this, having had a few classes. */
const LOW_ATTENDANCE = 60;

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);

    const [
      activeBatches,
      activeEnrollments,
      classesThisWeek,
      pendingAssignments,
      pendingProjects,
      openTickets,
      overdueTickets,
      lessonsThisWeek,
    ] = await Promise.all([
      this.prisma.batch.count({ where: { status: { in: ['ENROLLING', 'RUNNING'] } } }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.liveClass.count({
        where: { scheduledAt: { gte: weekAgo, lte: now }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.assignmentSubmission.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.projectSubmission.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_STUDENT'] } },
      }),
      this.prisma.supportTicket.count({
        where: {
          dueAt: { lt: now },
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      this.prisma.lessonProgress.count({
        where: { isCompleted: true, completedAt: { gte: weekAgo } },
      }),
    ]);

    // Attendance across the last week of classes.
    const attendance = await this.prisma.classAttendance.groupBy({
      by: ['status'],
      where: { liveClass: { scheduledAt: { gte: weekAgo } } },
      _count: true,
    });
    const marks = Object.fromEntries(attendance.map((a) => [a.status, a._count]));
    const marked = Object.values(marks).reduce((a: number, b: any) => a + b, 0);
    const present = (marks.PRESENT ?? 0) + (marks.LATE ?? 0);

    return {
      activeBatches,
      activeEnrollments,
      classesThisWeek,
      pendingReview: pendingAssignments + pendingProjects,
      pendingAssignments,
      pendingProjects,
      openTickets,
      overdueTickets,
      lessonsThisWeek,
      attendanceRate: marked ? Math.round((present / marked) * 100) : null,
      attendanceMarked: marked,
    };
  }

  /** Per-batch delivery health, which is what a manager actually scans. */
  async batches() {
    const batches = await this.prisma.batch.findMany({
      where: { status: { in: ['ENROLLING', 'RUNNING'] } },
      orderBy: { startDate: 'asc' },
      include: {
        course: { select: { id: true, title: true } },
        trainer: { select: { name: true } },
        members: { select: { userId: true } },
        liveClasses: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, scheduledAt: true, status: true },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    const now = new Date();

    return Promise.all(
      batches.map(async (batch) => {
        const userIds = batch.members.map((m) => m.userId);
        const classIds = batch.liveClasses.map((c) => c.id);

        const [lessonTotal, completed, attendance] = await Promise.all([
          this.prisma.lesson.count({
            where: { isPublished: true, module: { courseId: batch.courseId } },
          }),
          userIds.length
            ? this.prisma.lessonProgress.count({
                where: {
                  userId: { in: userIds },
                  isCompleted: true,
                  lesson: { module: { courseId: batch.courseId } },
                },
              })
            : 0,
          classIds.length
            ? this.prisma.classAttendance.groupBy({
                by: ['status'],
                where: { liveClassId: { in: classIds } },
                _count: true,
              })
            : [],
        ]);

        const marks = Object.fromEntries(attendance.map((a: any) => [a.status, a._count]));
        const marked = Object.values(marks).reduce((a: number, b: any) => a + b, 0);
        const present = (marks.PRESENT ?? 0) + (marks.LATE ?? 0);

        const possible = lessonTotal * userIds.length;
        const nextClass = batch.liveClasses.find(
          (c) => new Date(c.scheduledAt) > now,
        );

        return {
          id: batch.id,
          name: batch.name,
          batchCode: batch.batchCode,
          status: batch.status,
          course: batch.course,
          trainer: batch.trainer?.name ?? null,
          students: userIds.length,
          capacity: batch.capacity,
          completionRate: possible ? Math.round((completed / possible) * 100) : null,
          attendanceRate: marked ? Math.round((present / marked) * 100) : null,
          classesHeld: batch.liveClasses.filter((c) => c.status === 'COMPLETED').length,
          classesScheduled: batch.liveClasses.length,
          nextClassAt: nextClass?.scheduledAt ?? null,
        };
      }),
    );
  }

  /**
   * Students who have gone quiet or are missing classes.
   * This is the blueprint's "risk alerts" and inactivity monitoring.
   */
  async atRisk() {
    const cutoff = new Date(Date.now() - INACTIVE_DAYS * 86400_000);

    const members = await this.prisma.batchMember.findMany({
      where: { batch: { status: { in: ['ENROLLING', 'RUNNING'] } } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    const rows = await Promise.all(
      members.map(async (m) => {
        const [lastLesson, attendance, openTickets] = await Promise.all([
          this.prisma.lessonProgress.findFirst({
            where: { userId: m.userId, isCompleted: true },
            orderBy: { completedAt: 'desc' },
            select: { completedAt: true },
          }),
          this.prisma.classAttendance.groupBy({
            by: ['status'],
            where: { userId: m.userId },
            _count: true,
          }),
          this.prisma.supportTicket.count({
            where: {
              userId: m.userId,
              status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_STUDENT'] },
            },
          }),
        ]);

        const marks = Object.fromEntries(attendance.map((a) => [a.status, a._count]));
        const total = Object.values(marks).reduce((a: number, b: any) => a + b, 0);
        const present = (marks.PRESENT ?? 0) + (marks.LATE ?? 0);
        const rate = total ? Math.round((present / total) * 100) : null;

        const reasons: string[] = [];
        if (!lastLesson?.completedAt) {
          reasons.push('No lessons completed yet');
        } else if (lastLesson.completedAt < cutoff) {
          const days = Math.floor(
            (Date.now() - lastLesson.completedAt.getTime()) / 86400_000,
          );
          reasons.push(`No lesson for ${days} days`);
        }
        // Needs a few classes before a rate means anything.
        if (total >= 3 && rate !== null && rate < LOW_ATTENDANCE) {
          reasons.push(`Attendance ${rate}%`);
        }
        if (marks.ABSENT >= 3) reasons.push(`${marks.ABSENT} classes missed`);

        return {
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          batch: m.batch,
          lastActiveAt: lastLesson?.completedAt ?? null,
          attendanceRate: rate,
          classesMissed: marks.ABSENT ?? 0,
          openTickets,
          reasons,
        };
      }),
    );

    return rows
      .filter((r) => r.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length);
  }
}
