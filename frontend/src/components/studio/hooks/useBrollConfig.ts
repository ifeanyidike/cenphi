import { useState, useCallback } from "react";
import { workspaceHub } from "@/repo/workspace_hub";
import { AIBrollSuggestionResponse } from "@/services/studioAPI";

export interface BrollClip {
  url: string;
  name: string;
  thumbnail?: string;
  duration?: number;
  pexels_id?: number;
  start_time?: number;
  media_type?: "video" | "image";
}

export interface BrollConfig {
  placement_strategy: "auto" | "beginning" | "end" | "custom";
  max_broll_duration: number;
  transition_type: "fade" | "dissolve" | "cut";
  broll_clips: BrollClip[];
}

export interface UseBrollConfigOptions {
  contextType: "testimonial" | "clip" | "selected-clips" | "custom";
  testimonialId?: string;
}

export function useBrollConfig(options: UseBrollConfigOptions) {
  const { contextType, testimonialId } = options;

  const [brollConfig, setBrollConfig] = useState<BrollConfig>({
    placement_strategy: "custom",
    max_broll_duration: 10.0,
    transition_type: "fade",
    broll_clips: [],
  });

  const [showStockLibrary, setShowStockLibrary] = useState(false);
  const [showAIBrollSuggestion, setShowAIBrollSuggestion] = useState(false);
  const [brollWarningAcknowledged, setBrollWarningAcknowledged] = useState(false);
  const [transcriptMissingAcknowledged, setTranscriptMissingAcknowledged] = useState(false);

  // Cache AI suggestions to avoid repeated requests
  const [cachedAISuggestions, setCachedAISuggestions] = useState<{
    testimonialId: string;
    suggestions: AIBrollSuggestionResponse;
    timestamp: number;
  } | null>(null);

  // Helper: Get video duration from testimonial
  const getVideoDuration = useCallback(
    (testId?: string): number => {
      const id = testId || testimonialId;

      if (!id) {
        console.log("[Duration] No testimonialId provided, using default: 30s");
        return 30;
      }

      const testimonial = workspaceHub.testimonialManager.testimonials?.find(
        (t) => t.id === id
      );

      if (!testimonial) {
        console.log("[Duration] Testimonial not found, using default: 30s");
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
          console.log(
            `[Duration] ✓ Calculated from transcript_segments: ${lastSegment.end_time.toFixed(1)}s`
          );
          return lastSegment.end_time;
        }
      }

      // Warn if transcript_segments are missing
      console.warn(
        "[Duration] ⚠️ transcript_segments not available for testimonial:",
        id
      );
      console.warn(
        "[Duration] Using fallback duration - B-roll placement may be inaccurate"
      );

      // Fallback to default based on context type
      if (contextType === "clip") {
        return 30;
      }

      return 60; // Default for full testimonial
    },
    [testimonialId, contextType]
  );

  // Validate transcript_segments availability
  const validateTranscriptSegments = useCallback((): {
    isValid: boolean;
    errorMessage?: string;
  } => {
    if (!testimonialId || brollConfig.placement_strategy !== "custom" || transcriptMissingAcknowledged) {
      return { isValid: true };
    }

    const testimonial = workspaceHub.testimonialManager.testimonials?.find(
      (t) => t.id === testimonialId
    );

    if (
      !testimonial?.transcript_segments ||
      testimonial.transcript_segments.length === 0
    ) {
      console.warn(
        "[Validation] transcript_segments missing - B-roll placement may be inaccurate"
      );

      return {
        isValid: false,
        errorMessage:
          "⚠️ Transcript segments not available\n\n" +
          "We couldn't find accurate timing data for your video. B-roll clips will be distributed evenly, " +
          "but placement may not be optimal.\n\n" +
          "To improve accuracy, ensure your video has been fully transcribed before adding B-roll.\n\n" +
          "Click 'Start Processing' again to continue anyway.",
      };
    }

    return { isValid: true };
  }, [testimonialId, brollConfig.placement_strategy, transcriptMissingAcknowledged]);

  return {
    // State
    brollConfig,
    setBrollConfig,
    showStockLibrary,
    setShowStockLibrary,
    showAIBrollSuggestion,
    setShowAIBrollSuggestion,
    brollWarningAcknowledged,
    setBrollWarningAcknowledged,
    transcriptMissingAcknowledged,
    setTranscriptMissingAcknowledged,
    cachedAISuggestions,
    setCachedAISuggestions,

    // Methods
    getVideoDuration,
    validateTranscriptSegments,
  };
}
