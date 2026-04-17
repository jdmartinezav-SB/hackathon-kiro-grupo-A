-- ============================================================
-- Migration 012: Create admin_action_log table
-- Database: PostgreSQL 15+
-- Description: Stores administrative actions (approve, suspend,
--              revoke, reactivate) for audit trail (Req 7.5)
-- Owner: Dev 1 — Backend Core + Auth
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_action_log (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id              UUID        NOT NULL,
    action_type           TEXT        NOT NULL,
    target_consumer_id    UUID        NOT NULL,
    target_app_id         UUID,
    reason                TEXT        NOT NULL,
    details               JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin_id           ON admin_action_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_target_consumer_id ON admin_action_log (target_consumer_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_target_app_id      ON admin_action_log (target_app_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_action_type        ON admin_action_log (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created_at         ON admin_action_log (created_at);
