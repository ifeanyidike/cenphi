-- Add indexes for common processing_stages queries

-- Index for finding stages by session_id (most common query)
CREATE INDEX IF NOT EXISTS idx_processing_stages_session_id
ON processing_stages(session_id);

-- Index for finding stage by session_id and stage_id together (GetBySessionAndStageID)
CREATE INDEX IF NOT EXISTS idx_processing_stages_session_stage
ON processing_stages(session_id, stage_id);

-- Index for finding pending stages by status (ExecuteNextStep)
CREATE INDEX IF NOT EXISTS idx_processing_stages_session_status
ON processing_stages(session_id, status);

-- Index for ordering stages (sorted queries)
CREATE INDEX IF NOT EXISTS idx_processing_stages_session_order
ON processing_stages(session_id, stage_order);

-- Index for input dependency lookups
CREATE INDEX IF NOT EXISTS idx_processing_stages_input_from
ON processing_stages(input_from_stage_id)
WHERE input_from_stage_id IS NOT NULL;

-- Composite index for finding next executable stage (status + dependencies)
CREATE INDEX IF NOT EXISTS idx_processing_stages_execution
ON processing_stages(session_id, status, stage_order);
