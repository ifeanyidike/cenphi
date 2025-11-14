-- ============================================================================
-- Migration 000024 Rollback: Revert Highlight Types to Original
-- ============================================================================

-- Revert data migrations (best effort - some information may be lost)
UPDATE testimonial_highlights
SET highlight_type = CASE
    WHEN highlight_type = 'emotional' THEN 'customer_experience'
    WHEN highlight_type = 'thematic' THEN 'general'
    WHEN highlight_type = 'before_after' THEN 'results'
    WHEN highlight_type = 'recommendation' THEN 'general'
    WHEN highlight_type = 'metrics' THEN 'results'
    ELSE highlight_type
END
WHERE highlight_type IN ('emotional', 'thematic', 'before_after', 'recommendation', 'metrics');

-- Drop new constraint
ALTER TABLE testimonial_highlights
DROP CONSTRAINT IF EXISTS valid_highlight_type;

-- Restore old constraint
ALTER TABLE testimonial_highlights
ADD CONSTRAINT valid_highlight_type CHECK (highlight_type IN (
    'general',
    'problem',
    'solution',
    'results',
    'impact',
    'experience',
    'team',
    'customer_experience',
    'team_collaboration'
));

-- Restore old comment
COMMENT ON COLUMN testimonial_highlights.highlight_type IS
'Type of highlight: general, problem, solution, results, impact, experience, team, customer_experience, team_collaboration';

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================
