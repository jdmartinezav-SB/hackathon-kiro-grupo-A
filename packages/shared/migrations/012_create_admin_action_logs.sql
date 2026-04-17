-- Migration 012: Create admin_action_log table
-- Owner: Dev 1 — Backend Core + Auth

CREATE TABLE IF NOT EXISTS admin_action_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES consumer(id),
  target_id     UUID NOT NULL,
  action        VARCHAR(100) NOT NULL,
  reason        TEXT,
  previous_state JSONB,
  new_state     JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin ON admin_action_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_target ON admin_action_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created ON admin_action_log(created_at);
