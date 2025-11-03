import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Crop,
  Type,
  Music,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StudioContext } from "@/pages/Studio";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { backgroundMusicOptions } from "@/components/studio/constants";
import {
  AspectRatioSelector,
  PlatformSelector,
  DEFAULT_PLATFORMS,
  ALL_PLATFORMS,
  type AspectRatio,
} from "@/components/common/platform-selection";
import ErrorModal from "./ErrorModal";
import BrollConfigSection, {
  BrollConfig,
  BrollCache,
} from "./BrollConfigSection";
import { validateBrollConfig } from "./utils/brollValidation";
import { useVideoDuration } from "./hooks/useVideoDuration";
import TextOverlayEditor from "./TextOverlayEditor";

interface PlatformOptimizationConfigProps {
  context: StudioContext;
  onBack: () => void;
  onStartProcessing: (jobId: string) => void;
}

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
  enabled: boolean;
}

const PlatformOptimizationConfig: React.FC<PlatformOptimizationConfigProps> =
  observer(({ context, onBack, onStartProcessing }) => {
    const [searchParams] = useSearchParams();
    const platformFromUrl = searchParams.get("platform");

    // Extract testimonialId from context for lazy-loading duration
    const testimonialId =
      context.type === "testimonial" ||
      context.type === "clip" ||
      context.type === "selected-clips"
        ? context.testimonialId
        : undefined;

    // Fetch clips data for duration calculation and transcript text if context is clip-based
    const [clipsData, setClipsData] = useState<
      Array<{ start_time: number; end_time: number; text?: string }>
    >([]);

    useEffect(() => {
      const fetchClips = async () => {
        if (context.type === "clip" && testimonialId) {
          console.log(
            "[PlatformOptimization] 🔍 Fetching clip data for duration calculation",
            {
              clipId: context.clipId,
              testimonialId,
            }
          );

          // Fetch single clip
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              testimonialId,
              false
            );
          const artifact = testimonial?.artifacts?.find(
            (a: any) => a.processing_type === "clipping"
          );
          const clips = artifact?.data?.generated_clips || [];

          console.log("[PlatformOptimization] 📊 Found clips in artifact:", {
            artifactFound: !!artifact,
            clipsCount: clips.length,
            clipIds: clips.map((c: any) => c.id),
          });

          const clip = clips.find((c: any) => c.id === context.clipId);
          if (clip) {
            setClipsData([
              {
                start_time: clip.start_time,
                end_time: clip.end_time,
                text: clip.text
              },
            ]);
          } else {
            console.warn(
              "[PlatformOptimization] ⚠️ Clip not found in artifacts",
              {
                lookingFor: context.clipId,
                availableClips: clips.map((c: any) => c.id),
              }
            );
          }
        } else if (context.type === "selected-clips" && testimonialId) {
          console.log(
            "[PlatformOptimization] 🔍 Fetching multiple clips data",
            {
              clipIds: context.clipIds,
              testimonialId,
            }
          );

          // Fetch multiple clips
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              testimonialId,
              false
            );
          const artifact = testimonial?.artifacts?.find(
            (a: any) => a.processing_type === "clipping"
          );
          const clips = artifact?.data?.generated_clips || [];
          const selectedClips = clips.filter((c: any) =>
            context.clipIds.includes(c.id)
          );

          console.log("[PlatformOptimization] ✅ Found selected clips:", {
            count: selectedClips.length,
            totalDuration: selectedClips.reduce(
              (sum: number, c: any) => sum + (c.end_time - c.start_time),
              0
            ),
          });

          setClipsData(
            selectedClips.map((c: any) => ({
              start_time: c.start_time,
              end_time: c.end_time,
              text: c.text
            }))
          );
        } else {
          console.log(
            "[PlatformOptimization] ℹ️ Not a clip context, clearing clipsData"
          );
          setClipsData([]);
        }
      };
      fetchClips();
    }, [context, testimonialId]);

    // Lazy-load video duration from transcript_segments API or calculate from clips
    const { duration: videoDuration, source: durationSource } = useVideoDuration(
      testimonialId,
      context.type,
      clipsData.length > 0 ? clipsData : undefined // Pass clips if available
    );

    // Debug: Log video duration calculation
    console.log("[PlatformOptimization] 📊 Video duration calculated:", {
      videoDuration: `${videoDuration}s (${Math.round(videoDuration)}s)`,
      source: durationSource,
      clipsDataCount: clipsData.length,
      clipsData: clipsData.map(c => ({
        start: c.start_time,
        end: c.end_time,
        durationMs: c.end_time - c.start_time,
        durationS: (c.end_time - c.start_time) / 1000,
        hasText: !!c.text
      })),
      totalClipsDurationMs: clipsData.reduce((sum, c) => sum + (c.end_time - c.start_time), 0),
      totalClipsDurationS: clipsData.reduce((sum, c) => sum + (c.end_time - c.start_time), 0) / 1000,
      contextType: context.type,
      clipId: context.type === "clip" ? (context as any).clipId : undefined,
    });

    // State for aspect ratio and platform selection
    const [selectedAspectRatio, setSelectedAspectRatio] =
      useState<AspectRatio | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("");

    // Initialize from URL params or defaults
    useEffect(() => {
      if (platformFromUrl) {
        setSelectedPlatform(platformFromUrl);
        // Derive aspect ratio from platform
        const platform = ALL_PLATFORMS.find((p) => p.id === platformFromUrl);
        if (platform) {
          setSelectedAspectRatio(platform.aspectRatio);
        }
      } else {
        // Set default to 9:16 TikTok
        setSelectedAspectRatio("9:16");
        setSelectedPlatform("tiktok");
      }
    }, [platformFromUrl]);

    // When aspect ratio changes, update platform to default for that ratio
    const handleAspectRatioChange = (ratio: AspectRatio) => {
      setSelectedAspectRatio(ratio);
      setSelectedPlatform(DEFAULT_PLATFORMS[ratio]);
    };
    const [processingMode, setProcessingMode] = useState<
      "all-at-once" | "step-by-step"
    >("all-at-once");
    const [steps, setSteps] = useState<ProcessingStep[]>([
      {
        id: "crop_resize",
        name: "Crop & Resize",
        description: "Adjust aspect ratio for platform",
        icon: <Crop className="h-4 w-4" />,
        required: true,
        enabled: true,
      },
      {
        id: "burn_captions",
        name: "Burn Captions",
        description: "Add hard-coded captions",
        icon: <Type className="h-4 w-4" />,
        enabled: true,
      },
      {
        id: "noise_removal", // Fixed: was 'normalize_audio'
        name: "Noise Removal",
        description: "Clean background noise",
        icon: <Volume2 className="h-4 w-4" />,
        enabled: true,
      },
      {
        id: "mix_music",
        name: "Mix Music",
        description: "Add background music",
        icon: <Music className="h-4 w-4" />,
        enabled: false,
      },
      {
        id: "text_overlay",
        name: "Text Overlay",
        description: "Add animated intro/outro",
        icon: <Type className="h-4 w-4" />,
        enabled: false,
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
        id: "enhance", // Fixed: was 'enhance_video'
        name: "Enhance & Encode",
        description: "AI enhancement & final encoding",
        icon: <Zap className="h-4 w-4" />,
        enabled: true,
      },
      {
        id: "text_optimization",
        name: "Text Optimization",
        description: "Optimize CTAs and text",
        icon: <Sparkles className="h-4 w-4" />,
        enabled: false,
      },
    ]);

    const [isStarting, setIsStarting] = useState(false);
    const [errorModal, setErrorModal] = useState<{
      isOpen: boolean;
      message: string;
    }>({
      isOpen: false,
      message: "",
    });
    const [brollWarningAcknowledged, setBrollWarningAcknowledged] =
      useState(false);
    const [transcriptMissingAcknowledged, setTranscriptMissingAcknowledged] =
      useState(false);

    // Cache AI suggestions to avoid repeated requests
    const [cachedAISuggestions, setCachedAISuggestions] =
      useState<BrollCache | null>(null);

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

    // Text overlay configuration
    const [textOverlayConfig, setTextOverlayConfig] = useState({
      enable_intro: true,
      workspace_name: "",
      speaker_name: "",
      role: "",
      location: "",
      intro_duration: 4.0,
      enable_outro: true,
      tagline: "",
      outro_duration: 6.0,
      brand_color: "#3b82f6",
      animation_style: "elegant" as "elegant" | "slide" | "fade" | "pop",
      font_family: "DejaVu-Sans-Bold",
    });

    // B-roll configuration
    const [brollConfig, setBrollConfig] = useState<BrollConfig>({
      placement_strategy: "auto",
      max_broll_duration: 10.0,
      transition_type: "fade",
      broll_clips: [],
    });

    // Load brand context defaults and testimonial author
    useEffect(() => {
      const brandContext = workspaceHub.workspace?.brand_context;
      const workspace = workspaceHub.workspace;

      if (brandContext?.logo_url) {
        setBrandingConfig((prev) => ({
          ...prev,
          logo_url: brandContext.logo_url || "",
          watermark_text: brandContext.company_name || workspace?.name || "",
        }));
      }

      // Get testimonial author name if available
      let authorName = "";
      if (
        context.type === "testimonial" ||
        context.type === "clip" ||
        context.type === "selected-clips"
      ) {
        const testimonial = workspaceHub.testimonialManager.testimonials?.find(
          (t) => t.id === context.testimonialId
        );
        authorName = testimonial?.author_name || "";
      }

      // Auto-fill text overlay from brand context and testimonial
      setTextOverlayConfig((prev) => ({
        ...prev,
        workspace_name: workspace?.name || "",
        speaker_name: authorName,
        brand_color: brandContext?.primary_color || "#3b82f6",
        tagline: brandContext?.tagline || "",
      }));
    }, [context]);

    // Debug: Track brollConfig changes
    useEffect(() => {
      console.log("[AIBroll] brollConfig changed:", {
        clips_count: brollConfig.broll_clips.length,
        placement_strategy: brollConfig.placement_strategy,
        clips: brollConfig.broll_clips,
      });
    }, [brollConfig]);

    const toggleStep = (stepId: string) => {
      setSteps(
        steps.map((step) =>
          step.id === stepId && !step.required
            ? { ...step, enabled: !step.enabled }
            : step
        )
      );
    };

    const handleStart = async () => {
      setIsStarting(true);

      try {
        console.log("[PlatformOptimizationConfig] Context:", context);

        const workspaceId = workspaceHub.workspace?.id;
        if (!workspaceId) {
          throw new Error("No workspace selected");
        }

        let testimonialId: string | undefined;
        let clipId: string | undefined;
        let clipIds: string[] | undefined;

        if (context.type === "testimonial") {
          testimonialId = context.testimonialId;
          console.log(
            "[PlatformOptimizationConfig] Testimonial ID from context:",
            testimonialId
          );
        } else if (context.type === "clip") {
          testimonialId = context.testimonialId;
          clipId = context.clipId;
          console.log("[PlatformOptimizationConfig] Single clip context:", {
            testimonialId,
            clipId,
          });
        } else if (context.type === "selected-clips") {
          testimonialId = context.testimonialId;
          clipIds = context.clipIds;
          console.log("[PlatformOptimizationConfig] Multiple clips context:", {
            testimonialId,
            clipIds,
          });
        } else {
          console.warn(
            "[PlatformOptimizationConfig] Unsupported context type:",
            context.type
          );
        }

        // Platform optimization requires a testimonial or clip
        if (!testimonialId) {
          console.error(
            "[PlatformOptimizationConfig] No testimonialId found. Context:",
            context
          );
          throw new Error("Please select a testimonial or clip to optimize");
        }

        // Validate testimonial is video type (clips are always from video testimonials)
        if (context.type === "testimonial") {
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              testimonialId,
              false
            );
          if (testimonial.type !== "video") {
            console.error(
              "[PlatformOptimizationConfig] Testimonial is not video type:",
              testimonial.type
            );
            throw new Error(
              "Platform optimization can only be applied to video testimonials. This is a text testimonial."
            );
          }
        }

        // Build config with music and branding settings
        const hasMusicStep = steps.some(
          (s) => s.enabled && s.id === "mix_music"
        );
        const hasBrandingStep = steps.some(
          (s) => s.enabled && s.id === "apply_branding"
        );
        const hasTextOverlayStep = steps.some(
          (s) => s.enabled && s.id === "text_overlay"
        );
        const hasBrollStep = steps.some(
          (s) => s.enabled && s.id === "apply_broll"
        );

        // ====== B-ROLL VALIDATIONS ======
        if (hasBrollStep) {
          const testimonialId =
            context.type === "testimonial" ||
            context.type === "clip" ||
            context.type === "selected-clips"
              ? context.testimonialId
              : undefined;

          const validationResult = validateBrollConfig({
            brollConfig,
            testimonialId,
            contextType: context.type,
            transcriptMissingAcknowledged,
            brollWarningAcknowledged,
            videoDuration, // Pass lazy-loaded duration from hook
          });

          if (!validationResult.isValid) {
            setErrorModal({
              isOpen: true,
              message: validationResult.errorMessage || "Validation failed",
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
        }

        const config: any = {
          target_platform: selectedPlatform,
          clip_id: clipId, // Single clip ID for clip optimization
          clip_ids: clipIds, // Multiple clip IDs for batch optimization
          source_type: clipId ? "clip" : clipIds ? "clips" : "testimonial",
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

        // Add text overlay config if text_overlay step is enabled
        if (hasTextOverlayStep) {
          config.text_overlay_config = textOverlayConfig;
        }

        // Add B-roll config if apply_broll step is enabled
        if (hasBrollStep) {
          console.log(
            "[PlatformOptimization] Sending broll_config:",
            brollConfig
          );
          config.broll_config = brollConfig;
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

        // Create session using new SSE infrastructure
        const session = await studioAPI.createSession({
          testimonial_id: testimonialId,
          workspace_id: workspaceId,
          pipeline_type: "platform_optimization",
          selected_stages: steps.filter((s) => s.enabled).map((s) => s.id),
          auto_proceed: processingMode === "all-at-once",
          config,
        });

        onStartProcessing(session.session_id);
      } catch (error: any) {
        console.error("Failed to start processing:", error);
        setErrorModal({
          isOpen: true,
          message:
            error.message || "Failed to create session. Please try again.",
        });
        setIsStarting(false);
      }
    };

    const selectedPlatformData = ALL_PLATFORMS.find(
      (p) => p.id === selectedPlatform
    );
    const enabledStepsCount = steps.filter((s) => s.enabled).length;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Services
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Crop className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Platform Optimization
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Configure settings for your target platform
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Aspect Ratio & Platform Selection */}
          <Card className="border-2 border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              1. Select Aspect Ratio & Platform
            </h3>

            {/* Step 1: Aspect Ratio */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-700 mb-3 block">
                Choose Aspect Ratio
              </label>
              <AspectRatioSelector
                selected={selectedAspectRatio}
                onChange={handleAspectRatioChange}
              />
            </div>

            {/* Step 2: Platform (auto-shown after aspect ratio selection) */}
            {selectedAspectRatio && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PlatformSelector
                  aspectRatio={selectedAspectRatio}
                  selected={selectedPlatform}
                  onChange={setSelectedPlatform}
                />
              </motion.div>
            )}
          </Card>

          {/* Processing Mode */}
          <Card className="border-2 border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              2. Choose Processing Mode
            </h3>

            <RadioGroup
              value={processingMode}
              onValueChange={(value: any) => setProcessingMode(value)}
            >
              <div className="space-y-3">
                <div
                  onClick={() => setProcessingMode("all-at-once")}
                  className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    processingMode === "all-at-once"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }
                `}
                >
                  <RadioGroupItem
                    value="all-at-once"
                    id="all-at-once"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="all-at-once"
                      className="text-sm font-medium text-slate-900 cursor-pointer"
                    >
                      Process All Steps at Once
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Faster processing with final result shown at the end.
                      Recommended for most users.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setProcessingMode("step-by-step")}
                  className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    processingMode === "step-by-step"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }
                `}
                >
                  <RadioGroupItem
                    value="step-by-step"
                    id="step-by-step"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="step-by-step"
                      className="text-sm font-medium text-slate-900 cursor-pointer"
                    >
                      Interactive Step-by-Step
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Preview and approve each step. Provides more control and
                      real-time feedback.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Processing Steps */}
          <Card className="border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                3. Configure Processing Steps
              </h3>
              <Badge variant="outline" className="text-xs">
                {enabledStepsCount} of {steps.length} steps enabled
              </Badge>
            </div>

            <div className="space-y-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => !step.required && toggleStep(step.id)}
                  className={`
                  flex items-start gap-3 p-3 rounded-lg border transition-all
                  ${
                    step.enabled
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-100 bg-white opacity-60"
                  }
                  ${!step.required ? "cursor-pointer hover:border-slate-300" : ""}
                `}
                >
                  <Checkbox
                    checked={step.enabled}
                    disabled={step.required}
                    className="mt-0.5"
                  />
                  <div className="flex items-start gap-2 flex-1">
                    <div
                      className={`
                    w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
                    ${step.enabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}
                  `}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {step.name}
                        </span>
                        {step.required && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Music Configuration */}
          {steps.some((s) => s.enabled && s.id === "mix_music") && (
            <Card className="border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
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
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-3 w-3" />
                          <span>Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-5 w-5" />
                          <span>High</span>
                        </div>
                      </SelectItem>
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
                    Provide a direct link to your own music file (MP3, WAV, OGG)
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Branding Configuration */}
          {steps.some((s) => s.enabled && s.id === "apply_branding") && (
            <Card className="border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
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
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
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
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* Text Overlay Configuration */}
          {steps.some((s) => s.enabled && s.id === "text_overlay") && (
            <Card className="border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Text Overlay Configuration
                  </h3>
                  <p className="text-xs text-slate-600">
                    Add animated text overlays with speaker information and
                    branding
                  </p>
                </div>
              </div>

              <TextOverlayEditor
                config={textOverlayConfig}
                onConfigChange={setTextOverlayConfig}
                videoDuration={videoDuration}
              />
            </Card>
          )}

          {/* B-roll Configuration */}
          {steps.some((s) => s.enabled && s.id === "apply_broll") && (
            <Card className="border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
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
                  context.type === "testimonial" ||
                  context.type === "clip" ||
                  context.type === "selected-clips"
                    ? context.testimonialId
                    : undefined
                }
                contextType={context.type}
                aspectRatio={selectedAspectRatio || "9:16"}
                maxSelection={10}
                videoDuration={videoDuration}
                transcriptText={clipsData.length > 0 ? clipsData.map(c => c.text).filter(Boolean).join(" ") : undefined}
                cachedAISuggestions={cachedAISuggestions}
                onCacheSuggestions={setCachedAISuggestions}
              />
            </Card>
          )}

          {/* Summary & Action */}
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Ready to Process
                </h3>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    Platform:{" "}
                    <strong className="text-slate-900">
                      {selectedPlatformData?.name}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    Aspect Ratio:{" "}
                    <strong className="text-slate-900">
                      {selectedPlatformData?.aspectRatio}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    Mode:{" "}
                    <strong className="text-slate-900">
                      {processingMode === "all-at-once"
                        ? "All at Once"
                        : "Step-by-Step"}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    Steps:{" "}
                    <strong className="text-slate-900">
                      {enabledStepsCount} enabled
                    </strong>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={isStarting || enabledStepsCount === 0}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mr-2"
                    >
                      <Play className="h-4 w-4" />
                    </motion.div>
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" fill="currentColor" />
                    Start Processing
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Error Modal */}
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ isOpen: false, message: "" })}
          message={errorModal.message}
        />
      </div>
    );
  });

export default PlatformOptimizationConfig;
