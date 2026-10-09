import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: { title: 'Full Stack Web Development' },
    include: { modules: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!course) {
    throw new Error('Seed the course first.');
  }

  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: course.id } },
    orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    select: { id: true, title: true },
  });

  const lessonByTitle = new Map(
    lessons.map((lesson) => [lesson.title, lesson.id]),
  );

  const existing = await prisma.checkpoint.findFirst({
    where: { courseId: course.id, sortOrder: 0 },
  });

  if (existing) {
    console.log('Checkpoint already seeded:', existing.title);
    return;
  }

  const checkpoint = await prisma.checkpoint.create({
    data: {
      courseId: course.id,
      title: 'Checkpoint 1: Foundations',
      description:
        'Covers JavaScript foundations and your first React components. Score 80% or above to continue.',
      sortOrder: 0,
      fromModuleOrder: 0,
      toModuleOrder: 1,
      passMarkPercent: 80,
      isPublished: true,
      questions: {
        create: [
          {
            sortOrder: 0,
            prompt:
              'Which of these correctly declares a variable that cannot be reassigned?',
            options: [
              'let total = 10;',
              'const total = 10;',
              'var total = 10;',
              'total := 10;',
            ],
            correctIndex: 1,
            explanation:
              'const creates a binding that cannot be reassigned. let and var both allow reassignment.',
            lessonId: lessonByTitle.get('Values, Types and Variables') ?? null,
          },
          {
            sortOrder: 1,
            prompt: 'What does a function return when it has no return statement?',
            options: ['null', '0', 'undefined', 'An empty string'],
            correctIndex: 2,
            explanation:
              'A JavaScript function without an explicit return evaluates to undefined.',
            lessonId: lessonByTitle.get('Functions and Scope') ?? null,
          },
          {
            sortOrder: 2,
            prompt:
              'Given const nums = [1,2,3,4], what does nums.filter(n => n % 2 === 0) produce?',
            options: ['[1,3]', '[2,4]', '[1,2,3,4]', '[]'],
            correctIndex: 1,
            explanation:
              'filter keeps the elements where the callback returns true, so the even numbers remain.',
            lessonId: lessonByTitle.get('Arrays and Objects') ?? null,
          },
          {
            sortOrder: 3,
            prompt: 'In React, what are props used for?',
            options: [
              'Storing data that changes inside a component',
              'Passing data from a parent component to a child',
              'Styling a component',
              'Connecting directly to a database',
            ],
            correctIndex: 1,
            explanation:
              'Props pass data down from parent to child. Data that changes within a component belongs in state.',
            lessonId: lessonByTitle.get('Components and Props') ?? null,
          },
          {
            sortOrder: 4,
            prompt: 'When does a useEffect with an empty dependency array run?',
            options: [
              'On every render',
              'Only once, after the first render',
              'Never',
              'Only when props change',
            ],
            correctIndex: 1,
            explanation:
              'An empty dependency array means the effect has no dependencies to watch, so it runs once after mounting.',
            lessonId: lessonByTitle.get('State and Effects') ?? null,
          },
        ],
      },
    },
    include: { questions: true },
  });

  console.log('Checkpoint seeded:', {
    title: checkpoint.title,
    questions: checkpoint.questions.length,
    modules: `${checkpoint.fromModuleOrder}-${checkpoint.toModuleOrder}`,
    passMark: `${checkpoint.passMarkPercent}%`,
  });
}

main()
  .catch((error) => {
    console.error('Checkpoint seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
