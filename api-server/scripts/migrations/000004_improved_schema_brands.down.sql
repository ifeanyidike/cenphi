-- +migrate Down
-- SQL for rolling back this migration

BEGIN;

-- ==============================================================
-- Set session parameters to ensure maximum compatibility
-- ==============================================================
SET session_replication_role = 'replica';  -- Disables triggers
SET constraint_exclusion = off;            -- Ensures constraints don't prevent drops

-- ==============================================================
-- 1. Drop all triggers safely
-- ==============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_display_widgets_updated_at') THEN
        DROP TRIGGER IF EXISTS update_display_widgets_updated_at ON display_widgets;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
        DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collections_updated_at') THEN
        DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collection_portals_updated_at') THEN
        DROP TRIGGER IF EXISTS update_collection_portals_updated_at ON collection_portals;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_testimonials_updated_at') THEN
        DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brand_guides_updated_at') THEN
        DROP TRIGGER IF EXISTS update_brand_guides_updated_at ON brand_guides;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workspaces_updated_at') THEN
        DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
    END IF;
END$$;

-- ==============================================================
-- 2. Drop all tables with CASCADE to remove any dependencies
-- ==============================================================

-- Drop tables in reverse order of creation to respect foreign key constraints
DO $$
BEGIN
    -- 4.9 Integrations
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'platform_integrations') THEN
        DROP TABLE IF EXISTS platform_integrations CASCADE;
    END IF;
    
    -- 4.8 Analytics & Tracking
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversion_tracking') THEN
        DROP TABLE IF EXISTS conversion_tracking CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
        DROP TABLE IF EXISTS analytics_events CASCADE;
    END IF;
    
    -- 4.7 Collaboration
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
        DROP TABLE IF EXISTS comments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
        DROP TABLE IF EXISTS assignments CASCADE;
    END IF;
    
    -- 4.6 Organization & Display
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'display_placements') THEN
        DROP TABLE IF EXISTS display_placements CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'display_templates') THEN
        DROP TABLE IF EXISTS display_templates CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'display_widgets') THEN
        DROP TABLE IF EXISTS display_widgets CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_widgets') THEN
        DROP TABLE IF EXISTS collection_widgets CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_items') THEN
        DROP TABLE IF EXISTS collection_items CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collections') THEN
        DROP TABLE IF EXISTS collections CASCADE;
    END IF;
    
    -- 4.5 Templates
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_platform_connections') THEN
        DROP TABLE IF EXISTS social_platform_connections CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_campaigns') THEN
        DROP TABLE IF EXISTS social_campaigns CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_templates') THEN
        DROP TABLE IF EXISTS message_templates CASCADE;
    END IF;
    
    -- 4.4 Collection & Triggers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_portals') THEN
        DROP TABLE IF EXISTS collection_portals CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_triggers') THEN
        DROP TABLE IF EXISTS collection_triggers CASCADE;
    END IF;
    
    -- 4.3 Analysis & AI Processing
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_jobs') THEN
        DROP TABLE IF EXISTS ai_jobs CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'competitor_mentions') THEN
        DROP TABLE IF EXISTS competitor_mentions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'testimonial_analyses') THEN
        DROP TABLE IF EXISTS testimonial_analyses CASCADE;
    END IF;
    
    -- 4.2 Customer & Testimonial Core
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'testimonials') THEN
        DROP TABLE IF EXISTS testimonials CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_profiles') THEN
        DROP TABLE IF EXISTS customer_profiles CASCADE;
    END IF;
    
    -- 4.1 Core Platform Tables
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
        DROP TABLE IF EXISTS team_members CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        DROP TABLE IF EXISTS users CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_guides') THEN
        DROP TABLE IF EXISTS brand_guides CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workspaces') THEN
        DROP TABLE IF EXISTS workspaces CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
        DROP TABLE IF EXISTS audit_log CASCADE;
    END IF;
END$$;

-- ==============================================================
-- 3. Drop functions with CASCADE to ensure all dependents are removed
-- ==============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'cascade_workspace_deletion') THEN
        DROP FUNCTION IF EXISTS cascade_workspace_deletion() CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column') THEN
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    END IF;
END$$;

-- ==============================================================
-- 4. Use PL/pgSQL to clean up any potentially remaining objects
-- ==============================================================
DO $$
BEGIN
    -- Clean views
    FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || r.viewname || ' CASCADE';
    END LOOP;
    
    -- Clean indexes
    FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname || ' CASCADE';
    END LOOP;
    
    -- Clean sequences
    FOR r IN SELECT relname FROM pg_class WHERE relkind = 'S' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || r.relname || ' CASCADE';
    END LOOP;

    -- Clean domains
    FOR r IN SELECT typname FROM pg_type WHERE typtype = 'd' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP DOMAIN IF EXISTS ' || r.typname || ' CASCADE';
    END LOOP;
END$$;

-- ==============================================================
-- 5. Drop all enum types safely with CASCADE
-- ==============================================================
DO $$
BEGIN
    -- Drop all ENUM types with existence checks
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'trigger_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS trigger_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'business_event_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS business_event_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'testimonial_layout' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS testimonial_layout CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'testimonial_style' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS testimonial_style CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'analysis_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS analysis_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'placement_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS placement_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'integration_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS integration_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'sentiment' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS sentiment CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'ai_service_category' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS ai_service_category CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'verification_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS verification_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'collection_method' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS collection_method CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'content_status' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS content_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'content_format' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS content_format CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'testimonial_type' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS testimonial_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'member_role' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS member_role CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typname = 'workspace_plan' AND n.nspname = 'public') THEN
        DROP TYPE IF EXISTS workspace_plan CASCADE;
    END IF;
    
    -- Final sweep for any remaining enum types related to our schema
    FOR r IN 
        SELECT t.typname
        FROM pg_type t
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typtype = 'e' -- enum type
        AND n.nspname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || r.typname || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Log but continue
            RAISE NOTICE 'Could not drop type %: %', r.typname, SQLERRM;
        END;
    END LOOP;
END$$;

-- ==============================================================
-- 6. Reset session to normal operation
-- ==============================================================
SET session_replication_role = 'origin';
SET constraint_exclusion = default;

-- We don't drop extensions as they may be used by other parts of the application
-- DROP EXTENSION IF EXISTS "citext";
-- DROP EXTENSION IF EXISTS "hstore";
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;