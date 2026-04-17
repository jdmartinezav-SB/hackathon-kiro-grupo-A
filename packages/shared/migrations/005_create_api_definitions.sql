-- Migration 005: Create api_definition table
-- Service: catalog-service (Dev 2)
-- Depends on: none (standalone catalog table)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_definition_status') THEN
        CREATE TYPE api_definition_status AS ENUM ('active', 'deprecated', 'retired', 'maintenance');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS api_definition (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100) NOT NULL,
    status          api_definition_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_definition_status ON api_definition (status);
CREATE INDEX IF NOT EXISTS idx_api_definition_category ON api_definition (category);
