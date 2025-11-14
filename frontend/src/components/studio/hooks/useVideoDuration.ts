import { useState, useEffect, useMemo } from "react";
import { studioAPI } from "@/services/studioAPI";
import { ContextType } from "../utils/brollHelpers";

export interface Clip {
  start_time: number;
  end_time: number;
  [key: string]: any;
}

export interface Moment {
  duration: number;
  [key: string]: any;
}

export interface UseVideoDurationOptions {
  testimonialId?: string;
  contextType: ContextType;
  clips?: Clip[]; // For single clip or multi-clip scenarios
  moments?: Moment[]; // For best-moments or story videos
}

/**
 * Enhanced hook to calculate video duration from multiple sources:
 * 1. clips array - calculates sum of (end_time - start_time) for each clip
 * 2. moments array - calculates sum of moment.duration
 * 3. API (lazy-loaded) - fetches full testimonial duration from transcript_segments
 * 4. Fallback defaults based on context type
 *
 * Priority order: clips → moments → API → defaults
 */
export function useVideoDuration(
  testimonialId: string | undefined,
  contextType: ContextType,
  clips?: Clip[],
  moments?: Moment[]
): {
  duration: number;
  isLoading: boolean;
  error: Error | null;
  hasSegments: boolean;
  source: "clips" | "moments" | "api" | "default";
} {
  // Calculate duration from clips if provided
  // NOTE: Clip times are in milliseconds, but we need to return seconds
  const clipsDuration = useMemo(() => {
    if (!clips || clips.length === 0) return null;

    const totalMs = clips.reduce((sum, clip) => {
      const clipDuration = clip.end_time - clip.start_time;
      return sum + clipDuration;
    }, 0);

    // Convert from milliseconds to seconds
    return totalMs / 1000;
  }, [clips]);

  // Calculate duration from moments if provided
  // NOTE: Moment durations are in milliseconds, but we need to return seconds
  const momentsDuration = useMemo(() => {
    if (!moments || moments.length === 0) return null;

    const totalMs = moments.reduce((sum, moment) => sum + (moment.duration || moment.end_time - moment.start_time || 0), 0);

    // Convert from milliseconds to seconds
    return totalMs / 1000;
  }, [moments]);

  // State for API-fetched duration
  const [apiDuration, setApiDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSegments, setHasSegments] = useState(false);

  // Fetch from API only if clips and moments are not provided
  useEffect(() => {
    // Skip API call if we have clips or moments
    if (clipsDuration !== null || momentsDuration !== null) {
      return;
    }

    if (!testimonialId) {
      return;
    }

    const fetchDuration = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await studioAPI.getTestimonialDuration(testimonialId);
        setApiDuration(response.duration);
        setHasSegments(response.has_segments);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setApiDuration(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDuration();
  }, [testimonialId, clipsDuration, momentsDuration]);

  // Determine final duration and source
  const { duration, source } = useMemo(() => {
    // Priority 1: clips
    if (clipsDuration !== null) {
      return { duration: clipsDuration, source: "clips" as const };
    }

    // Priority 2: moments
    if (momentsDuration !== null) {
      return { duration: momentsDuration, source: "moments" as const };
    }

    // Priority 3: API
    if (apiDuration !== null) {
      return { duration: apiDuration, source: "api" as const };
    }

    // Priority 4: default fallback
    const defaultDuration =
      contextType === "clip"
        ? 30
        : contextType === "multi-testimonial" || contextType === "best-moments"
        ? 90
        : 60;

    return { duration: defaultDuration, source: "default" as const };
  }, [clipsDuration, momentsDuration, apiDuration, contextType]);

  return { duration, isLoading, error, hasSegments, source };
}
