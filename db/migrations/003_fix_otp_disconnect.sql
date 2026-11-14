-- ============================================================================
-- Migration 003 — Resolve OTP table split
--
-- Problem: schema.sql created `otp_verifications` (identifier-based, no FK to users).
--          NestJS/Prisma uses `otp_codes` (userId FK).
--          This migration drops the orphaned table and ensures otp_codes is canonical.
-- ============================================================================

BEGIN;

-- Only drop if Prisma's otp_codes table already exists and is populated
-- (run this after Prisma migrations have run)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'otp_codes'
  ) THEN
    -- Safe to remove the disconnected legacy table
    DROP TABLE IF EXISTS otp_verifications;
    RAISE NOTICE 'otp_verifications dropped — otp_codes is canonical.';
  ELSE
    RAISE EXCEPTION 'otp_codes table not found. Run Prisma migrations first.';
  END IF;
END
$$;

-- Harden otp_codes: add check that attempts never exceeds max
ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_attempts_sane
    CHECK (attempts >= 0 AND attempts <= 10);

-- Expire index: fast lookup of non-expired, non-verified codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_active
  ON otp_codes(user_id, purpose, expires_at)
  WHERE verified_at IS NULL;

COMMIT;
