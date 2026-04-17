-- Migration 007: Create sunset_plan table
-- Owner: Dev 2 — Catalog Service

CREATE TABLE IF NOT EXISTS sunset_plan (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_version_id          UUID NOT NULL REFERENCES api_version(id) ON DELETE CASCADE,
  replacement_version_id  UUID REFERENCES api_version(id),
  sunset_date             DATE NOT NULL,
  migration_guide_url     VARCHAR(500),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sunset_plan_api_version ON sunset_plan(api_version_id);
CREATE INDEX IF NOT EXISTS idx_sunset_plan_date ON sunset_plan(sunset_date);
