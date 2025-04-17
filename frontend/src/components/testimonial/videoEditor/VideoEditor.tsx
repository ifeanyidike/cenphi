import React, { useEffect, useRef, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { VideoEditMode } from "../../../repo/managers/video_editor";
import VideoPlayer from "./VideoPlayer";
import VideoEditorToolbar from "./VideoEditorToolbar";
import VideoTimeline from "./VideoTimeline";
import SubtitlePanel from "./panels/SubtitlePanel";
import CropPanel from "./panels/CropPanel";
import TransformPanel from "./panels/TransformPanel";
import TrimPanel from "./panels/TrimPanel";
import FiltersPanel from "./panels/FiltersPanel";
import ExportPanel from "./panels/ExportPanel";
import HistoryPanel from "./panels/HistoryPanel";
import VideoEditorShortcuts from "./VideoEditorShortcuts";
import { runInAction } from "mobx";
import AutoRecoveryPrompt from "./AutoRecoveryPrompt";
import PerformanceDropdown from "./PerformanceDropdownPortal";
import { Testimonial } from "@/types/testimonial";

interface VideoEditorProps {
  testimonial: Testimonial;
  onClose: () => void;
  onSave: (testimonial: Testimonial) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = observer(
  ({ testimonial, onClose, onSave }) => {
    const { videoEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const [isInitialized, setIsInitialized] = useState(false);
    const [exitingEditor, setExitingEditor] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] =
      useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showPerformanceOptions, setShowPerformanceOptions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [useHighPerformanceMode, setUseHighPerformanceMode] = useState(false);
    const [qualityPreset, setQualityPreset] = useState("balanced");
    const [showRecoveryDialog, setShowRecoveryDialog] =
      useState<boolean>(false);
    const [, setAutoSaveData] = useState<any>(null);

    useEffect(() => {
      if (testimonial.format !== "video") {
        console.error("VideoEditor can only edit video testimonials");
        onClose();
        return;
      }

      const initEditor = async () => {
        try {
          await videoEditorManager.initEditor(testimonial);

          const hasAutoSave = videoEditorManager.checkAutoSave();
          if (hasAutoSave) {
            setAutoSaveData(hasAutoSave);
            setShowRecoveryDialog(true);
          }

          // Start auto-save
          videoEditorManager.startAutoSave();

          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing video editor:", error);
          onClose();
        }
      };

      initEditor();

      // Handle keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) =>
        runInAction(() => {
          // Don't capture shortcuts if typing in an input
          if (
            ["INPUT", "TEXTAREA"].includes(
              (e.target as HTMLElement)?.tagName || ""
            )
          ) {
            return;
          }

          // Show keyboard shortcuts help with '?' key
          if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
            e.preventDefault();
            setShowKeyboardShortcuts(true);
            return;
          }

          // Space to toggle play/pause
          if (e.code === "Space") {
            e.preventDefault();
            videoEditorManager.togglePlay();
          }

          // J/K/L for video navigation (like professional video editors)
          if (e.key === "j") {
            // Rewind 5 seconds
            videoEditorManager.seek(
              Math.max(0, videoEditorManager.currentTime - 5)
            );
          }
          if (e.key === "k") {
            // Play/pause
            videoEditorManager.togglePlay();
          }
          if (e.key === "l") {
            // Forward 5 seconds
            videoEditorManager.seek(
              Math.min(
                videoEditorManager.duration,
                videoEditorManager.currentTime + 5
              )
            );
          }

          // Arrow keys for frame-by-frame navigation
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            // Shift+Left for bigger jump
            const skipAmount = e.shiftKey ? 10 : 1;
            videoEditorManager.seek(
              Math.max(0, videoEditorManager.currentTime - skipAmount)
            );
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            // Shift+Right for bigger jump
            const skipAmount = e.shiftKey ? 10 : 1;
            videoEditorManager.seek(
              Math.min(
                videoEditorManager.duration,
                videoEditorManager.currentTime + skipAmount
              )
            );
          }

          // Tool shortcuts
          if (e.key === "c") {
            videoEditorManager.setEditMode(
              videoEditorManager.activeEditMode === "crop" ? null : "crop"
            );
          }
          if (e.key === "t") {
            videoEditorManager.setEditMode(
              videoEditorManager.activeEditMode === "trim" ? null : "trim"
            );
          }
          if (e.key === "r") {
            videoEditorManager.setEditMode(
              videoEditorManager.activeEditMode === "transform"
                ? null
                : "transform"
            );
          }
          if (e.key === "f") {
            videoEditorManager.setEditMode(
              videoEditorManager.activeEditMode === "filters" ? null : "filters"
            );
          }
          if (e.key === "s") {
            videoEditorManager.setEditMode(
              videoEditorManager.activeEditMode === "subtitles"
                ? null
                : "subtitles"
            );
          }

          // Undo/Redo (Cmd/Ctrl + Z/Y)
          if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !e.shiftKey) {
            e.preventDefault();
            videoEditorManager.undo();
            return;
          }
          if (
            (e.metaKey || e.ctrlKey) &&
            (e.code === "KeyY" || (e.code === "KeyZ" && e.shiftKey))
          ) {
            e.preventDefault();
            videoEditorManager.redo();
            return;
          }

          // ESC to exit current editing mode
          if (e.code === "Escape") {
            if (showKeyboardShortcuts) {
              setShowKeyboardShortcuts(false);
            } else if (videoEditorManager.activeEditMode) {
              e.preventDefault();
              videoEditorManager.setEditMode(null);
            }
          }
        });

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [testimonial]);

    // Apply performance optimizations when changed
    useEffect(() => {
      // These settings would affect how canvas rendering behaves
      // In a real implementation, you would have more granular control

      // Example: Lower quality preview rendering during edits
      videoEditorManager.setPreviewQuality(
        (useHighPerformanceMode ? "low" : qualityPreset) as
          | "low"
          | "balanced"
          | "high"
      );

      // Cache frame during playback to reduce CPU usage
      videoEditorManager?.setCacheFrames?.(useHighPerformanceMode);
    }, [useHighPerformanceMode, qualityPreset, videoEditorManager]);

    useEffect(() => {
      const handleVideoEnd = () => {
        if (videoEditorManager && videoEditorManager.isPlaying === false) {
          setTimeout(() => {
            // Redraw the canvas to prevent size issues
            if (window.canvasCoordinator) {
              window.canvasCoordinator.clearTransformCache();

              // Force a render cycle
              window.canvasCoordinator.startRendering();

              // Then stop rendering after a short delay to save resources
              setTimeout(() => {
                if (!videoEditorManager.isPlaying) {
                  window.canvasCoordinator.stopRendering();
                }
              }, 500);
            }
          }, 100);
        }
      };

      // Set up a listener for custom video-ended event (we'll trigger this from VideoPreview)
      document.addEventListener("video-ended", handleVideoEnd);

      // Also handle play state changes
      // const playStateChangeHandler = () => {
      //   if (!videoEditorManager.isPlaying) {
      //     // Video was paused or ended
      //     handleVideoEnd();
      //   }
      // };

      // Clean up event listeners
      return () => {
        document.removeEventListener("video-ended", handleVideoEnd);
      };
    }, [videoEditorManager]);

    useEffect(() => {
      // Reset canvas positioning whenever the activeEditMode changes
      if (window.canvasCoordinator) {
        window.canvasCoordinator.clearTransformCache();
        window.canvasCoordinator.startRendering();

        // Ensure we're actually drawing something
        setTimeout(() => {
          // Make sure the canvas is properly rendering
          if (window.canvasCoordinator) {
            window.canvasCoordinator.drawVideoFrame();
          }
        }, 50);
      }
    }, [videoEditorManager.activeEditMode]);

    // Helper to get the active panel based on the editing mode
    const getActivePanel = useCallback(() => {
      if (!videoEditorManager.activeEditMode) return null;

      switch (videoEditorManager.activeEditMode) {
        case "subtitles":
          return <SubtitlePanel />;
        case "crop":
          return <CropPanel />;
        case "transform":
          return <TransformPanel />;
        case "trim":
          return <TrimPanel />;
        case "filters":
          return <FiltersPanel />;
        default:
          return null;
      }
    }, [videoEditorManager.activeEditMode]);

    // Handle saving the edits
    const handleSave = async () => {
      videoEditorManager.setProcessingStatus("Saving changes...");

      try {
        const success = await videoEditorManager.saveEdits();
        if (success) {
          exitEditor(true);
        } else {
          throw new Error("Failed to save edits");
        }
      } catch (error) {
        console.error("Error saving edits:", error);
        // Show error notification
        alert("Failed to save changes. Please try again.");
        videoEditorManager.setProcessingStatus("");
      }
    };

    // Handle discarding the edits
    const handleDiscard = () => {
      if (videoEditorManager.isDirty) {
        setShowUnsavedChangesModal(true);
      } else {
        videoEditorManager.discardEdits();
        exitEditor(false);
      }
    };

    // Exit the editor with animation
    const exitEditor = (saved: boolean) => {
      setExitingEditor(true);
      setTimeout(() => {
        if (saved && testimonial) {
          onSave(testimonial);
        }
        onClose();
      }, 300);
    };

    // Handle video player ready event
    const handleVideoReady = () => {
      setIsVideoReady(true);
    };

    // Confirm discard changes
    const confirmDiscard = () => {
      videoEditorManager.discardEdits();
      setShowUnsavedChangesModal(false);
      exitEditor(false);
    };

    // Performance options change handler
    const handlePerformanceChange = (preset: string) => {
      switch (preset) {
        case "performance":
          setUseHighPerformanceMode(true);
          setQualityPreset("low");
          break;
        case "quality":
          setUseHighPerformanceMode(false);
          setQualityPreset("high");
          break;
        case "balanced":
        default:
          setUseHighPerformanceMode(false);
          setQualityPreset("balanced");
          break;
      }
      setShowPerformanceOptions(false);
    };

    // Loading state
    if (!isInitialized) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
            </div>
            <p className="mt-4 text-white text-lg font-medium">
              Loading Editor...
            </p>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        className={`fixed inset-0 z-50 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-950"
            : "bg-gradient-to-br from-gray-50 to-white"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: exitingEditor ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        ref={containerRef}
      >
        {/* Processing overlay */}
        <AnimatePresence>
          {videoEditorManager.isProcessing && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {videoEditorManager.processingStatus}
              </h3>

              {videoEditorManager.processingProgress > 0 && (
                <div className="w-64 mt-4">
                  <div className="h-1.5 w-full bg-gray-700 rounded-full ">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${videoEditorManager.processingProgress}%`,
                      }}
                    ></motion.div>
                  </div>
                  <p className="text-center text-sm text-gray-300 mt-2">
                    {Math.round(videoEditorManager.processingProgress)}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-b ${
            isDarkMode
              ? "border-gray-800 bg-gray-900/95 backdrop-blur-md"
              : "border-gray-200 bg-white/95 backdrop-blur-md"
          } shadow-lg z-30`}
        >
          <div className="flex items-center">
            <button
              className={`text-${isDarkMode ? "white" : "black"} mr-4 p-2 rounded-full hover:bg-${isDarkMode ? "gray-800" : "gray-100"} transition-colors focus:outline-none`}
              onClick={handleDiscard}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1
              className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Video Editor{" "}
              <span className="text-sm font-normal opacity-60">
                • {testimonial.customer_profile?.name || "Testimonial"}
              </span>
            </h1>

            {/* Indicator for unsaved changes */}
            {videoEditorManager.isDirty && (
              <div className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Unsaved Changes
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <PerformanceDropdown
              isDarkMode={isDarkMode}
              showPerformanceOptions={showPerformanceOptions}
              setShowPerformanceOptions={setShowPerformanceOptions}
              handlePerformanceChange={handlePerformanceChange}
              useHighPerformanceMode={useHighPerformanceMode}
              qualityPreset={qualityPreset}
            />

            {/* Keyboard shortcuts button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => (videoEditorManager.activeEditMode = "history")}
              title="View Edit History"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setShowKeyboardShortcuts(true)}
              title="Keyboard Shortcuts"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </motion.button>

            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={handleDiscard}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                videoEditorManager.isDirty
                  ? isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handleSave}
              disabled={!videoEditorManager.isDirty}
            >
              Save Changes
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-64px)] ">
          <AnimatePresence>
            {videoEditorManager.activeEditMode && (
              <motion.div
                className={`w-80 border-r ${
                  isDarkMode
                    ? "border-gray-800 bg-gray-900/95 backdrop-blur-md"
                    : "border-gray-200 bg-white/95 backdrop-blur-md"
                } overflow-y-auto shadow-lg z-20 max-h-[calc(100vh-64px)]`}
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {getActivePanel()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center - Video Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            <VideoEditorToolbar />

            <div className="relative flex-1 flex items-center justify-center p-2 ">
              <div className="w-full h-full flex items-center justify-center">
                <VideoPlayer onReady={handleVideoReady} />

                {!isVideoReady && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
                      <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`border-t ${
                isDarkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <VideoTimeline />
            </div>
          </div>

          <AnimatePresence>
            {videoEditorManager.activeEditMode ===
              ("export" as VideoEditMode) && (
              <motion.div
                className={`w-80 border-l ${
                  isDarkMode
                    ? "border-gray-800 bg-gray-900/95 backdrop-blur-md"
                    : "border-gray-200 bg-white/95 backdrop-blur-md"
                } overflow-y-auto shadow-lg z-20 max-h-[calc(100vh-64px)]`}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <ExportPanel />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {videoEditorManager.activeEditMode ===
              ("history" as VideoEditMode) && (
              <motion.div
                className={`w-80 border-l ${
                  isDarkMode
                    ? "border-gray-800 bg-gray-900/95 backdrop-blur-md"
                    : "border-gray-200 bg-white/95 backdrop-blur-md"
                } overflow-y-auto shadow-lg z-20 max-h-[calc(100vh-64px)]`}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <HistoryPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showUnsavedChangesModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Unsaved Changes
                </h3>
                <p
                  className={`mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  You have unsaved changes. Are you sure you want to exit
                  without saving?
                </p>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowUnsavedChangesModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDarkMode
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                    onClick={confirmDiscard}
                  >
                    Discard Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Modal */}
        <VideoEditorShortcuts
          isDarkMode={isDarkMode}
          setShowKeyboardShortcuts={setShowKeyboardShortcuts}
          showKeyboardShortcuts={showKeyboardShortcuts}
        />

        <AnimatePresence>
          {showRecoveryDialog && <AutoRecoveryPrompt />}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export default VideoEditor;
