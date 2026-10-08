import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'TestPass123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tekrovia.dev' },
    update: { passwordHash },
    create: {
      email: 'admin@tekrovia.dev',
      phone: '+919999999999',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const candidate = await prisma.candidate.upsert({
    where: { email: 'demo.student@tekrovia.dev' },
    update: {},
    create: {
      candidateCode: 'TKR-2026-000001',
      fullName: 'Demo Student',
      email: 'demo.student@tekrovia.dev',
      phone: '+919876543210',
      education: 'BACHELORS',
      graduationYear: 2024,
      experienceYears: 0,
      skills: ['JavaScript', 'React', 'Node.js'],
      targetRole: 'Full Stack Developer',
      codingPreference: 'JavaScript',
      courseInterest: 'Technology Training',
      campaignSource: 'website',
      consentGiven: true,
      user: {
        create: {
          email: 'demo.student@tekrovia.dev',
          phone: '+919876543210',
          name: 'Demo Student',
          passwordHash,
          role: 'STUDENT',
          isVerified: true,
        },
      },
    },
    include: { user: true },
  });

  await prisma.lead.upsert({
    where: { leadCode: 'LEAD-2026-000001' },
    update: {},
    create: {
      leadCode: 'LEAD-2026-000001',
      name: 'Lead Prospect',
      email: 'lead@tekrovia.dev',
      phone: '+919988776655',
      courseInterest: 'Technology Training',
      source: 'website',
      utmSource: 'google',
      status: 'NEW',
      consentGiven: true,
    },
  });

  // --- Course content ---

  const existingCourse = await prisma.course.findFirst({
    where: { title: 'Full Stack Web Development' },
  });

  const course =
    existingCourse ??
    (await prisma.course.create({
      data: {
        title: 'Full Stack Web Development',
        category: 'Technology Training',
        description:
          'Build and deploy production web applications with JavaScript, React and Node.js.',
        duration: '12 weeks',
        level: 'beginner',
        price: 9999,
        learningOutcomes: [
          'Write modern JavaScript with confidence',
          'Build React interfaces from a design',
          'Create and consume REST APIs',
          'Deploy a full stack application',
        ],
        status: 'PUBLISHED',
        modules: {
          create: [
            {
              title: 'JavaScript Foundations',
              description: 'The language fundamentals everything else builds on.',
              sortOrder: 0,
              lessons: {
                create: [
                  {
                    title: 'Values, Types and Variables',
                    description: 'How JavaScript stores and labels data.',
                    duration: '45 min',
                    sortOrder: 0,
                    isPublished: true,
                  },
                  {
                    title: 'Functions and Scope',
                    description: 'Writing reusable logic and understanding scope.',
                    duration: '50 min',
                    sortOrder: 1,
                    isPublished: true,
                  },
                  {
                    title: 'Arrays and Objects',
                    description: 'Working with collections and structured data.',
                    duration: '55 min',
                    sortOrder: 2,
                    isPublished: true,
                  },
                ],
              },
            },
            {
              title: 'Building Interfaces with React',
              description: 'Componentised UI development.',
              sortOrder: 1,
              lessons: {
                create: [
                  {
                    title: 'Components and Props',
                    description: 'Breaking an interface into reusable pieces.',
                    duration: '50 min',
                    sortOrder: 0,
                    isPublished: true,
                  },
                  {
                    title: 'State and Effects',
                    description: 'Managing data that changes over time.',
                    duration: '60 min',
                    sortOrder: 1,
                    isPublished: true,
                  },
                ],
              },
            },
          ],
        },
      },
    }));

  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: course.id } },
    orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  });

  // An assignment on the final lesson of module one.
  const assignmentLesson = lessons[2];

  if (assignmentLesson) {
    await prisma.assignment.upsert({
      where: { lessonId: assignmentLesson.id },
      update: {},
      create: {
        lessonId: assignmentLesson.id,
        title: 'Build a contact list',
        instructions:
          'Create an array of contact objects and render them as a formatted list. Submit a link to your code.',
        isRequired: true,
      },
    });
  }

  // A guided project for the course.
  const existingProject = await prisma.project.findFirst({
    where: { courseId: course.id, sortOrder: 0 },
  });

  if (!existingProject) {
    await prisma.project.create({
      data: {
        courseId: course.id,
        title: 'Task Tracker Application',
        businessProblem:
          'A small team needs a shared place to record and track work items.',
        expectedOutcome:
          'A deployed application where users can create, update and complete tasks.',
        isRequired: true,
        sortOrder: 0,
        milestones: {
          create: [
            {
              title: 'Data model and API',
              description: 'Design the schema and expose CRUD endpoints.',
              sortOrder: 0,
            },
            {
              title: 'User interface',
              description: 'Build the React interface against your API.',
              sortOrder: 1,
            },
            {
              title: 'Deploy and demo',
              description: 'Deploy the application and record a short walkthrough.',
              sortOrder: 2,
              isFinal: true,
            },
          ],
        },
      },
    });
  }

  // --- Enrol the demo student and complete some lessons ---

  const studentUserId = candidate.user.id;

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: studentUserId, courseId: course.id },
    },
    update: {},
    create: {
      userId: studentUserId,
      candidateId: candidate.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });

  for (const lesson of lessons.slice(0, 2)) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: studentUserId, lessonId: lesson.id },
      },
      update: { isCompleted: true, completedAt: new Date() },
      create: {
        userId: studentUserId,
        lessonId: lesson.id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  console.log('Seed complete:', {
    admin: admin.email,
    student: candidate.email,
    password: DEMO_PASSWORD,
    course: course.title,
    lessons: lessons.length,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
