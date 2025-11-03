-- Rollback approval and showcase system

-- Drop indexes
DROP INDEX IF EXISTS idx_workspaces_showcase_slug;
DROP INDEX IF EXISTS idx_testimonials_workspace_approval;
DROP INDEX IF EXISTS idx_testimonials_is_public;
DROP INDEX IF EXISTS idx_testimonials_approval_status;
DROP INDEX IF EXISTS idx_artifacts_workspace_approval;
DROP INDEX IF EXISTS idx_artifacts_is_public;
DROP INDEX IF EXISTS idx_artifacts_approval_status;

-- Remove showcase fields from workspaces
ALTER TABLE workspaces DROP COLUMN IF EXISTS showcase_settings;
ALTER TABLE workspaces DROP COLUMN IF EXISTS showcase_slug;
ALTER TABLE workspaces DROP COLUMN IF EXISTS showcase_enabled;

-- Remove approval fields from testimonials
ALTER TABLE testimonials DROP COLUMN IF EXISTS approved_by;
ALTER TABLE testimonials DROP COLUMN IF EXISTS approved_at;
ALTER TABLE testimonials DROP COLUMN IF EXISTS is_public;
ALTER TABLE testimonials DROP COLUMN IF EXISTS approval_status;

-- Remove approval fields from testimonial_artifacts
ALTER TABLE testimonial_artifacts DROP COLUMN IF EXISTS approved_by;
ALTER TABLE testimonial_artifacts DROP COLUMN IF EXISTS approved_at;
ALTER TABLE testimonial_artifacts DROP COLUMN IF EXISTS is_public;
ALTER TABLE testimonial_artifacts DROP COLUMN IF EXISTS approval_status;
