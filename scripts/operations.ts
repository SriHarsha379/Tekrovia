/**
 * Walks the operational path: batches, live classes, attendance,
 * support tickets and the delivery dashboard.
 * Usage: pnpm tsx scripts/operations.ts
 *
 * Creates its own staff and students, its own batch, and cleans up after.
 */
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL ?? 'http://localhost:3001/api/v1';
const prisma = new PrismaClient();

const stamp = Date.now();
const ADMIN = `ops+${stamp}@test.local`;
const S1 = `ops-a+${stamp}@test.local`;
const S2 = `ops-b+${stamp}@test.local`;
const PASSWORD = 'OpsPass123!';
const BATCH_NAME = `Ops batch ${stamp}`;

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) { passed++; console.log(`  ok   ${name}`); }
  else {
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

async function signIn(email: string, name: string) {
  const phone = `+9196${Math.floor(10000000 + Math.random() * 89999999)}`;
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, phone, name, password: PASSWORD }),
  });
  return authenticate(email);
}

async function authenticate(email: string) {
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
  console.log(`\nOperations path — ${BATCH_NAME}\n`);

  const s1Token = await signIn(S1, 'Ops Student A');
  const s2Token = await signIn(S2, 'Ops Student B');
  await signIn(ADMIN, 'Ops Admin');
  await prisma.user.update({ where: { email: ADMIN }, data: { role: 'ADMIN' } });
  const adminToken = await authenticate(ADMIN);

  const course = await prisma.course.findFirst({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true },
  });
  if (!course) throw new Error('no published course — seed one first');

  console.log('1. Authorization');
  check('a student cannot list batches',
    (await api('/batches', {}, s1Token)).status === 403);
  check('a student cannot see the support queue',
    (await api('/support/queue', {}, s1Token)).status === 403);
  check('a student cannot see delivery data',
    (await api('/delivery/overview', {}, s1Token)).status === 403);

  console.log('\n2. Batches');
  const made = await api('/batches', {
    method: 'POST',
    body: JSON.stringify({
      name: BATCH_NAME, courseId: course.id, capacity: 2,
      schedule: 'Mon-Fri 7pm', startDate: new Date().toISOString().slice(0, 10),
    }),
  }, adminToken);
  check('batch created', made.status < 300, `got ${made.status} ${JSON.stringify(made.body)?.slice(0, 120)}`);
  const batchId = made.body?.id;
  if (!batchId) throw new Error('no batch id returned');

  const badYear = await api('/batches', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bad dates', courseId: course.id,
      startDate: '2026-10-01', endDate: '0027-12-22',
    }),
  }, adminToken);
  check('a mistyped year is rejected', badYear.status >= 400, `got ${badYear.status}`);

  console.log('\n3. Membership');
  const u1 = await prisma.user.findUnique({ where: { email: S1 } });
  const u2 = await prisma.user.findUnique({ where: { email: S2 } });

  check('first student added',
    (await api(`/batches/${batchId}/members`, {
      method: 'POST', body: JSON.stringify({ userId: u1!.id }),
    }, adminToken)).status < 300);

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: u1!.id, courseId: course.id } },
  });
  check('adding to a batch also enrols in the course', Boolean(enrolled));

  await api(`/batches/${batchId}/members`, {
    method: 'POST', body: JSON.stringify({ userId: u2!.id }),
  }, adminToken);

  const third = await prisma.user.findFirst({
    where: { role: 'STUDENT', email: { notIn: [S1, S2] } },
  });
  if (third) {
    const over = await api(`/batches/${batchId}/members`, {
      method: 'POST', body: JSON.stringify({ userId: third.id }),
    }, adminToken);
    check('capacity is enforced', over.status >= 400, `got ${over.status}`);
  }

  const shrink = await api(`/batches/${batchId}`, {
    method: 'PATCH', body: JSON.stringify({ capacity: 1 }),
  }, adminToken);
  check('capacity cannot drop below the headcount', shrink.status >= 400, `got ${shrink.status}`);

  // Delivery only counts batches that are actually in flight.
  const running = await api(`/batches/${batchId}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'RUNNING' }),
  }, adminToken);
  check('batch can be moved to running', running.status < 300, `got ${running.status}`);

  console.log('\n4. Live classes');
  const soon = new Date(Date.now() + 3600_000).toISOString();
  const cls = await api('/classes', {
    method: 'POST',
    body: JSON.stringify({
      batchId, title: 'Ops test class', scheduledAt: soon,
      durationMins: 60, meetingLink: 'https://meet.example.com/ops',
    }),
  }, adminToken);
  check('class scheduled', cls.status < 300, `got ${cls.status}`);
  const classId = cls.body?.id;

  const insecure = await api('/classes', {
    method: 'POST',
    body: JSON.stringify({
      batchId, title: 'Insecure link', scheduledAt: soon,
      meetingLink: 'http://meet.example.com/ops',
    }),
  }, adminToken);
  check('a non-https meeting link is refused', insecure.status >= 400, `got ${insecure.status}`);

  const mine = await api('/classes/mine', {}, s1Token);
  check('the class reaches the student',
    mine.body?.upcoming?.some((c: any) => c.id === classId));

  console.log('\n5. Attendance');
  const reg = await api(`/classes/${classId}/register`, {}, adminToken);
  check('the register lists both students', reg.body?.register?.length === 2,
    `${reg.body?.register?.length} listed`);

  const marked = await api(`/classes/${classId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({
      entries: [
        { userId: u1!.id, status: 'PRESENT' },
        { userId: u2!.id, status: 'ABSENT' },
      ],
    }),
  }, adminToken);
  check('attendance saved', marked.status < 300, `got ${marked.status}`);

  const after = await prisma.liveClass.findUnique({ where: { id: classId } });
  check('marking the register completes the class', after?.status === 'COMPLETED',
    `status is ${after?.status}`);

  const summary = await api('/classes/mine/attendance', {}, s1Token);
  check('the present student sees 100%', summary.body?.rate === 100,
    `got ${summary.body?.rate}`);

  const outsider = await api(`/classes/${classId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ entries: [{ userId: third?.id ?? 'x', status: 'PRESENT' }] }),
  }, adminToken);
  check('a student outside the batch cannot be marked', outsider.status >= 400,
    `got ${outsider.status}`);

  console.log('\n6. Support');
  const ticket = await api('/support', {
    method: 'POST',
    body: JSON.stringify({
      subject: 'Ops test ticket', body: 'Something is wrong.', category: 'LMS',
    }),
  }, s1Token);
  check('student raises a ticket', ticket.status < 300, `got ${ticket.status}`);
  const ticketId = ticket.body?.id;

  const otherStudent = await api(`/support/${ticketId}`, {}, s2Token);
  check('another student cannot read it', otherStudent.status === 403,
    `got ${otherStudent.status}`);

  await api(`/support/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: 'Internal: check their enrolment.', isInternal: true }),
  }, adminToken);

  const asStudent = await api(`/support/${ticketId}`, {}, s1Token);
  check('internal notes are hidden from the student',
    (asStudent.body?.comments ?? []).every((c: any) => !c.isInternal));

  const sneaky = await api(`/support/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: 'trying', isInternal: true }),
  }, s1Token);
  check('a student cannot write an internal note', sneaky.status === 403,
    `got ${sneaky.status}`);

  await api(`/support/${ticketId}/comments`, {
    method: 'POST', body: JSON.stringify({ body: 'Looking into it now.' }),
  }, adminToken);
  const replied = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  check('a staff reply starts the response clock', Boolean(replied?.firstResponseAt));
  check('and moves the ticket to in progress', replied?.status === 'IN_PROGRESS',
    `status is ${replied?.status}`);

  console.log('\n7. Delivery dashboard');
  const overview = await api('/delivery/overview', {}, adminToken);
  check('overview returns numbers', typeof overview.body?.activeEnrollments === 'number');

  const health = await api('/delivery/batches', {}, adminToken);
  check('the batch appears in delivery',
    Array.isArray(health.body) && health.body.some((b: any) => b.id === batchId));

  const risk = await api('/delivery/at-risk', {}, adminToken);
  check('the absent student is flagged',
    Array.isArray(risk.body) && risk.body.some((r: any) => r.userId === u2!.id),
    'expected a flag for no lessons completed');

  // Clean up
  await prisma.batch.delete({ where: { id: batchId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN, S1, S2] } } });

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
    await prisma.batch.deleteMany({ where: { name: BATCH_NAME } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { in: [ADMIN, S1, S2] } } }).catch(() => {});
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
