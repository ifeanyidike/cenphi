import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  SkipForward,
  AlertTriangle,
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

interface SessionStudioProps {
  sessionId: string;
  testimonialId?: string; // Optional fallback when session.testimonial_id is not available
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
    "Crop/Resize error": "Unable to adjust video dimensions. Please try again.",
    "Transcription error": "Unable to generate captions. Please try again.",
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

const SessionStudio: React.FC<SessionStudioProps> = ({
  sessionId,
  testimonialId: propTestimonialId,
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

  // CRITICAL: Reset all state when sessionId changes
  useEffect(() => {
    setPreviewError(null);
    setProcessingActions(new Set());
    setStaleStages(new Set());
    setSelectedStageId(null);
  }, [sessionId]);
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
    console.log("[SessionStudio] Register job effect triggered");
    console.log("[SessionStudio] Session:", session);
    console.log("[SessionStudio] Session type:", session?.session_type);

    if (!session || !session.session_type) {
      console.log(
        "[SessionStudio] Skipping registerJob - session or session_type missing"
      );
      return;
    }

    const serviceType = session.session_type as any;
    const serviceName = getServiceDisplayName(serviceType);
    const currentStageDisplay = currentStage?.display_name || "Initializing...";
    const progress = currentStage?.progress || 0;

    console.log("[SessionStudio] Calling registerJob with:", {
      sessionId: session.id,
      serviceType,
      serviceName,
      studioUrl: location.pathname + location.search,
    });

    registerJob({
      sessionId: session.id,
      testimonialId: session.testimonial_id || propTestimonialId,
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
    session?.testimonial_id,
    session?.status,
    session?.started_at,
    propTestimonialId,
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

    // Determine status - IMPORTANT: Handle cancelled sessions
    let status: "processing" | "paused" | "failed" | "completed" | "cancelled" =
      "processing";
    if (session.status === "cancelled") status = "cancelled";
    else if (session.status === "paused") status = "paused";
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

  // DO NOT auto-remove jobs when complete - let users manually dismiss or keep for reference
  // Jobs will be cleaned up after 48 hours via TTL in ProcessingMonitorContext

  // Clear preview error when new preview arrives
  useEffect(() => {
    if (latestPreview) {
      setPreviewError(null);
      console.log("[SessionStudio] New preview:", latestPreview);
    }
  }, [latestPreview]);
  console.log("latestPreview", latestPreview);

  // Auto-select latest stage with preview when new preview arrives
  // SPECIAL CASE: For clipping sessions, always auto-select extract_clips stage when it completes
  useEffect(() => {
    const isClippingSession = session?.session_type === "clipping";

    // For clipping sessions, prioritize extract_clips stage
    if (isClippingSession) {
      const extractClipsStage = stages.find(
        (s) =>
          s.stage_id === "extract_clips" &&
          (s.status === "completed" ||
            s.status === "accepted" ||
            s.status === "reviewing") &&
          s.metadata?.clips
      );

      if (extractClipsStage && selectedStageId !== "extract_clips") {
        console.log(
          "[SessionStudio] Auto-selecting extract_clips stage for clipping session"
        );
        setSelectedStageId("extract_clips");
        return;
      }
    }

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
        "[SessionStudio] Auto-selecting latest stage:",
        latestStageWithPreview.stage_id
      );
      setSelectedStageId(latestStageWithPreview.stage_id);
    }
  }, [stages, latestPreview, session?.session_type, selectedStageId]);
  // Log connection status changes
  useEffect(() => {
    console.log(
      `[SessionStudio] SSE connection status: ${isConnected ? "CONNECTED" : "DISCONNECTED"}`
    );
  }, [isConnected]);

  // Activity tracking
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
  }, []);

