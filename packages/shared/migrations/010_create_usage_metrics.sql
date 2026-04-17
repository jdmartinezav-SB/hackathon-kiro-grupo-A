-- Migration 010: Create usage_metric table
-- Owner: Dev 4 — Analytics + Audit
-- Validates: Property 8 (Cálculo correcto de porcentaje de Cuota)
-- Requirements: 4.1, 4.3, 4.6

CREATE TABLE IF NOT EXISTS usage_metric (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES application(id),
  api_version_id  UUID REFERENCES api_version(id),
  metric_date     DATE NOT NULL,
  total_requests  INTEGER NOT NULL DEFAULT 0,
  success_count   INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms  REAL NOT NULL DEFAULT 0.0,
  quota_used      INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one metric row per app + api_version + day
  CONSTRAINT uq_usage_metric_app_api_date
    UNIQUE (application_id, api_version_id, metric_date)
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_usage_metric_app_id ON usage_metric(application_id);
CREATE INDEX IF NOT EXISTS idx_usage_metric_metric_date ON usage_metric(metric_date);
CREATE INDEX IF NOT EXISTS idx_usage_metric_app_date ON usage_metric(application_id, metric_date);
