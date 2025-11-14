import { HighlightMoment, HighlightType } from "@/types/ai-service";
import {
  TestimonialArtifact,
  Testimonial,
  TestimonialHighlightRecord,
} from "@/types/testimonial";

/**
 * Moment Helpers - Utilities for parsing and managing highlight moments
 */

/**
 * Parse highlight moments from new testimonial_highlights table records
 *
 * @param highlights - Array of TestimonialHighlightRecord from testimonial_highlights table
 * @param filterType - Optional filter by specific highlight type
 * @returns Array of HighlightMoment objects
 */
export function parseMomentsFromHighlights(
  highlights: TestimonialHighlightRecord[],
  filterType?: HighlightType | "highlight"
): HighlightMoment[] {
  const moments: HighlightMoment[] = [];

  // Normalize filter type
  const normalizedFilterType =
    filterType === "highlight" ? "general" : filterType;

  for (const highlightRecord of highlights) {
    // Skip if filtering by type and this record doesn't match
    if (normalizedFilterType && highlightRecord.highlight_type !== normalizedFilterType) {
      continue;
    }

    // Parse moments from the JSONB moments array
    if (Array.isArray(highlightRecord.moments)) {
      for (const moment of highlightRecord.moments) {
        const startTime = moment.start_time || 0;
        const endTime = moment.end_time || 0;
        const duration = endTime - startTime;

        moments.push({
          id: moment.id || `${highlightRecord.id}-${moments.length}`,
          testimonial_id: highlightRecord.testimonial_id,
          type: (highlightRecord.highlight_type as HighlightType) || "general",
          start_time: startTime,
          end_time: endTime,
          duration,
          text: moment.text || "",
          theme: moment.theme,
          importance_score: moment.importance_score,
          engagement_score: moment.engagement_score || 0.5,
          keywords: moment.keywords || [],
          thumbnail_url: moment.thumbnail_url,
        });
      }
    }
  }

  return moments;
}

/**
 * Parse highlight moments from testimonial artifacts
 *
 * @param artifacts - Array of testimonial artifacts
 * @param filterType - Optional filter by specific highlight type
 * @returns Array of HighlightMoment objects
 */
export function parseMomentsFromArtifacts(
  artifacts: TestimonialArtifact[],
  filterType?: HighlightType | "highlight"
): HighlightMoment[] {
  const moments: HighlightMoment[] = [];

  const highlightArtifacts = artifacts.filter(
    (a) => a.processing_type === "highlight_extraction"
  );

  for (const artifact of highlightArtifacts) {
    const data = artifact.data;

    // Two possible formats:
    // 1. New format: {highlight_type: "solution", highlights: [...]}
    // 2. Old format: {highlights: [...]} with no highlight_type (defaults to "general")
    // 3. Legacy format: {general: [...], solution: [...], etc.}

    // Check for new/old format with highlights array
    if (data.highlights && Array.isArray(data.highlights)) {
      // Determine highlight type from parent level only
      // If highlight_type exists, use it (normalize "highlight" to "general")
      // If it doesn't exist, default to "general"
      const rawType = data.highlight_type || "general";

      // Normalize 'highlight' to 'general'
      const highlightType: HighlightType =
        rawType === "highlight" ? "general" : rawType;

      // If filterType specified, skip this entire artifact if type doesn't match
      if (filterType) {
        const normalizedFilterType =
          filterType === "highlight" ? "general" : filterType;
        if (highlightType !== normalizedFilterType) continue;
      }

      for (const highlight of data.highlights) {
        const startTime = highlight.start_time || 0;
        const endTime = highlight.end_time || 0;
        const duration = endTime - startTime;

        // Skip invalid moments
        if (duration <= 0) continue;

        moments.push({
          id:
            highlight.id ||
            `${artifact.testimonial_id}-${highlightType}-${startTime}`,
          testimonial_id: artifact.testimonial_id,
          type: highlightType,
          start_time: startTime,
          end_time: endTime,
          duration: duration,
          text: highlight.text || "",
          theme: highlight.theme || highlight.title || "",
          importance_score: highlight.importance_score,
          engagement_score: highlight.engagement_score || 0,
          keywords: highlight.keywords || [],
          thumbnail_url: highlight.thumbnail_url,
        });
      }
    } else {
      // Legacy format: {general: [...], solution: [...], etc.}
      const highlightMappings: Array<{
        key: string;
        type: HighlightType | "highlight";
      }> = [
        { key: "highlights", type: "highlight" },
        { key: "general", type: "general" },
        { key: "emotional", type: "emotional" },
        { key: "thematic", type: "thematic" },
        { key: "before_after", type: "before_after" },
        { key: "recommendation", type: "recommendation" },
        { key: "metrics", type: "metrics" },
        { key: "results", type: "results" },
        { key: "solution", type: "solution" },
        { key: "problem", type: "problem" },
      ];

      for (const { key, type } of highlightMappings) {
        // If filterType specified, skip non-matching types
        if (filterType && type !== filterType) continue;

        const highlightsArray = data[key];
        if (Array.isArray(highlightsArray)) {
          for (const highlight of highlightsArray) {
            const startTime = highlight.start_time || 0;
            const endTime = highlight.end_time || 0;
            const duration = endTime - startTime;

            // Skip invalid moments
            if (duration <= 0) continue;

            moments.push({
              id:
                highlight.id ||
                `${artifact.testimonial_id}-${type}-${startTime}`,
              testimonial_id: artifact.testimonial_id,
              type: type,
              start_time: startTime,
              end_time: endTime,
              duration: duration,
              text: highlight.text || "",
              theme: highlight.theme || highlight.title || "",
              importance_score: highlight.importance_score,
              engagement_score: highlight.engagement_score || 0,
              keywords: highlight.keywords || [],
              thumbnail_url: highlight.thumbnail_url,
            });
          }
        }
      }
    }
  }

  return moments;
}

