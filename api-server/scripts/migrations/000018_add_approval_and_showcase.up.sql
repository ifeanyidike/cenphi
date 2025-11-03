-- Add approval and showcase system for testimonials and artifacts

-- Add approval fields to testimonial_artifacts table
ALTER TABLE testimonial_artifacts ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';
ALTER TABLE testimonial_artifacts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE testimonial_artifacts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE testimonial_artifacts ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Add approval fields to testimonials table
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Add showcase fields to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS showcase_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS showcase_slug VARCHAR(100) UNIQUE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS showcase_settings JSONB DEFAULT '{}';

-- Create indexes for approval queries
CREATE INDEX IF NOT EXISTS idx_artifacts_approval_status ON testimonial_artifacts(approval_status);
CREATE INDEX IF NOT EXISTS idx_artifacts_is_public ON testimonial_artifacts(is_public);
CREATE INDEX IF NOT EXISTS idx_artifacts_workspace_approval ON testimonial_artifacts(workspace_id, approval_status, is_public);

CREATE INDEX IF NOT EXISTS idx_testimonials_approval_status ON testimonials(approval_status);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_public ON testimonials(is_public);
CREATE INDEX IF NOT EXISTS idx_testimonials_workspace_approval ON testimonials(workspace_id, approval_status, is_public);

CREATE INDEX IF NOT EXISTS idx_workspaces_showcase_slug ON workspaces(showcase_slug) WHERE showcase_slug IS NOT NULL;

-- Add comments
COMMENT ON COLUMN testimonial_artifacts.approval_status IS 'Approval status: draft, pending, approved, rejected';
COMMENT ON COLUMN testimonial_artifacts.is_public IS 'Whether artifact is publicly visible';
COMMENT ON COLUMN testimonials.approval_status IS 'Approval status: draft, pending, approved, rejected';
COMMENT ON COLUMN testimonials.is_public IS 'Whether testimonial is publicly visible';
COMMENT ON COLUMN workspaces.showcase_enabled IS 'Whether public showcase page is enabled';
COMMENT ON COLUMN workspaces.showcase_slug IS 'URL-friendly slug for public showcase page';
COMMENT ON COLUMN workspaces.showcase_settings IS 'JSON settings for public showcase customization';
