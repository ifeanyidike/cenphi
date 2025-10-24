-- Drop public sharing tables and functions

DROP FUNCTION IF EXISTS increment_public_share_metric(UUID, VARCHAR, UUID);
DROP TABLE IF EXISTS public_share_events CASCADE;
DROP TABLE IF EXISTS public_share_metrics CASCADE;
DROP TABLE IF EXISTS public_shares CASCADE;
