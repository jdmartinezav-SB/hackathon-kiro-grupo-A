-- Migration 003: Create credential table
-- Owner: Dev 1 — Backend Core + Auth

DO $$ BEGIN
  CREATE TYPE credential_env AS ENUM ('sandbox', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE credential_status AS ENUM ('active', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS credential (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
  client_id           UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  client_secret_hash  VARCHAR(255) NOT NULL,
  environment         credential_env NOT NULL DEFAULT 'sandbox',
  status              credential_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credential_application_id ON credential(application_id);
CREATE INDEX IF NOT EXISTS idx_credential_client_id ON credential(client_id);
