-- ----------------------------------
-- UP MIGRATION: 000021_fix_artifact_sources_cascade.up.sql
-- Fix artifact_sources foreign keys to use CASCADE DELETE
-- This ensures lineage records are cleaned up when testimonials/artifacts are deleted
-- ----------------------------------

-- Drop existing foreign key constraints
ALTER TABLE artifact_sources
  DROP CONSTRAINT IF EXISTS artifact_sources_source_testimonial_id_fkey,
  DROP CONSTRAINT IF EXISTS artifact_sources_source_artifact_id_fkey,
  DROP CONSTRAINT IF EXISTS artifact_sources_artifact_id_fkey;

-- Add foreign key constraints WITH CASCADE DELETE
ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_artifact_id_fkey
    FOREIGN KEY (artifact_id)
    REFERENCES testimonial_artifacts(id)
    ON DELETE CASCADE;

ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_source_testimonial_id_fkey
    FOREIGN KEY (source_testimonial_id)
    REFERENCES testimonials(id)
    ON DELETE CASCADE;

ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_source_artifact_id_fkey
    FOREIGN KEY (source_artifact_id)
    REFERENCES testimonial_artifacts(id)
    ON DELETE CASCADE;
