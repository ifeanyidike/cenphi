-- Drop indexes
DROP INDEX IF EXISTS idx_testimonial_artifacts_duration;
DROP INDEX IF EXISTS idx_testimonials_duration;

-- Remove columns from testimonial_artifacts
ALTER TABLE testimonial_artifacts
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS duration;

-- Remove columns from testimonials
ALTER TABLE testimonials
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS duration;
