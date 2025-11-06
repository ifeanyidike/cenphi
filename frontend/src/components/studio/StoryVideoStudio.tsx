import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Clock,
  AlertTriangle,
  SkipForward,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionSSE } from "@/hooks/useSessionSSE";
import { studioAPI } from "@/services/studioAPI";
import FinalizationModal from "./FinalizationModal";
import ErrorModal from "./ErrorModal";
import ConfirmModal from "./ConfirmModal";
import {
  PreviewSection,
  SessionHeader,
  ConnectionStatusBanner,
  StageCard,
  StageNavigationBar,
} from "./components";
import { useProcessingMonitor } from "@/contexts/ProcessingMonitorContext";
import { getServiceDisplayName } from "@/utils/studioHelpers";
import { useLocation } from "react-router-dom";

interface StoryVideoStudioProps {
  sessionId: string; // FIXED: Added sessionId prop
  testimonialIds?: string[];
  autoSelectBest?: boolean;
  onClose: () => void;
}

// Sanitize error messages to be user-friendly
const sanitizeErrorMessage = (message: string | undefined): string => {
  if (!message) return "An error occurred during processing";

  // Remove technical jargon
  const technicalPatterns = [
    /rpc error: code = \w+ desc = /gi,
    /cannot schedule new futures after interpreter shutdown/gi,
    /gRPC/gi,
    /Internal desc = /gi,
    /Traceback \(most recent call last\):.*/gis,
    /File ".*?", line \d+.*/gi,
  ];

  let sanitized = message;
  technicalPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Map common errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    "Story assembly error": "Unable to assemble story clips. Please try again.",
    "Clip extraction error": "Unable to extract clips. Please try again.",
    "Enhancement error": "Unable to enhance video quality. Please try again.",
    "Audio processing error": "Unable to process audio. Please try again.",
    "Network error":
      "Connection lost. Please check your internet and try again.",
    timeout: "Processing took too long. Please try again.",
  };

  // Check if error matches any known pattern
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (sanitized.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // Generic cleanup
  sanitized = sanitized.trim();
  if (sanitized.length > 150) {
    sanitized = sanitized.substring(0, 150) + "...";
  }

  return sanitized || "Something went wrong. Please try again.";
};

