-- Drop activity tracking columns
DROP INDEX IF EXISTS idx_processing_sessions_activity;

ALTER TABLE processing_sessions
DROP COLUMN IF EXISTS last_activity_at,
DROP COLUMN IF EXISTS is_stale,
DROP COLUMN IF EXISTS stale_marked_at;
