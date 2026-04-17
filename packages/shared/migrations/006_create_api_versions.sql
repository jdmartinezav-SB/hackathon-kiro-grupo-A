-- Migration 006: Create api_version table
-- Owner: Dev 2 — Catalog Service

DO $$ BEGIN
  CREATE TYPE spec_format AS ENUM ('yaml', 'json');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE version_status AS ENUM ('active', 'deprecated', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS api_version (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_definition_id   UUID NOT NULL REFERENCES api_definition(id) ON DELETE CASCADE,
  version_tag         VARCHAR(50) NOT NULL,
  openapi_spec        TEXT NOT NULL,
  format              spec_format NOT NULL DEFAULT 'json',
  status              version_status NOT NULL DEFAULT 'active',
  semantic_metadata   JSONB DEFAULT '{}',
  published_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_api_version_def_tag UNIQUE (api_definition_id, version_tag)
);

CREATE INDEX IF NOT EXISTS idx_api_version_definition_id ON api_version(api_definition_id);
CREATE INDEX IF NOT EXISTS idx_api_version_status ON api_version(status);

-- Now add FK from subscription_api to api_version
ALTER TABLE subscription_api ADD CONSTRAINT fk_subscription_api_version
  FOREIGN KEY (api_version_id) REFERENCES api_version(id) ON DELETE CASCADE;