/**
 * Filter moments by engagement threshold
 *
 * @param moments - Array of moments
 * @param threshold - Minimum engagement score (default 0.7)
 * @returns Filtered array of moments
 */
export function filterHighEngagementMoments(
  moments: HighlightMoment[],
  threshold: number = 0.7
): HighlightMoment[] {
  return moments.filter((m) => m.engagement_score >= threshold);
}

/**
 * Filter moments by type (general or highlight)
 *
 * @param moments - Array of moments
 * @returns Filtered array of moments
 */
export function filterGeneralOrHighlightMoments(
  moments: HighlightMoment[]
): HighlightMoment[] {
  return moments.filter((m) => m.type === "general" || m.type === "highlight");
}

/**
 * Sort moments by engagement score (descending)
 *
 * @param moments - Array of moments
 * @returns Sorted array of moments
 */
export function sortByEngagement(
  moments: HighlightMoment[]
): HighlightMoment[] {
  return [...moments].sort((a, b) => b.engagement_score - a.engagement_score);
}

/**
 * Sort moments by chronological order (start_time ascending)
 *
 * @param moments - Array of moments
 * @returns Sorted array of moments
 */
export function sortByChronological(
  moments: HighlightMoment[]
): HighlightMoment[] {
  return [...moments].sort((a, b) => a.start_time - b.start_time);
}

/**
 * Calculate total duration of moments
 *
 * @param moments - Array of moments
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(moments: HighlightMoment[]): number {
  return moments.reduce(
    (sum, m) => sum + (m.duration || m.end_time - m.start_time || 0),
    0
  );
}

/**
 * Calculate average engagement score
 *
 * @param moments - Array of moments
 * @returns Average engagement score (0-1)
 */
export function calculateAverageEngagement(moments: HighlightMoment[]): number {
  if (moments.length === 0) return 0;
  return (
    moments.reduce((sum, m) => sum + m.engagement_score, 0) / moments.length
  );
}

