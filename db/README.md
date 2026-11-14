# TekRovia — Database

## Single Source of Truth

**Prisma is the canonical schema.** The `schema.sql` file at the repo root
is a legacy blueprint and must NOT be run against any database managed by
Prisma migrations. It exists for reference only and will be removed once
the full platform schema is modelled in Prisma.

## Migration Order

Apply raw SQL migrations (for tables not yet in Prisma) in this order:

```bash
# 1. Run all Prisma migrations first
pnpm db:migrate

# 2. Apply supplementary SQL patches
psql $DATABASE_URL -f db/migrations/002_fix_critical_schema.sql
psql $DATABASE_URL -f db/migrations/003_fix_otp_disconnect.sql
psql $DATABASE_URL -f db/migrations/004_staff_auth.sql
psql $DATABASE_URL -f db/migrations/005_payments_integrity.sql
```

## Rules

- Never edit `schema.sql` for new features — add a Prisma model instead.
- Every `updated_at` column needs the `set_updated_at()` trigger (created in 002).
- All new tables need explicit indexes on FK columns and hot-path lookups.
- Passwords/secrets never go in migration files — use env vars.
