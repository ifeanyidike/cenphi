import { workspaceHub } from "@/repo/workspace_hub";

export type ContextType =
  | "testimonial"
  | "clip"
  | "selected-clips"
  | "custom"
  | "default"
  | "multi-testimonial"
  | "best-moments";

/**
 * Get accurate video duration from testimonial's transcript_segments
 * Falls back to sensible defaults if segments are unavailable
 */
export interface TimeRange {
  start_time: number;
  end_time: number;
}

/**
 * Extract transcript text for specific time ranges from transcript_segments
 * Used for clips, moments, or any time-bounded content
 */
export function getTranscriptForTimeRanges(
  testimonialId: string | undefined,
  timeRanges: TimeRange[]
): string {
  if (!testimonialId || timeRanges.length === 0) {
    return "";
  }

  const testimonial = workspaceHub.testimonialManager.testimonials?.find(
    (t) => t.id === testimonialId
  );

  if (!testimonial?.transcript_segments || testimonial.transcript_segments.length === 0) {
    // Fallback to full content if transcript_segments not available
    return testimonial?.content || "";
  }

  // Filter and concatenate transcript segments within the time ranges
  const filteredText = timeRanges
    .map((range) => {
      const segments = testimonial.transcript_segments.filter(
        (segment: any) =>
          segment.start_time >= range.start_time &&
          segment.end_time <= range.end_time
      );
      return segments.map((seg: any) => seg.text).join(" ");
    })
    .join(" ");

  return filteredText || testimonial?.content || "";
}

export function getVideoDuration(
  testimonialId: string | undefined,
  contextType: ContextType
): number {
  if (!testimonialId) {
    return 30;
  }

  const testimonial = workspaceHub.testimonialManager.testimonials?.find(
    (t) => t.id === testimonialId
  );

  if (!testimonial) {
    return 30;
  }

  // Try to get duration from transcript_segments (most accurate)
  if (
    testimonial.transcript_segments &&
    testimonial.transcript_segments.length > 0
  ) {
    const lastSegment =
      testimonial.transcript_segments[
        testimonial.transcript_segments.length - 1
      ];
    if (lastSegment?.end_time) {
      return lastSegment.end_time;
    }
  }

  // Fallback to default based on context type
  if (contextType === "clip") {
    return 30;
  }

  if (contextType === "multi-testimonial" || contextType === "best-moments") {
    return 90; // Longer default for multi-testimonial story videos
  }

  return 60; // Default for full testimonial
}
