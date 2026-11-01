# TekRovia — Learning to Placement Platform

An EdTech platform that takes a candidate from first enquiry through training,
assessment and interview preparation to structured placement support.

Built as a pnpm monorepo: Next.js 14 frontend, NestJS 10 API, PostgreSQL 16
with Prisma, FastAPI AI service, and Redis for caching and queues.

---

## Platform status — November 2026

| Layer | Status |
| --- | --- |
| Database schema | ✅ Complete — full blueprint coverage |
| Backend API | ✅ Complete — all modules built and tested |
| Student portal (frontend) | ✅ Complete — all 10 screens |
| Admin portal (frontend) | ✅ Complete — all 6 screens |
| AI service | ✅ Built — needs OpenAI API key to go live |
| Payments | ⏳ Awaiting Razorpay account from client |
| OTP / Email delivery | ⏳ Awaiting Resend account + domain from client |
| WhatsApp automation | ⏳ Awaiting WATI / Interakt account from client |
| Video hosting | ⏳ Awaiting S3 / CDN config from client |

The product is functionally complete and ready to demo. Remaining gaps are
external integrations, not code gaps.

---

## What the platform does

### Student journey

**Landing page.** Public site with pricing, programme details, FAQs and three
free entry points: career assessment, three-session trial, AI mock interview.

**Registration and login.** Full candidate profile — education, experience,
skills, target role, availability — producing one Candidate ID that follows the
person through every stage. Email + password login with OTP verification.

**Student dashboard.** Enrolled courses with progress bars, lessons completed,
assessments taken, average score, and quick links to all portal sections.

**Course player.** Lessons with video and notes. Progress tracked at 90% watch
time. Curriculum sidebar with module expand/collapse and per-lesson completion
indicators. Mark-complete button.

**Checkpoint quizzes.** Module-level quizzes gate the next module. Scored
server-side — correct answers never reach the browser before submission. Failed
attempts show which questions were wrong with explanations and lesson links.

**Assignments.** Submit text or a link per assignment. Trainer approves or
requests changes with written feedback. Full attempt history shown.

**Projects.** Multi-milestone projects with sequential unlock — earlier
milestones must be approved before the next opens. Final milestones require
expert (admin) approval and are recorded as placement readiness evidence.

**Assessments.** Two types: career readiness (profile-based, instant) and
interactive technical (question-based, scored server-side). Results include
a score, classification (Beginner / Starter / Pro), category breakdown, and
a personalised roadmap of next steps.

**Mock interviews.** Track scheduled and completed expert mock interviews.
Score per mock, pass/fail against 8/10 threshold, trainer feedback, final mock
status, and readiness progress towards the placement gate.

**Placement readiness.** Four-item checklist: 3 expert mocks complete, final
mock ≥ 8/10, expert-approved project, technical assessment ≥ 80%. Human review
required before placement support is activated. 4-interview recovery rule shown
when triggered.

**Support tickets.** Raise a ticket with category and priority. Follow the
conversation thread, reply, and see staff responses. SLA timers by priority
(Urgent 4h / High 12h / Normal 24h / Low 72h).

**Profile.** View and complete candidate profile. Skills shown as tags.
Candidate code displayed. Profile completeness drives assessment scoring and
placement eligibility.

### Admin portal

**Overview.** Platform-wide stats: total students, leads, active enrollments,
assessments completed. Delivery metrics: active learners, assignments and
projects awaiting review, completion rate. Lead funnel by status. Recent
candidates table.

**Candidates.** Searchable, paginated directory. Click through to full profile:
education, skills, assessments with scores, course enrollments with per-lesson
progress.

**Batches.** Create batches with course, trainer, capacity, start and end dates.
Capacity bar per batch. Adding a student to a batch also enrolls them in the
course.

**Placement pipeline.** Kanban board across all 11 stages: Profile Review →
Preparation Pending → Job Ready → Resume Approved → Jobs Matched → Submitted →
Interview Scheduled → Feedback Awaited → Selected → Offer Received → Joined.
Cards show job title, company and interview count.

**Marketing dashboard.** Lead funnel table with reached/at-stage counts and
conversion bar. Daily lead volume bar chart with hover tooltips. Attribution
table by UTM source with conversion rates. Configurable 7/14/30/90 day window.

### AI service (FastAPI — requires OpenAI key)

**Career roadmap.** Generates a personalised 3-4 phase learning roadmap from
the candidate's profile: target role, skills, experience and availability.

**Mock interview questions.** Generates role-specific interview questions with
hints and ideal answers. Supports Technical, HR and Mixed round types.

**Resume ATS review.** Scores a resume overall and by section, identifies
missing keywords, lists strengths and improvements.

**Doubt assistant.** Answers lesson-specific questions with examples, follow-up
questions and resource suggestions.

---

## Running it locally

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker and Docker Compose
- Python 3.9+ (for the AI service)

### Setup

```bash
git clone https://github.com/SriHarsha379/Tekrovia.git
cd Tekrovia
pnpm install

cp .env.example .env
# Edit .env — set DATABASE_URL and ALLOW_DEV_OTP_RESPONSE=true for local logins

pnpm docker:up        # Postgres + Redis
pnpm db:generate
pnpm db:migrate
pnpm db:seed          # Demo users, courses and leads
pnpm dev              # API on :3001, web on :3000
```

Swagger docs: `http://localhost:3001/docs`

### AI service (optional for local dev)

```bash
cd apps/ai-service
python3 -m pip install -r requirements.txt
python3 -m pip install eval_type_backport   # required on Python 3.9

# Add your OpenAI key to apps/ai-service/.env
cp .env.example .env   # then edit OPENAI_API_KEY

python3 -m uvicorn main:app --reload --port 8000
```

AI service health check: `http://localhost:8000/health`

### Demo account

The seed creates `test@tekrovia.test` with password `TestPass123!`.

To use the admin portal, promote the account in Prisma Studio:
```bash
pnpm prisma studio    # opens at http://localhost:5555
```
Set the user's `role` to `ADMIN`, then log out and back in.

### Local OTP logins

With `ALLOW_DEV_OTP_RESPONSE=true` in `.env`, the OTP is returned directly
in the login response so you can complete login without an email provider.
**Never set this flag in production.**

---

## Environment variables

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://tekrovia_user:tekrovia_password_dev@localhost:5432/tekrovia
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development
JWT_SECRET=change-in-production
ALLOW_DEV_OTP_RESPONSE=true       # local dev only — never in production

# Provided by client
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=tekrovia-internal-secret-change-in-prod
VIDEO_SIGNING_SECRET=             # S3 / CDN signing key
VIDEO_BASE_URL=                   # CDN base URL
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### AI service (`apps/ai-service/.env`)

```env
OPENAI_API_KEY=                   # provided by client
OPENAI_MODEL=gpt-4o-mini
AI_SERVICE_SECRET=tekrovia-internal-secret-change-in-prod
```

---

## Client integration checklist

Before going live, the following accounts and credentials are needed from the client:
