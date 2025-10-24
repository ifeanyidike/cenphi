import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  SkipForward,
  RotateCcw,
  Play,
  ChevronDown,
  Image as ImageIcon,
  Video as VideoIcon,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StepProgress, PreviewArtifact } from "@/hooks/useStudioSSE";
import StageCustomization from "./StageCustomization";

interface StudioStepCardProps {
  step: StepProgress;
  preview?: PreviewArtifact;
  stepNumber: number;
  totalSteps: number;
  isActive: boolean;
  onSkip?: () => void;
  onRetry?: () => void;
  onAccept?: () => void;
  onPreviewClick?: () => void;
  onConfigUpdate?: (config: Record<string, any>) => void;
  className?: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  crop_resize: <ImageIcon className="h-4 w-4" />,
  burn_captions: <VideoIcon className="h-4 w-4" />,
  apply_branding: <ImageIcon className="h-4 w-4" />,
  mix_music: <VideoIcon className="h-4 w-4" />,
  normalize_audio: <VideoIcon className="h-4 w-4" />,
  enhance_video: <VideoIcon className="h-4 w-4" />,
};

const StudioStepCard: React.FC<StudioStepCardProps> = ({
  step,
  preview,
  stepNumber,
  totalSteps,
  isActive,
  onSkip,
  onRetry,
  onAccept,
  onPreviewClick,
  onConfigUpdate,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);

  // Sync expansion with active state
  React.useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  const getStatusIcon = () => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "skipped":
        return <SkipForward className="h-5 w-5 text-slate-400" />;
      default:
        return <Circle className="h-5 w-5 text-slate-300" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case "completed":
        return "border-emerald-200 bg-emerald-50/30";
      case "in_progress":
        return "border-blue-300 bg-blue-50/50 shadow-md";
      case "failed":
        return "border-red-200 bg-red-50/30";
      case "skipped":
        return "border-slate-200 bg-slate-50/30";
      default:
        return "border-slate-200 bg-white";
    }
  };

  const getStatusBadgeColor = () => {
    switch (step.status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "skipped":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const formatStepName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className={`border-2 transition-all duration-300 ${getStatusColor()}`}
      >
        {/* Header - Always Visible */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status Icon */}
              <div className="flex-shrink-0">{getStatusIcon()}</div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-500">
                    Step {stepNumber} of {totalSteps}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0 ${getStatusBadgeColor()}`}
                  >
                    {step.status.replace("_", " ")}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 truncate">
                  {STEP_ICONS[step.stepName] && (
                    <span className="inline-flex mr-2">
                      {STEP_ICONS[step.stepName]}
                    </span>
                  )}
                  {formatStepName(step.stepName)}
                </h3>

                {step.message && (
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {step.message}
                  </p>
                )}
              </div>

              {/* Progress Badge (for in-progress steps) */}
              {step.status === "in_progress" && (
                <div className="flex-shrink-0">
                  <div className="text-xs font-semibold text-blue-600">
                    {Math.round(step.progress)}%
                  </div>
                </div>
              )}

              {/* Expand/Collapse Icon */}
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Progress Bar (for in-progress steps) */}
          {step.status === "in_progress" && (
            <div className="mt-3">
              <Progress value={step.progress} className="h-1.5 bg-slate-200" />
            </div>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200/50 pt-4">
                {/* Customization Panel - Show for pending or in_progress steps */}
                {(step.status === "pending" || step.status === "in_progress") &&
                  onConfigUpdate && (
                    <StageCustomization
                      stageType={step.stepName}
                      currentConfig={step.metadata || {}}
                      onConfigUpdate={onConfigUpdate}
                    />
                  )}

                {/* Preview Section */}
                {preview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Preview
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {preview.previewType}
                      </Badge>
                    </div>

                    <div
                      onClick={onPreviewClick}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-100 aspect-video"
                    >
                      {preview.previewType === "video" ? (
                        <video
                          src={preview.previewUrl}
                          className="w-full h-full object-cover"
                          controls={false}
                          preload="metadata"
                        />
                      ) : preview.previewType === "image" ||
                        preview.previewType === "thumbnail" ? (
                        <img
                          src={preview.previewUrl}
                          alt={`${step.stepName} preview`}
                          className="w-full h-full object-cover"
                        />
                      ) : null}

                      {/* Play overlay for video previews */}
                      {preview.previewType === "video" && (
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                            <Play
                              className="h-6 w-6 text-slate-800"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata overlay */}
                      {(preview.duration || preview.width) && (
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          {preview.duration && (
                            <Badge className="bg-black/70 text-white text-xs border-0">
                              {Math.floor(preview.duration)}s
                            </Badge>
                          )}
                          {preview.width && preview.height && (
                            <Badge className="bg-black/70 text-white text-xs border-0">
                              {preview.width}x{preview.height}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* For completed steps with preview - show Accept */}
                  {step.status === "completed" && preview && onAccept && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onAccept}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Accept
                    </Button>
                  )}

                  {/* For failed steps - show Retry */}
                  {step.status === "failed" && onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRetry}
                      className="border-slate-300 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Retry
                    </Button>
                  )}

                  {/* For in-progress steps - show Skip */}
                  {step.status === "in_progress" && onSkip && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onSkip}
                      className="border-slate-300 text-xs"
                    >
                      <SkipForward className="h-3.5 w-3.5 mr-1.5" />
                      Skip
                    </Button>
                  )}

                  {/* Preview button if preview exists */}
                  {preview && onPreviewClick && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onPreviewClick}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      View Full Preview
                    </Button>
                  )}
                </div>

                {/* Metadata / Timestamps */}
                {(step.startedAt || step.completedAt) && (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200/50">
                    {step.startedAt && (
                      <div>
                        Started: {new Date(step.startedAt).toLocaleTimeString()}
                      </div>
                    )}
                    {step.completedAt && (
                      <div>
                        Completed:{" "}
                        {new Date(step.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message (if failed) */}
                {step.status === "failed" && step.message && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{step.message}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default StudioStepCard;
