-- Migration to add vector_store_id to workspaces table
-- This allows each workspace to have its own OpenAI vector store for "Talk to Your Data" functionality

ALTER TABLE workspaces ADD COLUMN vector_store_id VARCHAR(255);

-- Add index for vector store lookups
CREATE INDEX idx_workspaces_vector_store_id ON workspaces(vector_store_id) WHERE vector_store_id IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN workspaces.vector_store_id IS 'OpenAI Vector Store ID for Talk to Your Data functionality';