-- -- +migrate Up
-- -- Your migration SQL here

-- -- ==============================================================
-- -- 1. Enable Extensions
-- -- ==============================================================

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- For UUID generation
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- For text search
-- CREATE EXTENSION IF NOT EXISTS "hstore";        -- For key-value pairs
-- CREATE EXTENSION IF NOT EXISTS "citext";        -- For case-insensitive text

-- -- ==============================================================
-- -- 2. Create ENUM Types
-- -- ==============================================================

-- CREATE TYPE workspace_plan AS ENUM ('essentials', 'growth', 'accelerate', 'transform', 'enterprise');
-- CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
-- CREATE TYPE testimonial_type AS ENUM ('customer', 'employee', 'partner', 'influencer', 'expert', 'case_study');
-- CREATE TYPE content_format AS ENUM ('text', 'video', 'audio', 'image', 'social_post', 'survey', 'interview');
-- CREATE TYPE content_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived', 'featured', 'scheduled');
-- CREATE TYPE collection_method AS ENUM (
--     'direct_link', 'embed_form', 'qr_code', 'email_request', 
--     'sms_request', 'api', 'social_import', 'interview', 'survey',
--     'screen_recording', 'event_capture'
-- );
-- CREATE TYPE verification_type AS ENUM (
--     'email', 'phone', 'social_login', 'order_verification',
--     'employee_verification', 'domain_verification'
-- );
-- CREATE TYPE ai_service_category AS ENUM (
--     'analysis', 'enhancement', 'generation', 
--     'optimization', 'verification', 'segmentation', 'recommendation'
-- );
-- CREATE TYPE follow_up_status AS ENUM (
--     'pending', 'sent', 'responded', 'completed', 'declined'
-- );
-- CREATE TYPE sentiment AS ENUM (
--     'very_negative', 'negative', 'neutral', 'positive', 'very_positive'
-- );
-- CREATE TYPE integration_type AS ENUM (
--     'crm', 'email_marketing', 'social_media', 'analytics', 
--     'ecommerce', 'cms', 'helpdesk', 'review_platform'
-- );
-- CREATE TYPE placement_type AS ENUM (
--     'website', 'social_media', 'email', 'landing_page', 
--     'product_page', 'mobile_app', 'digital_ad'
-- );
-- CREATE TYPE campaign_status AS ENUM (
--     'draft', 'active', 'paused', 'completed', 'scheduled'
-- );
-- CREATE TYPE analysis_aspect AS ENUM (
--     -- Content Analysis
--     'sentiment', 'emotion', 'tone', 'language_pattern',
--     'story_structure', 'key_moments',
--     -- Visual/Audio Analysis
--     'facial_expression', 'body_language', 'voice_pattern',
--     'background_analysis',
--     -- Business Intelligence
--     'competitor_mention', 'product_mention', 'feature_request',
--     'pain_point', 'buying_pattern', 'decision_driver',
--     -- Credibility
--     'authenticity', 'consistency', 'fact_check',
--     'social_verification'
-- );

-- -- ==============================================================
-- -- 3. Create Trigger Functions (but not the triggers yet)
-- -- ==============================================================

-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE OR REPLACE FUNCTION cascade_workspace_deletion()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Log the deletion event
--     INSERT INTO audit_log (
--         event_type,
--         entity_type,
--         entity_id,
--         details
--     ) VALUES (
--         'workspace_deletion',
--         'workspace',
--         OLD.id,
--         jsonb_build_object(
--             'workspace_name', OLD.name,
--             'workspace_plan', OLD.plan,
--             'deleted_at', CURRENT_TIMESTAMP
--         )
--     );

--     -- Cleanup notifications
--     PERFORM pg_notify('file_cleanup_channel', json_build_object(
--         'workspace_id', OLD.id,
--         'action', 'delete_workspace_files'
--     )::text);
--     PERFORM pg_notify('cache_cleanup_channel', json_build_object(
--         'workspace_id', OLD.id,
--         'action', 'invalidate_workspace_cache'
--     )::text);
--     RETURN OLD;
-- END;
-- $$ LANGUAGE plpgsql;


