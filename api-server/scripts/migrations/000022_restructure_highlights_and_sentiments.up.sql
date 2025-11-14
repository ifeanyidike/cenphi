-- ============================================================================
-- Migration 000022: Restructure Highlights and Sentiments
-- ============================================================================
--
-- OBJECTIVES:
-- 1. Move highlights from testimonial_artifacts to dedicated testimonial_highlights table
-- 2. Move sentiments from testimonial_artifacts to testimonials.sentiment_data JSONB field
-- 3. Enable dual extraction modes for highlights (standalone vs story_video)
--
-- BENEFITS:
-- - Better normalization (1:Many for highlights, 1:1 for sentiments)
-- - No join overhead for sentiments (always fetched with testimonial)
-- - Clean schema for highlight-specific fields
-- - Enables cost-optimized on-demand highlight generation
-- ============================================================================

-- ============================================================================
-- PART 1: Create testimonial_highlights table
-- ============================================================================

CREATE TABLE IF NOT EXISTS testimonial_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Highlight categorization
    highlight_type VARCHAR(50) NOT NULL,  -- general, problem, solution, results, impact, experience, team
    extraction_mode VARCHAR(20) NOT NULL DEFAULT 'standalone',  -- standalone (8-20s) | story_video (6-25s)

    -- Highlight moments data (JSONB array of HighlightMoment objects)
    moments JSONB NOT NULL DEFAULT '[]',

    -- Story-specific metadata (only for extraction_mode = 'story_video')
    story_metadata JSONB DEFAULT '{}',

    -- Processing metadata (AI model, processing time, etc.)
    processing_metadata JSONB DEFAULT '{}',

    -- Statistics (computed from moments array)
    moment_count INTEGER NOT NULL DEFAULT 0,
    total_duration FLOAT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_highlight_per_mode UNIQUE(testimonial_id, highlight_type, extraction_mode),
    CONSTRAINT valid_extraction_mode CHECK (extraction_mode IN ('standalone', 'story_video')),
    CONSTRAINT valid_highlight_type CHECK (highlight_type IN ('general', 'problem', 'solution', 'results', 'impact', 'experience', 'team', 'customer_experience', 'team_collaboration'))
);

-- Indexes for testimonial_highlights
CREATE INDEX idx_highlights_testimonial ON testimonial_highlights(testimonial_id);
CREATE INDEX idx_highlights_workspace ON testimonial_highlights(workspace_id);
CREATE INDEX idx_highlights_type_mode ON testimonial_highlights(highlight_type, extraction_mode);
CREATE INDEX idx_highlights_created ON testimonial_highlights(created_at DESC);
CREATE INDEX idx_highlights_testimonial_type ON testimonial_highlights(testimonial_id, highlight_type);

-- Trigger for updated_at
CREATE TRIGGER trg_highlights_updated
    BEFORE UPDATE ON testimonial_highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE testimonial_highlights IS 'Stores extracted highlight moments from testimonials. Supports dual extraction modes: standalone (for clips) and story_video (for story assembly).';
COMMENT ON COLUMN testimonial_highlights.extraction_mode IS 'standalone: 8-20s clips for direct use | story_video: 6-25s moments optimized for story flow';
COMMENT ON COLUMN testimonial_highlights.moments IS 'JSONB array of HighlightMoment objects with start_time, end_time, text, theme, etc.';
COMMENT ON COLUMN testimonial_highlights.story_metadata IS 'Metadata for story_video mode: speaker_id, narrative_position, emotional_tone, etc.';

-- ============================================================================
-- PART 2: Migrate existing highlights from testimonial_artifacts
-- ============================================================================

INSERT INTO testimonial_highlights (
    id,
    testimonial_id,
    workspace_id,
    highlight_type,
    extraction_mode,
    moments,
    processing_metadata,
    created_at,
    updated_at
)
SELECT
    ta.id,
    ta.testimonial_id,
    ta.workspace_id,
    CASE
        WHEN ta.result_category IN ('general', 'problem', 'solution', 'results', 'impact', 'experience', 'team', 'customer_experience', 'team_collaboration')
            THEN ta.result_category
        ELSE 'general'
    END as highlight_type,
    'standalone' as extraction_mode,  -- All existing highlights are standalone
    COALESCE(ta.data->'highlights', '[]'::jsonb) as moments,  -- Extract highlights array from data
    COALESCE(ta.processing_metadata, '{}'::jsonb) as processing_metadata,
    ta.created_at,
    ta.updated_at
FROM testimonial_artifacts ta
WHERE ta.processing_type = 'highlight_extraction'
  AND ta.testimonial_id IS NOT NULL  -- Only migrate highlights with testimonial_id
  AND ta.data ? 'highlights'  -- Only migrate if highlights key exists
ON CONFLICT (testimonial_id, highlight_type, extraction_mode) DO NOTHING;  -- Skip duplicates

-- Update statistics based on moments data
UPDATE testimonial_highlights
SET
    moment_count = (
        SELECT COALESCE(jsonb_array_length(moments), 0)
    ),
    total_duration = (
        SELECT COALESCE(
            SUM((elem->>'end_time')::float - (elem->>'start_time')::float),
            0
        )
        FROM jsonb_array_elements(moments) elem
        WHERE (elem->>'start_time') IS NOT NULL
          AND (elem->>'end_time') IS NOT NULL
    );

-- ============================================================================
-- PART 3: Add sentiment_data to testimonials table
-- ============================================================================

-- Add sentiment_data column if it doesn't exist
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS sentiment_data JSONB DEFAULT '{}' NOT NULL;

-- Add index for filtering by sentiment
CREATE INDEX IF NOT EXISTS idx_testimonials_sentiment
ON testimonials((sentiment_data->>'sentiment'));

-- Add index for filtering by sentiment score range
CREATE INDEX IF NOT EXISTS idx_testimonials_sentiment_score
ON testimonials(((sentiment_data->>'overall_score')::float));

-- Add comment
COMMENT ON COLUMN testimonials.sentiment_data IS 'Sentiment analysis data: overall_score, sentiment (positive/neutral/negative), confidence, emotions, etc.';

-- ============================================================================
-- PART 4: Migrate existing sentiments from testimonial_artifacts
-- ============================================================================

-- Migrate sentiment data to testimonials table
UPDATE testimonials t
SET sentiment_data = COALESCE(ta.data, '{}'::jsonb)
FROM testimonial_artifacts ta
WHERE ta.testimonial_id = t.id
  AND ta.processing_type = 'sentiment_analysis'
  AND t.sentiment_data = '{}'::jsonb;  -- Only update if not already set

-- Add processed_at timestamp to sentiment_data
UPDATE testimonials t
SET sentiment_data = jsonb_set(
    sentiment_data,
    '{processed_at}',
    to_jsonb(ta.created_at::text),
    true
)
FROM testimonial_artifacts ta
WHERE ta.testimonial_id = t.id
  AND ta.processing_type = 'sentiment_analysis'
  AND NOT (sentiment_data ? 'processed_at');  -- Only if processed_at doesn't exist

-- ============================================================================
-- PART 5: Cleanup (COMMENTED OUT - Run manually after verification)
-- ============================================================================

-- After verifying the migration and updating all code:
--
-- -- Delete migrated highlights from testimonial_artifacts
-- DELETE FROM testimonial_artifacts
-- WHERE processing_type = 'highlight_extraction';
--
-- -- Delete migrated sentiments from testimonial_artifacts
-- DELETE FROM testimonial_artifacts
-- WHERE processing_type = 'sentiment_analysis';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
