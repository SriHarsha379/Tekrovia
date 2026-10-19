import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckpointAttemptStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UnlockService } from './unlock.service';
import { UpdateProgressDto } from './dto/progress.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

/** Fraction of a lesson that must be watched before it counts as complete. */
const COMPLETION_RATIO = 0.9;

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unlock: UnlockService,
  ) {}

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    if (!enrollment || enrollment.status === EnrollmentStatus.CANCELLED) {
      throw new ForbiddenException('Not enrolled in this course');
    }
  }

  async courseTree(userId: string, courseId: string) {
    await this.assertEnrolled(userId, courseId);

    const [course, progress, attempts] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          checkpoints: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.lessonProgress.findMany({ where: { userId } }),
      this.prisma.checkpointAttempt.findMany({
        where: { userId, checkpoint: { courseId } },
        orderBy: { attemptNumber: 'desc' },
      }),
    ]);
    if (!course) throw new NotFoundException('Course not found');

    const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
    const bestByCheckpoint = new Map<string, number>();
    for (const a of attempts) {
      const best = bestByCheckpoint.get(a.checkpointId) ?? 0;
      bestByCheckpoint.set(a.checkpointId, Math.max(best, a.scorePercent ?? 0));
    }
    const passedIds = new Set(
      attempts
        .filter((a) => a.status === CheckpointAttemptStatus.PASSED)
        .map((a) => a.checkpointId),
    );
    const blocking = await this.unlock.firstBlockingModuleOrder(
      userId,
      courseId,
    );

    return {
      id: course.id,
      title: course.title,
      modules: course.modules.map((m) => {
        const locked = this.unlock.isModuleLocked(m.sortOrder, blocking);
        return {
          id: m.id,
          title: m.title,
          sortOrder: m.sortOrder,
          locked,
          lessons: m.lessons.map((l) => {
            const p = progressByLesson.get(l.id);
            return {
              id: l.id,
              title: l.title,
              duration: l.duration,
              sortOrder: l.sortOrder,
              locked,
              isCompleted: p?.isCompleted ?? false,
              lastPositionSeconds: p?.lastPositionSeconds ?? 0,
            };
          }),
          // The gate that sits immediately after this module, if any.
          checkpoint:
            course.checkpoints
              .filter((c) => c.toModuleOrder === m.sortOrder)
              .map((c) => ({
                id: c.id,
                title: c.title,
                passMarkPercent: c.passMarkPercent,
                passed: passedIds.has(c.id),
                bestScorePercent: bestByCheckpoint.get(c.id) ?? null,
              }))[0] ?? null,
        };
      }),
    };
  }

  async updateProgress(
    userId: string,
    lessonId: string,
    dto: UpdateProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true, sortOrder: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.assertEnrolled(userId, lesson.module.courseId);

    const blocking = await this.unlock.firstBlockingModuleOrder(
      userId,
      lesson.module.courseId,
    );
    if (this.unlock.isModuleLocked(lesson.module.sortOrder, blocking)) {
      throw new ForbiddenException('Pass the previous checkpoint first');
    }

    const totalSeconds = this.parseDuration(lesson.duration);
    const isCompleted =
      totalSeconds > 0 &&
      dto.watchedSeconds >= Math.floor(totalSeconds * COMPLETION_RATIO);

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        watchedSeconds: dto.watchedSeconds,
        lastPositionSeconds: dto.lastPositionSeconds,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        // Never let a rewind reduce credit already earned.
        watchedSeconds: { set: dto.watchedSeconds },
        lastPositionSeconds: dto.lastPositionSeconds,
        ...(isCompleted ? { isCompleted: true, completedAt: new Date() } : {}),
      },
    });
  }

  /** Accepts "12:30", "12m", or a plain number of seconds. */
  private parseDuration(raw: string | null): number {
    if (!raw) return 0;
    if (/^\d+:\d{1,2}$/.test(raw)) {
      const [m, s] = raw.split(':').map(Number);
      return m * 60 + s;
    }
    const mins = raw.match(/^(\d+)\s*m/i);
    if (mins) return Number(mins[1]) * 60;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  /** Questions WITHOUT correctIndex. Never leak the answer key. */
  async startAttempt(userId: string, checkpointId: string) {
    const available = await this.unlock.isCheckpointAvailable(
      userId,
      checkpointId,
    );
    if (!available) {
      throw new ForbiddenException('Finish the lessons in this section first');
    }

    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!checkpoint) throw new NotFoundException('Checkpoint not found');
    if (checkpoint.questions.length === 0) {
      throw new BadRequestException('Checkpoint has no questions');
    }

    const prior = await this.prisma.checkpointAttempt.count({
      where: { checkpointId, userId },
    });

    const attempt = await this.prisma.checkpointAttempt.create({
      data: {
        checkpointId,
        userId,
        attemptNumber: prior + 1,
        totalQuestions: checkpoint.questions.length,
        status: CheckpointAttemptStatus.IN_PROGRESS,
      },
    });

    return {
      attemptId: attempt.id,
      title: checkpoint.title,
      passMarkPercent: checkpoint.passMarkPercent,
      questions: checkpoint.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
      })),
    };
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    dto: SubmitAttemptDto,
  ) {
    const attempt = await this.prisma.checkpointAttempt.findUnique({
      where: { id: attemptId },
      include: {
        checkpoint: {
          include: { questions: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== CheckpointAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt already submitted');
    }

    const chosen = new Map(dto.answers.map((a) => [a.questionId, a.selectedIndex]));
    const responses = attempt.checkpoint.questions.map((q) => {
      const selectedIndex = chosen.get(q.id) ?? null;
      return {
        questionId: q.id,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect: selectedIndex === q.correctIndex,
        explanation: q.explanation,
        reviewLessonId: q.lessonId,
      };
    });

    const correctCount = responses.filter((r) => r.isCorrect).length;
    const scorePercent = Math.round(
      (correctCount / attempt.checkpoint.questions.length) * 100,
    );
    const status =
      scorePercent >= attempt.checkpoint.passMarkPercent
        ? CheckpointAttemptStatus.PASSED
        : CheckpointAttemptStatus.FAILED;

    const saved = await this.prisma.checkpointAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        correctCount,
        scorePercent,
        responses,
        completedAt: new Date(),
      },
    });

    return {
      attemptId: saved.id,
      status: saved.status,
      scorePercent,
      correctCount,
      totalQuestions: attempt.totalQuestions,
      passMarkPercent: attempt.checkpoint.passMarkPercent,
      // Lessons to revise, from the questions they got wrong.
      reviseLessonIds: [
        ...new Set(
          responses
            .filter((r) => !r.isCorrect && r.reviewLessonId)
            .map((r) => r.reviewLessonId as string),
        ),
      ],
      responses,
    };
  }
}
