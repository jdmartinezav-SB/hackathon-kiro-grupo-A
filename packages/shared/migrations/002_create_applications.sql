-- Migration 002: Create application table
-- Owner: Dev 1 — Backend Core + Auth

DO $$ BEGIN
  CREATE TYPE app_status AS ENUM ('active', 'inactive', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS application (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id   UUID NOT NULL REFERENCES consumer(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  status        app_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_consumer_id ON application(consumer_id);
