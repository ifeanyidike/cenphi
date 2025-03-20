-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- For text search
CREATE EXTENSION IF NOT EXISTS "hstore";         -- For key-value pairs

-- Create ENUM types
CREATE TYPE workspace_plan AS ENUM ('essentials', 'growth', 'accelerate', 'transform', 'enterprise');

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TYPE testimonial_type AS ENUM ('text', 'video', 'audio', 'image', 'social_post');

CREATE TYPE content_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived', 'featured');

CREATE TYPE collection_method AS ENUM (
    'direct_link', 'embed_form', 'qr_code', 'email_request', 
    'sms_request', 'api', 'social_import'
);

CREATE TYPE verification_type AS ENUM (
    'email', 'phone', 'social_login', 'order_verification',
    'employee_verification', 'domain_verification'
);

CREATE TYPE ai_service_category AS ENUM (
    'analysis', 'enhancement', 'generation', 
    'optimization', 'verification'
);

CREATE TYPE analysis_aspect AS ENUM (
    -- Content Analysis
    'sentiment', 'emotion', 'tone', 'language_pattern',
    'story_structure', 'key_moments',
    -- Visual/Audio Analysis
    'facial_expression', 'body_language', 'voice_pattern',
    'background_analysis',
    -- Business Intelligence
    'competitor_mention', 'product_mention', 'feature_request',
    'pain_point', 'buying_pattern', 'decision_driver',
    -- Credibility
    'authenticity', 'consistency', 'fact_check',
    'social_verification'
);

-- Create tables in order of dependencies

-- Audit Log table (needed for workspace deletion trigger)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Core tables
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    website_url VARCHAR(255),
    industry VARCHAR(100),
    plan workspace_plan DEFAULT 'essentials',
    settings JSONB DEFAULT '{}',
    branding_settings JSONB DEFAULT '{}',
    custom_domain VARCHAR(255),
    analytics_settings JSONB DEFAULT '{}',
    integration_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    settings JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL,
    settings JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);

CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    type testimonial_type NOT NULL,
    status content_status DEFAULT 'pending_review',
    
    -- Content
    content TEXT,
    media_urls TEXT[],
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    language VARCHAR(10),
    
    -- Customer Information
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_title VARCHAR(255),
    customer_company VARCHAR(255),
    customer_location VARCHAR(255),
    customer_avatar_url VARCHAR(1024),
    customer_metadata JSONB DEFAULT '{}',
    
    -- Collection & Verification
    collection_method collection_method,
    verification_method verification_type,
    verification_data JSONB DEFAULT '{}',
    verified_at TIMESTAMPTZ,
    source_data JSONB DEFAULT '{}',
    
    -- Organization
    tags TEXT[],
    categories TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Usage Metrics
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    engagement_metrics JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    collection_methods collection_method[] DEFAULT '{}',
    verification_methods verification_type[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    branding_settings JSONB DEFAULT '{}',
    form_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI System tables
CREATE TABLE ai_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    service_category ai_service_category NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    processing_details JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonial_dna_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    
    -- Core Scores
    authenticity_score FLOAT,
    emotional_coherence_score FLOAT,
    narrative_strength_score FLOAT,
    brand_alignment_score FLOAT,
    impact_potential_score FLOAT,
    credibility_score FLOAT,
    
    -- Detailed Analysis
    linguistic_patterns JSONB,
    emotional_patterns JSONB,
    narrative_elements JSONB,
    credibility_factors JSONB,
    key_themes TEXT[],
    
    -- Verification
    verification_sources JSONB[],
    verification_score FLOAT,
    
    -- Processing Metadata
    generation_version VARCHAR(50),
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE story_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    
    -- Narrative Analysis
    story_arc_type VARCHAR(50),
    narrative_elements JSONB,
    story_strength_score FLOAT,
    key_quotes TEXT[],
    
    -- Journey Mapping
    customer_journey_points JSONB[],
    decision_points JSONB[],
    emotional_waypoints JSONB[],
    
    -- Business Intelligence
    product_mentions JSONB[],
    feature_requests JSONB[],
    pain_points JSONB[],
    competitor_mentions JSONB[],
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    job_id UUID REFERENCES ai_processing_jobs(id) ON DELETE CASCADE,
    
    -- Content Details
    content_type VARCHAR(50),
    original_content_ref VARCHAR(1024),
    generated_content_ref VARCHAR(1024),
    generation_prompt TEXT,
    generation_parameters JSONB,
    
    -- Quality Control
    quality_score FLOAT,
    validation_status VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Content Organization tables
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    settings JSONB DEFAULT '{}',
    presentation_settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES team_members(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_items (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    display_order INTEGER,
    custom_settings JSONB DEFAULT '{}',
    added_by UUID REFERENCES team_members(id),
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, testimonial_id)
);

-- Distribution System tables
CREATE TABLE content_displays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    configuration JSONB DEFAULT '{}',
    styling JSONB DEFAULT '{}',
    filter_rules JSONB DEFAULT '{}',
    personalization_rules JSONB DEFAULT '{}',
    analytics_settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE display_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id UUID REFERENCES content_displays(id) ON DELETE CASCADE,
    placement_type VARCHAR(50),
    placement_settings JSONB DEFAULT '{}',
    targeting_rules JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration tables
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
    task_type VARCHAR(50),
    status VARCHAR(50),
    priority INTEGER,
    due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Analytics tables
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    display_id UUID REFERENCES content_displays(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversion_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    display_id UUID REFERENCES content_displays(id) ON DELETE CASCADE,
    conversion_type VARCHAR(50),
    conversion_value DECIMAL(10,2),
    conversion_details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Search Optimization table
CREATE TABLE semantic_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    embedding_type VARCHAR(50),
    vector_reference_id VARCHAR(255) NOT NULL,
    semantic_metadata JSONB,
    keywords TEXT[],
    topics TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create all indexes
CREATE INDEX idx_testimonials_workspace ON testimonials(workspace_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_type ON testimonials(type);
CREATE INDEX idx_testimonials_customer_email ON testimonials(customer_email);
CREATE INDEX idx_testimonials_tags ON testimonials USING gin(tags);
CREATE INDEX idx_testimonials_categories ON testimonials USING gin(categories);
CREATE INDEX idx_testimonials_content_trgm ON testimonials USING gin(content gin_trgm_ops);
CREATE INDEX idx_dna_profiles_scores ON testimonial_dna_profiles(
    authenticity_score,
    emotional_coherence_score,
    narrative_strength_score,
    impact_potential_score
);
CREATE INDEX idx_story_analyses_testimonial ON story_analyses(testimonial_id);
CREATE INDEX idx_collections_workspace ON collections(workspace_id);
CREATE INDEX idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_testimonial ON analytics_events(testimonial_id);
CREATE INDEX idx_semantic_indices_testimonial ON semantic_indices(testimonial_id);
CREATE INDEX idx_semantic_indices_vector_ref ON semantic_indices(vector_reference_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION cascade_workspace_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion event
    INSERT INTO audit_log (
        event_type,
        entity_type,
        entity_id,
        details
    ) VALUES (
        'workspace_deletion',
        'workspace',
        OLD.id,
        jsonb_build_object(
            'workspace_name', OLD.name,
            'workspace_plan', OLD.plan,
            'deleted_at', CURRENT_TIMESTAMP
        )
    );

    -- Clean up any orphaned data or external references
    PERFORM pg_notify('file_cleanup_channel', json_build_object(
        'workspace_id', OLD.id,
        'action', 'delete_workspace_files'
    )::text);

    -- Clean up any cached data
    PERFORM pg_notify('cache_cleanup_channel', json_build_object(
        'workspace_id', OLD.id,
        'action', 'invalidate_workspace_cache'
    )::text);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_portals_updated_at
    BEFORE UPDATE ON collection_portals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_displays_updated_at
    BEFORE UPDATE ON content_displays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();