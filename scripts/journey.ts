/**
 * Walks the full student journey against a running API and asserts each step.
 * Usage: pnpm tsx scripts/journey.ts
 *
 * Requires the API on :3001, a seeded published course, and
 * ALLOW_DEV_OTP_RESPONSE=true so login can complete without email.
 */
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001/api/v1';
const prisma = new PrismaClient();

const EMAIL = `journey+${Date.now()}@test.local`;
const PHONE = `+9199${Math.floor(10000000 + Math.random() * 89999999)}`;
const PASSWORD = 'JourneyPass123!';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
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

async function main() {
  console.log(`\nStudent journey — ${EMAIL}\n`);

  // 1. Register
  console.log('1. Registration');
  const reg = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL, phone: PHONE, name: 'Journey Student', password: PASSWORD,
    }),
  });
  check('register returns 2xx', reg.status < 300, `got ${reg.status} ${JSON.stringify(reg.body)}`);

  // 2. Login -> OTP -> token
  console.log('\n2. Login');
  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const otp = login.body?.otp;
  check('login issues an OTP', Boolean(otp),
    otp ? '' : 'no otp in response — is ALLOW_DEV_OTP_RESPONSE set?');
  if (!otp) throw new Error('cannot continue without an OTP');

  const verify = await api('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, otp }),
  });
  const token = verify.body?.accessToken;
  check('OTP exchanges for an access token', Boolean(token));
  if (!token) throw new Error('cannot continue without a token');

  // 3. A published course to work with
  const course = await prisma.course.findFirst({
    where: { status: 'PUBLISHED' },
    include: {
      modules: { orderBy: { sortOrder: 'asc' },
                 include: { lessons: { where: { isPublished: true },
                                       orderBy: { sortOrder: 'asc' } } } },
      checkpoints: { where: { isPublished: true }, include: { questions: true } },
    },
  });
  if (!course) throw new Error('no published course — seed one first');
  console.log(`\n3. Course: ${course.title}`);

  // 4. Unenrolled access is refused
  const blocked = await api(`/courses/lessons/${course.modules[0].lessons[0].id}`, {}, token);
  check('unenrolled student cannot open a lesson', blocked.status === 403,
    `got ${blocked.status}`);

  // 5. Enrol
  console.log('\n4. Enrolment');
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  await prisma.enrollment.create({
    data: { userId: user!.id, courseId: course.id },
  });
  const tree = await api(`/courses/my/progress`, {}, token);
  check('enrolled course appears in progress', Array.isArray(tree.body) &&
    tree.body.some((c: any) => c.courseId === course.id));

  // 6. Gate is closed before any lessons are done
  console.log('\n5. Gating');
  const cps = await api(`/checkpoints/courses/${course.id}`, {}, token);
  const gate = Array.isArray(cps.body) ? cps.body[0] : null;
  if (!gate) {
    check('course has a published checkpoint', false, 'none found — gating untested');
  } else {
    check('checkpoint is locked before lessons are done', gate.unlocked === false,
      `unlocked=${gate.unlocked}`);

    const early = await api(`/checkpoints/${gate.id}/attempts`, { method: 'POST' }, token);
    check('cannot start the quiz early', early.status === 403, `got ${early.status}`);

    // 7. Watch every lesson in the gated range
    console.log('\n6. Watching lessons');
    const gated = course.modules
      .filter((m) => m.sortOrder >= gate.fromModuleOrder && m.sortOrder <= gate.toModuleOrder)
      .flatMap((m) => m.lessons);

    for (const lesson of gated) {
      const r = await api(`/courses/lessons/${lesson.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ watchedSeconds: 10000, lastPositionSeconds: 10000 }),
      }, token);
      if (r.status >= 300) {
        check(`progress saved for "${lesson.title}"`, false, `got ${r.status}`);
      }
    }
    const done = await prisma.lessonProgress.count({
      where: { userId: user!.id, isCompleted: true,
               lessonId: { in: gated.map((l) => l.id) } },
    });
    check('all gated lessons marked complete', done === gated.length,
      `${done}/${gated.length}`);

    // 8. Gate opens
    const cps2 = await api(`/checkpoints/courses/${course.id}`, {}, token);
    const gate2 = cps2.body?.[0];
    check('checkpoint unlocks once lessons are done', gate2?.unlocked === true);

    // 9. Attempt it, deliberately wrong
    console.log('\n7. Quiz');
    const attempt = await api(`/checkpoints/${gate.id}/attempts`, { method: 'POST' }, token);
    check('quiz starts', attempt.status < 300, `got ${attempt.status}`);
    const questions = attempt.body?.questions ?? [];
    check('quiz returns questions', questions.length > 0);
    check('answer key is NOT sent to the client',
      questions.every((q: any) => q.correctIndex === undefined),
      'correctIndex present in the payload');

    const answerKey = new Map(
      course.checkpoints[0].questions.map((q) => [q.id, q.correctIndex]),
    );

    const wrong = await api(`/checkpoints/attempts/${attempt.body.attempt.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers: questions.map((q: any) => ({
          questionId: q.id,
          answerIndex: ((answerKey.get(q.id) ?? 0) + 1) % q.options.length,
        })),
      }),
    }, token);
    check('a wrong attempt is scored as failed',
      wrong.body?.status === 'FAILED' || wrong.body?.passed === false,
      JSON.stringify(wrong.body)?.slice(0, 120));

    // 10. Next module still locked
    const mid = await api(`/checkpoints/courses/${course.id}`, {}, token);
    check('failing does not unlock the next module', mid.body?.[0]?.passed !== true);

    // 11. Retry correctly
    const retry = await api(`/checkpoints/${gate.id}/attempts`, { method: 'POST' }, token);
    check('quiz can be retaken', retry.status < 300, `got ${retry.status}`);

    const right = await api(`/checkpoints/attempts/${retry.body.attempt.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers: (retry.body.questions ?? []).map((q: any) => ({
          questionId: q.id,
          answerIndex: answerKey.get(q.id) ?? 0,
        })),
      }),
    }, token);
    check('a correct attempt passes',
      right.body?.status === 'PASSED' || right.body?.passed === true,
      JSON.stringify(right.body)?.slice(0, 120));

    // 12. Next module opens
    const after = course.modules.find((m) => m.sortOrder > gate.toModuleOrder);
    if (after?.lessons.length) {
      const open = await api(`/courses/lessons/${after.lessons[0].id}`, {}, token);
      check('passing unlocks the next module', open.status < 300, `got ${open.status}`);
    }
  }

  // 13. Clean up
  await prisma.user.delete({ where: { email: EMAIL } });

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
    await prisma.user.deleteMany({ where: { email: EMAIL } }).catch(() => {});
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
