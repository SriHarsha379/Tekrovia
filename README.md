# TekRovia — Learning to Placement Platform

An EdTech platform that takes a candidate from first enquiry through training,
assessment and interview preparation to structured placement support.

Built as a pnpm monorepo: Next.js 14 frontend, NestJS 10 API, PostgreSQL 16
with Prisma, and a FastAPI AI service.

---

## Platform status — November 2026

| Layer | Status |
| --- | --- |
| Database schema | ✅ Complete |
| Backend API | ✅ Complete — all modules |
| Student portal | ✅ Complete — 12 screens |
| Admin portal | ✅ Complete — 7 screens |
| Landing page | ✅ Complete — trainer profiles, stats, testimonials, trial page |
| AI service | ✅ Built — needs OpenAI API key |
| Payments | ⏳ Awaiting Razorpay account |
| OTP / Email delivery | ⏳ Awaiting Resend + MSG91 accounts |
| WhatsApp automation | ⏳ Awaiting WATI / Interakt account |
| Video CDN | ⏳ Awaiting S3 / CloudFront config |
| Browser-based labs | 🔄 Deferred — using Google Colab links for first cohort |

The product is feature-complete and demo-ready. Remaining gaps are external
integrations, not code gaps.

---

## Blueprint coverage

| Blueprint section | Coverage |
| --- | --- |
| Executive vision and principles | 95% |
| Products and pricing | 100% |
| End-to-end student journey | 85% |
| Marketing and landing experience | 90% |
| Registration, trial and conversion | 85% |
| Automated onboarding | 70% (automation needs WhatsApp/Email) |
| Learning, labs and projects | 85% (labs = Colab links) |
| Interview readiness and soft skills | 90% |
| Placement operations | 95% |
| Dashboards | 85% |
| Technology architecture | 80% |

---

## What the platform does

### Public pages
- **Landing page** — hero, stats (500+ students, 85% placement rate), features,
  trainer profiles, student testimonials, pricing, FAQ, placement disclaimer
- **Free trial page** (`/trial`) — 3-session GenAI trial breakdown with topics,
  session descriptions and pricing preview
- **Register** — full candidate profile capture with UTM attribution
- **Login** — email + password with OTP verification (dev mode auto-fills OTP)

### Student portal (12 screens)

| Screen | Route | What it does |
| --- | --- | --- |
| Dashboard | `/dashboard` | Stats, enrolled courses with progress bars |
| My Courses | `/dashboard/courses` | Browse and enrol in published courses |
| Course Player | `/dashboard/courses/[id]` | Lesson sidebar, video, notes, mark complete |
| Live Classes | `/dashboard/classes` | Upcoming/past classes, join link, recording, attendance rate |
| Assessments | `/dashboard/assessments` | Career readiness + interactive technical assessment |
| Assignments | `/dashboard/assignments` | Submit work, view feedback, resubmit |
| Projects | `/dashboard/projects` | Milestone unlock flow, submit, expert feedback |
| Mock Interviews | `/dashboard/mock` | Scheduled/completed mocks, score/10, feedback |
| Resume Builder | `/dashboard/resume` | Paste resume → AI ATS review, section scores, keywords |
| Placement | `/dashboard/placement` | 4-item readiness checklist, pipeline stage, recovery rule |
| Support | `/dashboard/support` | Raise tickets, threaded replies, SLA tracking |
| Profile | `/dashboard/profile` | View/complete candidate profile, skill tags |

### Each lesson includes
- Video (YouTube / Vimeo / Loom / Google Drive / direct MP4)
- Written notes and description
- Interview questions panel (collapsible)
- AI doubt assistant (ask any question, get answer + example + follow-ups)
- Mark complete button

### Admin portal (7 screens)

| Screen | Route | What it does |
| --- | --- | --- |
| Overview | `/admin` | Platform stats, delivery metrics, lead funnel, recent candidates |
| Candidates | `/admin/candidates` | Search, paginate, click through to full profile |
| Courses | `/admin/courses` | Create courses, publish/archive, video coverage indicator |
| Course Editor | `/admin/courses/[id]` | Edit course details, modules, lessons, paste video URLs |
| Batches | `/admin/batches` | Create batches, assign trainer, capacity bar |
| Placement Pipeline | `/admin/placement` | Kanban across all 11 stages |
| Marketing Dashboard | `/admin/marketing` | Funnel, daily trend chart, attribution by UTM source |

### AI service (FastAPI — needs OpenAI key)
- Career roadmap generation (from candidate profile)
- Mock interview question generation (role-specific, with hints and ideal answers)
- Resume ATS review (score, missing keywords, section breakdown)
- Lesson doubt assistant (answer + example + follow-up questions)

---

## Running it locally

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker and Docker Compose
- Python 3.9+

### Setup

```bash
git clone https://github.com/SriHarsha379/Tekrovia.git
cd Tekrovia
pnpm install

cp .env.example .env
# Edit .env — set DATABASE_URL and ALLOW_DEV_OTP_RESPONSE=true

pnpm docker:up        # Postgres + Redis
pnpm db:generate
pnpm db:migrate
pnpm db:seed          # Demo accounts, course and leads
pnpm dev              # API :3001 · Frontend :3000
```

Swagger docs: `http://localhost:3001/docs`

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `demo.student@tekrovia.dev` | `TestPass123!` |
| Admin | `admin@tekrovia.dev` | `TestPass123!` |

