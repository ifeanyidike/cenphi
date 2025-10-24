-- Migration to add session activity tracking columns
-- Run this in Supabase SQL Editor or via psql

-- Add activity tracking columns to processing_sessions
ALTER TABLE processing_sessions
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW();

ALTER TABLE processing_sessions
ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT FALSE;

ALTER TABLE processing_sessions
ADD COLUMN IF NOT EXISTS stale_marked_at TIMESTAMP NULL;

-- Create index for efficient stale session queries
CREATE INDEX IF NOT EXISTS idx_processing_sessions_activity
ON processing_sessions(last_activity_at, is_stale)
WHERE status IN ('active', 'paused');

-- Backfill last_activity_at with updated_at for existing sessions
UPDATE processing_sessions
SET last_activity_at = updated_at
WHERE last_activity_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN processing_sessions.last_activity_at IS 'Last time user interacted with this session (accept/skip/retry/preview)';
COMMENT ON COLUMN processing_sessions.is_stale IS 'Session marked as stale due to inactivity (30+ minutes)';
COMMENT ON COLUMN processing_sessions.stale_marked_at IS 'Timestamp when session was marked as stale';

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'processing_sessions'
AND column_name IN ('last_activity_at', 'is_stale', 'stale_marked_at')
ORDER BY column_name;
