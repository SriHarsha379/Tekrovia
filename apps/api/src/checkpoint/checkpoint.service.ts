import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface SubmittedAnswer {
  questionId: string;
  answerIndex: number;
}

@Injectable()
export class CheckpointService {
  constructor(private readonly prisma: PrismaService) {}

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });

    if (!enrollment || enrollment.status === 'CANCELLED') {
      throw new ForbiddenException(
        'You are not enrolled in this course.',
      );
    }
  }

  /**
   * A checkpoint opens once every published lesson in the modules it
   * covers has been completed.
   */
  private async isUnlocked(
    userId: string,
    checkpoint: { courseId: string; fromModuleOrder: number; toModuleOrder: number },
  ) {
    const lessonWhere: Prisma.LessonWhereInput = {
      isPublished: true,
      module: {
        courseId: checkpoint.courseId,
        sortOrder: {
          gte: checkpoint.fromModuleOrder,
          lte: checkpoint.toModuleOrder,
        },
      },
    };

    const [total, completed] = await Promise.all([
      this.prisma.lesson.count({ where: lessonWhere }),
      this.prisma.lessonProgress.count({
        where: { userId, isCompleted: true, lesson: lessonWhere },
      }),
    ]);

    return {
      unlocked: total > 0 && completed === total,
      lessonsTotal: total,
      lessonsCompleted: completed,
    };
  }

  async listForCourse(userId: string, courseId: string) {
    await this.assertEnrolled(userId, courseId);

    const checkpoints = await this.prisma.checkpoint.findMany({
      where: { courseId, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { userId },
          orderBy: { attemptNumber: 'desc' },
        },
      },
    });

    return Promise.all(
      checkpoints.map(async (checkpoint) => {
        const progress = await this.isUnlocked(userId, checkpoint);
        const passed = checkpoint.attempts.some(
          (attempt) => attempt.status === 'PASSED',
        );
        const best = checkpoint.attempts.reduce<number | null>(
          (highest, attempt) =>
            attempt.scorePercent === null || attempt.scorePercent === undefined
              ? highest
              : highest === null
                ? attempt.scorePercent
                : Math.max(highest, attempt.scorePercent),
          null,
        );

        return {
          id: checkpoint.id,
          title: checkpoint.title,
          description: checkpoint.description,
          sortOrder: checkpoint.sortOrder,
          fromModuleOrder: checkpoint.fromModuleOrder,
          toModuleOrder: checkpoint.toModuleOrder,
          passMarkPercent: checkpoint.passMarkPercent,
          questionCount: checkpoint._count.questions,
          unlocked: progress.unlocked,
          lessonsCompleted: progress.lessonsCompleted,
          lessonsTotal: progress.lessonsTotal,
          passed,
          bestScorePercent: best,
          attemptCount: checkpoint.attempts.length,
        };
      }),
    );
  }

  /**
   * Starts an attempt and returns the questions in a random order.
   * Correct answers are never sent to the client.
   */
  async startAttempt(userId: string, checkpointId: string) {
    const checkpoint = await this.prisma.checkpoint.findFirst({
      where: { id: checkpointId, isPublished: true },
      include: { questions: true },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found.');
    }

    await this.assertEnrolled(userId, checkpoint.courseId);

    const progress = await this.isUnlocked(userId, checkpoint);

    if (!progress.unlocked) {
      throw new ForbiddenException(
        `Complete all ${progress.lessonsTotal} lessons in this section before taking the checkpoint.`,
      );
    }

    if (checkpoint.questions.length === 0) {
      throw new ConflictException(
        'This checkpoint has no questions yet.',
      );
    }

    const last = await this.prisma.checkpointAttempt.findFirst({
      where: { checkpointId, userId },
      orderBy: { attemptNumber: 'desc' },
      select: { attemptNumber: true },
    });

    const attempt = await this.prisma.checkpointAttempt.create({
      data: {
        checkpointId,
        userId,
        attemptNumber: (last?.attemptNumber ?? 0) + 1,
        totalQuestions: checkpoint.questions.length,
        status: 'IN_PROGRESS',
      },
    });

    return {
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
      },
      checkpoint: {
        id: checkpoint.id,
        courseId: checkpoint.courseId,
        title: checkpoint.title,
        passMarkPercent: checkpoint.passMarkPercent,
      },
      totalQuestions: checkpoint.questions.length,
      questions: this.shuffle(checkpoint.questions).map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      })),
    };
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    answers: unknown,
  ) {
    if (!Array.isArray(answers)) {
      throw new BadRequestException('answers must be an array.');
    }

    const attempt = await this.prisma.checkpointAttempt.findUnique({
      where: { id: attemptId },
      include: {
        checkpoint: {
          include: {
            questions: {
              include: {
                // Routes a wrong answer back to the lesson that teaches it.
                checkpoint: false,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found.');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('This attempt belongs to another learner.');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException('This attempt has already been submitted.');
    }

    const submitted = answers as SubmittedAnswer[];
    const questions = attempt.checkpoint.questions;

    const lessonIds = questions
      .map((question) => question.lessonId)
      .filter((id): id is string => Boolean(id));

    const lessons = lessonIds.length
      ? await this.prisma.lesson.findMany({
          where: { id: { in: lessonIds } },
          select: { id: true, title: true },
        })
      : [];

    const lessonTitles = new Map(
      lessons.map((lesson) => [lesson.id, lesson.title]),
    );

    const results = questions.map((question) => {
      const answer = submitted.find(
        (item) => item?.questionId === question.id,
      );
      const selectedIndex =
        typeof answer?.answerIndex === 'number' ? answer.answerIndex : null;
      const correct = selectedIndex === question.correctIndex;

      return {
        questionId: question.id,
        prompt: question.prompt,
        selectedIndex,
        correctIndex: question.correctIndex,
        correct,
        explanation: question.explanation,
        reviewLessonId: correct ? null : question.lessonId,
        reviewLessonTitle: correct
          ? null
          : question.lessonId
            ? (lessonTitles.get(question.lessonId) ?? null)
            : null,
      };
    });

    const correctCount = results.filter((item) => item.correct).length;
    const scorePercent = Math.round(
      (correctCount / questions.length) * 100,
    );
    const passed = scorePercent >= attempt.checkpoint.passMarkPercent;

    const updated = await this.prisma.checkpointAttempt.update({
      where: { id: attemptId },
      data: {
        status: passed ? 'PASSED' : 'FAILED',
        correctCount,
        scorePercent,
        completedAt: new Date(),
        responses: results as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      attemptId: updated.id,
      attemptNumber: updated.attemptNumber,
      passed,
      scorePercent,
      correctCount,
      totalQuestions: questions.length,
      passMarkPercent: attempt.checkpoint.passMarkPercent,
      results,
      // Failing is not terminal: the learner retakes until they pass.
      canRetake: !passed,
    };
  }
}
