import { PrismaClient, CourseLevel, CourseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.create({
    data: {
      title: 'GenAI Foundations',
      category: 'AI',
      description: 'Concept videos, labs and checkpoints.',
      duration: '6 weeks',
      level: CourseLevel.beginner,
      status: CourseStatus.PUBLISHED,
      learningOutcomes: ['Understand LLMs', 'Build a GenAI app'],
    },
  });

  const titles = [
    ['What is a large language model', 'Tokens and context windows',
     'Prompting basics', 'Temperature and sampling', 'Hands-on: first API call'],
    ['Embeddings explained', 'Vector stores', 'Retrieval augmented generation',
     'Chunking strategies', 'Hands-on: build a RAG app'],
  ];

  const lessonIds: string[][] = [];

  for (const [mi, group] of titles.entries()) {
    const mod = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        title: mi === 0 ? 'LLM Fundamentals' : 'Retrieval',
        sortOrder: mi,
      },
    });
    const ids: string[] = [];
    for (const [li, title] of group.entries()) {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          title,
          duration: '10:00',
          sortOrder: li,
          isPublished: true,
          videoUrl: 'https://example.com/placeholder.m3u8',
        },
      });
      ids.push(lesson.id);
    }
    lessonIds.push(ids);
  }

  const checkpoint = await prisma.checkpoint.create({
    data: {
      courseId: course.id,
      title: 'Checkpoint 1 — LLM Fundamentals',
      sortOrder: 0,
      fromModuleOrder: 0,
      toModuleOrder: 0,
      passMarkPercent: 80,
      isPublished: true,
    },
  });

  const questions = [
    { prompt: 'What does a token represent?',
      options: ['A word', 'A chunk of characters', 'A sentence', 'A file'],
      correctIndex: 1, lesson: 1,
      explanation: 'Tokens are sub-word chunks, not whole words.' },
    { prompt: 'A higher temperature makes output...',
      options: ['More deterministic', 'More varied', 'Shorter', 'Faster'],
      correctIndex: 1, lesson: 3,
      explanation: 'Temperature raises randomness in sampling.' },
    { prompt: 'The context window limits...',
      options: ['Model size', 'Tokens per request', 'Requests per minute', 'Cost'],
      correctIndex: 1, lesson: 1,
      explanation: 'It caps how many tokens fit in one request.' },
    { prompt: 'Few-shot prompting means...',
      options: ['Training the model', 'Giving examples in the prompt',
                'Using fewer tokens', 'Calling the API less'],
      correctIndex: 1, lesson: 2,
      explanation: 'Examples go in the prompt; no training involved.' },
    { prompt: 'Which is NOT a prompting technique?',
      options: ['Chain of thought', 'Few-shot', 'Backpropagation', 'Role prompting'],
      correctIndex: 2, lesson: 2,
      explanation: 'Backpropagation is training, not prompting.' },
  ];

  for (const [i, q] of questions.entries()) {
    await prisma.checkpointQuestion.create({
      data: {
        checkpointId: checkpoint.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        lessonId: lessonIds[0][q.lesson],
        sortOrder: i,
      },
    });
  }

  console.log('Seeded course', course.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
