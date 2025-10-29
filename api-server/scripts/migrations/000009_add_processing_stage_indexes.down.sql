-- Remove indexes for processing_stages table

DROP INDEX IF EXISTS idx_processing_stages_execution;
DROP INDEX IF EXISTS idx_processing_stages_input_from;
DROP INDEX IF EXISTS idx_processing_stages_session_order;
DROP INDEX IF EXISTS idx_processing_stages_session_status;
DROP INDEX IF EXISTS idx_processing_stages_session_stage;
DROP INDEX IF EXISTS idx_processing_stages_session_id;
