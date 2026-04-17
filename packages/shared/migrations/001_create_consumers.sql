-- Migration 001: Create consumer table
-- Owner: Dev 1 — Backend Core + Auth

DO $$ BEGIN
  CREATE TYPE business_profile AS ENUM ('insurtech', 'broker', 'enterprise', 'startup');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consumer_status AS ENUM ('active', 'suspended', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consumer_role AS ENUM ('consumer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS consumer (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  company_name      VARCHAR(255) NOT NULL,
  contact_name      VARCHAR(255) NOT NULL,
  phone             VARCHAR(50),
  business_profile  business_profile NOT NULL DEFAULT 'enterprise',
  status            consumer_status NOT NULL DEFAULT 'active',
  role              consumer_role NOT NULL DEFAULT 'consumer',
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_plan_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consumer_email ON consumer(email);
CREATE INDEX IF NOT EXISTS idx_consumer_status ON consumer(status);
