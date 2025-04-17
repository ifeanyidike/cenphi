-- -- +migrate Up
-- -- Your migration SQL here

-- -- ==============================================================
-- -- 1. Enable Extensions
-- -- ==============================================================

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "hstore";
-- CREATE EXTENSION IF NOT EXISTS "citext";

-- -- ==============================================================
-- -- 2. Create ENUM Types
-- -- ==============================================================

-- -- CREATE TYPE workspace_plan AS ENUM ('essentials', 'growth', 'accelerate', 'transform', 'enterprise');
-- CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
-- CREATE TYPE testimonial_type AS ENUM ('customer', 'employee', 'partner', 'influencer', 'expert', 'case_study');
-- CREATE TYPE content_format AS ENUM ('text', 'video', 'audio', 'image', 'social_post', 'survey', 'interview');
-- CREATE TYPE content_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived', 'featured', 'scheduled');
-- CREATE TYPE collection_method AS ENUM (
--     'website', 'email', 'chat', 'social', 'custom',
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
-- CREATE TYPE analysis_type AS ENUM (
--     'sentiment', 'narrative', 'authenticity', 'audience', 
--     'business_value', 'credibility', 'competitor', 'story'
-- );
-- CREATE TYPE testimonial_style AS ENUM (
--     'minimal', 'card', 'quote', 'bubble', 'highlight', 'modern', 'classic'
-- );
-- CREATE TYPE testimonial_layout AS ENUM (
--     'grid', 'carousel', 'masonry', 'list'
-- );
-- CREATE TYPE business_event_type AS ENUM (
--     'purchase_completed', 'service_completed', 'support_interaction',
--     'support_resolved', 'chat_completed'
-- );
-- CREATE TYPE trigger_type AS ENUM (
--     'purchase', 'support', 'feedback', 'custom', 'pageview', 
--     'timeonsite', 'scrolldepth', 'exitintent', 'clickelement'
-- );

-- -- ==============================================================
-- -- 3. Create Trigger Functions
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
-- -- 4. Create Tables (Reorganized by Domain)
-- -- ==============================================================

-- -- 4.1 Core Platform Tables
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
    
--     -- Core settings
--     settings JSONB DEFAULT '{}',
    
--     -- Collection method settings
--     website_settings JSONB DEFAULT '{}',
--     email_settings JSONB DEFAULT '{}',
--     chat_settings JSONB DEFAULT '{}',
--     social_settings JSONB DEFAULT '{}',
--     custom_page_settings JSONB DEFAULT '{}',
    
--     -- Other settings
--     integration_settings JSONB DEFAULT '{}',
--     analytics_settings JSONB DEFAULT '{}',
    
--     custom_domain VARCHAR(255),
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE brand_guides (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
    
--     -- Brand identity
--     colors JSONB NOT NULL DEFAULT '{}',
--     typography JSONB NOT NULL DEFAULT '{}',
    
--     -- Testimonial display settings
--     testimonial_style testimonial_style DEFAULT 'card',
--     testimonial_shape VARCHAR(50) DEFAULT 'rounded',
--     testimonial_layout testimonial_layout DEFAULT 'grid',
    
--     -- Display options
--     show_rating BOOLEAN DEFAULT TRUE,
--     show_avatar BOOLEAN DEFAULT TRUE,
--     show_date BOOLEAN DEFAULT TRUE,
--     show_company BOOLEAN DEFAULT TRUE,
    
--     -- Animation and styling
--     animation BOOLEAN DEFAULT TRUE,
--     shadow VARCHAR(10) DEFAULT 'md',
--     border BOOLEAN DEFAULT TRUE,
--     rating_style VARCHAR(20) DEFAULT 'stars',
    
--     -- Brand voice settings
--     voice JSONB DEFAULT '{}',
    
--     -- UI settings
--     ui_settings JSONB DEFAULT '{}',
    
--     is_default BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
--     UNIQUE(workspace_id, name)
-- );
-- CREATE INDEX idx_brand_guides_workspace ON brand_guides(workspace_id);

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
-- CREATE INDEX idx_team_members_workspace ON team_members(workspace_id);

-- -- 4.2 Customer & Testimonial Core
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

--     -- custom formatting
--     custom_formatting JSONB DEFAULT '{}',
    
--     -- Context
--     product_context JSONB DEFAULT '{}',
--     purchase_context JSONB DEFAULT '{}',
--     experience_context JSONB DEFAULT '{}',
    
--     -- Collection & Verification
--     collection_method collection_method,
--     trigger_source VARCHAR(255),
--     trigger_data JSONB DEFAULT '{}',
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

-- CREATE INDEX idx_testimonials_workspace ON testimonials(workspace_id);
-- CREATE INDEX idx_testimonials_status ON testimonials(status);
-- CREATE INDEX idx_testimonials_testimonial_type ON testimonials(testimonial_type);
-- CREATE INDEX idx_testimonials_tags ON testimonials USING gin(tags);
-- CREATE INDEX idx_testimonials_categories ON testimonials USING gin(categories);
-- CREATE INDEX idx_testimonials_content_trgm ON testimonials USING gin(content gin_trgm_ops);
-- CREATE INDEX idx_testimonials_collection_method ON testimonials(collection_method);
-- CREATE UNIQUE INDEX idx_testimonials_source_data ON testimonials((source_data->>'review_id')) WHERE source_data->>'review_id' IS NOT NULL;

-- -- 4.3 Analysis & AI Processing
-- -------------------------------------------------
-- CREATE TABLE testimonial_analyses (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     analysis_type analysis_type NOT NULL,
    
--     -- Core Metrics (common scores across analysis types)
--     sentiment_score FLOAT,
--     authenticity_score FLOAT, 
--     emotional_score FLOAT,
--     narrative_score FLOAT,
--     business_value_score FLOAT,
--     credibility_score FLOAT,
    
--     -- Analysis Detail Data
--     analysis_data JSONB NOT NULL DEFAULT '{}',
--     extracted_insights JSONB DEFAULT '[]',
    
--     -- Metadata
--     analysis_version VARCHAR(50),
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
--     UNIQUE(testimonial_id, analysis_type)
-- );
-- CREATE INDEX idx_testimonial_analyses_testimonial ON testimonial_analyses(testimonial_id);
-- CREATE INDEX idx_testimonial_analyses_type ON testimonial_analyses(analysis_type);

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

-- CREATE TABLE ai_jobs (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     job_type ai_service_category NOT NULL,
--     status VARCHAR(50) DEFAULT 'pending',
--     priority INTEGER DEFAULT 1,
    
--     -- Input parameters for the job
--     input_parameters JSONB DEFAULT '{}',
    
--     -- Processing metadata
--     started_at TIMESTAMPTZ,
--     completed_at TIMESTAMPTZ,
--     error_details JSONB,
    
--     -- Result data (null when not complete)
--     output_data JSONB,
--     output_reference_id UUID,
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_ai_jobs_testimonial ON ai_jobs(testimonial_id);
-- CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
-- CREATE INDEX idx_ai_jobs_job_type ON ai_jobs(job_type);

-- -- 4.4 Collection & Triggers
-- -------------------------------------------------
-- CREATE TABLE collection_triggers (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     type trigger_type NOT NULL,
--     business_event business_event_type,
    
--     collection_method collection_method NOT NULL,
--     enabled BOOLEAN DEFAULT TRUE,
    
--     -- Targeting & Display rules
--     user_segments JSONB DEFAULT '["all_users"]',
--     conditions JSONB DEFAULT '[]',
    
--     -- Timing
--     delay INTEGER DEFAULT 0,
--     delay_unit VARCHAR(20) DEFAULT 'seconds',
    
--     -- Throttling
--     frequency VARCHAR(20) DEFAULT 'once',
--     frequency_limit INTEGER,
--     priority VARCHAR(10) DEFAULT 'medium',
    
--     -- Data expectations
--     data_schema JSONB,
--     expected_data JSONB,
    
--     -- Customizations
--     template_id UUID,
--     custom_settings JSONB DEFAULT '{}',
    
--     -- Analytics
--     tags TEXT[],
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_collection_triggers_workspace ON collection_triggers(workspace_id);
-- CREATE INDEX idx_collection_triggers_type ON collection_triggers(type);
-- CREATE INDEX idx_collection_triggers_method ON collection_triggers(collection_method);

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

-- -- 4.5 Templates
-- -------------------------------------------------
-- CREATE TABLE message_templates (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     template_type VARCHAR(50) NOT NULL, -- 'email', 'chat', 'social', etc.
--     context_type VARCHAR(50), -- 'support', 'purchase', 'feedback', etc.
--     tone VARCHAR(50), -- 'friendly', 'professional', 'casual', etc.
    
--     subject VARCHAR(255), -- For email templates
--     content TEXT NOT NULL,
--     variables JSONB DEFAULT '[]',
    
--     design_settings JSONB DEFAULT '{}', -- For email templates
--     is_default BOOLEAN DEFAULT FALSE,
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_message_templates_workspace ON message_templates(workspace_id);
-- CREATE INDEX idx_message_templates_type ON message_templates(template_type);

-- CREATE TABLE social_campaigns (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL, -- 'hashtag', 'mention', 'comment', 'ugc', 'contest'
--     identifier VARCHAR(255) NOT NULL, -- The hashtag or mention text
--     status VARCHAR(20) DEFAULT 'draft',
--     start_date TIMESTAMPTZ,
--     end_date TIMESTAMPTZ,
--     platforms JSONB DEFAULT '[]',
--     target_count INTEGER DEFAULT 0,
--     collected_count INTEGER DEFAULT 0,
    
--     description TEXT,
--     incentive TEXT,
--     rules TEXT,
--     budget DECIMAL(10,2),
    
--     team_members UUID[] DEFAULT '{}',
--     report_frequency VARCHAR(20),
--     report_recipients TEXT[] DEFAULT '{}',
--     keywords TEXT[] DEFAULT '{}',
--     blacklist TEXT[] DEFAULT '{}',
    
--     sentiment_analysis BOOLEAN DEFAULT FALSE,
--     ai_categorization BOOLEAN DEFAULT FALSE,
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_social_campaigns_workspace ON social_campaigns(workspace_id);
-- CREATE INDEX idx_social_campaigns_status ON social_campaigns(status);

-- CREATE TABLE social_platform_connections (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     platform_name VARCHAR(50) NOT NULL, -- 'instagram', 'twitter', etc.
--     account_name VARCHAR(255),
--     account_id VARCHAR(255),
--     account_type VARCHAR(50), -- 'personal', 'business', 'creator'
    
--     auth_token TEXT,
--     refresh_token TEXT,
--     token_expires_at TIMESTAMPTZ,
--     scopes JSONB DEFAULT '[]',
    
--     is_connected BOOLEAN DEFAULT FALSE,
--     last_sync_at TIMESTAMPTZ,
    
--     settings JSONB DEFAULT '{}',
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
--     UNIQUE(workspace_id, platform_name, account_id)
-- );
-- CREATE INDEX idx_social_platform_connections_workspace ON social_platform_connections(workspace_id);
-- CREATE INDEX idx_social_platform_connections_platform ON social_platform_connections(platform_name);

-- -- 4.6 Organization & Display
-- -------------------------------------------------
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

-- -- Change from display_widgets to collection_widgets
-- CREATE TABLE collection_widgets (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     collection_method collection_method NOT NULL,
--     source_type VARCHAR(50) NOT NULL,
--     configuration JSONB DEFAULT '{}',
--     styling JSONB DEFAULT '{}',
--     responsiveness_settings JSONB DEFAULT '{}',
--     filter_rules JSONB DEFAULT '{}',
--     form_settings JSONB DEFAULT '{}',
--     customization JSONB DEFAULT '{}',
--     ab_testing_settings JSONB DEFAULT '{}',
--     analytics_settings JSONB DEFAULT '{}',
--     published BOOLEAN DEFAULT FALSE,
--     embed_code TEXT,
--     created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_collection_widgets_workspace ON collection_widgets(workspace_id);

-- -- For future use (when you implement display functionality)
-- CREATE TABLE display_widgets (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     -- Display-specific fields would go here
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

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

-- CREATE TABLE display_placements (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
--     -- Change reference from display_widgets to collection_widgets for now
--     collection_widget_id UUID REFERENCES collection_widgets(id) ON DELETE CASCADE,
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
-- CREATE INDEX idx_display_placements_widget ON display_placements(collection_widget_id);

-- -- 4.7 Collaboration
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

-- -- 4.8 Analytics & Tracking
-- -------------------------------------------------
-- CREATE TABLE analytics_events (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     testimonial_id UUID REFERENCES testimonials(id) ON DELETE CASCADE,
--     display_id UUID REFERENCES display_widgets(id) ON DELETE CASCADE,
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
--     display_id UUID REFERENCES display_widgets(id) ON DELETE CASCADE,
--     conversion_type VARCHAR(50),
--     conversion_value DECIMAL(10,2),
--     conversion_details JSONB,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_conversion_tracking_testimonial ON conversion_tracking(testimonial_id);
-- CREATE INDEX idx_conversion_tracking_display ON conversion_tracking(display_id);

-- -- 4.9 Integrations
-- -------------------------------------------------
-- CREATE TABLE platform_integrations (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
--     platform_name VARCHAR(100) NOT NULL,
--     integration_type integration_type NOT NULL,
--     credentials JSONB NOT NULL,
--     webhook_url VARCHAR(1024),
--     sync_frequency VARCHAR(50),
--     last_sync_at TIMESTAMPTZ,
--     sync_status VARCHAR(50),
--     status VARCHAR(50) DEFAULT 'active',
--     settings JSONB DEFAULT '{}',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_platform_integrations_workspace ON platform_integrations(workspace_id);
-- CREATE INDEX idx_platform_integrations_type ON platform_integrations(integration_type);

-- -- ==============================================================
-- -- 5. Create Triggers
-- -- ==============================================================

-- CREATE TRIGGER update_workspaces_updated_at
--     BEFORE UPDATE ON workspaces
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_brand_guides_updated_at
--     BEFORE UPDATE ON brand_guides
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_testimonials_updated_at
--     BEFORE UPDATE ON testimonials
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_collection_portals_updated_at
--     BEFORE UPDATE ON collection_portals
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_collections_updated_at
--     BEFORE UPDATE ON collections
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_comments_updated_at
--     BEFORE UPDATE ON comments
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- Add trigger for display_widgets since it's referenced in the error
-- CREATE TRIGGER update_display_widgets_updated_at
--     BEFORE UPDATE ON display_widgets
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();