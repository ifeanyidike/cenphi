-- Add AI and multi-testimonial features to social_posts table
-- Migration: 000003_add_social_ai_features.up.sql

-- Add new columns for AI best time suggestions and multi-testimonial support
ALTER TABLE social_posts
ADD COLUMN testimonial_ids JSONB NULL,
ADD COLUMN ai_best_time TIMESTAMPTZ NULL,
ADD COLUMN ai_best_time_score NUMERIC NULL;

-- Create index on ai_best_time for scheduling queries
CREATE INDEX idx_social_posts_ai_best_time ON social_posts(ai_best_time) WHERE ai_best_time IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN social_posts.testimonial_ids IS 'Array of testimonial UUIDs for multi-testimonial posts stored as JSONB';
COMMENT ON COLUMN social_posts.ai_best_time IS 'AI-suggested optimal posting time in UTC';
COMMENT ON COLUMN social_posts.ai_best_time_score IS 'Confidence score (0-1) for the AI suggestion';