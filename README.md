# SkillMove / TekRovia — Learning-to-Placement Platform

> A modern, scalable EdTech platform built with Next.js, NestJS, FastAPI, PostgreSQL, Prisma, and a pnpm monorepo architecture.

## Overview

SkillMove / TekRovia is a comprehensive learning and placement platform designed to bridge the gap between skill development and career placement. The platform includes:

- **Candidate Onboarding**: Lead capture, registration, and profile management
- **Skill Assessments**: A career-readiness assessment and a formal 10-question interactive technical assessment, scored on the server
- **Personalized Roadmaps**: Recommendations shown with assessment results (AI-generated learning paths are not built yet)
- **CRM Integration**: Lead management and conversion tracking
- **Learning Management**: Courses, lessons with notes and video links, assignments with trainer review, and guided projects with milestones and expert approval
- **Placement Support**: An interview and offer pipeline, a human-reviewed readiness gate, and an interview-recovery flag (job matching and mock-interview scheduling are not built yet)

## Current Status

TekRovia is under active development. This section is a plain inventory of what exists in the repository today, not a promise of dates.

### Built

- **Accounts and access**: registration, password and one-time-code login, eight user roles, and role checks on every protected API route, covered by automated tests
- **Leads**: validated public lead capture that returns only an acknowledgement, and admin-only lead conversion
- **Candidate profile**: education, skills, earlier training, career gap, an https resume link, and campaign (UTM) attribution captured for the browser session
- **Learning**: course catalogue, enrollment, lesson progress, lesson notes and https video links (visible to enrolled learners only), and an admin course and lesson editor
- **Assignments**: admin-authored assignments, learner submissions with attempt history, and trainer or admin review with feedback; a course completes only after its required assignments are approved
- **Projects**: admin-authored projects with ordered milestones, learner submissions, mentor review, and administrator-only approval of the final milestone, which records expert-approved evidence for placement readiness
- **Assessments**: a career-readiness assessment and a formal 10-question interactive technical assessment scored on the server
- **Placement management**: applications, interviews, offers, an 11-stage pipeline with history, a readiness review that always needs a human decision, and a flag for candidates with four unsuccessful interviews
- **Dashboards**: an admin delivery overview, a placement overview, and a read-only readiness checklist for learners

### Not built yet

- Payments and invoices (Razorpay), onboarding automation, and support tickets
- Email, SMS and WhatsApp delivery, including delivery of login codes (login is disabled in production until this exists)
- Live classes, labs, quizzes, and module unlock rules
- Expert mock-interview scheduling and scoring (the readiness gate reads these records, but nothing in the app creates them yet)
- Resume builder, ATS review, and improvement plans
- Job postings, job matching, and the full four-interview recovery workflow
- AI features: doubt assistant, practice interviews, mock interviews, and first-pass review (the AI service is a placeholder boundary)
- Marketing and attendance dashboards, and the three-session trial flow
- The blueprint's 15-question camera-on formal assessment (the app uses 10 questions)
- Production hardening: restricted CORS, rate limiting, HttpOnly session cookies, monitoring and backups

Placement support is structured assistance. Nothing in this repository represents a guaranteed job, and readiness approval is always a human decision.

## Roles and Pages

| Role | Lands on | What it can do today |
|---|---|---|
| STUDENT | `/dashboard` | Learn, submit assignments and projects, and see their own readiness checklist |
| TRAINER | `/review` | Review assignment submissions and non-final project milestones |
| ADMIN, SUPER_ADMIN | `/admin` | Review all work, plus manage courses, assignments, projects, students and placements, and give final project approval |
| PLACEMENT_MANAGER | `/dashboard` | Placement API routes (applications, interviews, offers, readiness); no dedicated landing page yet |
| COUNSELLOR, SUPPORT_STAFF, RECRUITER | `/dashboard` | Defined in the data model; no dedicated pages or permissions yet |

Staff pages: `/admin`, `/admin/courses`, `/admin/students`, `/admin/placements`, and `/review`.

## Tech Stack

### Frontend
- **Next.js 15** — React App Router with TypeScript
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Accessible component library
- **Lucide Icons** — Modern icon system

### Backend
- **NestJS 10** — Modular, scalable backend framework
- **PostgreSQL 16** — Primary data store
- **Prisma 5** — Type-safe ORM and schema management
- **Redis 7** — Caching and session management

### AI Service
- **FastAPI** — High-performance Python API
- **Pydantic** — Data validation and OpenAPI schema generation
- **Uvicorn** — ASGI server

