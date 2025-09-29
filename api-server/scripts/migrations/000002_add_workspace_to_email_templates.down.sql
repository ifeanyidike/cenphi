-- Remove workspace_id column from email_templates table
DROP INDEX IF EXISTS idx_email_templates_workspace;
ALTER TABLE email_templates DROP COLUMN IF EXISTS workspace_id;