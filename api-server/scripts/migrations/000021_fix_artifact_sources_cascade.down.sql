-- ----------------------------------
-- DOWN MIGRATION: 000021_fix_artifact_sources_cascade.down.sql
-- Revert artifact_sources foreign keys to original state (no CASCADE)
-- ----------------------------------

-- Drop CASCADE constraints
ALTER TABLE artifact_sources
  DROP CONSTRAINT IF EXISTS artifact_sources_source_testimonial_id_fkey,
  DROP CONSTRAINT IF EXISTS artifact_sources_source_artifact_id_fkey,
  DROP CONSTRAINT IF EXISTS artifact_sources_artifact_id_fkey;

-- Add foreign key constraints WITHOUT CASCADE DELETE (original state)
ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_artifact_id_fkey
    FOREIGN KEY (artifact_id)
    REFERENCES testimonial_artifacts(id);

ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_source_testimonial_id_fkey
    FOREIGN KEY (source_testimonial_id)
    REFERENCES testimonials(id);

ALTER TABLE artifact_sources
  ADD CONSTRAINT artifact_sources_source_artifact_id_fkey
    FOREIGN KEY (source_artifact_id)
    REFERENCES testimonial_artifacts(id);