/**
 * Extract best moments for story video generation
 * For BEST_STORY_MOMENTS context only
 *
 * Filters by:
 * - engagement_score >= 0.7
 * - type === 'general' OR 'highlight'
 * - Selects top testimonials by composite score
 *
 * @param testimonials - Array of testimonials with artifacts
 * @param maxTestimonials - Maximum number of testimonials to include (default 4)
 * @param maxMomentsPerTestimonial - Maximum moments per testimonial (default unlimited)
 * @returns Array of testimonials with their best moments
 */
export function extractBestMomentsFromTestimonials(
  testimonials: Testimonial[],
  maxTestimonials: number = 4,
  maxMomentsPerTestimonial?: number
): Array<{ testimonial: Testimonial; moments: HighlightMoment[] }> {
  const testimonialsWithMoments = testimonials
    .filter((t) => t.type === "video") // Only video testimonials
    .map((testimonial) => {
      const allMoments = parseMomentsFromArtifacts(testimonial.artifacts || []);

      // Filter for best story moments criteria
      let bestMoments = allMoments.filter(
        (m) =>
          m.engagement_score >= 0.7 &&
          (m.type === "general" || m.type === "highlight")
      );

      // Sort by engagement and take top N if limit specified
      bestMoments = sortByEngagement(bestMoments);
      if (maxMomentsPerTestimonial) {
        bestMoments = bestMoments.slice(0, maxMomentsPerTestimonial);
      }

      // Calculate composite score for ranking testimonials
      const avgEngagement = calculateAverageEngagement(bestMoments);
      const compositeScore =
        avgEngagement * (testimonial.rating || 3) * testimonial.sentiment_score;

      return {
        testimonial,
        moments: bestMoments,
        compositeScore,
      };
    })
    .filter((t) => t.moments.length > 0) // Only keep testimonials with valid moments
    .sort((a, b) => b.compositeScore - a.compositeScore) // Sort by composite score
    .slice(0, maxTestimonials); // Take top N testimonials

  return testimonialsWithMoments.map((t) => ({
    testimonial: t.testimonial,
    moments: t.moments,
  }));
}

/**
 * Get moments for single testimonial story video
 * Uses ALL highlights without engagement filtering
 *
 * @param testimonial - Testimonial object
 * @param highlightType - Type of highlights to use (default 'general')
 * @returns Array of moments
 */
export function getMomentsForSingleTestimonial(
  testimonial: Testimonial,
  highlightType: HighlightType | "highlight" = "general"
): HighlightMoment[] {
  const moments = parseMomentsFromArtifacts(
    testimonial.artifacts || [],
    highlightType
  );
  return sortByChronological(moments);
}

/**
 * Get moments for multiple testimonials story video
 * Uses ALL highlights without engagement filtering
 *
 * @param testimonials - Array of testimonials
 * @param highlightType - Type of highlights to use (default 'general')
 * @returns Array of moments grouped by testimonial
 */
export function getMomentsForMultipleTestimonials(
  testimonials: Testimonial[],
  highlightType: HighlightType | "highlight" = "general"
): Array<{ testimonial: Testimonial; moments: HighlightMoment[] }> {
  return testimonials
    .filter((t) => t.type === "video")
    .map((testimonial) => ({
      testimonial,
      moments: sortByEngagement(
        parseMomentsFromArtifacts(testimonial.artifacts || [], highlightType)
      ),
    }))
    .filter((t) => t.moments.length > 0);
}

/**
 * Get moments for clipping service
 * Uses highlights of specified type without engagement filtering
 *
 * @param testimonial - Testimonial object
 * @param highlightType - Type of highlights to clip
 * @returns Array of moments
 */
export function getMomentsForClipping(
  testimonial: Testimonial,
  highlightType: HighlightType | "highlight"
): HighlightMoment[] {
  // First try to get moments from new highlights field
  const momentsFromHighlights = parseMomentsFromHighlights(
    testimonial.highlights || [],
    highlightType
  );

  // Fallback to artifacts if no moments found in highlights
  const moments =
    momentsFromHighlights.length > 0
      ? momentsFromHighlights
      : parseMomentsFromArtifacts(testimonial.artifacts || [], highlightType);

  // Sort by engagement for clipping (user likely wants best clips first)
  return sortByEngagement(moments);
}

