-- Migration rollback for vector_store_id column
DROP INDEX IF EXISTS idx_workspaces_vector_store_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS vector_store_id;