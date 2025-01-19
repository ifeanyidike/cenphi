-- Down Migration

-- First drop triggers
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_content_displays_updated_at ON content_displays;
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS update_collection_portals_updated_at ON collection_portals;
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
DROP TRIGGER IF EXISTS workspace_deletion_trigger ON workspaces;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS cascade_workspace_deletion();

-- Drop indexes
DROP INDEX IF EXISTS idx_semantic_indices_vector_ref;
DROP INDEX IF EXISTS idx_semantic_indices_testimonial;
DROP INDEX IF EXISTS idx_analytics_events_testimonial;
DROP INDEX IF EXISTS idx_analytics_events_workspace;
DROP INDEX IF EXISTS idx_collections_workspace;
DROP INDEX IF EXISTS idx_story_analyses_testimonial;
DROP INDEX IF EXISTS idx_dna_profiles_scores;
DROP INDEX IF EXISTS idx_testimonials_content_trgm;
DROP INDEX IF EXISTS idx_testimonials_categories;
DROP INDEX IF EXISTS idx_testimonials_tags;
DROP INDEX IF EXISTS idx_testimonials_customer_email;
DROP INDEX IF EXISTS idx_testimonials_type;
DROP INDEX IF EXISTS idx_testimonials_status;
DROP INDEX IF EXISTS idx_testimonials_workspace;
DROP INDEX IF EXISTS idx_audit_log_event_type;
DROP INDEX IF EXISTS idx_audit_log_entity;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS semantic_indices;
DROP TABLE IF EXISTS conversion_tracking;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS display_placements;
DROP TABLE IF EXISTS content_displays;
DROP TABLE IF EXISTS collection_items;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS ai_generated_content;
DROP TABLE IF EXISTS story_analyses;
DROP TABLE IF EXISTS testimonial_dna_profiles;
DROP TABLE IF EXISTS ai_processing_jobs;
DROP TABLE IF EXISTS collection_portals;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS workspaces;

-- Drop enum types
DROP TYPE IF EXISTS analysis_aspect;
DROP TYPE IF EXISTS ai_service_category;
DROP TYPE IF EXISTS verification_type;
DROP TYPE IF EXISTS collection_method;
DROP TYPE IF EXISTS content_status;
DROP TYPE IF EXISTS testimonial_type;
DROP TYPE IF EXISTS member_role;
DROP TYPE IF EXISTS workspace_plan;

-- Drop extensions (optional - uncomment if you want to remove extensions)
-- DROP EXTENSION IF EXISTS "hstore";
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "uuid-ossp";