import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Sparkles,
  Check,
  Image as ImageIcon,
  Music,
  Clock,
  Zap,
  FileVideo,
  Loader2,
  AlertCircle,
  Heart,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudioContext } from "@/pages/Studio";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { backgroundMusicOptions } from "@/components/studio/constants";
import {
  HighlightMoment,
  TestimonialWithMoments,
  HighlightType,
} from "@/types/ai-service";
import { cn } from "@/lib/utils";
import MomentSelectionStep from "./MomentSelectionStep";
import AIOrderingStep from "./AIOrderingStep";
import HighlightTypeSelectionStep from "./HighlightTypeSelectionStep";
import * as momentHelpers from "@/utils/momentHelpers";
import { observer } from "mobx-react-lite";
import { AlertDialog } from "@/components/ui/ConfirmDialog";
import BrollConfigSection, {
  BrollConfig,
  BrollCache,
} from "./BrollConfigSection";
import { validateBrollConfig } from "./utils/brollValidation";

interface StoryVideoConfigProps {
  context: StudioContext;
  onBack: () => void;
  onStartProcessing: (jobId: string, autoProceed?: boolean) => void;
}

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

type ConfigStep =
  | "loading"
  | "insufficient-highlights-fallback"
  | "loading-fallback-highlights"
  | "select-highlight-type"
  | "select-moments"
  | "order-moments"
  | "configure-options";

