import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  SkipForward,
  Clock,
} from "lucide-react";
import { StepProgress } from "@/hooks/useStudioSSE";

interface StudioProgressBarProps {
  steps: StepProgress[];
  currentStepIndex?: number;
  className?: string;
}

const StudioProgressBar: React.FC<StudioProgressBarProps> = ({
  steps,
  className = "",
}) => {
  // Calculate overall progress based on REAL step statuses and progress
  const overallProgress = useMemo(() => {
    if (steps.length === 0) return 0;

    let totalProgress = 0;

    for (const step of steps) {
      if (step.status === "completed") {
        totalProgress += 100; // Completed step = 100%
      } else if (step.status === "skipped") {
        totalProgress += 100; // Skipped counts as complete for overall progress
      } else if (step.status === "in_progress") {
        totalProgress += Math.max(0, Math.min(100, step.progress)); // Current step's actual progress
      }
      // pending and failed steps contribute 0%
    }

    return (totalProgress / (steps.length * 100)) * 100;
  }, [steps]);

  const completedCount = useMemo(() => {
    return steps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
  }, [steps]);

  const getStepIcon = (step: StepProgress) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "skipped":
        return <SkipForward className="h-4 w-4 text-slate-400" />;
      default:
        return <Circle className="h-4 w-4 text-slate-300" />;
    }
  };

  const getStepColor = (step: StepProgress) => {
    switch (step.status) {
      case "completed":
        return "bg-emerald-500";
      case "in_progress":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      case "skipped":
        return "bg-slate-300";
      default:
        return "bg-slate-200";
    }
  };

  const formatStepName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getProgressBarColor = () => {
    const currentStep = steps.find((s) => s.status === "in_progress");
    if (currentStep) {
      return "bg-gradient-to-r from-blue-500 to-blue-600";
    }
    if (completedCount === steps.length) {
      return "bg-gradient-to-r from-emerald-500 to-emerald-600";
    }
    return "bg-gradient-to-r from-blue-500 to-blue-600";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Overall Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">
              {completedCount} / {steps.length}
            </span>
            <span className="text-slate-500 text-xs">
              ({Math.round(overallProgress)}%)
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
            />
          </div>

          {/* Progress Text Overlay */}
          {overallProgress > 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-y-0 flex items-center text-xs font-medium text-white px-2"
              style={{
                width: `${Math.max(overallProgress, 10)}%`,
                maxWidth: "100%",
              }}
            >
              <span className="drop-shadow-sm">
                {Math.round(overallProgress)}%
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {steps.map((step, index) => (
          <React.Fragment key={step.stepId}>
            {/* Step Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <div
                className={`
                  relative group cursor-pointer
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${
                    step.status === "in_progress"
                      ? "ring-2 ring-blue-300 ring-offset-2 shadow-lg"
                      : ""
                  }
                  ${
                    step.status === "completed"
                      ? "bg-emerald-50 hover:bg-emerald-100"
                      : step.status === "failed"
                        ? "bg-red-50 hover:bg-red-100"
                        : step.status === "skipped"
                          ? "bg-slate-50 hover:bg-slate-100"
                          : step.status === "in_progress"
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "bg-slate-50 hover:bg-slate-100"
                  }
                `}
                title={`${formatStepName(step.stepName)} - ${step.status}`}
              >
                {getStepIcon(step)}

                {/* Progress ring for in-progress steps */}
                {step.status === "in_progress" && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-blue-200"
                    />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-blue-500"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 18 * (1 - step.progress / 100),
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                )}

                {/* Tooltip on hover */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                  <div className="font-medium">
                    {formatStepName(step.stepName)}
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    {step.status === "in_progress" && (
                      <span>Progress: {Math.round(step.progress)}%</span>
                    )}
                    {step.status === "completed" && <span>✓ Completed</span>}
                    {step.status === "failed" && <span>✗ Failed</span>}
                    {step.status === "skipped" && <span>⊘ Skipped</span>}
                    {step.status === "pending" && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                  {step.message && (
                    <div className="text-slate-400 text-xs mt-1 max-w-xs truncate">
                      {step.message}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden min-w-[20px] max-w-[60px]">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width:
                      step.status === "completed" || step.status === "skipped"
                        ? "100%"
                        : step.status === "in_progress"
                          ? `${step.progress}%`
                          : "0%",
                  }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${getStepColor(step)}`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels (mobile-hidden, desktop-visible) */}
      <div className="hidden lg:flex items-start gap-2 overflow-x-auto">
        {steps.map((step, index) => (
          <React.Fragment key={`label-${step.stepId}`}>
            <div className="flex-shrink-0 w-10 text-center">
              <span className="text-xs text-slate-600 font-medium">
                {index + 1}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 min-w-[20px] max-w-[60px]" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Info (for in-progress step) */}
      {steps.some((s) => s.status === "in_progress") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {steps.map(
              (step) =>
                step.status === "in_progress" && (
                  <div key={step.stepId}>
                    <div className="text-sm font-medium text-blue-900">
                      {formatStepName(step.stepName)}
                    </div>
                    {step.message && (
                      <div className="text-xs text-blue-700 mt-0.5 truncate">
                        {step.message}
                      </div>
                    )}
                  </div>
                )
            )}
          </div>
          <div className="text-sm font-semibold text-blue-600 flex-shrink-0">
            {Math.round(
              steps.find((s) => s.status === "in_progress")?.progress || 0
            )}
            %
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudioProgressBar;
