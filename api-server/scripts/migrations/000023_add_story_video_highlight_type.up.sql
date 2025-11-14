-- Add 'story_video' to valid highlight types
ALTER TABLE testimonial_highlights DROP CONSTRAINT IF EXISTS valid_highlight_type;

ALTER TABLE testimonial_highlights ADD CONSTRAINT valid_highlight_type
CHECK (highlight_type IN (
    'general',
    'problem',
    'solution',
    'results',
    'impact',
    'experience',
    'team',
    'customer_experience',
    'team_collaboration',
    'story_video'  -- Added for story video highlights
));
