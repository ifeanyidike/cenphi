-- Add indexes for stage cleanup queries
-- These indexes enable efficient cleanup of old processing stages via session joins

-- Index for cancelled sessions cleanup (uses last_activity_at)
CREATE INDEX IF NOT EXISTS idx_processing_sessions_status_activity
ON processing_sessions(status, last_activity_at);

-- Index for completed/failed sessions cleanup (uses completed_at)
CREATE INDEX IF NOT EXISTS idx_processing_sessions_status_completed
ON processing_sessions(status, completed_at);

-- Add comments to document cleanup policy
COMMENT ON INDEX idx_processing_sessions_status_activity IS 'Optimizes cleanup of cancelled session stages by last activity (7 day retention)';
COMMENT ON INDEX idx_processing_sessions_status_completed IS 'Optimizes cleanup of completed/failed session stages by completion time (90 day retention)';
