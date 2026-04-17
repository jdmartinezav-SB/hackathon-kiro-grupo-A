-- ============================================================
-- Migration 004: Create subscription_plan and subscription_api tables
-- Database: PostgreSQL 15+
-- Description: Stores subscription plans with quota limits and
--              the many-to-many relationship between plans and API versions
-- Owner: Dev 1 — Backend Core + Auth
-- ============================================================

-- Enum type for quota period
DO $$ BEGIN
    CREATE TYPE quota_period_enum AS ENUM ('hour', 'day', 'month');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------
-- subscription_plan table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plan (
    id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT              NOT NULL,
    quota_limit   INTEGER           NOT NULL,
    quota_period  quota_period_enum NOT NULL,
    created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plan_name ON subscription_plan (name);

-- -------------------------------------------------------
-- subscription_api table (plan ↔ api_version join)
-- api_version_id references api_version created by Dev 2;
-- FK constraint omitted because the target table may not
-- exist yet at migration time.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_api (
    id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID  NOT NULL REFERENCES subscription_plan(id) ON DELETE CASCADE,
    api_version_id  UUID  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_api_plan_id        ON subscription_api (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_api_api_version_id ON subscription_api (api_version_id);

-- -------------------------------------------------------
-- Add FK from consumer.plan_id → subscription_plan(id)
-- The column was created in 001 without FK to avoid
-- circular dependency; now we can safely add the constraint.
-- -------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE consumer
        ADD CONSTRAINT fk_consumer_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plan(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