interface HighlightTypeOption {
  id: HighlightType | "highlight";
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const HIGHLIGHT_TYPES: HighlightTypeOption[] = [
  {
    id: "general",
    name: "General Highlights",
    description: "Most engaging overall moments",
    icon: <Sparkles className="h-4 w-4" />,
    color: "blue",
  },
  {
    id: "emotional",
    name: "Emotional Peaks",
    description: "Genuine excitement, relief, satisfaction",
    icon: <Heart className="h-4 w-4" />,
    color: "pink",
  },
  {
    id: "problem",
    name: "Problem Highlights",
    description: "Pain points and challenges",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "orange",
  },
  {
    id: "solution",
    name: "Solution Highlights",
    description: "How they chose your solution",
    icon: <Zap className="h-4 w-4" />,
    color: "emerald",
  },
  {
    id: "results",
    name: "Results & Outcomes",
    description: "Specific achievements",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "purple",
  },
  {
    id: "metrics",
    name: "Metrics & Numbers",
    description: "ROI, percentages, data points",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "blue",
  },
  {
    id: "recommendation",
    name: "Recommendations",
    description: "Direct endorsements",
    icon: <Check className="h-4 w-4" />,
    color: "emerald",
  },
  {
    id: "before_after",
    name: "Before & After",
    description: "Transformation stories",
    icon: <Clock className="h-4 w-4" />,
    color: "purple",
  },
];

const StoryVideoConfig: React.FC<StoryVideoConfigProps> = ({
  context,
  onBack,
  onStartProcessing,
}) => {
  // Multi-step workflow state
  const [currentStep, setCurrentStep] = useState<ConfigStep>("loading");
  const [testimonialsWithMoments, setTestimonialsWithMoments] = useState<
    TestimonialWithMoments[]
  >([]);
  const [selectedMoments, setSelectedMoments] = useState<HighlightMoment[]>([]);
  const [orderedMoments, setOrderedMoments] = useState<HighlightMoment[]>([]);

  // Cache the full testimonial object to avoid redundant API calls
  // Cache is cleared when component unmounts (new session)
  const [cachedTestimonial, setCachedTestimonial] = useState<any | null>(null);
  const [cachedTestimonialId, setCachedTestimonialId] = useState<string | null>(
    null
  );

  // Configuration state
  // Note: targetDuration is calculated from totalDuration, not set by user
  const [addIntro, setAddIntro] = useState<boolean>(true);
  const [addOutro, setAddOutro] = useState<boolean>(true);
  const [introText, setIntroText] = useState<string>("");
  const [outroText, setOutroText] = useState<string>("");
  const [autoProceed, setAutoProceed] = useState<boolean>(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "assemble_clips",
      name: "Assemble Clips",
      description: "Combine moments into draft video",
      icon: <FileVideo className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "add_intro_outro",
      name: "Add Intro/Outro",
      description: "Bookend video with branding",
      icon: <FileVideo className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "apply_broll",
      name: "B-roll Overlay",
      description: "Insert B-roll footage",
      icon: <ImageIcon className="h-4 w-4" />,
      enabled: false,
    },
    {
      id: "apply_branding",
      name: "Apply Branding",
      description: "Add logo/watermark",
      icon: <ImageIcon className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "noise_removal",
      name: "Noise Removal",
      description: "Clean background noise",
      icon: <Music className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "mix_music",
      name: "Add Music",
      description: "Background music track",
      icon: <Music className="h-4 w-4" />,
      enabled: false,
    },
    {
      id: "enhance",
      name: "Enhance & Encode",
      description: "Final enhancement and encoding",
      icon: <Zap className="h-4 w-4" />,
      enabled: true,
    },
  ]);

  const [isStarting, setIsStarting] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  // const [selectedHighlightType, setSelectedHighlightType] = useState<string>('highlight');
  const [fallbackHighlightType, setFallbackHighlightType] = useState<
    HighlightType | "highlight" | null
  >(null);

  // Music configuration
  const [musicConfig, setMusicConfig] = useState({
    background_music: "corporate",
    music_volume: "low" as "low" | "medium" | "high",
    custom_music_url: "",
  });

  // Branding configuration
  const [brandingConfig, setBrandingConfig] = useState({
    logo_url: "",
    watermark_text: "",
    logo_position: "top-right" as
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right",
    watermark_position: "bottom-right" as
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center",
  });

  // B-roll configuration
  const [brollConfig, setBrollConfig] = useState<BrollConfig>({
    placement_strategy: "auto",
    max_broll_duration: 10.0,
    transition_type: "fade",
    broll_clips: [],
  });

  const [brollWarningAcknowledged, setBrollWarningAcknowledged] =
    useState(false);
  const [transcriptMissingAcknowledged, setTranscriptMissingAcknowledged] =
    useState(false);

  // Cache AI suggestions to avoid repeated requests
  const [cachedAISuggestions, setCachedAISuggestions] =
    useState<BrollCache | null>(null);

  // Load brand context defaults
  useEffect(() => {
    const brandContext = workspaceHub.workspace?.brand_context;
    const workspace = workspaceHub.workspace;
    const companyName = brandContext?.company_name || workspace?.name || "us";

    // Set default intro/outro text with company name
    setIntroText(
      `Welcome. Thank you for choosing ${companyName}. Here's what our customers have to say.`
    );
    setOutroText(`Thank you for choosing ${companyName}.`);

    if (brandContext?.logo_url) {
      setBrandingConfig((prev) => ({
        ...prev,
        logo_url: brandContext.logo_url || "",
        watermark_text: companyName,
      }));
    }
  }, []);

  // Guard to prevent duplicate calls (React.StrictMode runs useEffect twice in dev)
  const hasLoadedRef = useRef(false);

  // Load testimonials and extract moments based on context
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadTestimonialsAndMoments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const loadTestimonialsAndMoments = async () => {
    try {
      setCurrentStep("loading");
      setLoadError(null);

      let testimonialsData: TestimonialWithMoments[] = [];

      if (context.type === "testimonial") {
        try {
          // Fetch testimonial for validation
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              context.testimonialId,
              false
            );

          // Validate testimonial exists
          if (!testimonial) {
            setLoadError(
              "The selected testimonial could not be found. It may have been deleted or moved to another workspace."
            );
            return;
          }

          // Validate testimonial is video type
          if (testimonial.type !== "video") {
            console.error(
              "[StoryVideoConfig] Testimonial is not video type:",
              testimonial.type
            );
            setLoadError(
              "Story videos can only be created from video testimonials. This is a text testimonial."
            );
            return;
          }

          // Cache the testimonial
          setCachedTestimonial(testimonial);
          setCachedTestimonialId(testimonial.id);

          const response = await studioAPI.getStoryVideoHighlights([
            context.testimonialId,
          ]);

          if (response.testimonials && response.testimonials.length > 0) {
            const testimonialHighlights = response.testimonials[0];
            const storyVideoMoments = testimonialHighlights.highlights;

            // Check if insufficient highlights (≤1)
            if (storyVideoMoments.length <= 1) {
              setLoadError(
                `Only ${storyVideoMoments.length} story video highlight${storyVideoMoments.length === 1 ? "" : "s"} found. Story video requires at least 2 highlights to create a compelling narrative.`
              );
              setCurrentStep("insufficient-highlights-fallback");
              return;
            }

            testimonialsData = [
              {
                id: testimonial.id,
                author_name: testimonial.author_name,
                author_company: testimonial.author_company,
                media_url: testimonial.media_url || "",
                rating: testimonial.rating,
                sentiment_score: testimonial.sentiment_score,
                moments: storyVideoMoments,
              },
            ];
          }
        } catch (apiError) {
          console.error(
            "[StoryVideoConfig] Failed to load story_video highlights:",
            apiError
          );
          setLoadError(
            `Failed to load story video highlights: ${apiError instanceof Error ? apiError.message : "Please try again."}`
          );
          return;
        }
      } else if (context.type === "multi-testimonial") {
        // Multiple testimonials - fetch story_video highlights via API

        try {
          // Fetch testimonials for metadata and validation
          const testimonials = await Promise.all(
            context.testimonialIds.map((id) =>
              workspaceHub.testimonialManager.fetchTestimonial(id, false)
            )
          );

          // Validate all testimonials are video type
          const nonVideoTestimonials = testimonials.filter(
            (t) => t.type !== "video"
          );
          if (nonVideoTestimonials.length > 0) {
            const nonVideoIds = nonVideoTestimonials
              .map((t) => t.id)
              .join(", ");
            console.error(
              "[StoryVideoConfig] Non-video testimonials found:",
              nonVideoIds
            );
            setLoadError(
              `Story videos can only be created from video testimonials. Found ${nonVideoTestimonials.length} text testimonial(s). Please remove them and try again.`
            );
            return;
          }

          // Fetch story_video highlights via API
          const response = await studioAPI.getStoryVideoHighlights(
            context.testimonialIds
          );

          // Map API response to testimonialsData format
          testimonialsData = response.testimonials
            .map((highlightData) => {
              const testimonial = testimonials.find(
                (t) => t.id === highlightData.testimonial_id
              );
              if (!testimonial) {
                console.warn(
                  `[StoryVideoConfig] Testimonial ${highlightData.testimonial_id} not found in fetched data`
                );
                return null;
              }

              return {
                id: testimonial.id,
                author_name: testimonial.author_name,
                author_company: testimonial.author_company,
                media_url: testimonial.media_url || "",
                rating: testimonial.rating,
                sentiment_score: testimonial.sentiment_score,
                moments: highlightData.highlights,
              };
            })
            .filter(Boolean) as TestimonialWithMoments[];
        } catch {
          // Fallback to local extraction if API fails
          const testimonials = await Promise.all(
            context.testimonialIds.map((id) =>
              workspaceHub.testimonialManager.fetchTestimonial(id, false)
            )
          );

          const testimonialsResult =
            momentHelpers.getMomentsForMultipleTestimonials(testimonials);
          testimonialsData = testimonialsResult.map((t) => ({
            id: t.testimonial.id,
            author_name: t.testimonial.author_name,
            author_company: t.testimonial.author_company,
            media_url: t.testimonial.media_url || "",
            rating: t.testimonial.rating,
            sentiment_score: t.testimonial.sentiment_score,
            moments: t.moments,
          }));
        }
      } else if (context.type === "best-moments") {
        // Best moments - fetch story_video highlights via API
        console.log(
          "[StoryVideoConfig] Fetching story_video highlights via API for best moments:",
          context.testimonialIds
        );

        try {
          if (!context.testimonialIds || context.testimonialIds.length === 0) {
            // No IDs provided - cannot proceed
            setLoadError(
              "No testimonial IDs provided for best moments. Please select testimonials first."
            );
            return;
          }

          // Fetch testimonials for metadata
          const testimonials = await Promise.all(
            context.testimonialIds.map((id) =>
              workspaceHub.testimonialManager.fetchTestimonial(id, false)
            )
          );

          // Fetch story_video highlights via API
          const response = await studioAPI.getStoryVideoHighlights(
            context.testimonialIds
          );

          // Map API response to testimonialsData format
          testimonialsData = response.testimonials
            .map((highlightData) => {
              const testimonial = testimonials.find(
                (t) => t.id === highlightData.testimonial_id
              );
              if (!testimonial) {
                console.warn(
                  `[StoryVideoConfig] Testimonial ${highlightData.testimonial_id} not found in fetched data`
                );
                return null;
              }

              return {
                id: testimonial.id,
                author_name: testimonial.author_name,
                author_company: testimonial.author_company,
                media_url: testimonial.media_url || "",
                rating: testimonial.rating,
                sentiment_score: testimonial.sentiment_score,
                moments: highlightData.highlights,
              };
            })
            .filter(Boolean) as TestimonialWithMoments[];
        } catch (apiError) {
          console.error(
            "[StoryVideoConfig] API call failed for best-moments, falling back to local extraction:",
            apiError
          );

          // Fallback to local extraction if API fails
          const allTestimonials =
            workspaceHub.testimonialManager.testimonials || [];

          if (!context.testimonialIds || context.testimonialIds.length === 0) {
            // No IDs provided - run extraction ourselves
            const best = momentHelpers.extractBestMomentsFromTestimonials(
              allTestimonials,
              4, // max 4 testimonials
              undefined // no limit per testimonial
            );

            testimonialsData = best.map((t) => ({
              id: t.testimonial.id,
              author_name: t.testimonial.author_name,
              author_company: t.testimonial.author_company,
              media_url: t.testimonial.media_url || "",
              rating: t.testimonial.rating,
              sentiment_score: t.testimonial.sentiment_score,
              moments: t.moments,
            }));
          } else {
            // IDs provided - they're already filtered and ranked by BestMomentsStoryGenerator
            const testimonials = await Promise.all(
              context.testimonialIds.map((id) =>
                workspaceHub.testimonialManager.fetchTestimonial(id, false)
              )
            );

            // Extract moments using the same criteria for consistency
            const best = momentHelpers.extractBestMomentsFromTestimonials(
              testimonials,
              testimonials.length, // Keep all testimonials (already ranked)
              undefined
            );

            testimonialsData = best.map((t) => ({
              id: t.testimonial.id,
              author_name: t.testimonial.author_name,
              author_company: t.testimonial.author_company,
              media_url: t.testimonial.media_url || "",
              rating: t.testimonial.rating,
              sentiment_score: t.testimonial.sentiment_score,
              moments: t.moments,
            }));
          }
        }
      } else if (context.type === "selected-clips") {
        console.log(
          "[StoryVideoConfig] Loading selected clips:",
          context.clipIds
        );

        try {
          // Fetch testimonial WITH artifacts to get clips from processing_type='clipping'
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              context.testimonialId,
              false // INCLUDE artifacts - clips are stored there
            );

          // Validate testimonial is video type
          if (testimonial.type !== "video") {
            console.error(
              "[StoryVideoConfig] Testimonial is not video type:",
              testimonial.type
            );
            setLoadError(
              "Story videos can only be created from video testimonials. This is a text testimonial."
            );
            return;
          }

          // Find clipping artifacts
          const clippingArtifacts =
            testimonial.artifacts?.filter(
              (a: any) => a.processing_type === "clipping"
            ) || [];

          // Extract all clips from clipping artifacts
          const allClips: any[] = [];
          for (const artifact of clippingArtifacts) {
            // Clips can be in result_data.clips OR result_data.generated_clips
            const clips = artifact.data?.generated_clips || [];
            if (clips.length > 0) {
              allClips.push(...clips);
            }
          }

          // Filter clips by requested clip IDs
          const requestedClipIds = new Set(context.clipIds);
          const selectedClips = allClips.filter((clip: any) =>
            requestedClipIds.has(clip.id || clip.artifact_id)
          );

          // Validate all clips were found
          if (selectedClips.length !== context.clipIds.length) {
            const foundIds = new Set(
              selectedClips.map((c: any) => c.id || c.artifact_id)
            );
            const missingIds = context.clipIds.filter(
              (id) => !foundIds.has(id)
            );
            console.error(
              `[StoryVideoConfig] Missing clips: ${missingIds.join(", ")}`
            );
            setLoadError(
              `Could not find ${missingIds.length} of ${context.clipIds.length} selected clips. ` +
                `They may have been deleted or are not yet available.`
            );
            return;
          }

          // Convert clips to moments
          const moments = momentHelpers.convertClipsToMoments(selectedClips);

          testimonialsData = [
            {
              id: testimonial.id,
              author_name: testimonial.author_name,
              author_company: testimonial.author_company,
              media_url: testimonial.media_url || "",
              rating: testimonial.rating,
              sentiment_score: testimonial.sentiment_score,
              moments,
            },
          ];

          // Since user already selected specific clips, skip moment selection and go to ordering
          setTestimonialsWithMoments(testimonialsData);
          setSelectedMoments(moments); // Pre-select all moments

          setCurrentStep("order-moments");
          return;
        } catch (error) {
          console.error(
            "[StoryVideoConfig] Failed to load selected clips:",
            error
          );
          setLoadError(
            `Failed to load selected clips: ${error instanceof Error ? error.message : "Please try again."}`
          );
          return;
        }
      }

      setTestimonialsWithMoments(testimonialsData);

      // Check if we have moments
      const totalMoments = testimonialsData.reduce(
        (sum, t) => sum + t.moments.length,
        0
      );

      if (totalMoments === 0) {
        console.log("[StoryVideoConfig] No moments found, setting error");
        setLoadError("No moments found. Please generate highlights first.");
        return;
      }

      setCurrentStep("select-moments");
    } catch (error) {
      console.error("[StoryVideoConfig] Failed to load testimonials:", error);
      setLoadError("Failed to load moments. Please try again.");
    }
  };

  const toggleStep = (stepId: string) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, enabled: !step.enabled } : step
      )
    );
  };

  // Auto-enable/disable intro/outro step
  useEffect(() => {
    const introOutroEnabled = addIntro || addOutro;
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === "add_intro_outro"
          ? { ...step, enabled: introOutroEnabled }
          : step
      )
    );
  }, [addIntro, addOutro]);

  const handleHighlightTypeSelected = async (highlightType: string) => {
    // Load moments for the selected highlight type
    try {
      setCurrentStep("loading");

      const currentTestimonialId =
        context.type === "testimonial" ? context.testimonialId : "";

      let moments: HighlightMoment[] = [];
      let testimonial: any;

      // For story_video type, use the new backend endpoint
      if (highlightType === "story_video") {
        try {
          const response = await studioAPI.getStoryVideoHighlights([
            currentTestimonialId,
          ]);

          if (response.testimonials && response.testimonials.length > 0) {
            const testimonialHighlights = response.testimonials[0];
            moments = testimonialHighlights.highlights;
          }

          // Still need testimonial object for testimonial metadata
          testimonial =
            cachedTestimonial ||
            (await workspaceHub.testimonialManager.fetchTestimonial(
              currentTestimonialId,
              false
            ));

          if (testimonial) {
            setCachedTestimonial(testimonial);
            setCachedTestimonialId(testimonial.id);
          }
        } catch (apiError) {
          console.error(
            "[StoryVideoConfig] API call failed, falling back to local extraction:",
            apiError
          );

          // Fallback to local extraction if API fails
          testimonial =
            cachedTestimonial ||
            (await workspaceHub.testimonialManager.fetchTestimonial(
              currentTestimonialId,
              false
            ));

          if (testimonial) {
            setCachedTestimonial(testimonial);
            setCachedTestimonialId(testimonial.id);
            moments = momentHelpers.getMomentsForSingleTestimonial(
              testimonial,
              highlightType as any
            );
          }
        }
      } else {
        // For other highlight types, use the existing local extraction
        // Validate cache before using it
        const isCacheValid =
          cachedTestimonial &&
          cachedTestimonialId === currentTestimonialId &&
          cachedTestimonial.artifacts &&
          cachedTestimonial.artifacts.length > 0;

        if (isCacheValid) {
          // Use cached testimonial to avoid redundant API call

          testimonial = cachedTestimonial;
        } else {
          // Cache invalid or empty - refetch

          testimonial = await workspaceHub.testimonialManager.fetchTestimonial(
            currentTestimonialId,
            false // Include artifacts
          );

          // Update cache with fresh data
          setCachedTestimonial(testimonial);
          setCachedTestimonialId(testimonial.id);
        }

        moments = momentHelpers.getMomentsForSingleTestimonial(
          testimonial,
          highlightType as any
        );
      }

      setTestimonialsWithMoments([
        {
          id: testimonial.id,
          author_name: testimonial.author_name,
          author_company: testimonial.author_company,
          media_url: testimonial.media_url || "",
          rating: testimonial.rating,
          sentiment_score: testimonial.sentiment_score,
          moments,
        },
      ]);

      if (moments.length === 0) {
        console.log(
          "[StoryVideoConfig] No moments found - checking artifacts..."
        );
        const highlightArtifacts =
          testimonial.artifacts?.filter(
            (a: any) => a.processing_type === "highlight_extraction"
          ) || [];
        console.log(
          "[StoryVideoConfig] Highlight extraction artifacts:",
          highlightArtifacts.length
        );

        // Go back to highlight type selection with error message
        setCurrentStep("select-highlight-type");

        if (highlightArtifacts.length === 0) {
          setLoadError(
            `No highlights found. Please generate ${highlightType} highlights for this testimonial first.`
          );
        } else {
          setLoadError(
            `No ${highlightType} highlights found. Try a different highlight type or generate new highlights.`
          );
        }
        return;
      }

      setCurrentStep("select-moments");
    } catch (error) {
      console.error("[StoryVideoConfig] Failed to load moments:", error);
      console.error("[StoryVideoConfig] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Go back to highlight type selection with error message
      setCurrentStep("select-highlight-type");
      setLoadError(
        `Failed to load moments: ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  };

  const handleMomentsSelected = (moments: HighlightMoment[]) => {
    setSelectedMoments(moments);
    setCurrentStep("order-moments");
  };

  const handleMomentsOrdered = (moments: HighlightMoment[]) => {
    setOrderedMoments(moments);
    setCurrentStep("configure-options");
  };

  const handleAIOrder = async (
    moments: HighlightMoment[]
  ): Promise<HighlightMoment[]> => {
    // Calculate target duration from selected moments (in ms)
    const targetDuration = moments.reduce(
      (sum, m) => sum + (m.duration || m.end_time - m.start_time || 0),
      0
    );

    const response = await studioAPI.orderMoments({
      moments,
      context: "story_video",
      target_duration: targetDuration,
    });

    // Reorder moments based on AI response
    const orderedMomentIds = response.ordered_moment_ids;

    const ordered = orderedMomentIds
      .map((id) => moments.find((m) => m.id === id))
      .filter(Boolean) as HighlightMoment[];

    return ordered;
  };

  const handleStartProcessing = async () => {
    setIsStarting(true);

    try {
      const workspaceId = workspaceHub.workspace?.id;
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }

      // Get first testimonial ID (for single testimonial case)
      const testimonialId =
        context.type === "testimonial" || context.type === "selected-clips"
          ? context.testimonialId
          : undefined;

      // Build config with music, branding, text overlay, and B-roll settings
      const hasMusicStep = steps.some((s) => s.enabled && s.id === "mix_music");
      const hasBrandingStep = steps.some(
        (s) => s.enabled && s.id === "apply_branding"
      );
      const hasBrollStep = steps.some(
        (s) => s.enabled && s.id === "apply_broll"
      );

      // Calculate target duration from ordered moments (in ms)
      const targetDuration = orderedMoments.reduce(
        (sum, m) => sum + (m.duration || m.end_time - m.start_time || 0),
        0
      );

      const config: Record<string, any> = {
        moments: orderedMoments, // Send full moment objects
        target_duration: targetDuration,
        add_intro: addIntro,
        add_outro: addOutro,
        intro_text: introText, // Custom intro text with company name
        outro_text: outroText, // Custom outro text with company name
      };

      // Add music config if music step is enabled
      if (hasMusicStep) {
        config.add_background_music = true;
        config.background_music = musicConfig.background_music;
        config.music_volume = musicConfig.music_volume;
        if (musicConfig.custom_music_url) {
          config.custom_music_url = musicConfig.custom_music_url;
        }
      }

      // Add branding config if branding step is enabled
      if (hasBrandingStep) {
        config.add_branding = true;
        config.include_logo = !!brandingConfig.logo_url;
        config.include_watermark = !!brandingConfig.watermark_text;
        config.logo_url = brandingConfig.logo_url;
        config.watermark_text = brandingConfig.watermark_text;
        config.logo_position = brandingConfig.logo_position;
        config.watermark_position = brandingConfig.watermark_position;
      }

      // ====== B-ROLL VALIDATIONS ======
      if (hasBrollStep) {
        // For story videos, use calculated video duration from ordered moments
        const validationResult = validateBrollConfig({
          brollConfig,
          testimonialId,
          contextType: "testimonial", // Story videos are always based on testimonials
          transcriptMissingAcknowledged,
          brollWarningAcknowledged,
          videoDuration: videoDuration, // Use calculated duration from ordered moments
        });

        if (!validationResult.isValid) {
          setValidationAlert({
            isOpen: true,
            message:
              validationResult.errorMessage || "B-roll validation failed",
          });

          // Set acknowledgment flags for warnings that can be bypassed
          if (validationResult.shouldAcknowledge) {
            if (
              validationResult.errorMessage?.includes("Transcript segments")
            ) {
              setTranscriptMissingAcknowledged(true);
            } else if (
              validationResult.errorMessage?.includes("B-roll Duration")
            ) {
              setBrollWarningAcknowledged(true);
            }
          }

          setIsStarting(false);
          return;
        }

        config.broll_config = brollConfig;
      }

      // Create session
      const session = await studioAPI.createSession({
        testimonial_id: testimonialId,
        workspace_id: workspaceId,
        pipeline_type: "story_video",
        selected_stages: steps.filter((s) => s.enabled).map((s) => s.id),
        auto_proceed: autoProceed,
        config,
      });

      onStartProcessing(session.session_id, autoProceed);
    } catch (error: any) {
      console.error("Failed to start story video:", error);
      setIsStarting(false);
    }
  };

  const getContextDescription = () => {
    switch (context.type) {
      case "testimonial":
        return "Using moments from single testimonial";
      case "multi-testimonial":
        return `Combining moments from ${testimonialsWithMoments.length} testimonials`;
      case "selected-clips":
        return `Using ${selectedMoments.length || context.clipIds.length} pre-selected clips`;
      case "best-moments":
        return `Best moments from top ${testimonialsWithMoments.length} testimonials`;
      default:
        return "Creating story video";
    }
  };

  const enabledStepsCount = steps.filter((s) => s.enabled).length;
  const totalDuration = useMemo(
    () => momentHelpers.calculateTotalDuration(orderedMoments),
    [orderedMoments]
  );

  // Calculate video duration in seconds for text overlay and B-roll validation
  // NOTE: moment.duration is in milliseconds, so divide by 1000 to get seconds
  const videoDuration = useMemo(
    () =>
      orderedMoments.reduce(
        (sum, moment) =>
          sum + (moment.duration || moment.end_time - moment.start_time || 0),
        0
      ) / 1000,
    [orderedMoments]
  );

  // Check if video is too short for B-roll
  const MIN_BROLL_DURATION = 20;
  const isTooShortForBroll = videoDuration < MIN_BROLL_DURATION;

  const handleLoadFallbackHighlights = async () => {
    if (!fallbackHighlightType) {
      return;
    }

    // Only support fallback for single testimonial context
    if (context.type !== "testimonial") {
      setLoadError(
        "Fallback highlights are only available for single testimonial stories."
      );
      return;
    }

    setCurrentStep("loading-fallback-highlights");
    setLoadError(null);

    try {
      // Get the testimonial (use cached if available)
      let testimonial = cachedTestimonial;

      if (!testimonial || cachedTestimonialId !== context.testimonialId) {
        testimonial = await workspaceHub.testimonialManager.fetchTestimonial(
          context.testimonialId,
          false
        );
        setCachedTestimonial(testimonial);
        setCachedTestimonialId(context.testimonialId);
      }

      // Get moments for the selected fallback highlight type
      const moments = momentHelpers.getMomentsForClipping(
        testimonial,
        fallbackHighlightType
      );

      // Validate that we have >1 highlights
      if (moments.length <= 1) {
        setLoadError(
          `Only ${moments.length} ${fallbackHighlightType} highlight${moments.length === 1 ? "" : "s"} found. Please select a different highlight type. Story video requires at least 2 highlights.`
        );
        setCurrentStep("insufficient-highlights-fallback");
        return;
      }

      // Success! Set up the testimonials with moments
      const testimonialsData: TestimonialWithMoments[] = [
        {
          id: testimonial.id,
          author_name: testimonial.author_name,
          author_company: testimonial.author_company,
          media_url: testimonial.media_url || "",
          rating: testimonial.rating,
          sentiment_score: testimonial.sentiment_score,
          moments,
        },
      ];

      setTestimonialsWithMoments(testimonialsData);

      // Pre-select all moments (user can deselect in next step)
      setSelectedMoments(moments);

      // Move to moment selection step
      setCurrentStep("select-moments");
    } catch (error: any) {
      console.error("Error loading fallback highlights:", error);
      setLoadError(
        error.message || "Failed to load fallback highlights. Please try again."
      );
      setCurrentStep("insufficient-highlights-fallback");
    }
  };

  // Error state - check this BEFORE loading state so errors are always visible
  if (loadError && currentStep !== "insufficient-highlights-fallback") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card className="p-8 text-center border-2 border-red-200 bg-red-50">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            {loadError}
          </h3>
          <Button onClick={onBack} variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Loading state
  if (currentStep === "loading") {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Loading moments...</p>
        </div>
      </div>
    );
  }

  // Insufficient Highlights Fallback Step
  if (currentStep === "insufficient-highlights-fallback") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-900 mb-1">
                    Insufficient Story Video Highlights
                  </h3>
                  <p className="text-xs text-slate-600 mb-4">
                    {loadError ||
                      "Not enough story video highlights were found. Would you like to use standalone highlights instead?"}
                  </p>
                  <p className="text-xs text-slate-600 mb-4">
                    Standalone highlights are optimized for specific types of
                    content (problems, solutions, results, etc.). Select a
                    highlight type below to continue with your story video.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {HIGHLIGHT_TYPES.map((type) => {
                  const isSelected = fallbackHighlightType === type.id;

                  // Safe color classes for Tailwind JIT
                  const getCardClasses = () => {
                    if (!isSelected)
                      return "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
                    switch (type.color) {
                      case "blue":
                        return "border-blue-500 bg-blue-50/30";
                      case "pink":
                        return "border-pink-500 bg-pink-50/30";
                      case "orange":
                        return "border-orange-500 bg-orange-50/30";
                      case "emerald":
                        return "border-emerald-500 bg-emerald-50/30";
                      case "purple":
                        return "border-purple-500 bg-purple-50/30";
                      default:
                        return "border-blue-500 bg-blue-50/30";
                    }
                  };

                  const getIconClasses = () => {
                    if (!isSelected) return "bg-slate-100 text-slate-600";
                    switch (type.color) {
                      case "blue":
                        return "bg-blue-100 text-blue-600";
                      case "pink":
                        return "bg-pink-100 text-pink-600";
                      case "orange":
                        return "bg-orange-100 text-orange-600";
                      case "emerald":
                        return "bg-emerald-100 text-emerald-600";
                      case "purple":
                        return "bg-purple-100 text-purple-600";
                      default:
                        return "bg-blue-100 text-blue-600";
                    }
                  };

                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all border-2",
                        getCardClasses()
                      )}
                      onClick={() => setFallbackHighlightType(type.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", getIconClasses())}>
                          {type.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-slate-900 mb-1">
                            {type.name}
                          </h4>
                          <p className="text-[10px] text-slate-600 line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleLoadFallbackHighlights}
                  disabled={!fallbackHighlightType}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue with{" "}
                  {fallbackHighlightType
                    ? HIGHLIGHT_TYPES.find(
                        (t) => t.id === fallbackHighlightType
                      )?.name
                    : "Selected Type"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Loading Fallback Highlights Step
  if (currentStep === "loading-fallback-highlights") {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-900 mb-1">
              Loading{" "}
              {fallbackHighlightType
                ? HIGHLIGHT_TYPES.find((t) => t.id === fallbackHighlightType)
                    ?.name
                : "Highlights"}
              ...
            </h3>
            <p className="text-xs text-slate-600">
              Fetching highlights from your testimonial
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 0: Select Highlight Type (only for single testimonial)
  if (currentStep === "select-highlight-type") {
    const testimonial = testimonialsWithMoments[0];
    if (!testimonial) {
      return null;
    }

    // Convert TestimonialWithMoments back to Testimonial for HighlightTypeSelectionStep
    const fullTestimonial = {
      ...testimonial,
      type: "video" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workspace_id: workspaceHub.workspace?.id || "",
      status: "completed" as const,
      artifacts: [], // Will be fetched inside the component
    };

    return (
      <HighlightTypeSelectionStep
        testimonial={fullTestimonial as any}
        onComplete={handleHighlightTypeSelected}
        onBack={onBack}
      />
    );
  }

  // Step 1: Select Moments
  if (currentStep === "select-moments") {
    return (
      <MomentSelectionStep
        testimonials={testimonialsWithMoments}
        onComplete={handleMomentsSelected}
        onBack={
          context.type === "testimonial"
            ? () => setCurrentStep("select-highlight-type")
            : onBack
        }
        title="Select Moments for Story Video"
        description={getContextDescription()}
        minSelection={2}
      />
    );
  }

  // Step 2: Order Moments
  if (currentStep === "order-moments") {
    return (
      <AIOrderingStep
        moments={selectedMoments}
        onComplete={handleMomentsOrdered}
        onBack={() => setCurrentStep("select-moments")}
        enableAI={true}
        context="story_video"
        onAIOrder={handleAIOrder}
      />
    );
  }

  // Step 3: Configure Options
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep("order-moments")}
              className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ordering
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Configure Story Video
                </h2>
                <p className="text-sm text-slate-600">
                  {orderedMoments.length} moments selected • Total duration:{" "}
                  {momentHelpers.formatDuration(totalDuration / 1000)}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Story Video
              </Badge>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-6">
            {/* Intro/Outro */}
            <Card className="p-5 border-purple-200 bg-gradient-to-br from-purple-50/30 to-transparent">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <FileVideo className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Intro & Outro
                  </h3>
                  <p className="text-xs text-slate-600">
                    Add professional branded intro and outro to your video
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Intro Checkbox */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    addIntro
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setAddIntro(!addIntro)}
                >
                  <Checkbox
                    checked={addIntro}
                    onCheckedChange={() => setAddIntro(!addIntro)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="h-4 w-4 text-purple-600" />
                      <Label className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Add Intro
                      </Label>
                    </div>
                    <p className="text-xs text-slate-600">
                      Professional branded opening with voiceover
                    </p>
                  </div>
                </div>

                {/* Outro Checkbox */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    addOutro
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setAddOutro(!addOutro)}
                >
                  <Checkbox
                    checked={addOutro}
                    onCheckedChange={() => setAddOutro(!addOutro)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Add Outro
                      </Label>
                    </div>
                    <p className="text-xs text-slate-600">
                      Professional branded closing with voiceover
                    </p>
                  </div>
                </div>
              </div>

              {/* Intro Text Input */}
              {addIntro && (
                <div className="mt-4">
                  <Label className="text-xs font-medium text-slate-700 mb-2 block">
                    Intro Text
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter custom intro text"
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    className="h-10 text-sm"
                    maxLength={150}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    This text will be displayed and spoken by the AI narrator (
                    {introText.length}/150 characters)
                  </p>
                </div>
              )}

              {/* Outro Text Input */}
              {addOutro && (
                <div className="mt-4">
                  <Label className="text-xs font-medium text-slate-700 mb-2 block">
                    Outro Text
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter custom outro text"
                    value={outroText}
                    onChange={(e) => setOutroText(e.target.value)}
                    className="h-10 text-sm"
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    This text will be displayed and spoken by the AI narrator (
                    {outroText.length}/100 characters)
                  </p>
                </div>
              )}

              {(addIntro || addOutro) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Intro/outro will use your workspace branding with
                      professional voiceover and smooth transitions (6s intro,
                      4.5s outro)
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Processing Steps */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Processing Steps
                  </h3>
                  <p className="text-xs text-slate-600">
                    {enabledStepsCount} of {steps.length} enabled
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {steps.map((step) => {
                  const isDisabled =
                    step.id === "apply_broll" && isTooShortForBroll;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                        isDisabled
                          ? "border-slate-200 bg-slate-50 opacity-60"
                          : step.enabled
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <Checkbox
                        checked={step.enabled}
                        onCheckedChange={() => toggleStep(step.id)}
                        disabled={isDisabled}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {step.icon}
                          <p className="text-xs font-semibold text-slate-900">
                            {step.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {step.description}
                        </p>
                        {isDisabled && (
                          <p className="text-xs text-slate-500 mt-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            ℹ️ Requires {MIN_BROLL_DURATION}+ second video
                            (yours: {Math.round(videoDuration)}s)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Processing Mode */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Processing Mode
                  </h3>
                  <p className="text-xs text-slate-600">
                    Choose processing approach
                  </p>
                </div>
              </div>
              <RadioGroup
                value={autoProceed ? "automatic" : "interactive"}
                onValueChange={(v) => setAutoProceed(v === "automatic")}
              >
                <div className="space-y-3">
                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      !autoProceed
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setAutoProceed(false)}
                  >
                    <RadioGroupItem
                      value="interactive"
                      id="mode-interactive"
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="mode-interactive"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Interactive Mode
                      </p>
                      <p className="text-xs text-slate-600">
                        Review and approve each processing step with preview
                      </p>
                    </Label>
                  </div>
                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      autoProceed
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setAutoProceed(true)}
                  >
                    <RadioGroupItem
                      value="automatic"
                      id="mode-automatic"
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="mode-automatic"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Automatic Mode
                      </p>
                      <p className="text-xs text-slate-600">
                        Process all steps automatically without review
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Music Configuration */}
            {steps.some((s) => s.enabled && s.id === "mix_music") && (
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Music className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Music Configuration
                    </h3>
                    <p className="text-xs text-slate-600">
                      Choose background music for your video
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Music Theme Selection */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Music Theme
                    </Label>
                    <Select
                      value={musicConfig.background_music}
                      onValueChange={(value) =>
                        setMusicConfig((prev) => ({
                          ...prev,
                          background_music: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundMusicOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{option.name}</span>
                              {option.mood && (
                                <span className="text-xs text-slate-500">
                                  • {option.mood}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume Level */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Volume Level
                    </Label>
                    <Select
                      value={musicConfig.music_volume}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setMusicConfig((prev) => ({
                          ...prev,
                          music_volume: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Music URL */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Custom Music URL (Optional)
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/music.mp3"
                      value={musicConfig.custom_music_url}
                      onChange={(e) =>
                        setMusicConfig((prev) => ({
                          ...prev,
                          custom_music_url: e.target.value,
                        }))
                      }
                      className="h-10 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Provide a direct link to your own music file (MP3, WAV,
                      OGG)
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Branding Configuration */}
            {steps.some((s) => s.enabled && s.id === "apply_branding") && (
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Branding Configuration
                    </h3>
                    <p className="text-xs text-slate-600">
                      Add your logo and watermark to the video
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Logo URL */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Logo URL
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={brandingConfig.logo_url}
                      onChange={(e) =>
                        setBrandingConfig((prev) => ({
                          ...prev,
                          logo_url: e.target.value,
                        }))
                      }
                      className="h-10 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Direct link to your logo image (PNG, SVG recommended)
                    </p>
                  </div>

                  {/* Logo Position */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Logo Position
                    </Label>
                    <Select
                      value={brandingConfig.logo_position}
                      onValueChange={(
                        value:
                          | "top-left"
                          | "top-right"
                          | "bottom-left"
                          | "bottom-right"
                      ) =>
                        setBrandingConfig((prev) => ({
                          ...prev,
                          logo_position: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">
                          Bottom Right
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Watermark Text */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Watermark Text
                    </Label>
                    <Input
                      type="text"
                      placeholder="Your Company Name"
                      value={brandingConfig.watermark_text}
                      onChange={(e) =>
                        setBrandingConfig((prev) => ({
                          ...prev,
                          watermark_text: e.target.value,
                        }))
                      }
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Watermark Position */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Watermark Position
                    </Label>
                    <Select
                      value={brandingConfig.watermark_position}
                      onValueChange={(
                        value:
                          | "top-left"
                          | "top-right"
                          | "bottom-left"
                          | "bottom-right"
                          | "center"
                      ) =>
                        setBrandingConfig((prev) => ({
                          ...prev,
                          watermark_position: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">
                          Bottom Right
                        </SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}

            {/* B-roll Configuration */}
            {steps.some((s) => s.enabled && s.id === "apply_broll") && (
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      B-roll Configuration
                    </h3>
                    <p className="text-xs text-slate-600">
                      Configure how B-roll footage is inserted into your video
                    </p>
                  </div>
                </div>

                <BrollConfigSection
                  brollConfig={brollConfig}
                  onBrollConfigChange={setBrollConfig}
                  testimonialId={
                    context.type === "testimonial"
                      ? context.testimonialId
                      : undefined
                  }
                  contextType="testimonial"
                  aspectRatio="9:16"
                  maxSelection={10}
                  videoDuration={videoDuration} // Use selected moments duration, not full testimonial
                  transcriptText={orderedMoments.map((m) => m.text).join(" ")}
                  cachedAISuggestions={cachedAISuggestions}
                  onCacheSuggestions={setCachedAISuggestions}
                />
              </Card>
            )}
          </div>

          {/* Footer Actions */}
          <Card className="p-5 mt-8 border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 mb-1">
                  Ready to process {orderedMoments.length} moments
                </p>
                <p className="text-xs text-slate-500">
                  Mode:{" "}
                  <strong className="text-slate-900">
                    {autoProceed ? "Automatic" : "Interactive"}
                  </strong>
                </p>
              </div>
              <Button
                onClick={handleStartProcessing}
                disabled={isStarting}
                className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Processing
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <AlertDialog
        isOpen={validationAlert.isOpen}
        onClose={() => setValidationAlert({ isOpen: false, message: "" })}
        title="B-roll Validation Error"
        message={validationAlert.message}
        variant="warning"
      />
    </div>
  );
};

export default observer(StoryVideoConfig);
