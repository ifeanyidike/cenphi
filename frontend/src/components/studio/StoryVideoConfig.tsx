import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { HighlightMoment, TestimonialWithMoments } from "@/types/ai-service";
import MomentSelectionStep from "./MomentSelectionStep";
import AIOrderingStep from "./AIOrderingStep";
import HighlightTypeSelectionStep from "./HighlightTypeSelectionStep";
import * as momentHelpers from "@/utils/momentHelpers";
import { observer } from "mobx-react-lite";

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
  | "select-highlight-type"
  | "select-moments"
  | "order-moments"
  | "configure-options";

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

  // Configuration state
  const [targetDuration, setTargetDuration] = useState<number>(60);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  // const [selectedHighlightType, setSelectedHighlightType] = useState<string>('highlight');

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

  // Load brand context defaults
  useEffect(() => {
    const brandContext = workspaceHub.workspace?.brand_context;
    const companyName =
      brandContext?.company_name || workspaceHub.workspace?.name || "us";

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

  // Load testimonials and extract moments based on context
  useEffect(() => {
    loadTestimonialsAndMoments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const loadTestimonialsAndMoments = async () => {
    try {
      console.log(
        "[StoryVideoConfig] Starting to load moments, context:",
        context
      );
      setCurrentStep("loading");
      setLoadError(null);

      let testimonialsData: TestimonialWithMoments[] = [];

      if (context.type === "testimonial") {
        console.log(
          "[StoryVideoConfig] Loading single testimonial:",
          context.testimonialId
        );

        // For single testimonial, show highlight type selection first
        // IMPORTANT: Must load artifacts to determine available highlight types
        const testimonial =
          await workspaceHub.testimonialManager.fetchTestimonial(
            context.testimonialId,
            false // Load artifacts to check available highlight types
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

        // Store testimonial for highlight type selection
        setTestimonialsWithMoments([
          {
            id: testimonial.id,
            author_name: testimonial.author_name,
            author_company: testimonial.author_company,
            media_url: testimonial.media_url || "",
            rating: testimonial.rating,
            sentiment_score: testimonial.sentiment_score,
            moments: [], // Will be loaded after highlight type selection
          },
        ]);

        // Go to highlight type selection step
        setCurrentStep("select-highlight-type");
        return;
      } else if (context.type === "multi-testimonial") {
        // Multiple testimonials - use all highlights from each
        // IMPORTANT: Need artifacts to extract moments, so don't exclude them
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
          const nonVideoIds = nonVideoTestimonials.map((t) => t.id).join(", ");
          console.error(
            "[StoryVideoConfig] Non-video testimonials found:",
            nonVideoIds
          );
          setLoadError(
            `Story videos can only be created from video testimonials. Found ${nonVideoTestimonials.length} text testimonial(s). Please remove them and try again.`
          );
          return;
        }

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
      } else if (context.type === "best-moments") {
        // Best moments - BestMomentsStoryGenerator already filtered and ranked
        // We receive testimonialIds that have already been through extractBestMomentsFromTestimonials
        // IMPORTANT: Do NOT re-filter or re-rank - trust the IDs provided
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
          // Just load the moments for those specific testimonials
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
      } else if (context.type === "selected-clips") {
        console.log(
          "[StoryVideoConfig] Loading selected clips:",
          context.clipIds
        );

        // Convert clips to moments
        // IMPORTANT: Pass false to include artifacts (needed to find the clips)
        const testimonial =
          await workspaceHub.testimonialManager.fetchTestimonial(
            context.testimonialId,
            false
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

        console.log(
          "[StoryVideoConfig] Testimonial artifacts:",
          testimonial.artifacts?.length
        );

        // IMPORTANT: clipIds are the IDs of clips within artifacts, NOT artifact IDs
        // We need to find artifacts that contain clips with matching IDs
        const selectedClips: any[] = [];
        const requestedClipIds = new Set(context.clipIds);
        const foundClipIds = new Set<string>();

        testimonial.artifacts?.forEach((artifact: any) => {
          if (
            artifact.processing_type === "clipping" &&
            artifact.data?.generated_clips?.clips
          ) {
            const clips = artifact.data.generated_clips.clips;
            clips.forEach((clip: any) => {
              if (requestedClipIds.has(clip.id)) {
                foundClipIds.add(clip.id);

                // Extract transcript text from clip time range
                let clipText = "";
                if (
                  testimonial.transcript_segments &&
                  clip.start_time !== undefined &&
                  clip.end_time !== undefined
                ) {
                  const relevantSegments =
                    testimonial.transcript_segments.filter(
                      (seg: any) =>
                        seg.start_time >= clip.start_time &&
                        seg.end_time <= clip.end_time
                    );
                  clipText = relevantSegments
                    .map((seg: any) => seg.text)
                    .join(" ");

                  if (!clipText && relevantSegments.length === 0) {
                    console.warn(
                      `[StoryVideoConfig] No transcript found for clip ${clip.id} ` +
                        `(${clip.start_time}s - ${clip.end_time}s)`
                    );
                  }
                }

                selectedClips.push({
                  ...clip,
                  artifactId: artifact.id, // Store the parent artifact ID
                  text_content:
                    clipText ||
                    clip.text ||
                    clip.metadata?.transcript ||
                    `Clip from ${clip.start_time}s to ${clip.end_time}s`, // Fallback description
                  testimonial_id: testimonial.id,
                  parent_testimonial_id: testimonial.id,
                  storage_url: clip.url || clip.storage_path,
                });
              }
            });
          }
        });

        // Validate all clips were found
        const missingClipIds = [...requestedClipIds].filter(
          (id) => !foundClipIds.has(id)
        );
        if (missingClipIds.length > 0) {
          console.error(
            `[StoryVideoConfig] Missing clips: ${missingClipIds.join(", ")}. ` +
              `Found ${selectedClips.length}/${context.clipIds.length} clips.`
          );
          setLoadError(
            `Could not find ${missingClipIds.length} of ${context.clipIds.length} selected clips. ` +
              `They may have been deleted or are not yet available.`
          );
          return;
        }

        console.log(
          `[StoryVideoConfig] Successfully loaded ${selectedClips.length}/${context.clipIds.length} clips`,
          "with text:",
          selectedClips.map((c) => ({ id: c.id, hasText: !!c.text_content }))
        );

        const moments = momentHelpers.convertClipsToMoments(selectedClips);
        console.log("[StoryVideoConfig] Converted to moments:", moments.length);
        console.log(
          "[StoryVideoConfig] Moment details:",
          moments.map((m) => ({
            id: m.id,
            duration: m.duration,
            text: m.text?.substring(0, 50) + "...",
            theme: m.theme,
            storage_path: m.storage_path,
          }))
        );

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
        console.log(
          "[StoryVideoConfig] Pre-selected clips, skipping to ordering"
        );
        setCurrentStep("order-moments");
        return;
      }

      setTestimonialsWithMoments(testimonialsData);

      // Check if we have moments
      const totalMoments = testimonialsData.reduce(
        (sum, t) => sum + t.moments.length,
        0
      );
      console.log("[StoryVideoConfig] Total moments:", totalMoments);

      if (totalMoments === 0) {
        console.log("[StoryVideoConfig] No moments found, setting error");
        setLoadError("No moments found. Please generate highlights first.");
        return;
      }

      console.log("[StoryVideoConfig] Setting step to select-moments");
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
    // setSelectedHighlightType(highlightType);

    // Load moments for the selected highlight type
    try {
      setCurrentStep("loading");

      // IMPORTANT: Pass false to include artifacts (needed for moments extraction)
      const testimonial =
        await workspaceHub.testimonialManager.fetchTestimonial(
          context.type === "testimonial" ? context.testimonialId : "",
          false // Include artifacts
        );

      const moments = momentHelpers.getMomentsForSingleTestimonial(
        testimonial,
        highlightType as any
      );

      console.log(
        "[StoryVideoConfig] Loaded moments for type:",
        highlightType,
        "count:",
        moments.length,
        "artifacts count:",
        testimonial.artifacts?.length
      );

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
        setLoadError("No moments found for selected highlight type.");
        return;
      }

      setCurrentStep("select-moments");
    } catch (error) {
      console.error("[StoryVideoConfig] Failed to load moments:", error);
      setLoadError("Failed to load moments. Please try again.");
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

      // Build config with music and branding settings
      const hasMusicStep = steps.some((s) => s.enabled && s.id === "mix_music");
      const hasBrandingStep = steps.some(
        (s) => s.enabled && s.id === "apply_branding"
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

  // Error state - check this BEFORE loading state so errors are always visible
  if (loadError) {
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
            {/* Target Duration */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Target Duration
                  </h3>
                  <p className="text-xs text-slate-600">
                    Aim for this total video length
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {targetDuration / 1000}s
                  </span>
                  <span className="text-xs text-slate-600">
                    Current: {Math.round(totalDuration / 1000)}s
                  </span>
                </div>
                <Slider
                  value={[targetDuration / 1000]}
                  onValueChange={(v) => setTargetDuration(v[0])}
                  min={30}
                  max={300}
                  step={15}
                  className="w-full"
                />
              </div>
            </Card>

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
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                      step.enabled
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Checkbox
                      checked={step.enabled}
                      onCheckedChange={() => toggleStep(step.id)}
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
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default observer(StoryVideoConfig);
