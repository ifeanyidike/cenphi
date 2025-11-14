-- ============================================================================
-- Down Migration 000022: Rollback Highlights and Sentiments Restructuring
-- ============================================================================
--
-- WARNING: This rollback will:
-- 1. Drop the testimonial_highlights table (data loss if not backed up)
-- 2. Remove sentiment_data column from testimonials table
-- 3. Restore highlights and sentiments to testimonial_artifacts
--
-- Only run this if you need to rollback the migration completely.
-- ============================================================================

-- ============================================================================
-- PART 1: Restore highlights to testimonial_artifacts (if needed)
-- ============================================================================

-- Migrate highlights back to testimonial_artifacts
-- This preserves the data before dropping the table
INSERT INTO testimonial_artifacts (
    id,
    testimonial_id,
    workspace_id,
    processing_type,
    result_category,
    data,
    processing_metadata,
    is_user_saved,
    is_streamed,
    approval_status,
    is_public,
    created_at,
    updated_at
)
SELECT
    h.id,
    h.testimonial_id,
    h.workspace_id,
    'highlight_extraction' as processing_type,
    h.highlight_type as result_category,
    h.moments as data,
    h.processing_metadata,
    false as is_user_saved,
    false as is_streamed,
    'draft' as approval_status,
    false as is_public,
    h.created_at,
    h.updated_at
FROM testimonial_highlights h
WHERE h.extraction_mode = 'standalone'  -- Only restore standalone highlights
ON CONFLICT (testimonial_id, processing_type, result_category) DO NOTHING;

-- ============================================================================
-- PART 2: Restore sentiments to testimonial_artifacts (if needed)
-- ============================================================================

-- Migrate sentiments back to testimonial_artifacts
INSERT INTO testimonial_artifacts (
    id,
    testimonial_id,
    workspace_id,
    processing_type,
    result_category,
    data,
    is_user_saved,
    is_streamed,
    approval_status,
    is_public,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4() as id,
    t.id as testimonial_id,
    t.workspace_id,
    'sentiment_analysis' as processing_type,
    'analysis' as result_category,
    t.sentiment_data as data,
    false as is_user_saved,
    false as is_streamed,
    'draft' as approval_status,
    false as is_public,
    NOW() as created_at,
    NOW() as updated_at
FROM testimonials t
WHERE t.sentiment_data != '{}'::jsonb
  AND t.sentiment_data IS NOT NULL
ON CONFLICT (testimonial_id, processing_type, result_category) DO NOTHING;

-- ============================================================================
-- PART 3: Drop new structures
-- ============================================================================

-- Drop testimonial_highlights table
DROP TABLE IF EXISTS testimonial_highlights CASCADE;

-- Drop sentiment_data column and indexes
DROP INDEX IF EXISTS idx_testimonials_sentiment;
DROP INDEX IF EXISTS idx_testimonials_sentiment_score;
ALTER TABLE testimonials DROP COLUMN IF EXISTS sentiment_data;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================
