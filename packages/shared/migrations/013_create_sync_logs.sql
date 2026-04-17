-- Migration 013: Create sync_log table
-- Owner: Dev 3 — Sandbox Service

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('pending', 'propagated', 'confirmed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type     VARCHAR(100) NOT NULL,
  change_payload  JSONB NOT NULL,
  status          sync_status NOT NULL DEFAULT 'pending',
  propagated_at   TIMESTAMPTZ,
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON sync_log(created_at);
