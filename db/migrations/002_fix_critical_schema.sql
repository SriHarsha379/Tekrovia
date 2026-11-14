-- ============================================================================
-- Migration 002 — Critical schema fixes
-- Apply with: psql $DATABASE_URL -f db/migrations/002_fix_critical_schema.sql
-- ============================================================================

BEGIN;

-- ── Fix #8: auto-update trigger function (applies to all tables) ────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Fix #5: leads — enforce at least one contact method ─────────────────────
ALTER TABLE leads
  ADD CONSTRAINT leads_contact_required
    CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- ── Fix #6: leads — unique contacts (partial indexes allow NULL in other rows)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_leads_email
  ON leads(email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_leads_phone
  ON leads(phone) WHERE phone IS NOT NULL;

-- ── Fix #7: payments — add updated_at ────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── Fix #8: attach updated_at triggers to every table that has the column ────

-- leads
DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- candidates
DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;
CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- payments
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- placement_submissions
DROP TRIGGER IF EXISTS trg_placements_updated_at ON placement_submissions;
CREATE TRIGGER trg_placements_updated_at
  BEFORE UPDATE ON placement_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Fix #12: missing indexes on hot-path columns ─────────────────────────────

-- Sessions: accessToken looked up on every authenticated request
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_access_token
  ON sessions(access_token)
  WHERE revoked_at IS NULL;

-- Sessions: refreshToken lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_refresh_token
  ON sessions(refresh_token)
  WHERE revoked_at IS NULL;

-- OtpCode: userId + purpose on every login attempt
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose
  ON otp_codes(user_id, purpose)
  WHERE verified_at IS NULL;

-- Candidate: userId used in every profile + assessment fetch
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_user_id
  ON candidates(user_id);

-- User: email is the primary login lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users(lower(email));  -- case-insensitive uniqueness

-- Lead: leadCode deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_lead_code
  ON leads(lead_code);

COMMIT;
