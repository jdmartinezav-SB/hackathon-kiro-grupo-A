-- ============================================================
-- Migration 003: Create credential table
-- Database: PostgreSQL 15+
-- Description: Stores OAuth2 client credentials per application
-- Owner: Dev 1 — Backend Core + Auth
-- ============================================================

-- Enum types for credential
DO $$ BEGIN
    CREATE TYPE credential_environment_enum AS ENUM ('sandbox', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE credential_status_enum AS ENUM ('active', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS credential (
    id                  UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID                        NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    client_id           TEXT                        NOT NULL,
    client_secret_hash  TEXT                        NOT NULL,
    environment         credential_environment_enum NOT NULL DEFAULT 'sandbox',
    status              credential_status_enum      NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    revoked_at          TIMESTAMPTZ
);

-- Unique constraint on client_id
DO $$ BEGIN
    ALTER TABLE credential ADD CONSTRAINT credential_client_id_uk UNIQUE (client_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credential_application_id ON credential (application_id);
CREATE INDEX IF NOT EXISTS idx_credential_client_id      ON credential (client_id);
CREATE INDEX IF NOT EXISTS idx_credential_environment    ON credential (environment);
CREATE INDEX IF NOT EXISTS idx_credential_status         ON credential (status);
