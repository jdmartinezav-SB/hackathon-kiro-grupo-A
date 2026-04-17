-- ============================================================
-- Migration 002: Create application table
-- Database: PostgreSQL 15+
-- Description: Stores applications registered by consumers
-- Owner: Dev 1 — Backend Core + Auth
-- ============================================================

-- Enum type for application status
DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM ('active', 'suspended', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS application (
    id            UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id   UUID                     NOT NULL REFERENCES consumer(id) ON DELETE CASCADE,
    name          TEXT                     NOT NULL,
    description   TEXT,
    status        application_status_enum  NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_application_consumer_id ON application (consumer_id);
CREATE INDEX IF NOT EXISTS idx_application_status      ON application (status);