-- -- ==============================================================
-- -- 4. Create Tables (Grouped by Related Functionality)
-- -- ==============================================================

-- -- 4.1 Audit & Core Tables
-- -------------------------------------------------
-- CREATE TABLE audit_log (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     event_type VARCHAR(50) NOT NULL,
--     entity_type VARCHAR(50) NOT NULL,
--     entity_id UUID NOT NULL,
--     details JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE workspaces (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255),
--     website_url VARCHAR(255),
--     logo_url VARCHAR(1024),
--     slug CITEXT UNIQUE,
--     industry VARCHAR(100),
--     company_size VARCHAR(50),
--     plan workspace_plan DEFAULT 'essentials',
--     plan_started_at TIMESTAMPTZ,
--     plan_expires_at TIMESTAMPTZ,
--     settings JSONB DEFAULT '{}',
--     branding_settings JSONB DEFAULT '{}',
--     custom_domain VARCHAR(255),
--     analytics_settings JSONB DEFAULT '{}',
--     integration_settings JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE users (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     firebase_uid VARCHAR(128) NOT NULL UNIQUE,
--     email CITEXT NOT NULL UNIQUE,
--     avatar_url VARCHAR(1024),
--     email_verified BOOLEAN DEFAULT FALSE,
--     name VARCHAR(255),
--     settings JSONB DEFAULT '{}',
--     permissions JSONB DEFAULT '{}',
--     last_active_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE team_members (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     role member_role NOT NULL,
--     settings JSONB DEFAULT '{}',
--     permissions JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(workspace_id, user_id)
-- );
-- -- Additional index for quick lookup by workspace
-- CREATE INDEX idx_team_members_workspace ON team_members(workspace_id);

-- -- 4.2 Customer & Testimonial Content
-- -------------------------------------------------
-- CREATE TABLE customer_profiles (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     external_id VARCHAR(255),
--     email CITEXT,
--     name VARCHAR(255),
--     title VARCHAR(100),
--     company VARCHAR(255),
--     industry VARCHAR(100),
--     location VARCHAR(255),
--     avatar_url VARCHAR(1024),
--     social_profiles JSONB DEFAULT '{}',
--     custom_fields JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE UNIQUE INDEX idx_customer_profiles_workspace_email ON customer_profiles (workspace_id, email) WHERE email IS NOT NULL;
-- CREATE INDEX idx_customer_profiles_external_id ON customer_profiles(external_id);

-- CREATE TABLE testimonials (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    
--     -- Categorization & Status
--     testimonial_type testimonial_type NOT NULL DEFAULT 'customer',
--     format content_format NOT NULL,
--     status content_status DEFAULT 'pending_review',
--     language VARCHAR(10) DEFAULT 'en',
    
--     -- Content
--     title VARCHAR(255),
--     summary TEXT,
--     content TEXT,
--     transcript TEXT,
--     media_urls TEXT[],
--     rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    
--     -- Media Metadata
--     media_url VARCHAR(1024),
--     media_duration INTEGER,
--     thumbnail_url VARCHAR(1024),
--     additional_media JSONB DEFAULT '[]',
    
--     -- Context
--     product_context JSONB DEFAULT '{}',
--     purchase_context JSONB DEFAULT '{}',
--     experience_context JSONB DEFAULT '{}',
    
--     -- Collection & Verification
--     collection_method collection_method,
--     verification_method verification_type,
--     verification_data JSONB DEFAULT '{}',
--     verification_status VARCHAR(50) DEFAULT 'unverified',
--     verified_at TIMESTAMPTZ,
--     authenticity_score FLOAT,
--     source_data JSONB DEFAULT '{}',
    
--     -- Publishing
--     published BOOLEAN DEFAULT FALSE,
--     published_at TIMESTAMPTZ,
--     scheduled_publish_at TIMESTAMPTZ,
    
--     -- Organization
--     tags TEXT[],
--     categories TEXT[],
--     custom_fields JSONB DEFAULT '{}',
    
--     -- Usage Metrics
--     view_count INTEGER DEFAULT 0,
--     share_count INTEGER DEFAULT 0,
--     conversion_count INTEGER DEFAULT 0,
--     engagement_metrics JSONB DEFAULT '{}',
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Indexes for testimonials
-- CREATE INDEX idx_testimonials_workspace ON testimonials(workspace_id);
-- CREATE INDEX idx_testimonials_status ON testimonials(status);
-- CREATE INDEX idx_testimonials_testimonial_type ON testimonials(testimonial_type);
-- CREATE INDEX idx_testimonials_tags ON testimonials USING gin(tags);
-- CREATE INDEX idx_testimonials_categories ON testimonials USING gin(categories);
-- CREATE INDEX idx_testimonials_content_trgm ON testimonials USING gin(content gin_trgm_ops);

-- CREATE TABLE testimonial_dna_profiles (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    
--     -- Core Scores
--     authenticity_score FLOAT,
--     emotional_coherence_score FLOAT,
--     narrative_strength_score FLOAT,
--     brand_alignment_score FLOAT,
--     impact_potential_score FLOAT,
--     credibility_score FLOAT,
    
--     -- Detailed Analysis
--     linguistic_patterns JSONB,
--     emotional_patterns JSONB,
--     narrative_elements JSONB,
--     credibility_factors JSONB,
--     key_themes TEXT[],
    
--     -- Verification
--     verification_sources JSONB[],
--     verification_score FLOAT,
    
--     -- Metadata
--     generation_version VARCHAR(50),
--     last_updated_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_dna_profiles_scores ON testimonial_dna_profiles(
--     authenticity_score,
--     emotional_coherence_score,
--     narrative_strength_score,
--     impact_potential_score
-- );

-- CREATE TABLE story_analyses (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
    
--     -- Journey Mapping
--     customer_journey_points JSONB[],
--     decision_points JSONB[],
--     emotional_waypoints JSONB[],
    
--     -- Business Intelligence
--     product_mentions JSONB[], -- note: duplicate column name removed if any conflict
--     feature_requests JSONB[],
--     pain_points JSONB[],
--     competitor_mentions JSONB[],
    
--     -- Content Analysis
--     sentiment sentiment,
--     sentiment_score FLOAT,
--     emotion_analysis JSONB DEFAULT '{}',
--     tone_analysis JSONB DEFAULT '{}',
--     language_quality_score FLOAT,
    
--     -- Narrative Analysis
--     story_arc_type VARCHAR(50),
--     story_elements JSONB DEFAULT '{}',
--     narrative_strength_score FLOAT,
--     storytelling_metrics JSONB DEFAULT '{}',
--     key_moments JSONB DEFAULT '[]',
    
--     -- Visual/Audio Analysis
--     facial_expression_analysis JSONB DEFAULT '{}',
--     voice_tone_analysis JSONB DEFAULT '{}',
--     body_language_analysis JSONB DEFAULT '{}',
--     video_quality_score FLOAT,
--     audio_quality_score FLOAT,
    
--     -- Business Value Analysis
--     business_value_score FLOAT,
--     persuasiveness_score FLOAT,
--     relevance_score FLOAT,
--     uniqueness_score FLOAT,
--     feature_mentions JSONB DEFAULT '[]',
    
--     -- Brand Alignment
--     brand_alignment_score FLOAT,
--     brand_voice_consistency FLOAT,
--     value_proposition_match JSONB DEFAULT '{}',
    
--     -- Audience Analysis
--     target_audience_relevance JSONB DEFAULT '{}',
--     demographic_insights JSONB DEFAULT '{}',
--     psychographic_insights JSONB DEFAULT '{}',
    
--     -- Credibility Analysis
--     authenticity_indicators JSONB DEFAULT '[]',
--     credibility_score FLOAT,
--     authenticity_score FLOAT,
--     consistency_score FLOAT,
    
--     -- Processing Metadata
--     analysis_version VARCHAR(50),
--     updated_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_story_analyses_testimonial ON story_analyses(testimonial_id);

-- CREATE TABLE competitor_mentions (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
--     competitor_name VARCHAR(255) NOT NULL,
--     context TEXT,
--     sentiment sentiment,
--     sentiment_score FLOAT,
--     comparison_type VARCHAR(50),
--     ai_confidence_score FLOAT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_competitor_mentions_testimonial ON competitor_mentions(testimonial_id);
-- CREATE INDEX idx_competitor_mentions_name ON competitor_mentions(competitor_name);

-- CREATE TABLE ai_processing_jobs (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     service_category ai_service_category NOT NULL,
--     status VARCHAR(50) DEFAULT 'pending',
--     priority INTEGER DEFAULT 1,
--     processing_details JSONB DEFAULT '{}',
--     started_at TIMESTAMPTZ,
--     completed_at TIMESTAMPTZ,
--     error_details JSONB,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_ai_processing_jobs_testimonial ON ai_processing_jobs(testimonial_id);
-- CREATE INDEX idx_ai_processing_jobs_status ON ai_processing_jobs(status);

-- CREATE TABLE ai_generated_content (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     job_id UUID REFERENCES ai_processing_jobs(id) ON DELETE CASCADE,
    
--     -- Content Details
--     content_type VARCHAR(50),
--     original_content_ref VARCHAR(1024),
--     generated_content_ref VARCHAR(1024),
--     generation_prompt TEXT,
--     generation_parameters JSONB,
    
--     -- Quality Control
--     quality_score FLOAT,
--     validation_status VARCHAR(50),
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_ai_generated_content_testimonial ON ai_generated_content(testimonial_id);
-- CREATE INDEX idx_ai_generated_content_job ON ai_generated_content(job_id);

-- -- 4.3 Collections & Content Organization
-- -------------------------------------------------
-- CREATE TABLE collection_portals (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     slug VARCHAR(255) UNIQUE,
--     collection_methods collection_method[] DEFAULT '{}',
--     verification_methods verification_type[] DEFAULT '{}',
--     custom_fields JSONB DEFAULT '{}',
--     branding_settings JSONB DEFAULT '{}',
--     form_settings JSONB DEFAULT '{}',
--     notification_settings JSONB DEFAULT '{}',
--     active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_collection_portals_workspace ON collection_portals(workspace_id);

-- CREATE TABLE collections (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     type VARCHAR(50),
--     settings JSONB DEFAULT '{}',
--     presentation_settings JSONB DEFAULT '{}',
--     created_by UUID REFERENCES team_members(id),
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_collections_workspace ON collections(workspace_id);

-- CREATE TABLE collection_items (
--     collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     display_order INTEGER,
--     custom_settings JSONB DEFAULT '{}',
--     added_by UUID REFERENCES team_members(id),
--     added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (collection_id, testimonial_id)
-- );
-- CREATE INDEX idx_collection_items_testimonial ON collection_items(testimonial_id);

-- -- 4.4 Distribution / Display
-- -------------------------------------------------
-- CREATE TABLE content_displays (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     configuration JSONB DEFAULT '{}',
--     styling JSONB DEFAULT '{}',
--     filter_rules JSONB DEFAULT '{}',
--     personalization_rules JSONB DEFAULT '{}',
--     analytics_settings JSONB DEFAULT '{}',
--     active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_content_displays_workspace ON content_displays(workspace_id);

-- CREATE TABLE display_widgets (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     source_type VARCHAR(50) NOT NULL,
--     source_id UUID,
--     configuration JSONB DEFAULT '{}',
--     styling JSONB DEFAULT '{}',
--     responsiveness_settings JSONB DEFAULT '{}',
--     filter_rules JSONB DEFAULT '{}',
--     rotation_settings JSONB DEFAULT '{}',
--     personalization_rules JSONB DEFAULT '{}',
--     ab_testing_settings JSONB DEFAULT '{}',
--     analytics_settings JSONB DEFAULT '{}',
--     published BOOLEAN DEFAULT FALSE,
--     embed_code TEXT,
--     created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_display_widgets_workspace ON display_widgets(workspace_id);

-- CREATE TABLE display_templates (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     type VARCHAR(50) NOT NULL,
--     format content_format NOT NULL,
--     template_json JSONB NOT NULL,
--     preview_image_url VARCHAR(1024),
--     is_default BOOLEAN DEFAULT FALSE,
--     is_public BOOLEAN DEFAULT FALSE,
--     created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_display_templates_workspace ON display_templates(workspace_id);

-- -- Note: Removed duplicate definition of display_placements. Keeping the more complete version:
-- CREATE TABLE display_placements (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     widget_id UUID REFERENCES display_widgets(id) ON DELETE CASCADE,
--     placement_type placement_type NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     url VARCHAR(1024),
--     placement_settings JSONB DEFAULT '{}',
--     targeting_rules JSONB DEFAULT '{}',
--     performance_metrics JSONB DEFAULT '{}',
--     active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_display_placements_workspace ON display_placements(workspace_id);
-- CREATE INDEX idx_display_placements_widget ON display_placements(widget_id);

-- -- 4.5 Collaboration
-- -------------------------------------------------
-- CREATE TABLE assignments (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     assigned_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     task_type VARCHAR(50),
--     status VARCHAR(50),
--     priority INTEGER,
--     due_date TIMESTAMPTZ,
--     notes TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_assignments_testimonial ON assignments(testimonial_id);
-- CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);

-- CREATE TABLE comments (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
--     content TEXT NOT NULL,
--     attachments JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_comments_testimonial ON comments(testimonial_id);
-- CREATE INDEX idx_comments_team_member ON comments(team_member_id);

-- -- 4.6 Analytics
-- -------------------------------------------------
-- CREATE TABLE analytics_events (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     display_id UUID REFERENCES content_displays(id) ON DELETE CASCADE,
--     event_type VARCHAR(50) NOT NULL,
--     event_data JSONB,
--     user_agent TEXT,
--     ip_address INET,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_analytics_events_workspace ON analytics_events(workspace_id);
-- CREATE INDEX idx_analytics_events_testimonial ON analytics_events(testimonial_id);

-- CREATE TABLE conversion_tracking (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     display_id UUID REFERENCES content_displays(id) ON DELETE CASCADE,
--     conversion_type VARCHAR(50),
--     conversion_value DECIMAL(10,2),
--     conversion_details JSONB,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_conversion_tracking_testimonial ON conversion_tracking(testimonial_id);
-- CREATE INDEX idx_conversion_tracking_display ON conversion_tracking(display_id);

-- -- 4.7 Search Optimization
-- -------------------------------------------------
-- CREATE TABLE semantic_indices (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     embedding_type VARCHAR(50),
--     vector_reference_id VARCHAR(255) NOT NULL,
--     semantic_metadata JSONB,
--     keywords TEXT[],
--     topics TEXT[],
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_semantic_indices_testimonial ON semantic_indices(testimonial_id);
-- CREATE INDEX idx_semantic_indices_vector_ref ON semantic_indices(vector_reference_id);



-- -- Triggers for auto-updating updated_at columns
-- CREATE TRIGGER update_workspaces_updated_at
--     BEFORE UPDATE ON workspaces
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_testimonials_updated_at
--     BEFORE UPDATE ON testimonials
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_collection_portals_updated_at
--     BEFORE UPDATE ON collection_portals
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_collections_updated_at
--     BEFORE UPDATE ON collections
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_content_displays_updated_at
--     BEFORE UPDATE ON content_displays
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_comments_updated_at
--     BEFORE UPDATE ON comments
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();