-- Add unique constraint for testimonial artifacts to enable upsert behavior
-- This ensures we can cache AI-generated results (platform recommendations, hook detection, etc.)
-- without creating duplicate rows

-- First, remove any existing duplicates (keep the most recent one)
DELETE FROM testimonial_artifacts a
USING testimonial_artifacts b
WHERE a.id < b.id
  AND a.testimonial_id = b.testimonial_id
  AND a.processing_type = b.processing_type
  AND a.result_category = b.result_category;

-- Add the unique constraint
ALTER TABLE testimonial_artifacts
ADD CONSTRAINT testimonial_artifacts_unique_processing
UNIQUE (testimonial_id, processing_type, result_category);
