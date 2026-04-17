-- Migration 008: Create sandbox_history table
-- Owner: Dev 3 — Sandbox + Gateway Simulator
-- Validates: Requirement 3.4 (historial últimas 50 peticiones por app)

CREATE TABLE IF NOT EXISTS sandbox_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    api_version_id  UUID NOT NULL REFERENCES api_version(id) ON DELETE CASCADE,
    method          VARCHAR(10) NOT NULL,
    path            VARCHAR(2048) NOT NULL,
    request_headers JSONB DEFAULT '{}',
    request_body    JSONB,
    response_status INTEGER NOT NULL,
    response_headers JSONB DEFAULT '{}',
    response_body   JSONB,
    response_time_ms INTEGER NOT NULL,
    correlation_id  VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for history query: last 50 entries per application (DESC by created_at)
CREATE INDEX idx_sandbox_history_app_created
    ON sandbox_history (application_id, created_at DESC);

-- Index for correlation_id lookups (traceability)
CREATE INDEX idx_sandbox_history_correlation
    ON sandbox_history (correlation_id);
