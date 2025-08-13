
-- -- ----------------------------------
-- -- DOWN MIGRATION: 000001_initial_schema.down.sql
-- -- ----------------------------------

-- -- Drop tables in reverse order
-- DROP TABLE IF EXISTS email_templates CASCADE;
-- DROP TABLE IF EXISTS email_logs CASCADE;
-- DROP TABLE IF EXISTS testimonial_requests CASCADE;
-- DROP TABLE IF EXISTS social_posts CASCADE;
-- DROP TABLE IF EXISTS social_accounts CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS testimonial_artifacts CASCADE;
-- DROP TABLE IF EXISTS testimonials CASCADE;
-- DROP TABLE IF EXISTS team_members CASCADE;
-- DROP TABLE IF EXISTS workspaces CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- -- Drop enums
-- DROP TYPE IF EXISTS collection_method CASCADE;
-- DROP TYPE IF EXISTS oauth_status CASCADE;
-- DROP TYPE IF EXISTS post_status CASCADE;
-- DROP TYPE IF EXISTS social_platform CASCADE;
-- DROP TYPE IF EXISTS job_status CASCADE;
-- DROP TYPE IF EXISTS content_status CASCADE;
-- DROP TYPE IF EXISTS content_type CASCADE;

-- -- Drop function
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- -- Drop domains
-- DROP DOMAIN IF EXISTS uuid_pk CASCADE;
-- DROP DOMAIN IF EXISTS ts_tz CASCADE;

-- -- Drop extensions
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "citext";
-- DROP EXTENSION IF EXISTS "pgcrypto";


-- ----------------------------------
-- DOWN MIGRATION: 000001_initial_schema.down.sql
-- ----------------------------------

-- Drop tables in reverse order
DROP TABLE IF EXISTS google_drive_accounts CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_requests CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS testimonial_artifacts CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS collection_method CASCADE;
DROP TYPE IF EXISTS oauth_status CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS social_platform CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS content_status CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop domains
DROP DOMAIN IF EXISTS uuid_pk CASCADE;
DROP DOMAIN IF EXISTS ts_tz CASCADE;

-- Drop extensions (avoid dropping pgcrypto if other extensions depend on it)
-- Check for dependencies before dropping
DO $$
BEGIN
    -- Only drop pgcrypto if no other extensions depend on it
    IF NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_extension e ON d.objid = e.oid
        WHERE d.refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pgcrypto')
        AND e.extname != 'pgcrypto'
    ) THEN
        DROP EXTENSION IF EXISTS "pgcrypto";
    END IF;
END$$;

DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "pg_trgm";
DROP EXTENSION IF EXISTS "citext";