### Development & Tooling
- **pnpm** — Fast, disk-efficient package manager
- **Turbo** — Monorepo build orchestration
- **TypeScript** — Static type safety
- **ESLint & Prettier** — Code linting and formatting
- **Jest** — Unit and integration testing
- **Docker Compose** — Local infrastructure

## Project Structure

```
TekRovia/
├── apps/
│   ├── api/                    # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/           # Authentication & OTP
│   │   │   ├── candidate/      # Candidate profiles & registration
│   │   │   ├── assessment/     # Assessment & scoring
│   │   │   ├── lead/           # CRM & lead management
│   │   │   ├── admin/          # Admin overview and student listing
│   │   │   ├── course/         # Courses, curriculum, enrollment, progress
│   │   │   ├── placement/      # Placement pipeline, interviews, offers, readiness review
│   │   │   ├── assignment/     # Assignments, submissions and review
│   │   │   ├── project/        # Projects, milestones and expert approval
│   │   │   ├── prisma/         # Database layer
│   │   │   ├── app.module.ts   # Root module
│   │   │   └── main.ts         # Application bootstrap
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   ├── src/                # Components (LearningHub, assessments) and API clients
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ai-service/             # FastAPI AI boundary
│       ├── main.py
│       ├── requirements.txt
│       └── pyproject.toml
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Shared validation schemas (Zod)
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   └── config/                 # Shared configuration
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data script
│   └── migrations/             # Database migrations
├── docker-compose.yml          # Postgres + Redis
├── pnpm-workspace.yaml         # Monorepo configuration
├── turbo.json                  # Build pipeline
├── package.json                # Root scripts
└── .env.example                # Environment template
```

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9.0.0 or higher (`npm install -g pnpm`)
- **Docker & Docker Compose** v3.9+
- **Python** v3.11+ (for AI service development)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/SriHarsha379/Tekrovia.git
cd Tekrovia
pnpm install
```

### 2. Environment Setup

Copy the example environment file and update with your local configuration:

```bash
cp .env.example .env.local
```

**`.env.local` template:**

```env
# Database
DATABASE_URL="postgresql://tekrovia_user:tekrovia_password_dev@localhost:5432/tekrovia?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# API
API_PREFIX="api/v1"
PORT=3001
NODE_ENV="development"

# JWT (will be added in auth hardening phase)
JWT_SECRET="your_super_secret_jwt_key_here_change_in_production"
JWT_EXPIRY="7d"

# External Services (placeholder for future integrations)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
AI_SERVICE_URL="http://localhost:8000"
```

> **Local login note:** the API returns a one-time login code in its response only when
> `ALLOW_DEV_OTP_RESPONSE="true"` is set. `.env.example` ships with `"false"`, so change it to
> `"true"` in your `.env.local` to log in locally. This flag is for local development only and
> must never be enabled in production. OTP delivery by email/SMS is not implemented yet, so
> login is currently disabled in production.

### 3. Start Infrastructure

Start PostgreSQL and Redis containers:

```bash
pnpm docker:up
```

Verify services are running:

```bash
docker ps
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Run Applications

In separate terminal windows, start each service:

**Terminal 1 — Backend API (NestJS)**

```bash
cd apps/api
pnpm install
pnpm dev
```

API runs on `http://localhost:3001`  
Swagger docs: `http://localhost:3001/docs`

**Terminal 2 — Frontend (Next.js)**

```bash
cd apps/web
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:3000`

**Terminal 3 — AI Service (FastAPI)**

```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

AI service runs on `http://localhost:8000`  
OpenAPI docs: `http://localhost:8000/docs`

### 6. Quick Verification

**Health Checks**

```bash
# API health
curl http://localhost:3001/api/v1/health

# AI service health
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2026-09-29T12:30:00.000Z"
}
```

### 7. Local Test Accounts

