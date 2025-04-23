import React, { useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { useBreakpointDown } from "../../../utils/responsiveUtils";
import type {
  VideoEditMode,
  AspectRatio,
} from "../../../repo/managers/video_editor";
import { Redo, Undo } from "lucide-react";
import { cn } from "@/lib/utils";
import { runInAction } from "mobx";

interface ToolButton {
  id: VideoEditMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  shortcut?: string;
  hideWhenProcessed?: boolean;
  previewAction?: () => Promise<void>;
}

const VideoEditorToolbar = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    activeEditMode,
    aspectRatio,
    setAspectRatio,
    setEditMode,
    undo,
    redo,
    editHistory,
    historyIndex,
    isProcessing,
    videoWidth,
    videoHeight,
    previewEdit,
    applyEdit, // Using our new method for applying edits
    processedVideoUrl,
    isPlaying,
    play,
    pause,
    showSubtitles,
    toggleSubtitles,
    duration,
    currentTime,
  } = videoEditorManager;

  const [hoveredTool, setHoveredTool] = useState<VideoEditMode | null>(null);
  const [showAspectRatios, setShowAspectRatios] = useState(false);
  const [applyingPreview, setApplyingPreview] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useBreakpointDown("sm");
  const isTablet = useBreakpointDown("md");

  // Handle scroll behavior to auto-hide toolbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowToolbar(false);
      } else {
        setShowToolbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Enhanced tool buttons configuration with preview-only actions
  const toolButtons: ToolButton[] = [
    {
      id: "crop",
      label: "Crop",
      icon: (
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
      description: "Crop video frame",
      shortcut: "C",
      hideWhenProcessed: true,
      previewAction: async () => {
        setApplyingPreview(true);
        try {
          // Now uses our optimized preview method
          await previewEdit("crop");
        } catch (error) {
          console.error("Failed to preview crop:", error);
        } finally {
          setApplyingPreview(false);
        }
      },
    },
    {
      id: "trim",
      label: "Trim",
      icon: (
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
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: "Trim video duration",
      shortcut: "T",
      hideWhenProcessed: true,
      previewAction: async () => {
        setApplyingPreview(true);
        try {
          // Now uses our optimized preview method
          await previewEdit("trim");
        } catch (error) {
          console.error("Failed to preview trim:", error);
        } finally {
          setApplyingPreview(false);
        }
      },
    },
    // Other tools remain the same...
    {
      id: "transform",
      label: "Transform",
      icon: (
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      description: "Rotate and flip video",
      shortcut: "R",
      hideWhenProcessed: true,
      // previewAction: async () => {
      //   setApplyingPreview(true);
      //   try {
      //     await previewEdit("transform");
      //   } catch (error) {
      //     console.error("Failed to preview transform:", error);
      //   } finally {
      //     setApplyingPreview(false);
      //   }
      // },
    },
    {
      id: "filters",
      label: "Filters",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      description: "Apply video filters",
      shortcut: "F",
      hideWhenProcessed: true,
      // previewAction: async () => {
      //   setApplyingPreview(true);
      //   try {
      //     await previewEdit("filters");
      //   } catch (error) {
      //     console.error("Failed to preview filters:", error);
      //   } finally {
      //     setApplyingPreview(false);
      //   }
      // },
    },
    {
      id: "subtitles",
      label: "Subtitles",
      icon: (
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
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
      description: "Add and edit subtitles",
      shortcut: "S",
    },
  ];

  // Aspect ratio options with improved labels
  const aspectRatioOptions: Array<{
    id: AspectRatio;
    label: string;
    description: string;
  }> = [
    {
      id: "original",
      label: "Original",
      description: "Keep original aspect ratio",
    },
    {
      id: "16:9",
      label: "16:9",
      description: "Widescreen (landscape)",
    },
    {
      id: "4:3",
      label: "4:3",
      description: "Standard TV format",
    },
    {
      id: "1:1",
      label: "1:1",
      description: "Square format",
    },
    {
      id: "9:16",
      label: "9:16",
      description: "Vertical (portrait)",
    },
  ];

  // Enhanced change aspect ratio with instant preview
  const changeAspectRatio = async (ratio: AspectRatio) => {
    // Tell canvas coordinator we're in an interaction state
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.setInteracting(true);
    }

    setAspectRatio(ratio);
    setShowAspectRatios(false);

    // Preview the aspect ratio change
    setApplyingPreview(true);
    try {
      await previewEdit("aspectRatio");
    } catch (error) {
      console.error("Failed to preview aspect ratio:", error);
    } finally {
      setApplyingPreview(false);

      // End interaction state
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.setInteracting(false);
      }
    }
  };

  // Toggle edit mode
  const toggleEditMode = (mode: VideoEditMode) => {
    if (activeEditMode === mode) {
      setEditMode(null);
    } else {
      setEditMode(mode);
    }
  };

  // Apply the current edit
  const applyCurrentEdit = async () => {
    if (!activeEditMode || applyingPreview) return;

    setApplyingPreview(true);
    try {
      // Force canvas to refresh cache
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.clearTransformCache();
        window.canvasCoordinator.setInteracting(true);
      }

      // First update preview
      await previewEdit(activeEditMode as any);

      // Then apply the actual processing using our new method
      await applyEdit(activeEditMode as any);

      // Add to history
      videoEditorManager.addToHistory();
    } catch (error) {
      console.error(`Error applying ${activeEditMode}:`, error);
    } finally {
      setApplyingPreview(false);

      // End interaction state
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.setInteracting(false);
      }
    }
  };

  // Export to display real dimensions
  const getDisplayDimensions = useCallback(() => {
    if (!videoWidth || !videoHeight) return null;

    let width = videoWidth;
    let height = videoHeight;

    // Apply aspect ratio if needed
    if (aspectRatio !== "original") {
      let ratio: number;

      switch (aspectRatio) {
        case "16:9":
          ratio = 16 / 9;
          break;
        case "4:3":
          ratio = 4 / 3;
          break;
        case "1:1":
          ratio = 1;
          break;
        case "9:16":
          ratio = 9 / 16;
          break;
        case "custom":
          ratio =
            videoEditorManager.customAspectRatio.width /
            videoEditorManager.customAspectRatio.height;
          break;
        default:
          ratio = width / height;
      }

      // Keep the same area
      const area = width * height;
      height = Math.sqrt(area / ratio);
      width = height * ratio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }, [
    videoWidth,
    videoHeight,
    aspectRatio,
    videoEditorManager.customAspectRatio,
  ]);

  const dimensions = getDisplayDimensions();

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get visible tools based on processed state
  const visibleTools = processedVideoUrl
    ? toolButtons.filter((tool) => !tool.hideWhenProcessed)
    : toolButtons;

  return (
    <motion.div
      className={`p-2 sm:px-4 py-2 flex items-center justify-between z-20 border-b transition-colors duration-150 ${
        isDarkMode
          ? "bg-gray-800/95 backdrop-blur-md shadow-lg border-gray-700/50"
          : "bg-white/95 backdrop-blur-md shadow-lg border-gray-200/50"
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: showToolbar ? 0 : -20,
        opacity: showToolbar ? 1 : 0,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Left side toolbar */}
      <div
        className={`flex items-center ${isMobile ? "space-x-1" : "space-x-3"}`}
      >
        <div className="flex items-center overflow-hidden">
          <motion.button
            whileHover={
              historyIndex > 0
                ? {
                    scale: 1.05,
                    backgroundColor: isDarkMode
                      ? "rgba(55, 65, 81, 0.9)"
                      : "rgba(243, 244, 246, 0.9)",
                  }
                : {}
            }
            whileTap={historyIndex > 0 ? { scale: 0.95 } : {}}
            className={`p-1 sm:p-1.5 rounded-l-md ${
              historyIndex > 0
                ? isDarkMode
                  ? "text-white bg-gray-800/70 hover:bg-gray-700"
                  : "text-gray-700 bg-gray-100/70 hover:bg-gray-200"
                : isDarkMode
                  ? "text-gray-600 bg-gray-800/50 cursor-not-allowed"
                  : "text-gray-300 bg-gray-100/50 cursor-not-allowed"
            }`}
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo />
          </motion.button>
          <motion.button
            whileHover={
              historyIndex < editHistory.length - 1
                ? {
                    scale: 1.05,
                    backgroundColor: isDarkMode
                      ? "rgba(55, 65, 81, 0.9)"
                      : "rgba(243, 244, 246, 0.9)",
                  }
                : {}
            }
            whileTap={
              historyIndex < editHistory.length - 1 ? { scale: 0.95 } : {}
            }
            className={`p-1.5 sm:p-2 rounded-r-md ${
              historyIndex < editHistory.length - 1
                ? isDarkMode
                  ? "text-white bg-gray-800/70 hover:bg-gray-700"
                  : "text-gray-700 bg-gray-100/70 hover:bg-gray-200"
                : isDarkMode
                  ? "text-gray-600 bg-gray-800/50 cursor-not-allowed"
                  : "text-gray-300 bg-gray-100/50 cursor-not-allowed"
            }`}
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo />
          </motion.button>
        </div>

        {/* Rest of the toolbar remains mostly the same */}
        {/* ... */}

        {!isMobile && (
          <>
            <div className="h-8 border-l mx-1 border-gray-300 dark:border-gray-600 opacity-30"></div>

            {/* Play/Pause button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1 rounded-md ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => (isPlaying ? pause() : play())}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path fillRule="evenodd" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.button>

            {/* Subtitles Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1 rounded-md ${
                showSubtitles
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={toggleSubtitles}
              title={showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z" />
              </svg>
            </motion.button>

            <div className="h-8 border-l mx-1 border-gray-300 dark:border-gray-600 opacity-30"></div>

            {/* Time display */}
            <div
              className={`hidden sm:flex items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>

            <div className="hidden sm:block h-8 border-l mx-1 border-gray-300 dark:border-gray-600 opacity-30"></div>
          </>
        )}

        {!isTablet ? (
          <div className="relative">
            <motion.button
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-sm ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setShowAspectRatios(!showAspectRatios)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-haspopup="true"
              aria-expanded={showAspectRatios}
              title="Change aspect ratio"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              <span>
                {aspectRatio === "original" ? "Original" : aspectRatio}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showAspectRatios ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.button>

            <AnimatePresence>
              {showAspectRatios && (
                <motion.div
                  className={`absolute z-30 mt-1 w-56 origin-top-right rounded-lg shadow-xl ring-1 ${
                    isDarkMode
                      ? "bg-gray-800 ring-gray-700"
                      : "bg-white ring-gray-200"
                  }`}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="py-1">
                    {aspectRatioOptions.map((option) => (
                      <motion.button
                        key={option.id}
                        className={`flex flex-col w-full px-4 py-2 text-sm ${
                          aspectRatio === option.id
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : isDarkMode
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => changeAspectRatio(option.id)}
                        whileHover={{
                          backgroundColor:
                            aspectRatio === option.id
                              ? isDarkMode
                                ? "rgba(37, 99, 235, 1)"
                                : "rgba(59, 130, 246, 1)"
                              : isDarkMode
                                ? "rgba(55, 65, 81, 0.9)"
                                : "rgba(243, 244, 246, 0.9)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option.label}</span>
                          {aspectRatio === option.id && (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            aspectRatio === option.id
                              ? "text-gray-100"
                              : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                          }`}
                        >
                          {option.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded-md ${
              isDarkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setShowAspectRatios(!showAspectRatios)}
            title="Aspect Ratio"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </motion.button>
        )}

        {dimensions && !isTablet && (
          <div
            className={`hidden md:block px-3 py-1 rounded-lg text-xs font-mono ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {dimensions.width} x {dimensions.height}
          </div>
        )}
      </div>

      {/* Center Toolbar - Edit Tools */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-3">
        {visibleTools.map((tool) => (
          <div key={tool.id} className="relative">
            <motion.button
              className={`p-1.5 flex flex-col items-center rounded-lg transition-colors ${
                activeEditMode === tool.id
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => toggleEditMode(tool.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${tool.description}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
            >
              {tool.icon}
              <span className="text-xs mt-1 hidden sm:inline">
                {tool.label}
              </span>
              {tool.shortcut && !isMobile && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {tool.shortcut}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {activeEditMode === tool.id && tool.previewAction && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium shadow-lg",
                    isDarkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600",
                    applyingPreview ? "opacity-70 cursor-not-allowed" : ""
                  )}
                  onClick={applyCurrentEdit}
                  disabled={applyingPreview}
                >
                  {applyingPreview ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="hidden sm:inline">Applying...</span>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3 sm:mr-1 inline-block"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="hidden sm:inline">Apply</span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredTool === tool.id && !activeEditMode && !isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute z-30 w-40 bottom-full left-1/2 -translate-x-1/2 px-2 py-1 mb-1 rounded-md text-xs shadow-lg ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-white text-gray-700"
                  } border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  {tool.description}
                  {tool.shortcut && (
                    <span className="block mt-1 opacity-70">
                      Shortcut: {tool.shortcut}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Right Toolbar - Export */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        {/* Help button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2 rounded-full ${
            isDarkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          onClick={() =>
            runInAction(() => (videoEditorManager.activeEditMode = "history"))
          }
          title="Edit History"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
          </svg>
        </motion.button>
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            title="Help"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-1.5 sm:py-2 rounded-lg hidden md:flex items-center gap-2 font-medium ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20"
          }`}
          onClick={() => setEditMode("export" as VideoEditMode)}
          disabled={isProcessing}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </motion.button>

        {/* Mobile export button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 sm:p-2 rounded-full md:hidden ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
          }`}
          onClick={() => setEditMode("export" as VideoEditMode)}
          disabled={isProcessing}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
});

export default VideoEditorToolbar;
