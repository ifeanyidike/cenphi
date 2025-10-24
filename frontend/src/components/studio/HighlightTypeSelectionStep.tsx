import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
  Heart,
  TrendingUp,
  Lightbulb,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HighlightType } from "@/types/ai-service";
import { Testimonial } from "@/types/testimonial";
import { cn } from "@/lib/utils";
import * as momentHelpers from "@/utils/momentHelpers";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { runInAction } from "mobx";

interface HighlightTypeSelectionStepProps {
  testimonial: Testimonial;
  onComplete: (highlightType: HighlightType | "highlight") => void;
  onBack?: () => void;
}

const HIGHLIGHT_TYPES: Array<{
  type: HighlightType | "highlight";
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: "general",
    label: "General Highlights",
    description: "Key moments and standout clips",
    icon: <Sparkles className="h-5 w-5" />,
    color: "blue",
  },
  {
    type: "emotional",
    label: "Emotional Moments",
    description: "Heartfelt and impactful expressions",
    icon: <Heart className="h-5 w-5" />,
    color: "pink",
  },
  {
    type: "problem",
    label: "Problem Statements",
    description: "Challenges and pain points discussed",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "orange",
  },
  {
    type: "solution",
    label: "Solution Highlights",
    description: "How problems were solved",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "yellow",
  },
  {
    type: "results",
    label: "Results & Outcomes",
    description: "Tangible results and achievements",
    icon: <Award className="h-5 w-5" />,
    color: "green",
  },
  {
    type: "metrics",
    label: "Metrics & Numbers",
    description: "Quantifiable data and statistics",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "indigo",
  },
  {
    type: "recommendation",
    label: "Recommendations",
    description: "Endorsements and suggestions",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "emerald",
  },
  {
    type: "before_after",
    label: "Before & After",
    description: "Transformation stories",
    icon: <Zap className="h-5 w-5" />,
    color: "purple",
  },
];

const getColorClasses = (color: string, isSelected: boolean) => {
  if (isSelected) {
    return {
      border: `border-${color}-500`,
      bg: `bg-${color}-50`,
      icon: `bg-${color}-600 text-white`,
      text: `text-${color}-900`,
    };
  }

  return {
    border: "border-slate-200 hover:border-slate-300",
    bg: "bg-white hover:bg-slate-50",
    icon: `bg-${color}-100 text-${color}-600`,
    text: "text-slate-700",
  };
};

/**
 * HighlightTypeSelectionStep - Select highlight type for single testimonial story video
 *
 * Features:
 * - Shows available highlight types
 * - Indicates which types have existing highlights
 * - Generates highlights for types that don't exist
 * - Loading state during generation
 */
