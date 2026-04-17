-- Migration 013: Create sync_log table
-- Owner: Dev 3 — Sandbox + Gateway Simulator
-- Validates: Requirement 17.5 (registro de sincronización control → data plane)

CREATE TYPE sync_log_status AS ENUM ('pending', 'propagated', 'confirmed', 'failed');

CREATE TABLE IF NOT EXISTS sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_type     VARCHAR(100) NOT NULL,
    change_payload  JSONB NOT NULL DEFAULT '{}',
    status          sync_log_status NOT NULL DEFAULT 'pending',
    propagated_at   TIMESTAMPTZ,
    confirmed_at    TIMESTAMPTZ
);

-- Index for filtering by status (pending items to process)
CREATE INDEX idx_sync_log_status
    ON sync_log (status);

-- Index for ordering by propagation time
CREATE INDEX idx_sync_log_propagated
    ON sync_log (propagated_at DESC);
