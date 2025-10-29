-- Remove stage cleanup indexes

DROP INDEX IF EXISTS idx_processing_sessions_status_activity;
DROP INDEX IF EXISTS idx_processing_sessions_status_completed;
