-- Rollback: Remove metadata column from processing_stages

DROP INDEX IF EXISTS idx_processing_stages_metadata;

ALTER TABLE processing_stages
DROP COLUMN IF EXISTS metadata;
