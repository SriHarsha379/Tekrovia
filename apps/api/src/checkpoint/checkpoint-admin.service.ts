import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CheckpointInput {
  courseId: string;
  title: string;
  description?: string | null;
  fromModuleOrder: number;
  toModuleOrder: number;
  passMarkPercent?: number;
  isPublished?: boolean;
}

export interface QuestionInput {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
  lessonId?: string | null;
}

@Injectable()
export class CheckpointAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full detail including correct answers. Admin eyes only. */
  async listForCourse(courseId: string) {
    return this.prisma.checkpoint.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });
  }

  private validateRange(input: CheckpointInput) {
    if (input.fromModuleOrder > input.toModuleOrder) {
      throw new BadRequestException(
        'The first module cannot come after the last module.',
      );
    }
    const pass = input.passMarkPercent ?? 80;
    if (pass < 1 || pass > 100) {
      throw new BadRequestException('Pass mark must be between 1 and 100.');
    }
  }

  async create(input: CheckpointInput) {
    this.validateRange(input);

    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found.');

    // Two gates ending on the same module would both block it.
    const clash = await this.prisma.checkpoint.findFirst({
      where: {
        courseId: input.courseId,
        toModuleOrder: input.toModuleOrder,
      },
      select: { id: true, title: true },
    });
    if (clash) {
      throw new BadRequestException(
        `"${clash.title}" already gates that module.`,
      );
    }

    const last = await this.prisma.checkpoint.findFirst({
      where: { courseId: input.courseId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.checkpoint.create({
      data: {
        courseId: input.courseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        fromModuleOrder: input.fromModuleOrder,
        toModuleOrder: input.toModuleOrder,
        passMarkPercent: input.passMarkPercent ?? 80,
        isPublished: false,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
      include: { questions: true },
    });
  }

  async update(id: string, input: Partial<CheckpointInput>) {
    const existing = await this.prisma.checkpoint.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!existing) throw new NotFoundException('Checkpoint not found.');

    // Publishing an empty checkpoint would lock students out permanently.
    if (input.isPublished && existing._count.questions === 0) {
      throw new BadRequestException(
        'Add at least one question before publishing.',
      );
    }

    return this.prisma.checkpoint.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.fromModuleOrder !== undefined
          ? { fromModuleOrder: input.fromModuleOrder }
          : {}),
        ...(input.toModuleOrder !== undefined
          ? { toModuleOrder: input.toModuleOrder }
          : {}),
        ...(input.passMarkPercent !== undefined
          ? { passMarkPercent: input.passMarkPercent }
          : {}),
        ...(input.isPublished !== undefined
          ? { isPublished: input.isPublished }
          : {}),
      },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(id: string) {
    const attempts = await this.prisma.checkpointAttempt.count({
      where: { checkpointId: id },
    });
    if (attempts > 0) {
      throw new BadRequestException(
        'Students have already attempted this checkpoint. Unpublish it instead of deleting it.',
      );
    }
    await this.prisma.checkpoint.delete({ where: { id } });
    return { deleted: true };
  }

  private validateQuestion(input: QuestionInput) {
    const options = (input.options ?? []).map((o) => o.trim());
    if (options.length < 2) {
      throw new BadRequestException('A question needs at least two options.');
    }
    if (options.some((o) => !o)) {
      throw new BadRequestException('Options cannot be blank.');
    }
    if (input.correctIndex < 0 || input.correctIndex >= options.length) {
      throw new BadRequestException(
        'The correct answer must be one of the options.',
      );
    }
    if (!input.prompt?.trim()) {
      throw new BadRequestException('A question needs a prompt.');
    }
    return options;
  }

  async addQuestion(checkpointId: string, input: QuestionInput) {
    const options = this.validateQuestion(input);

    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { id: true },
    });
    if (!checkpoint) throw new NotFoundException('Checkpoint not found.');

    const last = await this.prisma.checkpointQuestion.findFirst({
      where: { checkpointId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.checkpointQuestion.create({
      data: {
        checkpointId,
        prompt: input.prompt.trim(),
        options,
        correctIndex: input.correctIndex,
        explanation: input.explanation?.trim() || null,
        lessonId: input.lessonId || null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateQuestion(questionId: string, input: QuestionInput) {
    const options = this.validateQuestion(input);
    const existing = await this.prisma.checkpointQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Question not found.');

    return this.prisma.checkpointQuestion.update({
      where: { id: questionId },
      data: {
        prompt: input.prompt.trim(),
        options,
        correctIndex: input.correctIndex,
        explanation: input.explanation?.trim() || null,
        lessonId: input.lessonId || null,
      },
    });
  }

  async removeQuestion(questionId: string) {
    await this.prisma.checkpointQuestion.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  /** Lessons in a checkpoint's range, for the "revise this" dropdown. */
  async lessonsInRange(checkpointId: string) {
    const cp = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { courseId: true, fromModuleOrder: true, toModuleOrder: true },
    });
    if (!cp) throw new NotFoundException('Checkpoint not found.');

    return this.prisma.lesson.findMany({
      where: {
        module: {
          courseId: cp.courseId,
          sortOrder: { gte: cp.fromModuleOrder, lte: cp.toModuleOrder },
        },
      },
      orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      select: {
        id: true,
        title: true,
        module: { select: { title: true, sortOrder: true } },
      },
    });
  }
}