const StoryVideoStudio: React.FC<StoryVideoStudioProps> = ({
  sessionId,
  testimonialIds = [],
  autoSelectBest = false,
  onClose,
}) => {
  const location = useLocation();
  const { registerJob, updateJob } = useProcessingMonitor();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [staleStages, setStaleStages] = useState<Set<string>>(new Set());
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [processingActions, setProcessingActions] = useState<Set<string>>(
    new Set()
  );
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: "error" | "success" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "error",
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // CRITICAL: Reset all state when sessionId changes
  useEffect(() => {
    setPreviewError(null);
    setProcessingActions(new Set());
    setStaleStages(new Set());
    setSelectedStageId(null);
  }, [sessionId]);

  const {
    session,
    stages,
    isConnected,
    error: sseError,
    currentStage,
    latestPreview,
    connect,
    disconnect,
  } = useSessionSSE(sessionId);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [sessionId, connect, disconnect]);

  // Register job with global monitor when session starts
  useEffect(() => {
    if (!session || !session.session_type) return;

    const serviceType = "story_video" as const;
    const serviceName = getServiceDisplayName(serviceType);
    const currentStageDisplay = currentStage?.display_name || "Initializing...";
    const progress = currentStage?.progress || 0;

    registerJob({
      sessionId: session.id,
      testimonialIds,
      serviceType,
      serviceName,
      status: session.status === "paused" ? "paused" : "processing",
      progress,
      currentStage: currentStage?.stage_id || "initializing",
      stageDisplayName: currentStageDisplay,
      startedAt: new Date(session.started_at),
      previewUrl: latestPreview?.preview_url,
      studioUrl: location.pathname + location.search,
    });
  }, [
    session?.id,
    session?.session_type,
    session?.status,
    session?.started_at,
    testimonialIds,
    location.pathname,
    location.search,
    registerJob,
  ]);

  // Update job progress in global monitor
  useEffect(() => {
    if (!session) return;

    const currentStageDisplay = currentStage?.display_name || "Initializing...";
    const progress = currentStage?.progress || 0;

    // Check if any stage has failed
    const hasFailedStage = stages.some((s) => s.status === "failed");

    // Determine status
    let status: "processing" | "paused" | "failed" | "completed" = "processing";
    if (session.status === "paused") status = "paused";
    else if (session.status === "completed") status = "completed";
    else if (hasFailedStage && currentStage?.status === "failed")
      status = "failed";

    updateJob(sessionId, {
      status,
      progress,
      currentStage: currentStage?.stage_id || "initializing",
      stageDisplayName: currentStageDisplay,
      previewUrl: latestPreview?.preview_url,
      hasFailedStage,
    });
  }, [
    sessionId,
    session?.status,
    currentStage?.stage_id,
    currentStage?.display_name,
    currentStage?.progress,
    currentStage?.status,
    latestPreview?.preview_url,
    stages,
    updateJob,
  ]);

  // Clear preview error when new preview arrives
  useEffect(() => {
    if (latestPreview) {
      setPreviewError(null);
      console.log("[StoryVideoStudio] New preview:", latestPreview);
    }
  }, [latestPreview]);

  // Auto-select latest stage with preview when new preview arrives
  useEffect(() => {
    // Find the latest stage with a preview
    const latestStageWithPreview = [...stages]
      .reverse()
      .find(
        (s) =>
          (s.status === "completed" ||
            s.status === "accepted" ||
            s.status === "reviewing") &&
          s.metadata?.preview_url
      );

    // Auto-select if no stage is selected OR if a new stage completed
    if (latestStageWithPreview && !selectedStageId) {
      console.log(
        "[StoryVideoStudio] Auto-selecting latest stage:",
        latestStageWithPreview.stage_id
      );
      setSelectedStageId(latestStageWithPreview.stage_id);
    }
  }, [stages, latestPreview]);

  // Activity tracking
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
  }, []);

  // Detect stale processing stages
  useEffect(() => {
    const getStaleThreshold = (stageId: string): number => {
      const longRunningStages = ["enhance", "mix_music", "story_assembly"];
      if (longRunningStages.includes(stageId)) {
        return 5 * 60 * 1000; // 5 minutes for compute-intensive stages
      }
      return 2 * 60 * 1000; // 2 minutes for other stages
    };

    const checkStaleStages = () => {
      const now = Date.now();
      const newStaleStages = new Set<string>();

      stages.forEach((stage) => {
        if (stage.status === "processing" && stage.started_at) {
          const startTime = new Date(stage.started_at).getTime();
          const elapsed = now - startTime;
          const threshold = getStaleThreshold(stage.stage_id);

          if (elapsed > threshold) {
            console.warn(
              `[StoryVideoStudio] Stage ${stage.stage_id} is stale - processing for ${Math.floor(elapsed / 1000)}s`
            );
            newStaleStages.add(stage.stage_id);
          }
        }
      });

      setStaleStages(newStaleStages);
    };

    checkStaleStages();
    const interval = setInterval(checkStaleStages, 10000);
    return () => clearInterval(interval);
  }, [stages]);

  // Inactivity timeout (1 hour)
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      const WARN_THRESHOLD = 50 * 60 * 1000; // 50 minutes
      const TIMEOUT_THRESHOLD = 60 * 60 * 1000; // 60 minutes

      if (idleTime > TIMEOUT_THRESHOLD) {
        handleTimeout();
      } else if (idleTime > WARN_THRESHOLD) {
        setShowTimeoutWarning(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInactivity);
  }, [lastActivity]);

  const handleTimeout = async () => {
    try {
      await studioAPI.pauseSession(sessionId, false);
      setShowTimeoutWarning(false);
      setErrorModal({
        isOpen: true,
        message:
          "Session paused due to inactivity. You can resume within 1 hour.",
        type: "info",
      });
    } catch (error) {
      console.error("Failed to auto-pause session:", error);
    }
  };

  const handlePauseResume = async () => {
    updateActivity();
    try {
      if (session?.status === "paused") {
        await studioAPI.resumeSession(sessionId);
      } else {
        await studioAPI.pauseSession(sessionId, true);
      }
    } catch (error) {
      console.error("Failed to pause/resume:", error);
    }
  };

  const handleSkipStage = async (stageId: string) => {
    updateActivity();
    const actionKey = `skip-${stageId}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      await studioAPI.skipStage(sessionId, stageId, "user_manual_skip");
      console.log("[StoryVideoStudio] Skip stage successful:", stageId);
    } catch (error) {
      console.error("Failed to skip stage:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to skip stage. Please try again.",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }, 1000);
    }
  };

  const handleRetryStage = async (stageId: string) => {
    updateActivity();
    const actionKey = `retry-${stageId}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      await studioAPI.retryStage(sessionId, stageId);
      console.log("[StoryVideoStudio] Retry stage successful:", stageId);
    } catch (error) {
      console.error("Failed to retry stage:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to retry stage. Please try again.",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }, 1000);
    }
  };

  const handleAcceptStage = async (stageId: string) => {
    updateActivity();
    const actionKey = `accept-${stageId}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      await studioAPI.acceptStage(sessionId, stageId);
      console.log("[StoryVideoStudio] Accept stage successful:", stageId);
    } catch (error) {
      console.error("Failed to accept stage:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to accept stage. Please try again.",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }, 1000);
    }
  };

  const handleContinueToNextStage = async () => {
    updateActivity();
    setProcessingActions((prev) => new Set([...prev, "continue"]));

    try {
      await studioAPI.resumeSession(sessionId);
    } catch (error) {
      console.error("Failed to continue to next stage:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to continue processing. Please try again.",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const next = new Set(prev);
          next.delete("continue");
          return next;
        });
      }, 1000);
    }
  };

  const handleClose = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Close Session",
      message:
        "Are you sure you want to close? All unsaved progress will be lost.",
      onConfirm: async () => {
        try {
          await studioAPI.cancelSession(sessionId);
        } catch (error) {
          console.error("Failed to cancel session:", error);
        } finally {
          disconnect();
          onClose();
        }
      },
    });
  };

  const handleCancelSession = async () => {
    try {
      await studioAPI.cancelSession(sessionId);
      disconnect();
      onClose();
    } catch (error) {
      console.error("Failed to cancel session:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to cancel session. Please try again.",
        type: "error",
      });
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "skipped":
        return <SkipForward className="h-4 w-4 text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-300" />;
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "accepted":
        return "bg-emerald-50/80 text-emerald-700 border-emerald-200/60";
      case "processing":
        return "bg-blue-50/80 text-blue-700 border-blue-200/60";
      case "failed":
        return "bg-red-50/80 text-red-700 border-red-200/60";
      case "skipped":
        return "bg-slate-50/80 text-slate-500 border-slate-200/60";
      default:
        return "bg-slate-50/50 text-slate-400 border-slate-200/40";
    }
  };

  const completedStages = stages.filter(
    (s) => s.status === "completed" || s.status === "accepted"
  ).length;
  const skippedStages = stages.filter(
    (s) => s.status === "skipped" || s.status === "skipped_auto"
  ).length;
  const totalStages = stages.length;
  // const progressPercent =
  //   totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const isReadyToFinalize =
    totalStages > 0 &&
    completedStages === totalStages &&
    !stages.some((s) => s.status === "processing" || s.status === "pending");

  const allStagesSkipped =
    totalStages > 0 &&
    skippedStages === totalStages &&
    !stages.some((s) => s.status === "processing" || s.status === "pending");

  // Auto-show finalization modal when session completes
  useEffect(() => {
    if (
      session?.status === "completed" &&
      isReadyToFinalize &&
      !showFinalizationModal &&
      completedStages > 0
    ) {
      console.log(
        "[StoryVideoStudio] Session completed, showing finalization modal"
      );
      setShowFinalizationModal(true);
    }
  }, [
    session?.status,
    isReadyToFinalize,
    showFinalizationModal,
    completedStages,
  ]);

  const hasAcceptedOrCompletedStages = stages.some(
    (s) => s.status === "accepted" || s.status === "completed"
  );
  const hasPendingStages = stages.some((s) => s.status === "pending");
  const shouldShowContinueButton =
    session?.auto_proceed === false &&
    !isReadyToFinalize &&
    hasAcceptedOrCompletedStages &&
    hasPendingStages;

  const shouldShowResumeInAutoMode =
    session?.auto_proceed === true &&
    !isReadyToFinalize &&
    hasAcceptedOrCompletedStages &&
    hasPendingStages &&
    !currentStage;

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <SessionHeader
        session={session}
        isConnected={isConnected}
        currentStage={currentStage}
        isReadyToFinalize={isReadyToFinalize}
        shouldShowContinueButton={shouldShowContinueButton}
        shouldShowResumeInAutoMode={shouldShowResumeInAutoMode}
        processingActions={processingActions}
        onClose={handleClose}
        onFinalize={() => setShowFinalizationModal(true)}
        onContinue={handleContinueToNextStage}
        onPauseResume={handlePauseResume}
        customTitle="Story Video Studio"
        customSubtitle={
          autoSelectBest
            ? "Auto-selecting best testimonials"
            : `${testimonialIds.length} testimonials selected`
        }
      />

      {/* Timeout Warning */}
      <AnimatePresence>
        {showTimeoutWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-200/60"
          >
            <div className="max-w-[1600px] mx-auto px-6 py-2.5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-900 font-medium flex-1">
                  Session will pause in 10 minutes due to inactivity
                </p>
                <button
                  onClick={updateActivity}
                  className="h-6 px-2.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-[10px] font-semibold transition-all"
                >
                  I'm here
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Display */}
      <ConnectionStatusBanner
        sseError={sseError}
        isConnected={isConnected}
        onReconnect={() => {
          disconnect();
          setTimeout(() => connect(), 500);
        }}
        sanitizeErrorMessage={sanitizeErrorMessage}
      />

      {/* Main Content - World-class layout */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preview - Large and prominent */}
          <div className="lg:col-span-5 xl:col-span-6">
            <div className="sticky top-24">
              <div className="rounded-xl bg-white border border-slate-200/60 shadow-lg overflow-hidden">
                {/* Preview Header */}
                <div className="border-b border-slate-200/40 bg-gradient-to-r from-slate-50 to-slate-100/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Play
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                        />
                      </div>
                      <h3 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wide">
                        Live Preview
                      </h3>
                    </div>
                    {latestPreview && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0.5 font-semibold bg-purple-50/80 text-purple-700 border-purple-200/60 uppercase tracking-wide"
                      >
                        Latest
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-4 space-y-4">
                  {/* Stage Navigation Timeline */}
                  <StageNavigationBar
                    stages={stages}
                    selectedStageId={selectedStageId}
                    onStageSelect={setSelectedStageId}
                  />

                  {/* Video Preview */}
                  <PreviewSection
                    stages={stages}
                    latestPreview={latestPreview}
                    currentStage={currentStage}
                    previewError={previewError}
                    sessionId={sessionId}
                    selectedStageId={selectedStageId}
                    onCopyPreviewUrl={() => {
                      if (latestPreview?.preview_url) {
                        navigator.clipboard.writeText(
                          latestPreview.preview_url
                        );
                        setErrorModal({
                          isOpen: true,
                          message: "Preview URL copied to clipboard",
                          type: "success",
                        });
                      }
                    }}
                    setPreviewError={setPreviewError}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stages List - Compact and clean */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-2.5">
            {/* Show message when all stages are skipped */}
            {allStagesSkipped && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-8 text-center mb-4">
                <SkipForward className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <p className="text-sm font-semibold text-amber-900 mb-2">
                  All Processing Stages Skipped
                </p>
                <p className="text-xs text-amber-700 mb-6 max-w-md mx-auto">
                  All stages in this session have been skipped. You can start a
                  new processing session or go back to select different
                  services.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Back to Services
                  </button>
                  <button
                    onClick={handleCancelSession}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Close Session
                  </button>
                </div>
              </div>
            )}

            {stages.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300/60 bg-white p-12 text-center">
                {isConnected && session?.status === "active" ? (
                  <>
                    <Loader2 className="h-12 w-12 text-slate-400 animate-spin mx-auto mb-4" />
                    <p className="text-[13px] font-semibold text-slate-700">
                      Initializing processing stages...
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      This may take a few moments
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-[13px] font-semibold text-slate-700">
                      No processing stages found
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 mb-4">
                      This session appears to be incomplete or corrupted
                    </p>
                    <button
                      onClick={handleCancelSession}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel Session
                    </button>
                  </>
                )}
              </div>
            ) : (
              stages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  currentStage={currentStage}
                  session={session}
                  staleStages={staleStages}
                  processingActions={processingActions}
                  stages={stages}
                  onRetryStage={handleRetryStage}
                  onSkipStage={handleSkipStage}
                  onAcceptStage={handleAcceptStage}
                  onContinueToNextStage={handleContinueToNextStage}
                  onCancelSession={handleCancelSession}
                  getStageStatusIcon={getStageStatusIcon}
                  getStageStatusColor={getStageStatusColor}
                  sanitizeErrorMessage={sanitizeErrorMessage}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFinalizationModal && (
        <FinalizationModal
          sessionId={sessionId}
          completedStages={completedStages}
          totalStages={totalStages}
          stages={stages}
          onClose={() => setShowFinalizationModal(false)}
        />
      )}

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() =>
          setErrorModal({ isOpen: false, message: "", type: "error" })
        }
        message={errorModal.message}
        type={errorModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {},
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={true}
        confirmText="Close Session"
        cancelText="Keep Working"
      />
    </div>
  );
};

export default StoryVideoStudio;
