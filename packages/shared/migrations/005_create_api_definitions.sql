-- Migration 005: Create api_definition table
-- Owner: Dev 2 — Catalog Service

DO $$ BEGIN
  CREATE TYPE api_status AS ENUM ('active', 'deprecated', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS api_definition (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(100) NOT NULL,
  status      api_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_definition_status ON api_definition(status);
CREATE INDEX IF NOT EXISTS idx_api_definition_category ON api_definition(category);
