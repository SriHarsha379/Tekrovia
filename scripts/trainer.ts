/**
 * Walks the trainer/admin authoring path and asserts each step.
 * Usage: pnpm tsx scripts/trainer.ts
 *
 * Creates its own admin and student, its own course, and deletes
 * everything afterwards. Safe to run repeatedly.
 */
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001/api/v1';
const prisma = new PrismaClient();

const stamp = Date.now();
const ADMIN = `trainer+${stamp}@test.local`;
const STUDENT = `pupil+${stamp}@test.local`;
const PASSWORD = 'TrainerPass123!';
const COURSE_TITLE = `Authoring test ${stamp}`;

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
         console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function api(path: string, init: RequestInit = {}, token?: string) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

async function signIn(email: string, phone: string, name: string) {
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, phone, name, password: PASSWORD }),
  });
  const login = await api('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password: PASSWORD }),
  });
  const otp = login.body?.otp;
  if (!otp) throw new Error(`no OTP for ${email} — is ALLOW_DEV_OTP_RESPONSE set?`);
  const verify = await api('/auth/verify-otp', {
    method: 'POST', body: JSON.stringify({ email, otp }),
  });
  if (!verify.body?.accessToken) throw new Error(`login failed for ${email}`);
  return verify.body.accessToken as string;
}

