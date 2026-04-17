-- Migration 006: Create api_version table
-- Service: catalog-service (Dev 2)
-- Depends on: 005_create_api_definitions.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_version_format') THEN
        CREATE TYPE api_version_format AS ENUM ('yaml', 'json');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_version_status') THEN
        CREATE TYPE api_version_status AS ENUM ('active', 'deprecated', 'retired');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS api_version (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_definition_id   UUID NOT NULL REFERENCES api_definition(id) ON DELETE CASCADE,
    version_tag         VARCHAR(50) NOT NULL,
    openapi_spec        TEXT NOT NULL,
    format              api_version_format NOT NULL DEFAULT 'yaml',
    status              api_version_status NOT NULL DEFAULT 'active',
    semantic_metadata   JSONB DEFAULT '{}',
    published_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_version_api_definition_id ON api_version (api_definition_id);
CREATE INDEX IF NOT EXISTS idx_api_version_status ON api_version (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_version_unique_tag ON api_version (api_definition_id, version_tag);