/**
 * Convert existing clip artifacts to moments
 * Used when user selects already-generated clips
 *
 * IMPORTANT: Preserves clip metadata (storage_path, preview_url, artifact_id)
 * so backend can use existing clips instead of re-extracting
 *
 * @param clips - Array of clip artifacts
 * @returns Array of HighlightMoment objects with clip metadata
 */
export function convertClipsToMoments(clips: any[]): HighlightMoment[] {
  return clips.map((clip) => {
    // Extract timestamps - clips can have them at different levels
    const startTime = clip.start_time || clip.metadata?.start_time || 0;
    const endTime = clip.end_time || clip.metadata?.end_time || 0;
    const duration = clip.duration || clip.metadata?.duration || 0;

    // Convert to milliseconds if in seconds (< 1000 likely means seconds)
    // All HighlightMoment timestamps must be in milliseconds
    const startTimeMs = startTime < 1000 ? startTime * 1000 : startTime;
    const endTimeMs = endTime < 1000 ? endTime * 1000 : endTime;
    const durationMs = duration < 1000 ? duration * 1000 : duration;
    let theme =
      clip.theme ||
      clip.title ||
      clip.metadata?.theme ||
      clip.metadata?.title ||
      `Clip ${clip.id}`;
    theme = theme?.split("_")?.join(" ") || theme;
    theme = theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : theme;

    return {
      id: clip.id || clip.artifact_id,
      testimonial_id: clip.testimonial_id || clip.parent_testimonial_id,
      type: "general" as const,
      start_time: startTimeMs,
      end_time: endTimeMs,
      duration: durationMs,
      text: clip.text_content || clip.text || clip.metadata?.transcript || "",
      theme,
      importance_score:
        clip.importance_score || clip.metadata?.importance_score,
      engagement_score:
        clip.engagement_score || clip.metadata?.engagement_score || 0.8,
      keywords: clip.keywords || clip.metadata?.keywords || [],
      thumbnail_url: clip.thumbnail_url || clip.metadata?.thumbnail_url,
      clip_artifact_id: clip.id || clip.artifact_id,
      storage_path:
        clip.storage_url || clip.url || clip.storage_path || clip.media_url,
      preview_url: clip.preview_url,
    };
  });
}

/**
 * Format duration in MM:SS format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if testimonial has highlights of specified type
 *
 * @param testimonial - Testimonial object
 * @param highlightType - Type to check for
 * @returns True if highlights exist
 */
export function hasHighlightsOfType(
  testimonial: Testimonial,
  highlightType: HighlightType | "highlight"
): boolean {
  const moments = parseMomentsFromArtifacts(
    testimonial.artifacts || [],
    highlightType
  );
  return moments.length > 0;
}

/**
 * Get available highlight types for testimonial
 *
 * @param testimonial - Testimonial object
 * @returns Array of available highlight types
 */
export function getAvailableHighlightTypes(
  testimonial: Testimonial
): Array<HighlightType | "highlight"> {
  const types = new Set<HighlightType | "highlight">();

  const highlightArtifacts = (testimonial.artifacts || []).filter(
    (a) => a.processing_type === "highlight_extraction"
  );

  for (const artifact of highlightArtifacts) {
    const data = artifact.data;

    // Check for highlights array
    if (
      data.highlights &&
      Array.isArray(data.highlights) &&
      data.highlights.length > 0
    ) {
      // Check parent-level highlight_type only
      // If it exists, use it (normalize "highlight" to "general")
      // If it doesn't exist, default to "general"
      if (data.highlight_type) {
        const type =
          data.highlight_type === "highlight" ? "general" : data.highlight_type;
        types.add(type);
      } else {
        // No highlight_type means it's general/highlight
        types.add("general");
      }
    }

    // Legacy format: check for type-specific keys
    const legacyKeys = [
      "general",
      "emotional",
      "thematic",
      "before_after",
      "recommendation",
      "metrics",
      "results",
      "solution",
      "problem",
    ];
    for (const key of legacyKeys) {
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        types.add(key as HighlightType);
      }
    }
  }

  return Array.from(types);
}
