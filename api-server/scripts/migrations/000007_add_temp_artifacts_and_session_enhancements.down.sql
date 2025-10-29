-- Rollback migration: Remove temp artifacts and session enhancements

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_extend_ttl_on_pause ON processing_sessions;
DROP TRIGGER IF EXISTS trigger_update_session_progress ON processing_stages;

-- Drop functions
DROP FUNCTION IF EXISTS extend_ttl_on_session_pause();
DROP FUNCTION IF EXISTS update_session_progress();
DROP FUNCTION IF EXISTS cleanup_expired_temp_artifacts();

-- Remove columns from processing_stages
ALTER TABLE processing_stages
DROP COLUMN IF EXISTS skip_reason,
DROP COLUMN IF EXISTS input_from_stage_id,
DROP COLUMN IF EXISTS can_skip,
DROP COLUMN IF EXISTS is_optional,
DROP COLUMN IF EXISTS attempt_count;

-- Remove columns from processing_sessions
ALTER TABLE processing_sessions
DROP COLUMN IF EXISTS selected_stages,
DROP COLUMN IF EXISTS auto_proceed,
DROP COLUMN IF EXISTS paused_at,
DROP COLUMN IF EXISTS paused_by_user,
DROP COLUMN IF EXISTS resume_from_stage_id,
DROP COLUMN IF EXISTS total_steps,
DROP COLUMN IF EXISTS completed_steps,
DROP COLUMN IF EXISTS skipped_steps;

-- Drop tables
DROP TABLE IF EXISTS session_checkpoints;
DROP TABLE IF EXISTS temp_artifacts;
