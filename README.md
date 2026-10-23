# TekRovia — Learning to Placement Platform

An EdTech platform that takes a candidate from first enquiry through training,
assessment and interview preparation to structured placement support.

Built as a pnpm monorepo: Next.js 15 frontend, NestJS 10 API, PostgreSQL 16
with Prisma, and a FastAPI service reserved for AI features.

---

## What the platform does today

### For a prospective student

**Landing page and free offers.** The public site explains the programmes and
pricing, and offers three free entry points: a career assessment, a
three-session trial, and an AI mock interview.

**Lead capture.** A short form — name, phone, email, interest, consent —
creates a CRM lead without demanding a full profile. UTM parameters are
captured automatically, so you can tell which campaign produced which lead.

**Registration.** The full candidate profile: education, graduation year,
experience, current skills, previous training, career gap, target role, coding
preference, resume, availability and preferred schedule. This produces one
**Candidate ID** that follows the person through every later stage.

**Login.** Email and password followed by a one-time code. Sessions are stored
server-side and can be revoked.

### For an enrolled student

**Dashboard.** Enrolled courses with progress, lessons completed, assessments
taken, average score, and links to work, classes, support and placement status.

**Course player.** Lessons play in the page. The platform records how much was
actually watched rather than where the playhead sits, so skipping to the end
does not count. A lesson completes at 90% watched, and closing the browser and
returning resumes at the right point.

**Checkpoint quizzes.** After a module, a quiz gates what follows. It only
opens once every lesson in that module is complete. Questions are multiple
choice and shuffled on each attempt.

**Scoring and review.** Answers are scored on the server — correct answers are
never sent to the browser before submission. A failed attempt shows which
questions were wrong, the explanation for each, and a link back to the lesson
that teaches it. Students can retake the quiz.

**Gating.** Until a checkpoint is passed at its required mark, the next module
stays locked. This is enforced server-side: a student who tries to reach a
later lesson directly is refused.

**Live classes.** Upcoming sessions with the trainer, a join link that appears
fifteen minutes before the start, recordings afterwards, and the student's own
attendance record.

**My work.** Assignments and project milestones. Submit text or a link; a
reviewer approves or requests changes, with feedback shown back.

**Support.** Raise a ticket in plain language, follow the conversation, and
reply. Tickets are categorised and routed to a named owner.

**Assessments and placement.** Free and technical assessments with results and
classification, plus the student's placement readiness and pipeline status.

### For a trainer or administrator

**Course authoring.** Create a course with category, duration, level, price and
learning outcomes, then lay out modules and lessons. Courses start as drafts
and are published when ready; retired courses are archived rather than deleted.

**Lesson content and videos.** Each lesson takes a video link, written notes, a
description and a duration. The editor shows how many lessons still have no
video attached.

> **Important:** add videos *after* the curriculum is final. Restructuring the
> curriculum recreates the lessons and clears their content.

**Checkpoint authoring.** Add a quiz after any module, set the pass mark, and
write questions with their options, correct answer, explanation, and the lesson
to revisit when wrong. Safeguards prevent publishing an empty quiz, deleting one
students have already sat, and placing two gates on the same module.

**Projects and assignments.** Define project briefs with milestones and attach
assignments to lessons. A reviewer queue collects everything awaiting approval.

**Batches.** Group students into a cohort with a course, trainer, capacity,
schedule and dates. Adding a student to a batch also enrols them in its course,
so the two cannot drift apart. Removing them from the batch leaves their course
progress intact.

**Live class scheduling.** Schedule sessions against a batch with a meeting
link, then mark attendance from a register that defaults everyone to present.
Marking the register completes the class.

**Students.** Search the directory, open a profile, and see registration
details, assessments, and course progress module by module. Enrol or cancel
enrolments directly from the profile — this is how a cohort is run while online
payment is pending.

**Leads.** The CRM pipeline with funnel counts across eight stages. Filter by
stage, search, assign an owner, record call notes, and move leads through to
enrolment.

**Support queue.** Tickets sorted by priority and age, filtered by status or
category, with overdue tickets highlighted. Assign, reply, add internal notes
the student never sees, and resolve. Each priority carries a response deadline.

**Delivery dashboard.** Active batches and enrolments, classes held, attendance
rate, lessons completed, work awaiting review, and open and overdue tickets.
Per-batch completion and attendance health, plus a **needs attention** list of
students who have gone quiet or are missing classes, with the reason for each
flag.

**Placement administration.** An eleven-stage application pipeline, interview
scheduling, outcomes and offers, expert mock interviews, and readiness approval.

---

## Not built yet