Students can register at `/register`. There is no screen for creating staff accounts, so for local testing create them with a one-off script of your own, using a role from [Roles and Pages](#roles-and-pages).

- Read the password from your terminal when the script runs; never write passwords into a file or pass them on the command line
- Keep such scripts out of git (do not run `git add .`), together with any `*.bak.*` or `*.backup.*` copies of files
- Roles are read when a user logs in, so after changing a role in the database, log out and log in again
- Use a separate browser tab per account, because the session is stored per tab

## Available Commands

### Monorepo Scripts

```bash
# Development
pnpm dev                      # Start all apps in watch mode
pnpm docker:up                # Start Postgres + Redis
pnpm docker:down              # Stop Postgres + Redis

# Database
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Run pending migrations
pnpm db:seed                  # Seed demo data

# Code Quality
pnpm lint                     # Run ESLint across all apps
pnpm typecheck                # Run TypeScript type checking
pnpm test                     # Run Jest tests
pnpm format                   # Format code with Prettier
pnpm check                    # Run lint + typecheck + test

# Building
pnpm build                    # Build all app packages
```

### API-Specific Commands

```bash
cd apps/api

pnpm dev                      # Start NestJS in watch mode
pnpm build                    # Build for production
pnpm start                    # Run production build
pnpm test                     # Run Jest tests
pnpm lint                     # Lint TypeScript
```

### Frontend-Specific Commands

```bash
cd apps/web

pnpm dev                      # Start Next.js dev server
pnpm build                    # Build for production
pnpm start                    # Run production server
pnpm lint                     # Lint with ESLint
```

### AI Service Commands

```bash
cd apps/ai-service

python -m uvicorn main:app --reload      # Development server
python -m pytest                          # Run tests
python -m pip install -r requirements.txt # Install dependencies
```

## API Documentation

Interactive documentation is served by the running API at `http://localhost:3001/docs`. Every path below is under `/api/v1`.

### Authentication

Signing in returns an access token. Send it on every protected request as `Authorization: Bearer <access-token>`.

**Register** (public):

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "9876543210",
    "name": "John Doe",
    "password": "<choose-a-strong-password>"
  }'
```

**Log in** (public). The response includes the one-time code only when `ALLOW_DEV_OTP_RESPONSE="true"` is set for local development. Without the flag the API refuses to issue a code, and it never does in production:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "<your-password>"
  }'
```

**Verify the code** (public). This returns the access token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "<code-from-the-login-response>"
  }'
```

### Public lead capture

```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prospect Name",
    "email": "prospect@example.com",
    "phone": "9123456789",
    "courseInterest": "Full Stack Development",
    "source": "website",
    "consentGiven": true
  }'
```

The name must be 2 to 150 characters, the email valid, and the phone 10 to 15 digits. The response is only `{"received": true}`, whether or not the lead already existed.

### Routes and who can call them

**Leads and candidates**

| Route | Access |
|---|---|
| `POST /leads/:id/convert/:candidateId` | ADMIN, SUPER_ADMIN |
| `POST /candidates/user/:userId`, `GET /candidates/user/:userId` | The signed-in user, for their own profile only (the id in the path is ignored) |
| `POST /candidates`, `GET /candidates`, `GET /candidates/:id` | ADMIN, SUPER_ADMIN |

**Assessments**

| Route | Access |
|---|---|
| `POST /assessments/me/interactive`, `POST /assessments/:id/interactive-submit` | Signed-in user; the server scores the answers |
| `POST /assessments/me/career-readiness` | Signed-in user |
| `GET /assessments/candidate/:candidateId`, `GET /assessments/:id` | The owner, or an administrator |
| `POST /assessments/:id/submit` | Disabled; always refused |

**Courses and learning**

| Route | Access |
|---|---|
| `GET /courses`, `GET /courses/:id` | Signed-in user; published courses only, without lesson notes or video |
| `POST /courses/:id/enroll` | Signed-in user |
| `GET /courses/my/enrollments`, `GET /courses/my/progress` | Own data; progress includes lesson notes and video for enrolled learners |
| `POST /courses/lessons/:lessonId/complete` | Learner with an active enrollment |
| `GET /courses/admin`, `POST /courses/admin`, `POST /courses`, `PATCH /courses/admin/:id` (also `/publish`, `/archive`), `PATCH /courses/admin/lessons/:lessonId` | ADMIN, SUPER_ADMIN |

**Assignments**

| Route | Access |
|---|---|
| `PUT /assignments/lessons/:lessonId` | ADMIN, SUPER_ADMIN |
| `GET /assignments/my`, `POST /assignments/:assignmentId/submit` | Learner with an active enrollment; text and an https link only |
| `GET /assignments/review`, `PATCH /assignments/submissions/:submissionId/review` | TRAINER, ADMIN, SUPER_ADMIN; nobody can review their own submission |

**Projects**

| Route | Access |
|---|---|
| `PUT /projects/courses/:courseId` | ADMIN, SUPER_ADMIN; 1 to 5 milestones, the last one is final |
| `GET /projects/my`, `POST /projects/milestones/:milestoneId/submit` | Learner with an active enrollment; milestones unlock in order |
| `GET /projects/review`, `PATCH /projects/submissions/:submissionId/review` | TRAINER, ADMIN, SUPER_ADMIN; the final milestone can only be reviewed by ADMIN or SUPER_ADMIN |

**Placement**

| Route | Access |
|---|---|
| `GET /placements/me/readiness` | Signed-in user; their own checklist only, with no staff notes |
| `GET /placements/overview`, applications, interviews, offers, pipeline stages, `GET /placements/readiness`, `GET /placements/readiness/:candidateId` | ADMIN, SUPER_ADMIN, PLACEMENT_MANAGER |
| `PATCH /placements/readiness/:candidateId/review` | ADMIN, SUPER_ADMIN, PLACEMENT_MANAGER; records the human readiness decision |

**Administration**

| Route | Access |
|---|---|
| `GET /admin/overview`, `GET /admin/students`, `GET /admin/students/:id` | ADMIN, SUPER_ADMIN |

## Database Schema

The schema lives in `prisma/schema.prisma` and the migrations in `prisma/migrations`. Model groups:

- **Identity**: User, Session, OtpCode, AuditLog
- **Candidates and leads**: Candidate, Registration, Lead
- **Assessments**: Assessment
- **Learning**: Course, CourseModule, Lesson, Enrollment, LessonProgress
- **Assignments**: Assignment, AssignmentSubmission (one row per attempt)
- **Projects**: Project, ProjectMilestone, ProjectSubmission (one row per attempt)
- **Placement**: PlacementApplication, PlacementInterview, PlacementOffer, PlacementPipelineHistory, ExpertMockInterview, CandidateProjectReview, PlacementReadinessReview

### Applying migrations

Load your environment first (for example `set -a; source .env.local; set +a`), then:

```bash
pnpm --filter @tekrovia/api exec prisma migrate status --schema=../../prisma/schema.prisma
pnpm --filter @tekrovia/api exec prisma migrate deploy --schema=../../prisma/schema.prisma
pnpm --filter @tekrovia/api exec prisma generate --schema=../../prisma/schema.prisma
```

`migrate deploy` only applies migrations that are already in the repository and never resets data. Avoid `migrate dev` against a database you care about, because when it detects drift it can offer to reset it.

### Changing the schema

Edit `prisma/schema.prisma`, then generate the SQL without touching any database. The schema file reads `DATABASE_URL`, so set it to any placeholder value for this one command:

```bash
git show HEAD:prisma/schema.prisma > /tmp/schema.before.prisma
pnpm --filter @tekrovia/api exec prisma migrate diff \
  --from-schema-datamodel /tmp/schema.before.prisma \
  --to-schema-datamodel ../../prisma/schema.prisma \
  --script
