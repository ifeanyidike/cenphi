-- Remove unique constraint from testimonial_artifacts
ALTER TABLE testimonial_artifacts
DROP CONSTRAINT IF EXISTS testimonial_artifacts_unique_processing;