With `ALLOW_DEV_OTP_RESPONSE=true` the OTP is shown on the login screen automatically.
The login page shows demo account hints — click to auto-fill.

### AI service (optional for local dev)

```bash
cd apps/ai-service
python3 -m pip install -r requirements.txt
python3 -m pip install eval_type_backport   # required on Python 3.9

# Edit apps/ai-service/.env — set OPENAI_API_KEY
python3 -m uvicorn main:app --reload --port 8000
```

---

## Environment variables

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://tekrovia_user:tekrovia_password_dev@localhost:5432/tekrovia
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development
ALLOW_DEV_OTP_RESPONSE=true    # local dev only — never in production

# Provided by client
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=tekrovia-internal-secret-change-in-prod
VIDEO_SIGNING_SECRET=
VIDEO_BASE_URL=
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### AI service (`apps/ai-service/.env`)

```env
OPENAI_API_KEY=         # from client
OPENAI_MODEL=gpt-4o-mini
AI_SERVICE_SECRET=tekrovia-internal-secret-change-in-prod
```

---

## Client integration checklist
□ OpenAI API key → AI features (roadmap, mock, resume, doubt)
□ Razorpay Key ID + Secret → Online payments
□ MSG91 / Fast2SMS API key → OTP delivery via SMS
□ Resend API key + domain → Transactional email
□ WATI / Interakt API key → WhatsApp Business automation
□ S3 bucket + signing secret → Secure video hosting
□ Domain name → Production deployment
□ Hosting preference → Vercel (frontend) + Railway/Render (backend)

See `CLIENT_REQUIREMENTS.md` for the full integration guide with sign-up
instructions, timelines and estimated monthly costs.

### Labs environment note

Browser-based coding labs are deferred for the first cohort. The current
approach is to paste a Google Colab or Replit link into the lesson video/content
field. Students click the link and complete the lab in their browser without
any installation. A dedicated in-platform lab environment can be revisited once
the platform reaches 200+ concurrent active students.

---

## Project structure
TekRovia/
├── apps/
│ ├── api/ # NestJS backend
│ │ └── src/
│ │ ├── ai/ # AI service client + endpoints
│ │ ├── admin/ # Student directory, enrolment
│ │ ├── assessment/ # Career readiness + technical assessments
│ │ ├── assignment/ # Submissions + trainer review
│ │ ├── auth/ # Sessions, OTP
│ │ ├── batch/ # Cohorts and membership
│ │ ├── candidate/ # Candidate profiles
│ │ ├── checkpoint/ # Module quizzes and gating
│ │ ├── course/ # Courses, modules, lessons, enrolment
│ │ ├── dashboard/ # Student dashboard data
│ │ ├── delivery/ # Delivery metrics and risk alerts
│ │ ├── lead/ # CRM capture and pipeline
│ │ ├── live-class/ # Scheduling and attendance
│ │ ├── marketing/ # Funnel, attribution, daily trend
│ │ ├── placement/ # Applications, interviews, readiness
│ │ ├── product/ # Product and pricing catalogue
│ │ ├── project/ # Project milestones + review
│ │ ├── resource/ # Lesson attachments
│ │ ├── support/ # Tickets and conversations
│ │ └── video/ # Signed video URL service
│ │
│ ├── web/ # Next.js 14 frontend
│ │ ├── app/
│ │ │ ├── page.tsx # Landing page
│ │ │ ├── trial/ # Free trial page
│ │ │ ├── login/ # Login + OTP
│ │ │ ├── register/ # Registration
│ │ │ ├── dashboard/ # Student portal (12 screens)
│ │ │ └── admin/ # Admin portal (7 screens)
│ │ └── src/
│ │ ├── components/ # LessonView, InteractiveAssessment, etc.
│ │ ├── hooks/ # API hooks
│ │ ├── lib/ # API client, UTM utils
│ │ └── store/ # Zustand auth store
│ │
│ └── ai-service/ # FastAPI AI service
│ ├── main.py # App + routes
│ ├── config.py # OpenAI client
│ ├── roadmap.py # Career roadmap generation
│ ├── mock_interview.py # Interview question generation
│ ├── resume_review.py # ATS resume review
│ └── doubt_assistant.py # Lesson doubt answering
│
├── packages/ # Shared types, validation, UI, config
├── prisma/ # Schema, migrations, seeds
├── scripts/ # End-to-end test scripts
├── CLIENT_REQUIREMENTS.md # Integration guide for client
└── SCHEMA.md # Database design notes

---

## Useful commands

```bash
pnpm dev              # API (:3001) + web (:3000)
pnpm build            # Build everything
pnpm db:migrate       # Apply schema changes
pnpm db:seed          # Reset demo data
pnpm docker:up        # Start Postgres + Redis
pnpm docker:down      # Stop Postgres + Redis
pnpm lint             # Lint all packages
cd apps/web && pnpm typecheck   # TypeScript check frontend
pnpm test:journey     # End-to-end API tests
```

---

## Security notes

- Passwords hashed with bcrypt (cost 12)
- Sessions stored server-side, fully revocable
- OTPs hashed with SHA-256, expire after 5 min, 60s resend cooldown, 5-attempt cap
- Quiz answer keys never sent to browser before submission
- Module gating enforced server-side on every lesson fetch
- Placement readiness gate requires human approval — cannot be bypassed via API
- AI service protected by shared secret header
- Internal support notes filtered from student responses

---

**Version:** 0.3.0
**Status:** Feature complete — pending client integrations
**Last updated:** November 2026
