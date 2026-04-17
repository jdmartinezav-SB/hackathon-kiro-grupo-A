-- Migration 009: Create audit_log table
-- Owner: Dev 4 — Analytics + Audit
-- Validates: Property 6 (Registro de Auditoría completo e inmutable)
-- Requirement: 8.1, 8.5, 8.7

-- Enum for HTTP methods used in audit
DO $$ BEGIN
  CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id  UUID NOT NULL,
  consumer_id     UUID NOT NULL REFERENCES consumer(id),
  application_id  UUID NOT NULL REFERENCES application(id),
  api_version_id  UUID REFERENCES api_version(id),
  endpoint        VARCHAR(500) NOT NULL,
  method          http_method NOT NULL,
  status_code     INTEGER NOT NULL,
  ip_address      INET NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance (Requirement 8.2 — filtrado por consumerId, apiId, fechas)
CREATE INDEX IF NOT EXISTS idx_audit_log_consumer_id ON audit_log(consumer_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_application_id ON audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_consumer_created ON audit_log(consumer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_app_created ON audit_log(application_id, created_at);

-- IMMUTABILITY: Revoke UPDATE and DELETE to enforce Property 6
-- Once created, audit records SHALL be immutable
REVOKE UPDATE ON audit_log FROM PUBLIC;
REVOKE DELETE ON audit_log FROM PUBLIC;
