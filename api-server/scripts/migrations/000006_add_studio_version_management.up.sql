-- AI Studio Version Management Schema
-- This migration adds tables for managing AI processing stages and their versions

-- Processing sessions for studio workflows
CREATE TABLE IF NOT EXISTS processing_sessions (
    id UUID PRIMARY KEY,
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL DEFAULT 'single_testimonial', -- 'single_testimonial', 'story_generation'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
    current_stage_id VARCHAR(50),
    accepted_versions JSONB DEFAULT '{}', -- Maps stage_id to version_id
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Processing stages for each session
CREATE TABLE IF NOT EXISTS processing_stages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES processing_sessions(id) ON DELETE CASCADE,
    stage_id VARCHAR(50) NOT NULL, -- 'transcription', 'sentiment_analysis', etc.
    stage_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'reviewing', 'failed'
    progress INTEGER DEFAULT 0,
    message TEXT,
    dependencies JSONB DEFAULT '[]', -- Array of stage_ids that must complete first
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(session_id, stage_id)
);

-- Stage versions for save/discard/replace functionality
CREATE TABLE IF NOT EXISTS stage_versions (
    id UUID PRIMARY KEY,
    stage_id UUID REFERENCES processing_stages(id) ON DELETE CASCADE,
    version_data JSONB NOT NULL, -- The actual processed data/result
    preview_data JSONB, -- Preview/snippet for UI display
    quality_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0-1.0 confidence score
    is_accepted BOOLEAN DEFAULT FALSE,
    is_temporary BOOLEAN DEFAULT TRUE, -- Temporary versions can be discarded
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contextual suggestions for each stage
CREATE TABLE IF NOT EXISTS contextual_suggestions (
    id UUID PRIMARY KEY,
    stage_id UUID REFERENCES processing_stages(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(50) NOT NULL, -- 'improvement', 'alternative', 'enhancement', 'fix'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'quality', 'style', 'content', 'technical'
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0, -- 0.0-1.0
    impact VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    action_type VARCHAR(50) NOT NULL, -- 'regenerate', 'adjust_parameter', 'apply_filter'
    action_parameters JSONB DEFAULT '{}',
    preview_data JSONB, -- Preview of applying suggestion
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Action logs for audit trail
CREATE TABLE IF NOT EXISTS studio_action_logs (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES processing_sessions(id) ON DELETE CASCADE,
    stage_id VARCHAR(50),
    action_type VARCHAR(50) NOT NULL, -- 'accept', 'discard', 'regenerate', 'apply_suggestion'
    action_data JSONB DEFAULT '{}',
    user_id UUID, -- If we want to track which user performed action
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_sessions_testimonial_id ON processing_sessions(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_workspace_id ON processing_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_status ON processing_sessions(status);

CREATE INDEX IF NOT EXISTS idx_processing_stages_session_id ON processing_stages(session_id);
CREATE INDEX IF NOT EXISTS idx_processing_stages_stage_id ON processing_stages(stage_id);
CREATE INDEX IF NOT EXISTS idx_processing_stages_status ON processing_stages(status);
CREATE INDEX IF NOT EXISTS idx_processing_stages_order ON processing_stages(stage_order);

CREATE INDEX IF NOT EXISTS idx_stage_versions_stage_id ON stage_versions(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_versions_accepted ON stage_versions(is_accepted);
CREATE INDEX IF NOT EXISTS idx_stage_versions_temporary ON stage_versions(is_temporary);

CREATE INDEX IF NOT EXISTS idx_contextual_suggestions_stage_id ON contextual_suggestions(stage_id);
CREATE INDEX IF NOT EXISTS idx_contextual_suggestions_type ON contextual_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_contextual_suggestions_applied ON contextual_suggestions(is_applied);

CREATE INDEX IF NOT EXISTS idx_studio_action_logs_session_id ON studio_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_studio_action_logs_created_at ON studio_action_logs(created_at);

-- Update trigger for processing_sessions
CREATE OR REPLACE FUNCTION update_processing_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_processing_sessions_updated_at
    BEFORE UPDATE ON processing_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_processing_sessions_updated_at();

-- Update trigger for processing_stages
CREATE OR REPLACE FUNCTION update_processing_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_processing_stages_updated_at
    BEFORE UPDATE ON processing_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_processing_stages_updated_at();