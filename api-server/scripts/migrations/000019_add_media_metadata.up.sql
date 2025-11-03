-- Add duration and thumbnail_url to testimonials table
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS duration DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add duration and thumbnail_url to testimonial_artifacts table
ALTER TABLE testimonial_artifacts
ADD COLUMN IF NOT EXISTS duration DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_testimonials_duration ON testimonials(duration) WHERE duration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_testimonial_artifacts_duration ON testimonial_artifacts(duration) WHERE duration IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN testimonials.duration IS 'Video duration in seconds, extracted when testimonial is uploaded';
COMMENT ON COLUMN testimonials.thumbnail_url IS 'Auto-generated thumbnail URL at 25% mark of video';
COMMENT ON COLUMN testimonial_artifacts.duration IS 'Artifact video duration in seconds';
COMMENT ON COLUMN testimonial_artifacts.thumbnail_url IS 'Auto-generated thumbnail URL at 25% mark of artifact';
