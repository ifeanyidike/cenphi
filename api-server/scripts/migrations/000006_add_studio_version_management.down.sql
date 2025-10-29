-- Rollback AI Studio Version Management Schema

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_processing_sessions_updated_at ON processing_sessions;
DROP TRIGGER IF EXISTS trigger_update_processing_stages_updated_at ON processing_stages;

-- Drop functions
DROP FUNCTION IF EXISTS update_processing_sessions_updated_at();
DROP FUNCTION IF EXISTS update_processing_stages_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_processing_sessions_testimonial_id;
DROP INDEX IF EXISTS idx_processing_sessions_workspace_id;
DROP INDEX IF EXISTS idx_processing_sessions_status;

DROP INDEX IF EXISTS idx_processing_stages_session_id;
DROP INDEX IF EXISTS idx_processing_stages_stage_id;
DROP INDEX IF EXISTS idx_processing_stages_status;
DROP INDEX IF EXISTS idx_processing_stages_order;

DROP INDEX IF EXISTS idx_stage_versions_stage_id;
DROP INDEX IF EXISTS idx_stage_versions_accepted;
DROP INDEX IF EXISTS idx_stage_versions_temporary;

DROP INDEX IF EXISTS idx_contextual_suggestions_stage_id;
DROP INDEX IF EXISTS idx_contextual_suggestions_type;
DROP INDEX IF EXISTS idx_contextual_suggestions_applied;

DROP INDEX IF EXISTS idx_studio_action_logs_session_id;
DROP INDEX IF EXISTS idx_studio_action_logs_created_at;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS studio_action_logs;
DROP TABLE IF EXISTS contextual_suggestions;
DROP TABLE IF EXISTS stage_versions;
DROP TABLE IF EXISTS processing_stages;
DROP TABLE IF EXISTS processing_sessions;