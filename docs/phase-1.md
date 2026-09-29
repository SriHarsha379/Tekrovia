# SkillMove / TekRovia — Phase 1 Implementation

## Implemented in this phase

- Preserved the existing `backend/`, `frontend/`, `schema.sql`, and `SCHEMA.md` files.
- Added an `apps/api` NestJS service with global validation, versioned API prefix, health endpoint, CORS, and Swagger.
- Added an `apps/ai-service` FastAPI service with OpenAPI, Pydantic validation, and an explicit not-configured roadmap boundary.
- Added shared `@tekrovia/types` and `@tekrovia/validation` packages.
- Kept PostgreSQL and Redis in Docker Compose.

## Runtime boundaries

The AI roadmap endpoint intentionally does not claim to generate AI output until an approved provider and human-review workflow are configured. Payment, messaging, storage, authentication, and LMS modules remain subsequent phases.

## Local verification commands

```bash
pnpm install
pnpm docker:up
pnpm --dir apps/api run build
pnpm --dir apps/api run typecheck
cd apps/ai-service && python -m pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000
```

API health: `GET http://localhost:3001/api/v1/health`  
AI health: `GET http://localhost:8000/health`  
Swagger: `http://localhost:3001/docs`

## Next phase

Implement Prisma schema/migrations, authentication, candidate registration, assessment persistence, CRM, and tests against PostgreSQL. Do not bypass the existing SQL domain model without a migration review.
