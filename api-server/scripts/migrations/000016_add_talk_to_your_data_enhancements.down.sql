-- ----------------------------------
-- DOWN MIGRATION: 000016_add_talk_to_your_data_enhancements.down.sql
-- ----------------------------------

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS export_logs CASCADE;
DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS segment_definitions CASCADE;
DROP TABLE IF EXISTS saved_queries CASCADE;
DROP TABLE IF EXISTS conversation_sessions CASCADE;

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_analytics_cache();
