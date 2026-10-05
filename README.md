# SkillMove / TekRovia — Learning-to-Placement Platform

> A modern, scalable EdTech platform built with Next.js, NestJS, FastAPI, PostgreSQL, Prisma, and a pnpm monorepo architecture.

## Overview

SkillMove / TekRovia is a comprehensive learning and placement platform designed to bridge the gap between skill development and career placement. The platform includes:

- **Candidate Onboarding**: Lead capture, registration, and profile management
- **Skill Assessments**: Career readiness, technical, and mock interview assessments
- **Personalized Roadmaps**: AI-driven learning paths tailored to individual goals
- **CRM Integration**: Lead management and conversion tracking
- **Learning Management**: Course materials, live labs, and guided projects
- **Placement Support**: Job matching and interview preparation

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

### Authentication

**Register a user:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+919876543210",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Verify OTP:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### Candidate Registration

**Create a candidate profile:**

```bash
curl -X POST http://localhost:3001/api/v1/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+919988776655",
    "education": "BACHELORS",
    "graduationYear": 2024,
    "experienceYears": 1,
    "skills": ["JavaScript", "React", "Node.js"],
    "targetRole": "Full Stack Developer",
    "codingPreference": "JavaScript",
    "courseInterest": "Full Stack Development",
    "consentGiven": true
  }'
```

**List all candidates:**

```bash
curl http://localhost:3001/api/v1/candidates
```

**Get candidate by ID:**

```bash
curl http://localhost:3001/api/v1/candidates/{id}
```

### Assessments

**Create assessment:**

```bash
curl -X POST http://localhost:3001/api/v1/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "candidate_id_here",
    "type": "FREE_ASSESSMENT",
    "title": "JavaScript Fundamentals",
    "description": "Test your JavaScript knowledge"
  }'
```

### CRM Leads

**Capture a new lead:**

```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prospect Name",
    "email": "prospect@example.com",
    "phone": "+919123456789",
    "courseInterest": "Full Stack Development",
    "source": "website",
    "consentGiven": true
  }'
```

**Convert lead to candidate:**

```bash
curl -X GET http://localhost:3001/api/v1/leads/{leadId}/convert/{candidateId}
```

## Database Schema

### Key Models

- **User** — Platform users with roles (STUDENT, TRAINER, ADMIN, etc.)
- **Candidate** — Student profiles with education, skills, and career goals
- **Assessment** — Skill tests with scoring and roadmap generation
- **Lead** — CRM prospects from marketing campaigns
- **Session** — User login sessions with access and refresh tokens
- **OtpCode** — One-time passwords for verification
- **AuditLog** — Action tracking for compliance and debugging

See `prisma/schema.prisma` for complete schema definition.

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests (requires running services)

```bash
pnpm test:integration
```

### Test Coverage

```bash
pnpm test:coverage
```

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

### Phase 1 ✅ (Complete)
- Monorepo scaffolding
- NestJS API foundation
- FastAPI AI service boundary
- Prisma schema and seed
- Auth, candidate, assessment, and CRM modules

### Phase 2 (In Progress)
- JWT authentication hardening
- Database migration validation
- Candidate and assessment persistence
- Lead conversion workflows
- Comprehensive testing

### Phase 3 (Planned)
- LMS and course management
- Payment integration (Razorpay)
- Onboarding flows
- AI roadmap generation
- Admin dashboard

### Phase 4 (Planned)
- Job matching engine
- Interview preparation tools
- Placement management
- Analytics and reporting
- Mobile app

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
- Sessions use signed tokens with expiry
- CORS is enabled for local development
- SQL injection protection via Prisma parameterized queries
- Environment variables for sensitive configuration

## Questions or Issues?

Refer to the troubleshooting section above or contact the development team.

---

**Last Updated:** 2026-09-29  
**Version:** 0.1.0  
**Status:** Active Development
