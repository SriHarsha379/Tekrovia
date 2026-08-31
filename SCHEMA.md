# TekRovia — Database Schema Notes

Stack assumed: **PostgreSQL + FastAPI + SQLAlchemy 2.0 (or SQLModel) + Alembic** for migrations,
Next.js consuming the FastAPI REST/OpenAPI layer.

## How the tables map to the blueprint's data foundation

`Campaign → Lead → Candidate → Registration → Payment → Batch → Activity → Assessment → Support → Placement`

| Blueprint stage | Tables |
|---|---|
| Campaign | `campaigns` |
| Lead | `leads`, `funnel_events` |
| Candidate | `candidates`, `otp_verifications` |
| Registration | `registrations` |
| Payment | `products`, `payments`, `payment_items` |
| Batch / Onboarding | `batches`, `enrollments`, `trial_progress`, `automation_events` |
| Learning (LMS) | `courses`, `modules`, `lessons`, `activities`, `assignments`, `assignment_submissions`, `projects`, `project_submissions` |
| Assessment | `assessments`, `mock_interviews`, `resumes`, `readiness_gates` |
| Support | `support_tickets`, `ticket_comments` |
| Placement | `job_postings`, `job_matches`, `placement_submissions`, `interview_rounds`, `placement_recovery` |

`candidates.id` is the single source-of-truth foreign key threaded through every table — this is
the "one Candidate ID across marketing, LMS, support, assessments and placement" principle from
the blueprint. `candidate_code` is the human-readable ID (e.g. `TKR-2026-000123`) shown in the UI;
`id` (UUID) is the actual join key.

## Key design decisions

- **UUID primary keys** everywhere, via `pgcrypto`'s `gen_random_uuid()`. Plays nicely with
  FastAPI/Pydantic and avoids leaking sequential row counts (candidate volume, lead volume) through
  the API.
- **Payments support bundles.** `payment_items` is a line-item table so one Razorpay payment can
  cover the Complete Package (all 4 products at once) as well as a single stage-wise purchase —
  matches "Allow stage-wise purchase and one-click upgrades."
- **`funnel_events` is append-only.** Rather than trying to infer the marketing funnel
  (visitor → registration → assessment → checkout → enrollment) from other tables, log it directly.
  This is what your Marketing dashboard's daily funnel table queries.
- **`readiness_gates` is a snapshot table**, re-evaluated (new row) each time projects/mocks/scores
  change, so you keep a history of *why* a candidate passed or failed the gate — useful for the
  four-interview recovery rule and for support/dispute conversations.
- **`unlock_rule` and `breakdown` are JSONB.** Module unlock logic and assessment score breakdown
  (theory/logical/practical) are structured-but-flexible — JSONB avoids a rigid extra table while
  staying queryable (`WHERE breakdown->>'theory' >= '4'`).
- **Enums over free-text status columns** everywhere a fixed vocabulary exists (ticket categories,
  pipeline stages, payment status). Postgres enforces it at the DB layer; FastAPI/Pydantic mirrors
  the same enum so invalid states can't reach the database.
- **`placement_submissions.stage`** is the 11-stage pipeline from the blueprint
  (`profile_review` → `joined`) as a single enum column rather than 11 boolean flags — makes the
  Kanban-style placement dashboard a single `GROUP BY stage` query.

## FastAPI integration notes

- Generate SQLAlchemy models from this DDL (or hand-write with SQLModel, which is the more
  fresher-friendly option since one class doubles as the Pydantic schema).
- Use **Alembic** from day one — the roadmap's Phase 0 "core DB schema" week should end with an
  initial Alembic migration, not a hand-run `schema.sql`, so schema changes in later phases are
  tracked and revertible.
- Suggested router split matches the "Division of Work" section of the roadmap:
  - Lead owns: `auth`, `payments`, `ai`, `readiness`, `placement_recovery`, `automation` routers
  - Junior owns (once you define the Pydantic schemas): `leads`/`registrations` CRUD,
    `support_tickets` CRUD, `dashboard` read-only aggregation endpoints
- Money and AI tables (`payments`, `payment_items`, `mock_interviews`, `assessments`) should sit
  behind endpoints that only the lead developer merges — same "keep this yours" principle as the
  roadmap already states for Razorpay.

## Things you'll still need to decide before Phase 0 ends

1. Whether `assessments.breakdown` needs a normalized `assessment_questions` /
   `assessment_answers` pair later (only worth it once you build a question bank UI — JSONB is
   fine for MVP).
2. Whether `interview_rounds` should exist at all in MVP, or whether `placement_submissions.stage`
   transitions are enough — the blueprint's 11-stage pipeline doesn't explicitly ask for
   round-by-round detail, so this table is optional scope you can cut for the Week 22–24 phase if
   time is tight.
3. Soft-delete vs hard-delete policy for `candidates` — none of the FKs currently cascade-delete
   candidate history except where explicitly marked `ON DELETE CASCADE`; recommend soft-delete
   (`is_active` flag, already present) rather than ever hard-deleting a candidate given payment/
   placement history.
