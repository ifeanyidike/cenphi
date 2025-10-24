-- Document result_category patterns for testimonial_artifacts
-- This migration adds documentation comments about expected result_category values

-- The unique constraint (testimonial_id, processing_type, result_category) works as follows:
--
-- Services that CANNOT be duplicated (fixed result_category):
--   - clipping: result_category = 'content'
--   - sentiment_analysis: result_category = 'analysis'
--
-- Services that CAN be duplicated (dynamic result_category):
--   - highlight_extraction: result_category = <highlight_type> ('emotional', 'problem', 'solution', 'general', etc.)
--   - video_platform_optimization: result_category = 'content_<timestamp>'
--   - custom_pipeline: result_category = 'content_<timestamp>'
--   - story_mode_generation: result_category = 'story_<timestamp>' (usually has NULL testimonial_id)
--
-- This design allows:
--   ✅ Multiple highlight types per testimonial
--   ✅ Multiple video optimizations per testimonial
--   ✅ Multiple custom pipelines per testimonial
--   ❌ Duplicate sentiment analysis (prevented by constraint)
--   ❌ Duplicate clipping (prevented by constraint)

-- Add comment to the constraint for documentation
COMMENT ON CONSTRAINT testimonial_artifacts_unique_processing ON testimonial_artifacts IS
'Prevents duplicate artifacts while allowing multiple variants through dynamic result_category values. See migration 000012 for patterns.';
