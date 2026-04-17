-- ============================================================
-- Migration 001: Create consumer table
-- Database: PostgreSQL 15+
-- Description: Stores registered API consumers (aliados/intermediarios)
-- Owner: Dev 1 — Backend Core + Auth
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for consumer
DO $$ BEGIN
    CREATE TYPE business_profile_enum AS ENUM ('salud', 'autos', 'vida', 'hogar', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE consumer_status_enum AS ENUM ('pending', 'active', 'suspended', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS consumer (
    id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT                  NOT NULL,
    password_hash     TEXT                  NOT NULL,
    company_name      TEXT                  NOT NULL,
    contact_name      TEXT                  NOT NULL,
    phone             TEXT,
    business_profile  business_profile_enum NOT NULL,
    status            consumer_status_enum  NOT NULL DEFAULT 'pending',
    email_verified    BOOLEAN               NOT NULL DEFAULT FALSE,
    plan_id           UUID,
    created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    last_activity_at  TIMESTAMPTZ
);

-- Unique constraint on email
DO $$ BEGIN
    ALTER TABLE consumer ADD CONSTRAINT consumer_email_uk UNIQUE (email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_consumer_email           ON consumer (email);
CREATE INDEX IF NOT EXISTS idx_consumer_status          ON consumer (status);
CREATE INDEX IF NOT EXISTS idx_consumer_business_profile ON consumer (business_profile);
CREATE INDEX IF NOT EXISTS idx_consumer_plan_id         ON consumer (plan_id);
