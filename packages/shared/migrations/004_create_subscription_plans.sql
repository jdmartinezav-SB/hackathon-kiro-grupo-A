-- Migration 004: Create subscription_plan and subscription_api tables
-- Owner: Dev 1 — Backend Core + Auth

DO $$ BEGIN
  CREATE TYPE quota_period AS ENUM ('daily', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS subscription_plan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  quota_limit   INTEGER NOT NULL DEFAULT 10000,
  quota_period  quota_period NOT NULL DEFAULT 'monthly',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- After api_version table exists, this links plans to APIs
CREATE TABLE IF NOT EXISTS subscription_api (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plan(id) ON DELETE CASCADE,
  api_version_id      UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_subscription_api UNIQUE (subscription_plan_id, api_version_id)
);

-- Add FK from consumer to subscription_plan (deferred because plan may not exist yet)
-- This is done via ALTER TABLE since consumer is created in 001
ALTER TABLE consumer ADD CONSTRAINT fk_consumer_subscription_plan
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plan(id)
  ON DELETE SET NULL;
