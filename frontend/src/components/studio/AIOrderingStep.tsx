import React, { useState } from "react";
import { motion, Reorder } from "framer-motion";
import {
  GripVertical,
  Sparkles,
  RotateCcw,
  Check,
  Clock,
  Zap,
  Loader2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HighlightMoment } from "@/types/ai-service";
import { cn } from "@/lib/utils";

interface AIOrderingStepProps {
  moments: HighlightMoment[];
  onComplete: (orderedMoments: HighlightMoment[]) => void;
  onBack: () => void;
  enableAI?: boolean;
  context?: "story_video" | "clipping";
  onAIOrder?: (moments: HighlightMoment[]) => Promise<HighlightMoment[]>;
}

/**
 * AIOrderingStep - Reorder moments with drag-and-drop or AI assistance
 *
 * Features:
 * - Drag-and-drop reordering using Framer Motion
 * - AI-powered optimal ordering
 * - Timeline visualization
 * - Duration preview per moment
 * - Reset to original order
 */
const AIOrderingStep: React.FC<AIOrderingStepProps> = ({
  moments: initialMoments,
  onComplete,
  onBack,
  enableAI = true,
  onAIOrder,
}) => {
  const [orderedMoments, setOrderedMoments] =
    useState<HighlightMoment[]>(initialMoments);
  const [originalOrder] = useState<HighlightMoment[]>(initialMoments);
  const [isOrderingWithAI, setIsOrderingWithAI] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [hasReordered, setHasReordered] = useState(false);

  const handleAIOrdering = async () => {
    if (!onAIOrder) return;

    setIsOrderingWithAI(true);
    setAiReasoning(null);

    try {
      const aiOrderedMoments = await onAIOrder(orderedMoments);
      console.log("AI ordered moments:", aiOrderedMoments);
      setOrderedMoments(aiOrderedMoments);
      setHasReordered(true);
      setAiReasoning(
        "AI has arranged moments for optimal narrative flow and engagement."
      );
    } catch (error) {
      console.error("AI ordering failed:", error);
      setAiReasoning("AI ordering failed. Please reorder manually.");
    } finally {
      setIsOrderingWithAI(false);
    }
  };

  const handleResetOrder = () => {
    setOrderedMoments(originalOrder);
    setHasReordered(false);
    setAiReasoning(null);
  };

  const handleContinue = () => {
    onComplete(orderedMoments);
  };

  const totalDuration = orderedMoments.reduce((sum, m) => sum + m.duration, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600";
    if (score >= 0.7) return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Order Your Moments
            </h2>
            <p className="text-sm text-slate-600">
              Drag to reorder or use AI to suggest optimal sequence
            </p>
          </div>
          <Button onClick={onBack} variant="outline" size="sm" className="h-8">
            Back
          </Button>
        </div>

        {/* Stats & Actions Bar */}
        <Card className="p-4 border-2 border-slate-200 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Moments</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {orderedMoments.length}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Total Duration</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatTime(totalDuration / 1000)}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Avg Engagement</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {Math.round(
                      (orderedMoments.reduce(
                        (sum, m) => sum + m.engagement_score,
                        0
                      ) /
                        orderedMoments.length) *
                        100
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasReordered && (
                <Button
                  onClick={handleResetOrder}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset Order
                </Button>
              )}
              {enableAI && onAIOrder && (
                <Button
                  onClick={handleAIOrdering}
                  disabled={isOrderingWithAI}
                  size="sm"
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                >
                  {isOrderingWithAI ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Ordering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Use AI Ordering
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          {aiReasoning && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-start gap-2 text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <Zap className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">{aiReasoning}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Timeline Preview */}
      <div className="mb-6">
        <Card className="p-4 border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-600" />
            <p className="text-xs font-semibold text-slate-900">
              Timeline Preview
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {orderedMoments.map((moment, index) => {
              const widthPercent = (moment.duration / totalDuration) * 100;
              return (
                <div
                  key={moment.id}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                  style={{ width: `${Math.max(widthPercent, 10)}%` }}
                >
                  <div
                    className={cn(
                      "w-full h-2 rounded-full transition-colors",
                      index === 0
                        ? "bg-blue-500"
                        : index === orderedMoments.length - 1
                          ? "bg-purple-500"
                          : "bg-slate-300"
                    )}
                  />
                  <p className="text-[10px] font-medium text-slate-600">
                    {index + 1}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatTime(moment.duration / 1000)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Reorderable Moment List */}
      <div className="mb-6">
        <Reorder.Group
          axis="y"
          values={orderedMoments}
          onReorder={(newOrder) => {
            setOrderedMoments(newOrder);
            setHasReordered(true);
          }}
          className="space-y-3"
        >
          {orderedMoments.map((moment, index) => (
            <Reorder.Item
              key={moment.id}
              value={moment}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-4 border-2 border-slate-200 hover:border-slate-300 bg-white transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Order Number */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <p className="text-sm font-bold text-blue-600">
                          {index + 1}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          {moment.theme && (
                            <p className="text-sm font-semibold text-slate-900 mb-1 truncate">
                              {moment.theme}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {moment.text}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 border font-medium",
                              getEngagementColor(moment.engagement_score),
                              "bg-white"
                            )}
                          >
                            <TrendingUp className="h-2.5 w-2.5 mr-1" />
                            {Math.round(moment.engagement_score * 100)}%
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-600 border-slate-200"
                          >
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {formatTime(moment.duration / 1000)}
                          </Badge>
                        </div>
                      </div>

                      {/* Keywords */}
                      {moment.keywords && moment.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {moment.keywords.slice(0, 4).map((keyword, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-0"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Footer Actions */}
      <Card className="p-4 border-2 border-slate-200 bg-white sticky bottom-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <p className="text-xs text-slate-600">
              Moments ordered • Total duration:{" "}
              {formatTime(totalDuration / 1000)}
            </p>
          </div>
          <Button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 h-9 px-6"
          >
            Continue to Configuration
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIOrderingStep;
