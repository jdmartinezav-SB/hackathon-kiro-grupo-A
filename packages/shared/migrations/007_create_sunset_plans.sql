-- Migration 007: Create sunset_plan table
-- Service: catalog-service (Dev 2)
-- Depends on: 006_create_api_versions.sql

CREATE TABLE IF NOT EXISTS sunset_plan (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_version_id          UUID NOT NULL REFERENCES api_version(id) ON DELETE CASCADE,
    replacement_version_id  UUID REFERENCES api_version(id) ON DELETE SET NULL,
    sunset_date             DATE NOT NULL,
    migration_guide_url     TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sunset_plan_api_version_id ON sunset_plan (api_version_id);
CREATE INDEX IF NOT EXISTS idx_sunset_plan_sunset_date ON sunset_plan (sunset_date);
