-- Migration 008: Create sandbox_history table
-- Owner: Dev 3 — Sandbox Service

CREATE TABLE IF NOT EXISTS sandbox_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
  api_version_id    UUID NOT NULL REFERENCES api_version(id),
  method            VARCHAR(10) NOT NULL,
  path              VARCHAR(500) NOT NULL,
  request_headers   JSONB DEFAULT '{}',
  request_body      JSONB,
  response_status   INTEGER NOT NULL,
  response_headers  JSONB DEFAULT '{}',
  response_body     JSONB,
  response_time_ms  INTEGER NOT NULL,
  correlation_id    UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_history_app_id ON sandbox_history(application_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_history_created_at ON sandbox_history(created_at);
