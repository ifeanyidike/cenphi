-- Migration: Add temp artifacts and enhanced session management for Interactive AI Studio
-- This enables pause/resume, skip, and step-by-step processing with temp artifact management

-- Temp Artifacts Table - stores temporary processing artifacts with TTL
CREATE TABLE IF NOT EXISTS temp_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES processing_sessions(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES processing_stages(id) ON DELETE CASCADE,

    -- Storage details
    storage_path VARCHAR(500) NOT NULL,
    preview_url TEXT, -- Presigned URL for quick preview (expires in 15 min)
    artifact_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'json'
    file_size_bytes BIGINT,

    -- TTL management
    ttl_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    extended_ttl BOOLEAN DEFAULT FALSE, -- Extended to 7 days for paused sessions
    is_checkpoint BOOLEAN DEFAULT FALSE, -- Preserved for resume

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session Checkpoints - for pause/resume functionality
CREATE TABLE IF NOT EXISTS session_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES processing_sessions(id) ON DELETE CASCADE,
    checkpoint_stage_id VARCHAR(50) NOT NULL,
    checkpoint_data JSONB NOT NULL, -- Complete state to resume from
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enhance processing_sessions table with new columns
ALTER TABLE processing_sessions
ADD COLUMN IF NOT EXISTS selected_stages JSONB DEFAULT '[]', -- Array of stage IDs user selected
ADD COLUMN IF NOT EXISTS auto_proceed BOOLEAN DEFAULT FALSE, -- Auto-proceed vs wait for user input
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS paused_by_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resume_from_stage_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_steps INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skipped_steps INTEGER DEFAULT 0;

-- Enhance processing_stages table with skip and input tracking
ALTER TABLE processing_stages
ADD COLUMN IF NOT EXISTS skip_reason VARCHAR(100), -- 'user_manual_skip', 'dependency_skipped', etc.
ADD COLUMN IF NOT EXISTS input_from_stage_id UUID, -- Which stage's output to use as input
ADD COLUMN IF NOT EXISTS can_skip BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0; -- For retry tracking

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_temp_artifacts_session ON temp_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_temp_artifacts_stage ON temp_artifacts(stage_id);
CREATE INDEX IF NOT EXISTS idx_temp_artifacts_ttl ON temp_artifacts(ttl_expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_artifacts_checkpoint ON temp_artifacts(is_checkpoint) WHERE is_checkpoint = TRUE;

CREATE INDEX IF NOT EXISTS idx_session_checkpoints_session ON session_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_stage ON session_checkpoints(checkpoint_stage_id);

CREATE INDEX IF NOT EXISTS idx_processing_sessions_paused ON processing_sessions(paused_at) WHERE paused_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processing_sessions_resume ON processing_sessions(resume_from_stage_id) WHERE resume_from_stage_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_processing_stages_skip_reason ON processing_stages(skip_reason) WHERE skip_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processing_stages_input_from ON processing_stages(input_from_stage_id) WHERE input_from_stage_id IS NOT NULL;

-- Function to auto-extend TTL when session is paused
CREATE OR REPLACE FUNCTION extend_ttl_on_session_pause()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paused' AND OLD.status != 'paused' THEN
        -- Extend TTL for all temp artifacts in this session to 7 days
        UPDATE temp_artifacts
        SET ttl_expires_at = NOW() + INTERVAL '7 days',
            extended_ttl = TRUE,
            is_checkpoint = TRUE
        WHERE session_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-extend TTL when session is paused
DROP TRIGGER IF EXISTS trigger_extend_ttl_on_pause ON processing_sessions;
CREATE TRIGGER trigger_extend_ttl_on_pause
    AFTER UPDATE ON processing_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'paused' AND OLD.status != 'paused')
    EXECUTE FUNCTION extend_ttl_on_session_pause();

-- Function to update session progress counters
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE processing_sessions
    SET
        completed_steps = (
            SELECT COUNT(*) FROM processing_stages
            WHERE session_id = NEW.session_id
            AND status IN ('completed', 'accepted')
        ),
        skipped_steps = (
            SELECT COUNT(*) FROM processing_stages
            WHERE session_id = NEW.session_id
            AND status IN ('skipped', 'skipped_auto')
        ),
        updated_at = NOW()
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session progress on stage status change
DROP TRIGGER IF EXISTS trigger_update_session_progress ON processing_stages;
CREATE TRIGGER trigger_update_session_progress
    AFTER UPDATE ON processing_stages
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_session_progress();

-- Function to cleanup expired temp artifacts (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_temp_artifacts()
RETURNS TABLE(deleted_count INTEGER, storage_paths TEXT[]) AS $$
DECLARE
    paths TEXT[];
    deleted_rows INTEGER;
BEGIN
    -- Collect paths before deletion
    SELECT ARRAY_AGG(storage_path) INTO paths
    FROM temp_artifacts
    WHERE ttl_expires_at < NOW();

    -- Delete expired artifacts
    DELETE FROM temp_artifacts
    WHERE ttl_expires_at < NOW();

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;

    RETURN QUERY SELECT deleted_rows, paths;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE temp_artifacts IS 'Temporary processing artifacts with TTL for interactive AI studio';
COMMENT ON TABLE session_checkpoints IS 'Session state checkpoints for pause/resume functionality';
COMMENT ON COLUMN processing_sessions.selected_stages IS 'Array of stage IDs user selected to process';
COMMENT ON COLUMN processing_sessions.auto_proceed IS 'If true, automatically proceed to next step without waiting for user input';
COMMENT ON COLUMN processing_stages.skip_reason IS 'Reason why stage was skipped: user_manual_skip, dependency_skipped, not_applicable';
COMMENT ON COLUMN processing_stages.input_from_stage_id IS 'Stage ID whose output should be used as input (handles skip scenarios)';
COMMENT ON COLUMN temp_artifacts.extended_ttl IS 'TTL extended to 7 days for paused sessions';
COMMENT ON COLUMN temp_artifacts.is_checkpoint IS 'Artifact preserved as checkpoint for session resume';
