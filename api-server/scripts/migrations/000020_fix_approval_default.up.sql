-- Change approval_status default from 'approved' to 'draft'
-- This ensures new artifacts and testimonials start as drafts

ALTER TABLE testimonial_artifacts
  ALTER COLUMN approval_status SET DEFAULT 'draft';

ALTER TABLE testimonials
  ALTER COLUMN approval_status SET DEFAULT 'draft';

-- Update existing NULL values to 'draft' (shouldn't be any with current schema, but just in case)
UPDATE testimonial_artifacts
  SET approval_status = 'draft'
  WHERE approval_status IS NULL;

UPDATE testimonials
  SET approval_status = 'draft'
  WHERE approval_status IS NULL;