  // Auto-accept completed stages after 10 minutes in step-by-step mode
  useEffect(() => {
    if (session?.auto_proceed) return; // Only for step-by-step mode

    const AUTO_ACCEPT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

    const checkAutoAccept = () => {
      const now = Date.now();

      stages.forEach((stage) => {
        if (
          stage.status === "completed" &&
          stage.completed_at &&
          !stage.skip_reason
        ) {
          const completedTime = new Date(stage.completed_at).getTime();
          const elapsed = now - completedTime;

          // Auto-accept if completed for more than 10 minutes
          if (elapsed > AUTO_ACCEPT_TIMEOUT) {
            console.log(
              `[SessionStudio] Auto-accepting stage ${stage.stage_id} after 10 minutes`
            );
            handleAcceptStage(stage.stage_id).catch((err) => {
              console.error("[SessionStudio] Auto-accept failed:", err);
            });
          }
        }
      });
    };

    // Check every 30 seconds
    const interval = setInterval(checkAutoAccept, 30000);

    // Check immediately on mount/stages change
    checkAutoAccept();

    return () => clearInterval(interval);
  }, [session?.auto_proceed, stages]);

  // Detect stale processing stages immediately and continuously
  useEffect(() => {
    // Stage-specific stale thresholds based on typical processing time
    const getStaleThreshold = (stageId: string): number => {
      // Very long operations that can take 10+ minutes
      const veryLongRunningStages = [
        "assemble_clips", // Story video assembly with multiple clips
        "add_intro_outro", // Intro/outro generation with voiceover
      ];

      // Long operations that typically take 5-8 minutes
      const longRunningStages = [
        "enhance", // Video enhancement
        "mix_music", // Music mixing
        "burn_captions", // Caption burning
        "story_assembly", // Legacy story assembly
        "extract_clips", // Clip extraction
      ];

      if (veryLongRunningStages.includes(stageId)) {
        return 12 * 60 * 1000; // 12 minutes for very long operations
      }
      if (longRunningStages.includes(stageId)) {
        return 6 * 60 * 1000; // 6 minutes for long operations
      }
      return 3 * 60 * 1000; // 3 minutes for standard operations (increased from 2)
    };

    const checkStaleStages = () => {
      const now = Date.now();
      const newStaleStages = new Set<string>();

      stages.forEach((stage) => {
        if (stage.status === "processing" && stage.started_at) {
          const startTime = new Date(stage.started_at).getTime();
          const elapsed = now - startTime;
          const threshold = getStaleThreshold(stage.stage_id);

          // Mark as stale if processing beyond threshold with no progress
          if (elapsed > threshold) {
            console.warn(
              `[SessionStudio] Stage ${stage.stage_id} is stale - processing for ${Math.floor(elapsed / 1000)}s (threshold: ${threshold / 1000}s)`
            );
            newStaleStages.add(stage.stage_id);
          }
        }
      });

      if (newStaleStages.size > 0) {
        console.log(
          `[SessionStudio] Found ${newStaleStages.size} stale stages:`,
          Array.from(newStaleStages)
        );
      }

      setStaleStages(newStaleStages);
    };

    // Check immediately when stages load or change
    checkStaleStages();

    // Then check every 10 seconds for real-time detection
    const interval = setInterval(checkStaleStages, 10000);

    return () => clearInterval(interval);
  }, [stages]);

