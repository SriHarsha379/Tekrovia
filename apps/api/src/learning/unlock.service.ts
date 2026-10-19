import { Injectable } from '@nestjs/common';
import { CheckpointAttemptStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Server-side gating. A module is locked when a published checkpoint that
 * ends before it has no PASSED attempt by this user. The UI may mirror this,
 * but it is never the source of truth.
 */
@Injectable()
export class UnlockService {
  constructor(private readonly prisma: PrismaService) {}

  async firstBlockingModuleOrder(
    userId: string,
    courseId: string,
  ): Promise<number | null> {
    const [checkpoints, passed] = await Promise.all([
      this.prisma.checkpoint.findMany({
        where: { courseId, isPublished: true },
        select: { id: true, toModuleOrder: true },
        orderBy: { toModuleOrder: 'asc' },
      }),
      this.prisma.checkpointAttempt.findMany({
        where: {
          userId,
          status: CheckpointAttemptStatus.PASSED,
          checkpoint: { courseId },
        },
        select: { checkpointId: true },
      }),
    ]);

    const passedIds = new Set(passed.map((a) => a.checkpointId));
    const blocking = checkpoints.find((c) => !passedIds.has(c.id));
    return blocking ? blocking.toModuleOrder : null;
  }

  isModuleLocked(moduleOrder: number, blockingOrder: number | null): boolean {
    return blockingOrder !== null && moduleOrder > blockingOrder;
  }

  /** A checkpoint opens only once every lesson in its range is complete. */
  async isCheckpointAvailable(
    userId: string,
    checkpointId: string,
  ): Promise<boolean> {
    const cp = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: {
        courseId: true,
        fromModuleOrder: true,
        toModuleOrder: true,
      },
    });
    if (!cp) return false;

    const blocking = await this.firstBlockingModuleOrder(userId, cp.courseId);
    if (blocking !== null && cp.fromModuleOrder > blocking) return false;

    const lessons = await this.prisma.lesson.findMany({
      where: {
        isPublished: true,
        module: {
          courseId: cp.courseId,
          sortOrder: { gte: cp.fromModuleOrder, lte: cp.toModuleOrder },
        },
      },
      select: { id: true },
    });
    if (lessons.length === 0) return false;

    const done = await this.prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lessonId: { in: lessons.map((l) => l.id) },
      },
    });
    return done === lessons.length;
  }
}
