-- Migration 011: Create notification + notification_preference tables
-- Owner: Dev 4 — Analytics + Audit + Notificaciones
-- Validates: Property 19 (Notificación a todos los consumidores afectados)
-- Requirements: 6.1, 6.2

-- Enum for notification types
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_version', 'maintenance', 'sunset',
    'quota_warning', 'quota_exhausted', 'general'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enum for notification channel
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'portal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enum for notification priority
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- notification table
CREATE TABLE IF NOT EXISTS notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES consumer(id),
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  channel     notification_channel NOT NULL DEFAULT 'portal',
  priority    notification_priority NOT NULL DEFAULT 'medium',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notification_consumer_id ON notification(consumer_id);
CREATE INDEX IF NOT EXISTS idx_notification_consumer_read ON notification(consumer_id, read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);

-- notification_preference table
CREATE TABLE IF NOT EXISTS notification_preference (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id     UUID NOT NULL REFERENCES consumer(id),
  event_type      notification_type NOT NULL,
  email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  portal_enabled  BOOLEAN NOT NULL DEFAULT TRUE,

  -- One preference per consumer per event type
  CONSTRAINT uq_notification_pref_consumer_event
    UNIQUE (consumer_id, event_type)
);

-- Index for preference lookups
CREATE INDEX IF NOT EXISTS idx_notification_pref_consumer ON notification_preference(consumer_id);
