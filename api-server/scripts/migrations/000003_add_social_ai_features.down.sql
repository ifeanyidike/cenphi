-- Rollback: Remove AI and multi-testimonial features from social_posts table
-- Migration: 000003_add_social_ai_features.down.sql

-- Drop the index first
DROP INDEX IF EXISTS idx_social_posts_ai_best_time;

-- Remove the new columns
ALTER TABLE social_posts
DROP COLUMN IF EXISTS testimonial_ids,
DROP COLUMN IF EXISTS ai_best_time,
DROP COLUMN IF EXISTS ai_best_time_score;