| Area | Status |
| --- | --- |
| Outgoing email | Not built. Blocks real logins — the one-time code has no way to reach a student. Needs a provider account and a sending domain |
| Online payment | Not built, awaiting Razorpay account details. Payment is currently taken outside the platform and the student enrolled by an administrator |
| AI doubt assistant | Deferred until there are real student questions to design against |
| 1:1 mentor booking | Deferred. A shared calendar link covers a first cohort |
| Labs and browser environments | Deferred. A repository with instructions covers the same ground |
| WhatsApp Business API | Deferred. Approval takes weeks |
| Course content | Not produced. The platform is ready for lessons; the lessons are the outstanding dependency |

---

## Running it locally

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker and Docker Compose
- Python 3.11+ (only for the AI service)

### Setup

```bash
git clone https://github.com/SriHarsha379/Tekrovia.git
cd Tekrovia
pnpm install

cp .env.example .env
# Set DATABASE_URL, and ALLOW_DEV_OTP_RESPONSE=true for local logins

pnpm docker:up        # Postgres and Redis
pnpm db:generate
pnpm db:migrate
pnpm db:seed          # demo users, courses and leads
pnpm dev              # API on :3001, web on :3000
```

Swagger documentation is at `http://localhost:3001/docs`.

### Demo account

The seed creates `test@tekrovia.test` with password `TestPass123!`. Promote it
to administrator from Prisma Studio (`pnpm prisma studio`) by setting its role
to `ADMIN`, then log out and back in — the role is cached in the browser
session.

### Local logins

Login sends a one-time code. With `ALLOW_DEV_OTP_RESPONSE=true` the code is
returned in the login response so you can complete it without email. **This
flag must never be set in a deployed environment.**

---

## Tests

```bash
pnpm test:journey
```

Runs three scripts against a live API — 64 assertions in about fifteen seconds.
Each creates its own accounts and data, then cleans up.

| Script | Covers |
| --- | --- |
| `scripts/journey.ts` | Registration, login, enrolment, lesson progress, checkpoint gating, quiz scoring, unlocking |
| `scripts/trainer.ts` | Course authoring, lesson videos, checkpoint authoring, publishing, and the authoring guards |
| `scripts/operations.ts` | Batches, capacity, live classes, attendance, support tickets, delivery metrics |

Roughly half the assertions are security checks: unenrolled access, early quiz
attempts, answer keys leaking, internal notes reaching students, cross-student
access, and capacity limits.

Run these before pushing anything that touches courses, checkpoints, auth,
batches or support.

---

## Project structure

```
TekRovia/
├── apps/
│   ├── api/              # NestJS API
│   │   └── src/
│   │       ├── auth/         # Sessions, OTP
│   │       ├── candidate/    # Candidate profiles
│   │       ├── course/       # Courses, modules, lessons, enrolment
│   │       ├── checkpoint/   # Quizzes, attempts, gating
│   │       ├── batch/        # Cohorts and membership
│   │       ├── live-class/   # Scheduling and attendance
│   │       ├── support/      # Tickets and conversations
│   │       ├── lead/         # CRM capture and pipeline
│   │       ├── assignment/   # Assignment submissions
│   │       ├── project/      # Project milestones
│   │       ├── placement/    # Applications, interviews, readiness
│   │       ├── delivery/     # Delivery metrics and risk
│   │       ├── admin/        # Student directory, enrolment
│   │       └── dashboard/    # Student dashboard data
│   ├── web/              # Next.js frontend
│   └── ai-service/       # FastAPI, reserved for AI features
├── packages/             # Shared types, validation, UI, config
├── prisma/               # Schema, migrations, seeds
└── scripts/              # End-to-end test scripts
```

`SCHEMA.md` describes an earlier SQLAlchemy design that was never built and is
marked superseded. The live schema is `prisma/schema.prisma`.

---

## Useful commands

```bash
pnpm dev                 # API and web together
pnpm build               # Build everything
pnpm test:journey        # End-to-end tests
pnpm db:migrate          # Apply schema changes
pnpm db:seed             # Reset demo data
pnpm docker:up           # Start Postgres and Redis
pnpm lint                # Lint
```

The API clears `dist` before building. Do not run `pnpm build` while the dev
server is running — they share the output directory.

---

## Security notes

- Passwords hashed with bcrypt; sessions stored server-side and revocable
- One-time codes expire after five minutes, with a sixty-second resend cooldown
  and a five-attempt cap
- Quiz answer keys never leave the server before submission
- Module gating enforced on every lesson fetch, not merely hidden in the UI
- Lead capture returns an acknowledgement only, so the CRM cannot be enumerated
- Video and recording links restricted to https
- Internal support notes are filtered out of student responses

---

**Status:** active development · **Last updated:** 2026-10-23
