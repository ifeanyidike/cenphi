-- -- +migrate Down
-- -- SQL for rolling back this migration

-- -- ==============================================================
-- -- 1. Drop Triggers
-- -- ==============================================================
-- DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
-- DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
-- DROP TRIGGER IF EXISTS update_collection_portals_updated_at ON collection_portals;
-- DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
-- DROP TRIGGER IF EXISTS update_brand_guides_updated_at ON brand_guides;
-- DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;

-- -- ==============================================================
-- -- 2. Drop Tables (in reverse dependency order)
-- -- ==============================================================

-- -- 4.9 Integrations
-- DROP TABLE IF EXISTS platform_integrations CASCADE;

-- -- 4.8 Analytics & Tracking
-- DROP TABLE IF EXISTS conversion_tracking CASCADE;
-- DROP TABLE IF EXISTS analytics_events CASCADE;

-- -- 4.7 Collaboration
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS assignments CASCADE;

-- -- 4.6 Organization & Display
-- DROP TABLE IF EXISTS display_placements CASCADE;
-- DROP TABLE IF EXISTS display_templates CASCADE;
-- DROP TABLE IF EXISTS display_widgets CASCADE;
-- DROP TABLE IF EXISTS collection_widgets CASCADE;
-- DROP TABLE IF EXISTS collection_items CASCADE;
-- DROP TABLE IF EXISTS collections CASCADE;

-- -- 4.5 Templates
-- DROP TABLE IF EXISTS social_platform_connections CASCADE;
-- DROP TABLE IF EXISTS social_campaigns CASCADE;
-- DROP TABLE IF EXISTS message_templates CASCADE;

-- -- 4.4 Collection & Triggers
-- DROP TABLE IF EXISTS collection_portals CASCADE;
-- DROP TABLE IF EXISTS collection_triggers CASCADE;

-- -- 4.3 Analysis & AI Processing
-- DROP TABLE IF EXISTS ai_jobs CASCADE;
-- DROP TABLE IF EXISTS competitor_mentions CASCADE;
-- DROP TABLE IF EXISTS testimonial_analyses CASCADE;

-- -- 4.2 Customer & Testimonial Core
-- DROP TABLE IF EXISTS testimonials CASCADE;
-- DROP TABLE IF EXISTS customer_profiles CASCADE;

-- -- 4.1 Core Platform Tables
-- DROP TABLE IF EXISTS team_members CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS brand_guides CASCADE;
-- DROP TABLE IF EXISTS workspaces CASCADE;
-- DROP TABLE IF EXISTS audit_log CASCADE;

-- -- ==============================================================
-- -- 3. Drop Trigger Functions
-- -- ==============================================================
-- DROP FUNCTION IF EXISTS cascade_workspace_deletion() CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- -- ==============================================================
-- -- 4. Drop ENUM Types
-- -- ==============================================================
-- DROP TYPE IF EXISTS testimonial_layout;
-- DROP TYPE IF EXISTS testimonial_style;
-- DROP TYPE IF EXISTS analysis_type;
-- DROP TYPE IF EXISTS placement_type;
-- DROP TYPE IF EXISTS integration_type;
-- DROP TYPE IF EXISTS sentiment;
-- DROP TYPE IF EXISTS ai_service_category;
-- DROP TYPE IF EXISTS verification_type;
-- DROP TYPE IF EXISTS collection_method;
-- DROP TYPE IF EXISTS content_status;
-- DROP TYPE IF EXISTS content_format;
-- DROP TYPE IF EXISTS testimonial_type;
-- DROP TYPE IF EXISTS member_role;
-- DROP TYPE IF EXISTS workspace_plan;
-- DROP TYPE IF EXISTS trigger_type;
-- DROP TYPE IF EXISTS business_event_type;

-- -- ==============================================================
-- -- 5. Drop Extensions (Commented out by default)
-- -- ==============================================================
-- -- DROP EXTENSION IF EXISTS "citext";
-- -- DROP EXTENSION IF EXISTS "hstore";
-- -- DROP EXTENSION IF EXISTS "pg_trgm";
-- -- DROP EXTENSION IF EXISTS "uuid-ossp";