import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Scissors,
  Check,
  Sparkles,
  Heart,
  Zap,
  TrendingUp,
  Clock,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StudioContext } from "@/pages/Studio";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import MomentSelectionStep from "./MomentSelectionStep";
import * as momentHelpers from "@/utils/momentHelpers";
import {
  HighlightMoment,
  TestimonialWithMoments,
  HighlightType,
} from "@/types/ai-service";

interface ClippingConfigProps {
  context: StudioContext;
  onBack: () => void;
  onStartProcessing: (sessionId: string, autoProceed: boolean) => void;
}

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

type ConfigStep =
  | "select-type"
  | "loading-moments"
  | "select-moments"
  | "configure-options";

const ClippingConfig: React.FC<ClippingConfigProps> = observer(
  ({ context, onBack, onStartProcessing }) => {
    const [currentStep, setCurrentStep] = useState<ConfigStep>("select-type");
    const [selectedHighlightType, setSelectedHighlightType] = useState<
      HighlightType | "highlight"
    >("general");
    const [testimonialWithMoments, setTestimonialWithMoments] =
      useState<TestimonialWithMoments | null>(null);
    const [selectedMoments, setSelectedMoments] = useState<HighlightMoment[]>(
      []
    );
    const [minClipDuration, setMinClipDuration] = useState<number | "auto">(
      "auto"
    );
    const [maxClips, setMaxClips] = useState<number | "auto">("auto");
    const [autoProceed, setAutoProceed] = useState<boolean>(true);
    const [isStarting, setIsStarting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [highlightsExist, setHighlightsExist] = useState<boolean>(false);

    // Check if highlights exist for testimonial
    useEffect(() => {
      if (context.type !== "testimonial") return;

      const checkHighlights = async () => {
        try {
          const testimonial =
            await workspaceHub.testimonialManager.fetchTestimonial(
              context.testimonialId
            );
          const hasHighlights = momentHelpers.hasHighlightsOfType(
            testimonial,
            selectedHighlightType
          );
          setHighlightsExist(hasHighlights);
        } catch (error) {
          console.error("Error checking highlights:", error);
          setHighlightsExist(false);
        }
      };

      checkHighlights();
    }, [context, selectedHighlightType]);

    // Load moments when user clicks Continue on type selection
    const handleLoadMoments = async () => {
      if (context.type !== "testimonial") {
        setLoadError("Clipping requires a testimonial to be selected");
        return;
      }

      setCurrentStep("loading-moments");
      setLoadError(null);

      try {
        const testimonial =
          await workspaceHub.testimonialManager.fetchTestimonial(
            context.testimonialId
          );

        // Use getMomentsForClipping which sorts by engagement
        let moments = momentHelpers.getMomentsForClipping(
          testimonial,
          selectedHighlightType
        );

        // If no moments exist, generate them automatically
        if (moments.length === 0) {
          console.log(
            `[ClippingConfig] No ${selectedHighlightType} highlights found, generating...`
          );

          try {
            const workspaceId = workspaceHub.workspace?.id;
            if (!workspaceId) {
              throw new Error("No workspace selected");
            }

            const tokenInfo = await authStore.getToken();

            // Generate highlights
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/ai/highlights/by-type`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${tokenInfo?.token}`,
                },
                body: JSON.stringify({
                  testimonial_id: testimonial.id,
                  text: testimonial.content,
                  segments: testimonial.transcript_segments,
                  workspace_id: workspaceId,
                  highlight_type: selectedHighlightType,
                  max_highlights: 10,
                }),
              }
            );

            if (!response.ok) {
              throw new Error("Failed to generate highlights");
            }

            console.log(
              `[ClippingConfig] Successfully generated ${selectedHighlightType} highlights`
            );

            // Parse the generated highlights directly from the response
            const generatedHighlights = await response.json();

            if (
              !Array.isArray(generatedHighlights) ||
              generatedHighlights.length === 0
            ) {
              setLoadError(
                `No ${selectedHighlightType} highlights were generated. Please try again or select a different type.`
              );
              setCurrentStep("select-type");
              return;
            }

            // Convert API response to HighlightMoment format
            moments = generatedHighlights.map((highlight: any) => ({
              id: highlight.id || `${testimonial.id}-${highlight.start_time}`,
              testimonial_id: testimonial.id,
              type: selectedHighlightType,
              start_time: highlight.start_time || 0,
              end_time: highlight.end_time || 0,
              duration: (highlight.end_time || 0) - (highlight.start_time || 0),
              text: highlight.text || "",
              theme: highlight.theme,
              importance_score: highlight.importance_score,
              engagement_score: highlight.engagement_score || 0.5,
              keywords: highlight.keywords || [],
              thumbnail_url: highlight.thumbnail_url,
            }));
          } catch (genError: any) {
            console.error("Error generating highlights:", genError);
            setLoadError(
              `Failed to generate ${selectedHighlightType} highlights: ${genError.message}`
            );
            setCurrentStep("select-type");
            return;
          }
        }

        setTestimonialWithMoments({
          id: testimonial.id,
          author_name: testimonial.author_name,
          author_company: testimonial.author_company,
          media_url: testimonial.media_url || "",
          rating: testimonial.rating,
          sentiment_score: testimonial.sentiment_score,
          moments,
        });

        setCurrentStep("select-moments");
      } catch (error: any) {
        console.error("Error loading moments:", error);
        setLoadError(
          error.message || "Failed to load moments. Please try again."
        );
        setCurrentStep("select-type");
      }
    };

    const handleMomentsSelected = (moments: HighlightMoment[]) => {
      setSelectedMoments(moments);
      setCurrentStep("configure-options");
    };

    const handleStartProcessing = async () => {
      if (context.type !== "testimonial") {
        console.error("Clipping requires a testimonial");
        return;
      }

      setIsStarting(true);

      try {
        const workspaceId = workspaceHub.workspace?.id;
        if (!workspaceId) {
          throw new Error("No workspace selected");
        }

        // Build config with selected moments
        const config: Record<string, any> = {
          moments: selectedMoments, // Full moment objects
          highlight_type: selectedHighlightType,
          min_clip_duration:
            minClipDuration === "auto" ? null : minClipDuration,
          max_clips: maxClips === "auto" ? null : maxClips,
        };

        const session = await studioAPI.createSession({
          testimonial_id: context.testimonialId,
          workspace_id: workspaceId,
          pipeline_type: "clipping",
          selected_stages: [], // All clipping stages
          auto_proceed: autoProceed,
          config,
        });

        onStartProcessing(session.session_id, autoProceed);
      } catch (error: any) {
        console.error("Failed to start clipping:", error);
        setIsStarting(false);
      }
    };

    const selectedType = HIGHLIGHT_TYPES.find(
      (h) => h.id === selectedHighlightType
    );

    const getColorClasses = (color: string, isActive: boolean) => {
      const colors = {
        blue: isActive
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white",
        pink: isActive
          ? "border-pink-500 bg-pink-50"
          : "border-slate-200 bg-white",
        orange: isActive
          ? "border-orange-500 bg-orange-50"
          : "border-slate-200 bg-white",
        emerald: isActive
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 bg-white",
        purple: isActive
          ? "border-purple-500 bg-purple-50"
          : "border-slate-200 bg-white",
      };
      return colors[color as keyof typeof colors] || colors.blue;
    };

    const getIconBgColor = (color: string) => {
      const colors = {
        blue: "bg-blue-100 text-blue-600",
        pink: "bg-pink-100 text-pink-600",
        orange: "bg-orange-100 text-orange-600",
        emerald: "bg-emerald-100 text-emerald-600",
        purple: "bg-purple-100 text-purple-600",
      };
      return colors[color as keyof typeof colors] || colors.blue;
    };

    // Loading state
    if (currentStep === "loading-moments") {
      return (
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Loading Moments...
            </h3>
            <p className="text-sm text-slate-600">
              Fetching {selectedType?.name.toLowerCase()} from testimonial
            </p>
          </motion.div>
        </div>
      );
    }

    // Moment selection step
    if (currentStep === "select-moments" && testimonialWithMoments) {
      return (
        <MomentSelectionStep
          testimonials={[testimonialWithMoments]}
          onComplete={handleMomentsSelected}
          onBack={() => setCurrentStep("select-type")}
          title="Select Moments to Clip"
          description={`Choose ${selectedType?.name.toLowerCase()} you want to extract as clips`}
          minSelection={1}
          autoSelectAll={true}
        />
      );
    }

    // Configure options step
    if (currentStep === "configure-options") {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep("select-moments")}
                  className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Moment Selection
                </Button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Configure Clipping
                    </h1>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {selectedMoments.length} moment
                      {selectedMoments.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Clip Settings */}
                <Card className="border-2 border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-6">
                    Clip Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Min Clip Duration */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium text-slate-900">
                          Minimum Clip Duration
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {minClipDuration === "auto"
                              ? "Auto"
                              : `${minClipDuration}s`}
                          </Badge>
                          <button
                            onClick={() =>
                              setMinClipDuration(
                                minClipDuration === "auto" ? 15 : "auto"
                              )
                            }
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            {minClipDuration === "auto" ? "Set Manual" : "Auto"}
                          </button>
                        </div>
                      </div>
                      {minClipDuration !== "auto" && (
                        <>
                          <Slider
                            value={[minClipDuration as number]}
                            onValueChange={(value) =>
                              setMinClipDuration(value[0])
                            }
                            min={5}
                            max={60}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>5s (Very Short)</span>
                            <span>60s (Long)</span>
                          </div>
                        </>
                      )}
                      {minClipDuration === "auto" && (
                        <p className="text-[10px] text-slate-600 mt-2">
                          Use selected moment durations as-is
                        </p>
                      )}
                    </div>

                    {/* Max Clips */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium text-slate-900">
                          Maximum Clips to Extract
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {maxClips === "auto"
                              ? `All ${selectedMoments.length} clips`
                              : `${maxClips} ${maxClips === 1 ? "clip" : "clips"}`}
                          </Badge>
                          <button
                            onClick={() =>
                              setMaxClips(maxClips === "auto" ? 3 : "auto")
                            }
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            {maxClips === "auto" ? "Set Limit" : "All"}
                          </button>
                        </div>
                      </div>
                      {maxClips !== "auto" && (
                        <>
                          <Slider
                            value={[maxClips as number]}
                            onValueChange={(value) => setMaxClips(value[0])}
                            min={1}
                            max={Math.min(10, selectedMoments.length)}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>1 clip</span>
                            <span>
                              {Math.min(10, selectedMoments.length)} clips
                            </span>
                          </div>
                        </>
                      )}
                      {maxClips === "auto" && (
                        <p className="text-[10px] text-slate-600 mt-2">
                          Extract all {selectedMoments.length} selected moments
                        </p>
                      )}
                    </div>

                    {/* Processing Mode */}
                    <div>
                      <Label className="text-xs font-medium text-slate-900 mb-3 block">
                        Processing Mode
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setAutoProceed(true)}
                          className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                            autoProceed
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                autoProceed
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {autoProceed && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900 mb-0.5">
                                Auto Process
                              </p>
                              <p className="text-[10px] text-slate-600 leading-relaxed">
                                Extract clips automatically without step-by-step
                                approval
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => setAutoProceed(false)}
                          className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                            !autoProceed
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                !autoProceed
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {!autoProceed && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900 mb-0.5">
                                Step-by-Step
                              </p>
                              <p className="text-[10px] text-slate-600 leading-relaxed">
                                Review and approve each processing step
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Summary & Action */}
                <Card className="border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">
                        Ready to Clip
                      </h3>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          Type:{" "}
                          <strong className="text-slate-900">
                            {selectedType?.name}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          Selected moments:{" "}
                          <strong className="text-slate-900">
                            {selectedMoments.length}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          Min duration:{" "}
                          <strong className="text-slate-900">
                            {minClipDuration === "auto"
                              ? "Auto"
                              : `${minClipDuration}s+`}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          Max clips:{" "}
                          <strong className="text-slate-900">
                            {maxClips === "auto" ? "All" : maxClips}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          Mode:{" "}
                          <strong className="text-slate-900">
                            {autoProceed ? "Auto Process" : "Step-by-Step"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleStartProcessing}
                      disabled={isStarting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                      size="lg"
                    >
                      {isStarting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" fill="currentColor" />
                          Start Clipping
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    // Default: Type selection step
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="select-type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
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
                <div className="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Smart Clipping
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Extract highlight clips from testimonial
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {loadError && (
              <Card className="mb-6 p-4 border-2 border-red-200 bg-red-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-900 mb-0.5">
                      Error Loading Moments
                    </p>
                    <p className="text-xs text-red-700">{loadError}</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-6">
              {/* Highlight Type Selection */}
              <Card className="border-2 border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Select Highlight Type
                </h3>

                {/* Highlight Types Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {HIGHLIGHT_TYPES.map((type) => (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => setSelectedHighlightType(type.id)}
                        className={`
                        relative cursor-pointer rounded-lg border-2 p-3.5 transition-all duration-200
                        ${getColorClasses(type.color, selectedHighlightType === type.id)}
                        hover:border-slate-300
                      `}
                      >
                        {selectedHighlightType === type.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}

                        <div
                          className={`w-8 h-8 rounded-lg ${getIconBgColor(
                            type.color
                          )} flex items-center justify-center mb-2`}
                        >
                          {type.icon}
                        </div>

                        <div className="text-[11px] font-semibold text-slate-900 mb-0.5">
                          {type.name}
                        </div>
                        <div className="text-[10px] text-slate-600 leading-snug">
                          {type.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Generate Highlights Notice */}
                {!highlightsExist && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-900">
                          Highlights will be generated first
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          No {selectedType?.name.toLowerCase()} found. We'll
                          detect highlights before showing preview.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Continue Button */}
              <Card className="border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                      Next Step
                    </h3>
                    <p className="text-xs text-slate-600">
                      Preview and select {selectedType?.name.toLowerCase()} to
                      clip
                    </p>
                  </div>
                  <Button
                    onClick={handleLoadMoments}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    Continue to Preview
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

export default ClippingConfig;
