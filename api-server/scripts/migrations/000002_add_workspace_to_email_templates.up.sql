-- Add workspace_id column to email_templates table
ALTER TABLE email_templates ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create index for workspace filtering
CREATE INDEX idx_email_templates_workspace ON email_templates(workspace_id);

-- Update trigger (already exists, so we don't need to recreate it)