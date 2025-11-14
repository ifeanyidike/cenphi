-- ============================================================================
-- Migration 000024: Update Highlight Types to Match Frontend
-- ============================================================================
--
-- OBJECTIVES:
-- 1. Update valid_highlight_type constraint to match frontend types
-- 2. Migrate existing data to new type names where applicable
--
-- Frontend highlight types (from ai-service.ts and HighlightTypeSelectionStep.tsx):
-- - general: Key moments and standout clips
-- - emotional: Heartfelt and impactful expressions
-- - problem: Challenges and pain points discussed
-- - solution: How problems were solved
-- - results: Tangible results and achievements
-- - metrics: Quantifiable data and statistics
-- - recommendation: Endorsements and suggestions
-- - before_after: Transformation stories
-- - thematic: Thematic highlights (from TypeScript but not in UI)
--
-- Old database types being replaced:
-- - impact -> results (closer semantic match)
-- - experience -> general (generic fallback)
-- - team -> general (generic fallback)
-- - customer_experience -> emotional (experience-focused)
-- - team_collaboration -> general (generic fallback)
-- ============================================================================

-- ============================================================================
-- PART 1: Migrate existing data to new type names
-- ============================================================================

-- Fix rows where 'story_video' is in highlight_type (should be in extraction_mode)
-- These rows have highlight_type = 'story_video' which is incorrect
UPDATE testimonial_highlights
SET
    extraction_mode = 'story_video',
    highlight_type = 'general'  -- Default to general for story_video entries
WHERE highlight_type = 'story_video';

-- Map old types to new types
UPDATE testimonial_highlights
SET highlight_type = CASE
    WHEN highlight_type = 'impact' THEN 'results'
    WHEN highlight_type = 'experience' THEN 'general'
    WHEN highlight_type = 'team' THEN 'general'
    WHEN highlight_type = 'customer_experience' THEN 'emotional'
    WHEN highlight_type = 'team_collaboration' THEN 'general'
    ELSE highlight_type
END
WHERE highlight_type IN ('impact', 'experience', 'team', 'customer_experience', 'team_collaboration');

-- ============================================================================
-- PART 2: Drop old constraint and create new one
-- ============================================================================

-- Drop the old constraint
ALTER TABLE testimonial_highlights
DROP CONSTRAINT IF EXISTS valid_highlight_type;

-- Create new constraint with updated types
ALTER TABLE testimonial_highlights
ADD CONSTRAINT valid_highlight_type CHECK (highlight_type IN (
    'general',
    'emotional',
    'thematic',
    'before_after',
    'recommendation',
    'metrics',
    'results',
    'solution',
    'problem'
));

-- ============================================================================
-- PART 3: Update comment for clarity
-- ============================================================================

COMMENT ON COLUMN testimonial_highlights.highlight_type IS
'Type of highlight: general (key moments), emotional (heartfelt), problem (challenges), solution (how solved), results (outcomes), metrics (data), recommendation (endorsements), before_after (transformation), thematic (themes)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