```

Review the SQL for `DROP`, `TRUNCATE` and `RENAME` before saving it as a new folder under `prisma/migrations` and applying it with `migrate deploy`.

## Testing

API (Jest; the database is mocked, so no running services are needed):

```bash
pnpm --filter @tekrovia/api test
pnpm --filter @tekrovia/api typecheck
pnpm --filter @tekrovia/api lint
pnpm --filter @tekrovia/api build
```

Web (Vitest and Testing Library):

```bash
pnpm --filter @tekrovia/web test
pnpm --filter @tekrovia/web typecheck
pnpm --filter @tekrovia/web lint
env -u NODE_ENV pnpm --filter @tekrovia/web build
```

Notes:

- Because the API tests mock the database, they do not prove that queries work against a real database. Apply the migrations locally and try new flows in the browser as well.
- Controller authorization is tested against every role. A new route must be added to the matching test table, otherwise the coverage check fails.
- Unit tests do not cover Nest module wiring. After adding a module, start the API once and check that it boots without dependency errors.
- Do not run a production web build while the web dev server is running; both write to `apps/web/.next`.

## Deployment

The platform is designed for containerized deployment. See `docker-compose.yml` for local development setup. Production deployment requires:

- Container orchestration (Kubernetes, Docker Swarm, etc.)
- Environment-specific configuration management
- Database backups and replication
- CDN for static assets
- Load balancing
- Monitoring and logging (DataDog, CloudWatch, etc.)

## Troubleshooting

### Database Connection Issues

```bash
# Check Postgres is running
docker ps | grep tekrovia-postgres

# Restart services
pnpm docker:down
pnpm docker:up
```

### Port Conflicts

If ports 3000, 3001, 5432, 6379, or 8000 are already in use:

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env.local
PORT=3002
```

### Prisma Migration Issues

```bash
# Reset database (CAUTION: deletes all data)
cd apps/api
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status
```

### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
```

### Next.js Dev Server Errors After a Build

If the web app shows errors such as a missing `middleware-manifest.json` or `Cannot find module './295.js'`, the `apps/web/.next` folder was written by two processes at once, usually a production build run while `next dev` was still running. Stop the dev server with Ctrl+C, delete `apps/web/.next`, and start it again. Use Ctrl+C rather than Ctrl+Z, which only suspends the process and keeps the port busy.

### Login Says "OTP delivery is not configured"

Login codes are only issued when `ALLOW_DEV_OTP_RESPONSE="true"` is set in the environment the API was started with, and never in production. Set it in `.env.local` and restart the API.

## Development Guidelines

### Code Style

- Use TypeScript for all Node.js code
- Follow ESLint and Prettier configuration
- Write descriptive commit messages
- Create feature branches for new work

### Naming Conventions

- **Files**: kebab-case (`user-controller.ts`)
- **Classes**: PascalCase (`UserController`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Database Tables**: snake_case (`user_sessions`)
- **Enums**: PascalCase (`UserRole`)

### Adding a New Feature

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Implement the feature with tests
3. Run `pnpm check` to validate
4. Create a pull request with a clear description
5. Merge after review and CI passes

## Contributing

Contribution guidelines have not been published yet. Please contact the development team before submitting changes.

## License

This project is proprietary. No license file has been added to the repository yet.

## Support

For issues, questions, or feedback, please reach out to the development team or open an issue on GitHub.

## Roadmap

The order follows technical dependencies, not the blueprint's page order. Items marked done exist in the repository today.

1. **Foundation** (done): monorepo, NestJS API, Prisma schema and migrations, authentication, roles, lead and candidate modules
2. **Learning core** (done): courses, lesson content, assignments with review, projects with milestones and expert approval
3. **Placement basics** (done): applications, interviews, offers, pipeline stages, human-reviewed readiness, recovery flag
4. **Production login and hardening** (suggested next): email or SMS delivery of login codes, restricted CORS, rate limiting, HttpOnly session cookies, deployment setup
5. **Interview readiness**: expert mock scheduling and scoring, resume builder, ATS review, improvement plans
6. **Payments and onboarding**: products, Razorpay, invoices, enrollment gated on payment, support owners and tickets
7. **Notifications**: email and WhatsApp templates and triggers
8. **Placement operations**: job postings, job-to-evidence matching, the four-interview recovery workflow
9. **Learning extras**: quizzes and unlock rules, live classes, labs
10. **Funnel and dashboards**: campaigns, trial flow, marketing and delivery dashboards
11. **Assessment upgrade**: the blueprint's 15-question camera-on assessment
12. **AI features**: doubt assistant, practice and mock interviews, first-pass review

The blueprint remains the source of truth for requirements.

## Architecture Decision Records

### Why pnpm Monorepo?
Shared dependencies and lockfile ensure reproducible builds across all packages. Faster installation and better disk usage compared to npm/yarn.

### Why NestJS?
Modular, opinionated framework with excellent TypeScript support, built-in dependency injection, and decorator-based architecture that scales well.

### Why Prisma?
Type-safe ORM with automatic migrations, excellent TypeScript integration, and an intuitive schema language that mirrors database structure.

### Why FastAPI for AI?
High-performance Python framework with automatic OpenAPI documentation, built-in validation with Pydantic, and excellent async support.

## Performance Considerations

- Database queries are indexed on frequently filtered columns (email, phone, candidateCode, status)
- Redis caching is available for session management and rate limiting
- API responses are paginated for large datasets
- Images and static assets should use CDN in production

## Security

- All passwords are hashed with bcryptjs
- OTP codes are stored hashed, expire after 5 minutes, have a resend cooldown and an attempt limit
- Login is disabled in production until an OTP delivery provider is configured; outside
  production the OTP is only returned when `ALLOW_DEV_OTP_RESPONSE="true"` is set
- Sessions are stored server-side with an expiry. The web app currently keeps the access token in `sessionStorage`, which is a prototype choice; move it to an HttpOnly cookie before production
- CORS currently allows any origin; restrict it to your real domains before deploying
- Every protected API route checks the caller's role, and the checks are covered by automated tests
- Learner-submitted and staff-entered links must be https, and submitted text is always rendered as plain text, never as HTML
- The public lead endpoint never returns stored lead data
- SQL injection protection via Prisma parameterized queries
- Environment variables for sensitive configuration

## Questions or Issues?

Refer to the troubleshooting section above or contact the development team.

---

**Last Updated:** 2026-10-05  
**Version:** 0.1.0  
**Status:** Active Development
