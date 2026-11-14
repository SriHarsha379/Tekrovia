-- ============================================================================
-- Migration 005 — Payment integrity + configurable pricing
-- ============================================================================

BEGIN;

-- ── Fix #15: Move prices to a versioned price_list table ──────────────────
-- Products keep their identity; prices are versioned separately
CREATE TABLE IF NOT EXISTS price_list (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id),
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency     VARCHAR(10) NOT NULL DEFAULT 'INR',
  valid_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until  TIMESTAMPTZ,  -- NULL means currently active
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT price_list_dates_sane
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_price_list_product_active
  ON price_list(product_id, valid_from DESC)
  WHERE valid_until IS NULL;

-- Migrate existing hardcoded prices into price_list
INSERT INTO price_list (product_id, amount, currency)
SELECT id, price, 'INR'
FROM products
WHERE price IS NOT NULL
ON CONFLICT DO NOTHING;

-- payments: add updated_at trigger (may already exist from migration 002)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- payments: add razorpay webhook event log instead of storing signature
-- (signature is for verification only, not long-term storage)
CREATE TABLE IF NOT EXISTS payment_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID REFERENCES payments(id) ON DELETE CASCADE,
  event_type      VARCHAR(100) NOT NULL,  -- e.g. payment.captured, payment.failed
  razorpay_event  JSONB,                  -- raw webhook payload (no signature stored)
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment
  ON payment_events(payment_id);

COMMIT;