  // Inactivity timeout (1 hour)
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      const WARN_THRESHOLD = 50 * 60 * 1000; // 50 minutes
      const TIMEOUT_THRESHOLD = 60 * 60 * 1000; // 60 minutes (1 hour)

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
      await studioAPI.pauseSession(sessionId, false); // pausedByUser: false
      setShowTimeoutWarning(false);
      // Show notification that session was paused
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
        await studioAPI.pauseSession(sessionId, true); // pausedByUser: true
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
      console.log("[SessionStudio] Skip stage successful:", stageId);
    } catch (error) {
      console.error("Failed to skip stage:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to skip stage. Please try again.",
        type: "error",
      });
    } finally {
      // Remove action from processing after a short delay (SSE should update faster)
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
      console.log("[SessionStudio] Retry stage successful:", stageId);
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

  const handleUpdateStageConfig = async (
    stageId: string,
    config: Record<string, any>
  ) => {
    updateActivity();
    try {
      await studioAPI.updateStageConfig(sessionId, stageId, config);
      console.log("[SessionStudio] Stage config updated:", stageId, config);
    } catch (error) {
      console.error("Failed to update stage config:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to update configuration. Please try again.",
        type: "error",
      });
    }
  };

  const handleAcceptStage = async (stageId: string) => {
    updateActivity();
    const actionKey = `accept-${stageId}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      await studioAPI.acceptStage(sessionId, stageId);
      console.log("[SessionStudio] Accept stage successful:", stageId);
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

  const handleRegenerateText = async (stageId: string) => {
    updateActivity();
    const actionKey = `regenerate-${stageId}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      await studioAPI.regenerateTextOptimization(sessionId, stageId);
      console.log("[SessionStudio] Regenerate text successful:", stageId);
    } catch (error) {
      console.error("Failed to regenerate text:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to regenerate text. Please try again.",
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

  const handleClipsSaveComplete = () => {
    // After clips are saved/discarded, close the session and return to service selector
    console.log("[SessionStudio] Clips saved/discarded successfully");
    disconnect();
    onClose();

    // IMPORTANT: After closing, the user should be able to see their saved clips
    // The testimonial data will be refetched when they navigate to the details page
  };

  const handleContinueToNextStage = async () => {
    updateActivity();
    setProcessingActions((prev) => new Set([...prev, "continue"]));

    try {
      console.log("[SessionStudio] Continuing to next stage...");
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
          // Cancel session and cleanup temp artifacts
          await studioAPI.cancelSession(sessionId);
        } catch (error) {
          console.error("Failed to cancel session:", error);
          // Continue with close anyway
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

  // Get aspect ratio for preview - use exact dimensions from metadata OR fallback to platform defaults
  // const getPreviewAspectRatio = () => {
  //   // Priority 1: Check preview metadata for aspect_ratio
  //   if (
  //     latestPreview?.metadata?.aspect_ratio &&
  //     typeof latestPreview.metadata.aspect_ratio === "string"
  //   ) {
  //     console.log(
  //       "[SessionStudio] Using aspect_ratio from preview metadata:",
  //       latestPreview.metadata.aspect_ratio
  //     );
  //     return latestPreview.metadata.aspect_ratio.replace(":", "/");
  //   }

  //   // Priority 2: Calculate from width and height in metadata
  //   const { width, height } = latestPreview?.metadata || {};
  //   if (width && height) {
  //     console.log(
  //       "[SessionStudio] Calculating from width/height:",
  //       width,
  //       height
  //     );
  //     return `${width}/${height}`;
  //   }

  //   // Priority 3: Derive from platform in preview metadata OR any completed stage metadata
  //   let platform = (latestPreview?.metadata as any)?.platform;

  //   // If no platform in latest preview, check all completed stages for platform
  //   if (!platform && stages.length > 0) {
  //     for (const stage of stages) {
  //       if (stage.metadata?.platform) {
  //         platform = stage.metadata.platform;
  //         console.log(
  //           `[SessionStudio] Found platform in stage ${stage.stage_id}:`,
  //           platform
  //         );
  //         break;
  //       }
  //     }
  //   }

  //   if (platform) {
  //     const platformAspectRatios: Record<string, string> = {
  //       instagram_reels: "9/16",
  //       instagram_story: "9/16",
  //       instagram_feed: "1/1",
  //       tiktok: "9/16",
  //       youtube_shorts: "9/16",
  //       youtube_standard: "16/9",
  //       facebook: "16/9",
  //       linkedin: "16/9",
  //       twitter: "16/9",
  //     };

  //     if (platformAspectRatios[platform]) {
  //       console.log(
  //         `[SessionStudio] Using aspect ratio from platform: ${platform} -> ${platformAspectRatios[platform]}`
  //       );
  //       return platformAspectRatios[platform];
  //     }
  //   }

  //   // Priority 4: Default fallback
  //   console.warn(
  //     "[SessionStudio] No aspect ratio found, using default 16/9. Preview:",
  //     latestPreview,
  //     "Stages:",
  //     stages
  //   );
  //   return "16/9";
  // };

  // CRITICAL FIX: Count "reviewing" stages as done for finalization purposes
  // When all stages are done (completed/accepted/reviewing), show Finalize instead of Continue
  const completedStages = stages.filter(
    (s) =>
      s.status === "completed" ||
      s.status === "accepted" ||
      s.status === "reviewing"
  ).length;
  const skippedStages = stages.filter(
    (s) => s.status === "skipped" || s.status === "skipped_auto"
  ).length;
  const totalStages = stages.length;
  // const progressPercent =
  //   totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  // Check if session is ready for finalization
  // All stages must be either completed/accepted/reviewing/skipped (no pending/processing left)
  // SPECIAL CASE: For clipping sessions, DON'T show finalize until clips are explicitly saved
  const isClippingSession = session?.session_type === "clipping";
  const isReadyToFinalize =
    !isClippingSession && // Never auto-finalize clipping sessions
    totalStages > 0 &&
    completedStages + skippedStages === totalStages &&
    !stages.some((s) => s.status === "processing" || s.status === "pending");

  // Check if all stages are skipped (session is stuck)
  const allStagesSkipped =
    totalStages > 0 &&
    skippedStages === totalStages &&
    !stages.some((s) => s.status === "processing" || s.status === "pending");

  // Check if session is effectively complete (all stages either completed or skipped)
  const isSessionComplete =
    totalStages > 0 &&
    completedStages + skippedStages === totalStages &&
    !stages.some((s) => s.status === "processing" || s.status === "pending");

  // Auto-show finalization modal when session completes with successful stages
  useEffect(() => {
    if (
      session?.status === "completed" &&
      isReadyToFinalize &&
      !showFinalizationModal &&
      completedStages > 0
    ) {
      console.log(
        "[SessionStudio] Session completed with results, showing finalization modal"
      );
      setShowFinalizationModal(true);
    }
  }, [
    session?.status,
    isReadyToFinalize,
    showFinalizationModal,
    completedStages,
  ]);

  // Debug: Log session and stage state for Continue button troubleshooting
  useEffect(() => {
    console.log("[SessionStudio] Session State:", {
      session_id: sessionId,
      auto_proceed: session?.auto_proceed,
      session_status: session?.status,
      total_stages: totalStages,
      completed_stages: completedStages,
      skipped_stages: skippedStages,
      all_stages_skipped: allStagesSkipped,
      is_session_complete: isSessionComplete,
      isReadyToFinalize,
      currentStage: currentStage?.stage_id,
      stages: stages.map((s) => ({
        stage_id: s.stage_id,
        status: s.status,
        has_preview: !!s.metadata?.preview_url,
      })),
    });
  }, [
    session?.auto_proceed,
    session?.status,
    stages,
    currentStage,
    skippedStages,
    allStagesSkipped,
    isSessionComplete,
  ]);

  // Calculate if Continue button should show
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

  console.log("[SessionStudio] Continue/Resume Button Conditions:", {
    auto_proceed: session?.auto_proceed,
    isReadyToFinalize,
    hasAcceptedOrCompletedStages,
    hasPendingStages,
    currentStage: currentStage?.stage_id,
    shouldShowContinueButton,
    shouldShowResumeInAutoMode,
    willShowButton: shouldShowContinueButton || shouldShowResumeInAutoMode,
  });

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
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
                        className="text-[9px] px-1.5 py-0.5 font-semibold bg-blue-50/80 text-blue-700 border-blue-200/60 uppercase tracking-wide"
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
                    onRegenerateText={handleRegenerateText}
                    onClipsSaveComplete={handleClipsSaveComplete}
                    testimonialId={session?.testimonial_id || propTestimonialId}
                    onShowError={(message, type = "error") => {
                      setErrorModal({
                        isOpen: true,
                        message,
                        type,
                      });
                    }}
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
                  onUpdateStageConfig={handleUpdateStageConfig}
                  getStageStatusIcon={getStageStatusIcon}
                  getStageStatusColor={getStageStatusColor}
                  sanitizeErrorMessage={sanitizeErrorMessage}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Finalization Modal */}
      {showFinalizationModal && (
        <FinalizationModal
          sessionId={sessionId}
          completedStages={completedStages}
          totalStages={totalStages}
          stages={stages}
          onClose={() => setShowFinalizationModal(false)}
        />
      )}

      {/* Error/Success Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() =>
          setErrorModal({ isOpen: false, message: "", type: "error" })
        }
        message={errorModal.message}
        type={errorModal.type}
      />

      {/* Confirmation Modal */}
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

export default SessionStudio;
