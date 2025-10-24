-- Add metadata column to processing_stages for config/output propagation between stages
-- BUGFIX #12: This enables handlers to pass data (highlights, clips, etc.) to subsequent stages

ALTER TABLE processing_stages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for metadata queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_processing_stages_metadata ON processing_stages USING GIN (metadata);

-- Add comment to document the purpose
COMMENT ON COLUMN processing_stages.metadata IS 'Stores stage-specific configuration and output data for propagation to subsequent stages';
