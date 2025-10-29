-- Migration rollback for scheduled calls
DROP TRIGGER IF EXISTS trigger_scheduled_calls_updated_at ON scheduled_calls;
DROP FUNCTION IF EXISTS update_scheduled_calls_updated_at();
DROP TABLE IF EXISTS scheduled_calls;