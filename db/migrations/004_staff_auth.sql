-- ============================================================================
-- Migration 004 — Add authentication columns to staff users table
--
-- The users table had no password_hash, is_verified, or updated_at,
-- making staff authentication impossible.
-- ============================================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_login_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Failed login tracking for lockout policy
  ADD COLUMN IF NOT EXISTS failed_attempts  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until     TIMESTAMPTZ;

-- Auto-update trigger for staff users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();  -- created in migration 002

-- Staff sessions table (mirrors the candidate session model)
CREATE TABLE IF NOT EXISTS staff_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token  VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_sessions_access_token
  ON staff_sessions(access_token)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_sessions_user
  ON staff_sessions(user_id);

-- Staff OTP codes (same pattern as candidate OTPs)
CREATE TABLE IF NOT EXISTS staff_otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     VARCHAR(30) NOT NULL DEFAULT 'login',
  code        VARCHAR(255) NOT NULL,  -- bcrypt hash
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    SMALLINT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_otp_attempts_sane CHECK (attempts >= 0 AND attempts <= 10)
);

CREATE INDEX IF NOT EXISTS idx_staff_otp_user_purpose
  ON staff_otp_codes(user_id, purpose)
  WHERE verified_at IS NULL;

COMMIT;