const HighlightTypeSelectionStep: React.FC<HighlightTypeSelectionStepProps> = ({
  testimonial,
  onComplete,
  onBack,
}) => {
  const [selectedType, setSelectedType] = useState<HighlightType | "highlight">(
    "highlight"
  );
  const [availableTypes, setAvailableTypes] = useState<
    Set<HighlightType | "highlight">
  >(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const loadTestimonialWithArtifacts = async () => {
      try {
        // Fetch full testimonial with artifacts to check availability
        const fullTestimonial =
          await workspaceHub.testimonialManager.fetchTestimonial(
            testimonial.id
          );
        const available =
          momentHelpers.getAvailableHighlightTypes(fullTestimonial);

        setAvailableTypes(new Set(available));

        // Default to 'highlight' if available, otherwise first available type
        if (available.length > 0) {
          setSelectedType(
            available.includes("highlight") ? "highlight" : available[0]
          );
        }
      } catch (error) {
        console.error(
          "[HighlightTypeSelectionStep] Failed to load testimonial artifacts:",
          error
        );
      }
    };

    loadTestimonialWithArtifacts();
  }, [testimonial.id]);

  const handleTypeSelect = (type: HighlightType | "highlight") => {
    setSelectedType(type);
    setGenerationError(null);
  };

  const handleContinue = async () => {
    const hasHighlights = availableTypes.has(selectedType);

    if (hasHighlights) {
      // Highlights already exist, proceed immediately
      onComplete(selectedType);
    } else {
      // Need to generate highlights
      await generateHighlights(selectedType);
    }
  };

  const generateHighlights = async (type: HighlightType | "highlight") => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const workspaceId = workspaceHub.workspace?.id;
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      const tokenInfo = await authStore.getToken();

      // Call API to generate highlights by type
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
            highlight_type: type,
            max_highlights: 10, // Generate up to 10 highlights
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate highlights");
      }

      if (response.status === 200) {
        console.log("Highlights generated successfully");
        const data = await response.json();
        console.log("Generation response data:", data);
        runInAction(() => {
          workspaceHub.testimonialManager.testimonial = {
            ...(workspaceHub.testimonialManager.testimonial as any),
            artifacts: [
              ...(workspaceHub.testimonialManager.testimonial?.artifacts || []),
              data,
            ],
          };
        });
      }

      // Refresh testimonial to get new highlights
      // IMPORTANT: Pass false to include artifacts
      await workspaceHub.testimonialManager.fetchTestimonial(testimonial.id, false);

      // Mark type as available
      setAvailableTypes((prev) => new Set([...prev, type]));

      console.log("[HighlightTypeSelectionStep] Highlights generated and refreshed, proceeding to next step");

      // Proceed to next step
      onComplete(type);
    } catch (error) {
      console.error("Failed to generate highlights:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate highlights. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTypeInfo = HIGHLIGHT_TYPES.find((t) => t.type === selectedType);
  const hasSelectedHighlights = availableTypes.has(selectedType);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Select Highlight Type
            </h2>
            <p className="text-sm text-slate-600">
              Choose the type of highlights to use for your story video
            </p>
          </div>
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Back
            </Button>
          )}
        </div>

        {/* Testimonial Info */}
        <Card className="p-4 border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {testimonial.author_name || "Anonymous"}
              </p>
              {testimonial.author_company && (
                <p className="text-xs text-slate-600">
                  {testimonial.author_company}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Highlight Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {HIGHLIGHT_TYPES.map((typeInfo) => {
          const isSelected = selectedType === typeInfo.type;
          const isAvailable = availableTypes.has(typeInfo.type);
          const colors = getColorClasses(typeInfo.color, isSelected);

          return (
            <motion.div
              key={typeInfo.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all border-2 p-4",
                  colors.border,
                  colors.bg
                )}
                onClick={() => handleTypeSelect(typeInfo.type)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                      colors.icon
                    )}
                  >
                    {typeInfo.icon}
                  </div>
                  <h3 className={cn("text-sm font-semibold mb-1", colors.text)}>
                    {typeInfo.label}
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">
                    {typeInfo.description}
                  </p>

                  {/* Status Badge */}
                  {isSelected ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5",
                        `bg-${typeInfo.color}-100 text-${typeInfo.color}-700 border-${typeInfo.color}-300`
                      )}
                    >
                      <Check className="h-2.5 w-2.5 mr-1" />
                      Selected
                    </Badge>
                  ) : isAvailable ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      New
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Error Message */}
      {generationError && (
        <Card className="p-4 border-2 border-red-200 bg-red-50 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">
                Generation Failed
              </p>
              <p className="text-xs text-red-700">{generationError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Card */}
      <Card className="p-6 border-2 border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTypeInfo && (
              <>
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    `bg-${selectedTypeInfo.color}-100`
                  )}
                >
                  {selectedTypeInfo.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {selectedTypeInfo.label}
                  </p>
                  <p className="text-xs text-slate-600">
                    {hasSelectedHighlights
                      ? "Highlights are ready to use"
                      : "Will create highlights with AI (~30-60 seconds)"}
                  </p>
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleContinue}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Highlights...
              </>
            ) : hasSelectedHighlights ? (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create & Continue
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HighlightTypeSelectionStep;