async function main() {
  console.log(`\nTrainer authoring path — ${COURSE_TITLE}\n`);

  // Two accounts: one promoted to admin, one left as a student.
  const studentToken = await signIn(
    STUDENT, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`, 'Test Pupil');
  await signIn(ADMIN, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`, 'Test Trainer');
  await prisma.user.update({ where: { email: ADMIN }, data: { role: 'ADMIN' } });
  // Re-authenticate so the session carries the new role.
  const adminToken = await (async () => {
    const login = await api('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: ADMIN, password: PASSWORD }),
    });
    const verify = await api('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN, otp: login.body.otp }),
    });
    return verify.body.accessToken as string;
  })();

  console.log('1. Authorization');
  const forbidden = await api('/courses/admin', {}, studentToken);
  check('a student cannot list admin courses', forbidden.status === 403,
    `got ${forbidden.status}`);

  const cpForbidden = await api('/checkpoints/admin', {
    method: 'POST', body: JSON.stringify({ courseId: 'x', title: 'x',
      fromModuleOrder: 0, toModuleOrder: 0 }),
  }, studentToken);
  check('a student cannot create a checkpoint', cpForbidden.status === 403,
    `got ${cpForbidden.status}`);

  console.log('\n2. Course creation');
  const created = await api('/courses/admin', {
    method: 'POST',
    body: JSON.stringify({
      title: COURSE_TITLE,
      category: 'Testing',
      description: 'Created by the trainer path script.',
      duration: '2 weeks',
      level: 'beginner',
      price: 0,
      learningOutcomes: ['Verify authoring works'],
      curriculum: [
        { module: 'Module One', topics: ['Lesson 1A', 'Lesson 1B'] },
        { module: 'Module Two', topics: ['Lesson 2A'] },
      ],
      status: 'DRAFT',
    }),
  }, adminToken);
  check('course created as a draft', created.status < 300, `got ${created.status}`);
  const courseId = created.body?.id;
  if (!courseId) throw new Error('no course id returned');

  const fresh = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { orderBy: { sortOrder: 'asc' },
                          include: { lessons: { orderBy: { sortOrder: 'asc' } } } } },
  });
  check('curriculum became real modules', fresh?.modules.length === 2,
    `${fresh?.modules.length} modules`);
  check('curriculum became real lessons',
    fresh?.modules.flatMap((m) => m.lessons).length === 3,
    `${fresh?.modules.flatMap((m) => m.lessons).length} lessons`);

  console.log('\n3. Draft visibility');
  const published = await api('/courses', {}, studentToken);
  check('a draft course is not listed publicly',
    Array.isArray(published.body) &&
      !published.body.some((c: any) => c.id === courseId));

  console.log('\n4. Lesson video and notes');
  const firstLesson = fresh!.modules[0].lessons[0];
  const badVideo = await api(`/courses/admin/lessons/${firstLesson.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: firstLesson.title, videoUrl: 'javascript:alert(1)' }),
  }, adminToken);
  check('an unsafe video link is rejected', badVideo.status >= 400,
    `got ${badVideo.status}`);

  for (const lesson of fresh!.modules.flatMap((m) => m.lessons)) {
    await api(`/courses/admin/lessons/${lesson.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: lesson.title,
        duration: '0:15',
        content: 'Notes for ' + lesson.title,
        videoUrl: 'https://example.org/video.mp4',
      }),
    }, adminToken);
  }
  const withVideo = await prisma.lesson.count({
    where: { module: { courseId }, videoUrl: { not: null } },
  });
  check('all lessons have a video', withVideo === 3, `${withVideo}/3`);

  console.log('\n5. Checkpoint authoring');
  const cp = await api('/checkpoints/admin', {
    method: 'POST',
    body: JSON.stringify({
      courseId, title: 'Gate after module one',
      fromModuleOrder: 0, toModuleOrder: 0, passMarkPercent: 50,
    }),
  }, adminToken);
  check('checkpoint created', cp.status < 300, `got ${cp.status}`);
  const cpId = cp.body?.id;

  const clash = await api('/checkpoints/admin', {
    method: 'POST',
    body: JSON.stringify({
      courseId, title: 'Second gate on the same module',
      fromModuleOrder: 0, toModuleOrder: 0,
    }),
  }, adminToken);
  check('two gates on one module are refused', clash.status >= 400,
    `got ${clash.status}`);

  const earlyPublish = await api(`/checkpoints/admin/${cpId}`, {
    method: 'PATCH', body: JSON.stringify({ isPublished: true }),
  }, adminToken);
  check('an empty checkpoint cannot be published', earlyPublish.status >= 400,
    `got ${earlyPublish.status}`);

  const q = await api(`/checkpoints/admin/${cpId}/questions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: 'Does authoring work?',
      options: ['No', 'Yes'],
      correctIndex: 1,
      explanation: 'It does.',
      lessonId: firstLesson.id,
    }),
  }, adminToken);
  check('question added', q.status < 300, `got ${q.status}`);

  const badQ = await api(`/checkpoints/admin/${cpId}/questions`, {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Bad', options: ['Only one'], correctIndex: 0 }),
  }, adminToken);
  check('a question with one option is refused', badQ.status >= 400,
    `got ${badQ.status}`);

  const outOfRange = await api(`/checkpoints/admin/${cpId}/questions`, {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Bad', options: ['A', 'B'], correctIndex: 5 }),
  }, adminToken);
  check('a correct answer outside the options is refused', outOfRange.status >= 400,
    `got ${outOfRange.status}`);

  const nowPublish = await api(`/checkpoints/admin/${cpId}`, {
    method: 'PATCH', body: JSON.stringify({ isPublished: true }),
  }, adminToken);
  check('a checkpoint with questions publishes', nowPublish.status < 300,
    `got ${nowPublish.status}`);

  console.log('\n6. Publish and verify as a student');
  const pub = await api(`/courses/admin/${courseId}/publish`, {
    method: 'PATCH',
  }, adminToken);
  check('course published', pub.status < 300, `got ${pub.status}`);

  const listed = await api('/courses', {}, studentToken);
  check('published course is now listed',
    Array.isArray(listed.body) && listed.body.some((c: any) => c.id === courseId));

  const pupil = await prisma.user.findUnique({ where: { email: STUDENT } });
  await prisma.enrollment.create({
    data: { userId: pupil!.id, courseId },
  });
  const gate = await api(`/checkpoints/courses/${courseId}`, {}, studentToken);
  check('the authored checkpoint reaches the student',
    Array.isArray(gate.body) && gate.body.length === 1);
  check('it is locked until the lessons are done',
    gate.body?.[0]?.unlocked === false);

  console.log('\n7. Deletion guard');
  const unattempted = await api(`/checkpoints/admin/${cpId}`, { method: 'DELETE' }, adminToken);
  check('an unattempted checkpoint can be deleted', unattempted.status < 300,
    `got ${unattempted.status}`);

  // Rebuild it, then record an attempt directly: going through the API
  // would be refused, since the gate is still locked.
  const cp2 = await api('/checkpoints/admin', {
    method: 'POST',
    body: JSON.stringify({
      courseId, title: 'Gate with history',
      fromModuleOrder: 0, toModuleOrder: 0, passMarkPercent: 50,
    }),
  }, adminToken);
  await prisma.checkpointAttempt.create({
    data: {
      checkpointId: cp2.body.id,
      userId: pupil!.id,
      attemptNumber: 1,
      totalQuestions: 1,
      status: 'IN_PROGRESS',
    },
  });
  const del = await api(`/checkpoints/admin/${cp2.body.id}`, { method: 'DELETE' }, adminToken);
  check('an attempted checkpoint cannot be deleted', del.status >= 400,
    `got ${del.status}`);

  // Clean up
  await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN, STUDENT] } } });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exitCode = 1;
  }
}

main()
  .catch(async (e) => {
    console.error('\nAborted:', e.message);
    await prisma.course.deleteMany({ where: { title: COURSE_TITLE } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { in: [ADMIN, STUDENT] } } }).catch(() => {});
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
