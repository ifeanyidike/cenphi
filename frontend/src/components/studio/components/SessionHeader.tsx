import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, Play } from "lucide-react";
import { ProcessingSession, ProcessingStage } from "@/hooks/useSessionSSE";

interface SessionHeaderProps {
  session: ProcessingSession | null;
  isConnected: boolean;
  currentStage: ProcessingStage | null;
  isReadyToFinalize: boolean;
  shouldShowContinueButton: boolean;
  shouldShowResumeInAutoMode: boolean;
  processingActions: Set<string>;
  onClose: () => void;
  onFinalize: () => void;
  onContinue: () => void;
  onPauseResume: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

export const SessionHeader: React.FC<SessionHeaderProps> = React.memo(
  ({
    session,
    isConnected,
    currentStage,
    isReadyToFinalize,
    shouldShowContinueButton,
    shouldShowResumeInAutoMode,
    processingActions,
    onClose,
    onFinalize,
    onContinue,
    customTitle,
    customSubtitle,
  }) => {
    // Memoize progress calculation to prevent flickering
    const progressData = useMemo(() => {
      if (!session || !session.total_steps || session.total_steps === 0) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      const completed = session.completed_steps || 0;
      const total = session.total_steps;
      const percentage = Math.round((completed / total) * 100);

      return { completed, total, percentage };
    }, [session?.completed_steps, session?.total_steps]);
    return (
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-lg sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all -ml-1"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>

              <div className="h-3 w-px bg-slate-300/60" />

              <div>
                <h1 className="text-[13px] font-semibold text-slate-900 tracking-tight">
                  {customTitle || "AI Processing Studio"}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                    {customSubtitle ||
                      session?.session_type?.replace(/_/g, " ") ||
                      "Processing"}
                  </span>
                  <span className="text-slate-300">•</span>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Connecting
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Finalize Button */}
              <AnimatePresence mode="wait">
                {isReadyToFinalize && (
                  <motion.button
                    key="finalize-button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", damping: 20, stiffness: 400 }}
                    onClick={onFinalize}
                    className="h-7 px-3 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Save className="h-3 w-3" />
                    Finalize
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Continue/Resume Processing */}
              <AnimatePresence mode="wait">
                {(shouldShowContinueButton || shouldShowResumeInAutoMode) && (
                  <motion.button
                    key="continue-button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={onContinue}
                    disabled={
                      processingActions.has("continue") || currentStage !== null
                    }
                    className="h-7 px-3 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingActions.has("continue") ||
                    currentStage !== null ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" fill="currentColor" />
                        {session?.auto_proceed === true
                          ? "Resume Processing"
                          : "Continue Processing"}
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress Bar - Only show if we have valid progress data */}
          {session && progressData.total > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="font-medium text-slate-700">
                  Progress: {progressData.completed} / {progressData.total}{" "}
                  steps
                </span>
                <span className="text-slate-500">
                  {progressData.percentage}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                <motion.div
                  key={`progress-${progressData.completed}`}
                  initial={false}
                  animate={{
                    width: `${progressData.percentage}%`,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
