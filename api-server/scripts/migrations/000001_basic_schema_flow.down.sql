-- MIGRATE DOWN SCRIPT

-- DROP TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS workspace_deletion_trigger ON workspaces;
DROP FUNCTION IF EXISTS cascade_workspace_deletion;

-- DROP INDEXES
DROP INDEX IF EXISTS idx_testimonials_workspace;
DROP INDEX IF EXISTS idx_testimonials_status;
DROP INDEX IF EXISTS idx_testimonials_type;
DROP INDEX IF EXISTS idx_testimonials_customer_email;
DROP INDEX IF EXISTS idx_testimonials_tags;
DROP INDEX IF EXISTS idx_testimonials_categories;
DROP INDEX IF EXISTS idx_testimonials_content_trgm;
DROP INDEX IF EXISTS idx_dna_profiles_scores;
DROP INDEX IF EXISTS idx_story_analyses_testimonial;
DROP INDEX IF EXISTS idx_collections_workspace;
DROP INDEX IF EXISTS idx_analytics_events_workspace;
DROP INDEX IF EXISTS idx_analytics_events_testimonial;
DROP INDEX IF EXISTS idx_semantic_indices_testimonial;

-- DROP TABLES
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
DROP TABLE IF EXISTS workspaces;

-- DROP ENUMS
DROP TYPE IF EXISTS workspace_plan;
DROP TYPE IF EXISTS member_role;
DROP TYPE IF EXISTS testimonial_type;
DROP TYPE IF EXISTS content_status;
DROP TYPE IF EXISTS collection_method;
DROP TYPE IF EXISTS verification_type;
DROP TYPE IF EXISTS ai_service_category;
DROP TYPE IF EXISTS analysis_aspect;

-- DROP EXTENSIONS
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS hstore;
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS "uuid-ossp";
