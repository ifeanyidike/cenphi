-- ----------------------------------
-- UP MIGRATION: 000016_add_talk_to_your_data_enhancements.up.sql
-- Talk to Your Data Feature Enhancements
-- Features: Visual Analytics, Comparative Analysis, Advanced Filters, Segments, Conversation Memory, Export
-- ----------------------------------

-- Conversation Sessions for contextual chat memory
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session metadata
  title VARCHAR(255), -- Optional user-provided or AI-generated title

  -- Conversation data
  messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp, filters}
  active_filters JSONB DEFAULT '{}', -- Current active filters for the session
  referenced_entities JSONB DEFAULT '{}', -- Entities mentioned (companies, features, pain_points)

  -- Session state
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_conversation_sessions_updated
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_conversation_sessions_workspace ON conversation_sessions(workspace_id);
CREATE INDEX idx_conversation_sessions_user ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_active ON conversation_sessions(workspace_id, is_active, last_activity DESC);
CREATE INDEX idx_conversation_sessions_last_activity ON conversation_sessions(last_activity DESC) WHERE is_active = true;


-- Saved Queries for frequently used filters and queries
CREATE TABLE saved_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Query details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,

  -- Filters applied
  filters JSONB DEFAULT '{}', -- {date_range, rating, companies, tags, type, etc.}

  -- Query type and categorization
  category VARCHAR(100), -- sentiment_analysis, trends, comparisons, segments

  -- Usage tracking
  is_template BOOLEAN DEFAULT false, -- System-provided template queries
  is_default BOOLEAN DEFAULT false, -- Default query for the workspace
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(workspace_id, name)
);

CREATE TRIGGER trg_saved_queries_updated
  BEFORE UPDATE ON saved_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_saved_queries_workspace ON saved_queries(workspace_id);
CREATE INDEX idx_saved_queries_user ON saved_queries(user_id);
CREATE INDEX idx_saved_queries_category ON saved_queries(category);
CREATE INDEX idx_saved_queries_template ON saved_queries(is_template) WHERE is_template = true;
CREATE INDEX idx_saved_queries_use_count ON saved_queries(use_count DESC);


-- Segment Definitions for cohort analysis
CREATE TABLE segment_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Segment identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color for UI display

  -- Segment criteria (flexible JSONB for different types of segments)
  criteria JSONB NOT NULL, -- {rating_min, rating_max, companies, tags, nps_category, etc.}
  segment_type VARCHAR(50) NOT NULL, -- nps_promoters, nps_detractors, enterprise, smb, custom

  -- Cached metrics (updated periodically for performance)
  cached_testimonial_count INTEGER DEFAULT 0,
  cached_avg_sentiment REAL,
  cached_top_themes JSONB DEFAULT '[]',
  cache_updated_at TIMESTAMPTZ,

  -- Metadata
  is_system_defined BOOLEAN DEFAULT false, -- System segments vs user-defined
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(workspace_id, name)
);

CREATE TRIGGER trg_segment_definitions_updated
  BEFORE UPDATE ON segment_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_segment_definitions_workspace ON segment_definitions(workspace_id);
CREATE INDEX idx_segment_definitions_type ON segment_definitions(segment_type);
CREATE INDEX idx_segment_definitions_active ON segment_definitions(workspace_id, is_active);


-- Analytics Cache for pre-computed metrics (performance optimization)
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Cache identification
  cache_key VARCHAR(255) NOT NULL, -- sentiment_timeline_30d, feature_heatmap, etc.
  cache_type VARCHAR(100) NOT NULL, -- sentiment_timeline, word_cloud, comparison, segment_analysis

  -- Filters that produced this cache
  filters JSONB DEFAULT '{}',

  -- Cached data
  data JSONB NOT NULL,

  -- Cache metadata
  expires_at TIMESTAMPTZ NOT NULL,
  computation_time_ms INTEGER, -- How long it took to compute

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(workspace_id, cache_key, filters)
);

CREATE INDEX idx_analytics_cache_workspace ON analytics_cache(workspace_id);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(workspace_id, cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(cache_type);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;


-- Export Logs for tracking export history
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Export details
  export_type VARCHAR(50) NOT NULL, -- excel, pdf, google_sheets, powerpoint
  export_format VARCHAR(50), -- xlsx, pdf, csv, pptx

  -- Content exported
  content_type VARCHAR(50) NOT NULL, -- analytics_report, chat_conversation, testimonial_list
  filters JSONB DEFAULT '{}',

  -- File information
  file_name VARCHAR(255),
  file_size_bytes BIGINT,
  file_url TEXT, -- For downloadable exports

  -- Status
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,

  -- Metadata
  export_params JSONB DEFAULT '{}', -- Additional export parameters

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_export_logs_updated
  BEFORE UPDATE ON export_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_export_logs_workspace ON export_logs(workspace_id);
CREATE INDEX idx_export_logs_user ON export_logs(user_id);
CREATE INDEX idx_export_logs_type ON export_logs(export_type);
CREATE INDEX idx_export_logs_status ON export_logs(status);
CREATE INDEX idx_export_logs_created ON export_logs(created_at DESC);


-- Insert default system segments for workspaces
-- This will be executed by the application when a workspace is created
-- or can be run as a one-time migration for existing workspaces

COMMENT ON TABLE conversation_sessions IS 'Stores conversation history for contextual chat with data feature';
COMMENT ON TABLE saved_queries IS 'User-saved queries and filter combinations for quick access';
COMMENT ON TABLE segment_definitions IS 'Customer segment definitions for cohort analysis';
COMMENT ON TABLE analytics_cache IS 'Pre-computed analytics for performance optimization';
COMMENT ON TABLE export_logs IS 'Tracks all data exports for audit and history';

