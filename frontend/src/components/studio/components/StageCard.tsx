import React from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  RotateCcw,
  SkipForward,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProcessingStage } from "@/hooks/useSessionSSE";
import StageCustomization from "../StageCustomization";

interface StageCardProps {
  stage: ProcessingStage;
  index: number;
  currentStage: ProcessingStage | null;
  session: any;
  staleStages: Set<string>;
  processingActions: Set<string>;
  stages: ProcessingStage[];
  onRetryStage: (stageId: string) => void;
  onSkipStage: (stageId: string) => void;
  onAcceptStage: (stageId: string) => void;
  onContinueToNextStage: () => void;
  onCancelSession: () => void;
  onUpdateStageConfig?: (stageId: string, config: Record<string, any>) => void;
  getStageStatusIcon: (status: string) => React.ReactNode;
  getStageStatusColor: (status: string) => string;
  sanitizeErrorMessage: (message: string) => string;
}

export const StageCard: React.FC<StageCardProps> = ({
  stage,
  index,
  currentStage,
  session,
  staleStages,
  processingActions,
  stages,
  onRetryStage,
  onSkipStage,
  onAcceptStage,
  onContinueToNextStage,
  onCancelSession,
  onUpdateStageConfig,
  getStageStatusIcon,
  getStageStatusColor,
  sanitizeErrorMessage,
}) => {
  const isActive = currentStage?.id === stage.id;
  const isFailed = stage.status === "failed";
  const isCompleted = stage.status === "completed" || stage.status === "accepted";
  const isPendingAcceptance = stage.status === "completed";
  const isAccepted = stage.status === "accepted";
  const isStale = staleStages.has(stage.stage_id);

  // Debug logging for Continue button visibility
  if (isAccepted) {
    console.log(`[SessionStudio] Stage ${stage.stage_id}:`, {
      isAccepted,
      hasPreview: !!stage.metadata?.preview_url,
      previewUrl: stage.metadata?.preview_url,
      auto_proceed: session?.auto_proceed,
      willShowContinue:
        session?.auto_proceed === false && !!stage.metadata?.preview_url,
    });
  }

  return (
    <motion.div
      key={stage.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.02,
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <div
        className={`rounded-xl p-4 transition-all duration-300 border ${
          isActive
            ? "border-slate-300 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-200"
            : isFailed
              ? "border-slate-200 bg-white shadow-sm"
              : isStale
                ? "border-slate-200 bg-white shadow-sm"
                : isCompleted
                  ? "border-slate-200 bg-white shadow-sm"
                  : "border-slate-200/70 bg-white/95 hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Stage Icon */}
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                isActive
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500 border border-blue-400/40"
                  : isFailed
                    ? "bg-white border-2 border-red-400/60"
                    : isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 border border-emerald-400/40"
                      : "bg-slate-100 border border-slate-200/60"
              }`}
            >
              {isActive || isFailed || isCompleted ? (
                <div
                  className={
                    isActive || isCompleted ? "text-white" : "text-red-600"
                  }
                >
                  {getStageStatusIcon(stage.status)}
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  {index + 1}
                </span>
              )}
            </div>
          </div>

          {/* Stage Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="text-[11px] font-semibold text-slate-900 tracking-tight leading-tight">
                {stage.display_name}
              </h3>
              <Badge
                variant="outline"
                className={`text-[8px] px-1.5 py-0.5 font-medium uppercase tracking-wider ${getStageStatusColor(
                  stage.status
                )}`}
              >
                {stage.status}
              </Badge>
            </div>

            {stage.message && (
              <p
                className={`text-[10px] leading-relaxed mt-1 ${
                  isFailed
                    ? "text-red-700 font-medium"
                    : isStale
                      ? "text-amber-700 font-medium"
                      : "text-slate-600"
                }`}
              >
                {sanitizeErrorMessage(stage.message)}
              </p>
            )}

            {/* Stale stage warning */}
            {isStale && !isFailed && (
              <div className="mt-2 p-2 bg-amber-100/60 border border-amber-200/60 rounded-md text-[10px] text-amber-900 font-medium">
                ⚠️ Processing is taking longer than expected. This might indicate an issue.
              </div>
            )}

            {/* Customization Panel - Show for pending or processing stages */}
            {(stage.status === "pending" || stage.status === "processing") &&
              isActive &&
              onUpdateStageConfig && (
                <div className="mt-3">
                  <StageCustomization
                    stageType={stage.stage_id}
                    currentConfig={stage.metadata || {}}
                    onConfigUpdate={(config) =>
                      onUpdateStageConfig(stage.stage_id, config)
                    }
                  />
                </div>
              )}

            {/* Processing Indicator */}
            {stage.status === "processing" && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-[10px]">
                  <Loader2 className="h-3.5 w-3.5 text-slate-600 animate-spin" />
                  <span className="text-slate-600 font-medium">
                    {stage.message || "Processing..."}
                  </span>
                </div>
                {/* Indeterminate progress bar animation */}
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                  <motion.div
                    className="h-full w-1/3 bg-slate-900 rounded-full"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons for Failed/Stale Stages */}
            {(isFailed || isStale) && (
              <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100">
                <button
                  onClick={() => onRetryStage(stage.stage_id)}
                  disabled={processingActions.has(`retry-${stage.stage_id}`)}
                  className={`h-8 px-3 rounded-lg text-white shadow-sm hover:shadow-md text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                    isStale
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {processingActions.has(`retry-${stage.stage_id}`) ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      {isStale ? "Force Retry" : "Retry"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSkipStage(stage.stage_id)}
                  disabled={processingActions.has(`skip-${stage.stage_id}`)}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {processingActions.has(`skip-${stage.stage_id}`) ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Skipping...
                    </>
                  ) : (
                    <>
                      <SkipForward className="h-3.5 w-3.5" />
                      Skip
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Action Buttons (Step-by-step mode) */}
            {session?.auto_proceed === false &&
              isPendingAcceptance &&
              !stage.skip_reason && (
                <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100">
                  <button
                    onClick={() => onSkipStage(stage.stage_id)}
                    disabled={processingActions.has(`skip-${stage.stage_id}`)}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {processingActions.has(`skip-${stage.stage_id}`) ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Skipping...
                      </>
                    ) : (
                      <>
                        <SkipForward className="h-3.5 w-3.5" />
                        Skip
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onAcceptStage(stage.stage_id)}
                    disabled={processingActions.has(`accept-${stage.stage_id}`)}
                    className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg text-[10px] font-medium ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                  >
                    {processingActions.has(`accept-${stage.stage_id}`) ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Accept
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

            {/* Continue button for accepted stage with preview */}
            {(() => {
              const hasSubsequentStageTriggered = stages
                .slice(index + 1)
                .some(
                  (s) =>
                    s.status === "processing" ||
                    s.status === "completed" ||
                    s.status === "failed" ||
                    s.status === "accepted"
                );

              if (
                isAccepted &&
                stage.metadata?.preview_url &&
                session?.auto_proceed === false
              ) {
                console.log(`[Continue Button] Stage ${stage.stage_id}:`, {
                  index,
                  status: stage.status,
                  hasSubsequentStageTriggered,
                  subsequentStages: stages
                    .slice(index + 1)
                    .map((s) => ({
                      id: s.stage_id,
                      status: s.status,
                    })),
                });
              }

              return session?.auto_proceed === false &&
                isAccepted &&
                stage.metadata?.preview_url &&
                !stage.skip_reason &&
                !hasSubsequentStageTriggered ? (
                <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-600 font-medium">
                      Ready to continue
                    </p>
                  </div>
                  <button
                    onClick={onContinueToNextStage}
                    disabled={processingActions.has("continue")}
                    className="h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg text-[10px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                  >
                    {processingActions.has("continue") ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Continuing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ) : null;
            })()}

            {/* Warning for accepted stage without preview */}
            {(() => {
              // Stages that don't produce video previews (only metadata/JSON)
              const noPreviewStages = [
                "generate_highlights",
                "text_optimization",
                "optimize_text",
              ];

              // Only show warning if stage should have a preview but doesn't
              const shouldHavePreview = !noPreviewStages.includes(stage.stage_id);

              return isAccepted && !stage.metadata?.preview_url && shouldHavePreview ? (
                <div className="mt-3 pt-3 border-t border-amber-200/40">
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-amber-900 font-semibold mb-1">
                          Preview unavailable
                        </p>
                        <p className="text-[9px] text-amber-800 leading-relaxed">
                          This stage was completed in an older session. Please
                          retry or cancel this session and start fresh.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onRetryStage(stage.stage_id)}
                        className="h-7 px-2.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-medium transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={onCancelSession}
                        className="h-7 px-2.5 rounded-md border border-amber-300/60 bg-white hover:bg-amber-50 text-amber-900 text-[9px] font-medium transition-colors"
                      >
                        Cancel Session
                      </button>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Skip reason display */}
            {stage.skip_reason && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/60 rounded-md">
                  <p className="text-[10px] text-slate-600 font-medium mb-0.5">
                    Skipped
                  </p>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    {stage.skip_reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
