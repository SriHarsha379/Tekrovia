# TekRovia Backend (FastAPI)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill in DATABASE_URL etc.
```

## Database

Requires PostgreSQL 14+ with the `pgcrypto` extension (models use Python-side
UUID generation, so this is only needed if you also run `db/schema.sql`
directly for reference/comparison).

```bash
createdb tekrovia

# Generate the first migration from the SQLModel classes in app/models/
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## Run the API

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs (this is what the frontend dev should build against):
  http://localhost:8000/docs

## Project layout

```
app/
  core/        # settings, DB session
  models/      # SQLModel tables — one file per functional area, matches db/schema.sql
  routers/     # FastAPI routers — one file per resource
  main.py      # app entrypoint, router registration
alembic/       # migrations
```

## Ownership (per the roadmap's division of work)

- **Lead dev:** `auth.py`, payments/Razorpay routers (not yet scaffolded), AI routers,
  readiness/placement business logic, all of `app/models/`, Alembic migrations.
- **Junior dev:** CRUD routers once schemas are agreed (`leads.py`, `candidates.py`
  read endpoints are a starting example), frontend integration.

Every PR into `main` should be reviewed by the lead dev before merge.
