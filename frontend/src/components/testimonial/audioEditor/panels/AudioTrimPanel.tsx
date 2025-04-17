import React, { useState, useRef, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { formatTimecode } from "@/utils/general";

interface AudioTrimPanelProps {
  onSuccess?: (message: string) => void;
}

const AudioTrimPanel: React.FC<AudioTrimPanelProps> = observer(
  ({ onSuccess }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const {
      trim,
      setTrim,
      previewEdit,
      applyEdit,
      duration,
      currentTime,
      seek,
      isPlaying,
      pause,
      play,
      hasPendingChanges,
      isProcessing,
    } = audioEditorManager;

    // State
    const [startTimeInput, setStartTimeInput] = useState<string>(
      formatTimecode(trim.startTime)
    );
    const [endTimeInput, setEndTimeInput] = useState<string>(
      formatTimecode(trim.endTime)
    );
    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [selectedSegment, setSelectedSegment] = useState<
      "start" | "end" | null
    >(null);
    const [showFrameStepper, setShowFrameStepper] = useState<boolean>(false);
    const [trimPreview, setTrimPreview] = useState({
      startTime: trim.startTime,
      endTime: trim.endTime,
    });
    const [applyEnabled, setApplyEnabled] = useState(false);
    const [previewTimeout, setPreviewTimeout] = useState<number | null>(null);

    // Refs
    const isDraggingRef = useRef<boolean>(false);
    const dragTypeRef = useRef<"start" | "end" | null>(null);
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const dragStartValuesRef = useRef({
      clientX: 0,
      rectLeft: 0,
      rectWidth: 0,
      initialValue: 0,
    });

    // Update trim preview whenever actual trim changes
    useEffect(() => {
      setStartTimeInput(formatTimecode(trim.startTime));
      setEndTimeInput(formatTimecode(trim.endTime));
      setTrimPreview({
        startTime: trim.startTime,
        endTime: trim.endTime,
      });

      // Enable apply button if trim values have changed from original
      setApplyEnabled(hasPendingChanges("trim"));
    }, [trim.startTime, trim.endTime, hasPendingChanges]);

    // Parse timecode strings
    const parseTimecode = useCallback((timecode: string): number => {
      // Handle MM:SS format
      if (/^\d+:\d+$/.test(timecode)) {
        const [minutes, seconds] = timecode.split(":").map(Number);
        return minutes * 60 + seconds;
      }

      // Handle MM:SS.MS format
      if (/^\d+:\d+\.\d+$/.test(timecode)) {
        const [minutesPart, secondsPart] = timecode.split(":");
        const minutes = parseInt(minutesPart, 10);
        const seconds = parseFloat(secondsPart);
        return minutes * 60 + seconds;
      }

      // Try to parse as seconds
      const asNumber = Number(timecode);
      if (!isNaN(asNumber)) {
        return asNumber;
      }

      return 0;
    }, []);

    // Apply trim changes with preview
    const applyTrimChange = useCallback(
      (
        type: "startTime" | "endTime",
        time: number,
        skipPreview: boolean = false
      ) => {
        // Update preview values for UI
        if (type === "startTime") {
          setTrimPreview((prev) => ({ ...prev, startTime: time }));
        } else {
          setTrimPreview((prev) => ({ ...prev, endTime: time }));
        }

        // Update the store - this now gives instant feedback
        setTrim({ [type]: time });

        // Debounce preview updates to avoid excessive processing
        if (!skipPreview) {
          if (previewTimeout) {
            clearTimeout(previewTimeout);
          }

          const timeout = setTimeout(() => {
            // Update waveform view immediately
            previewEdit("trim");
          }, 200); // 200ms debounce

          setPreviewTimeout(timeout);
        }
      },
      [previewEdit, setTrim, previewTimeout]
    );

    const handleTrimDragStart = useCallback(
      (
        e:
          | React.MouseEvent<HTMLDivElement, MouseEvent>
          | React.TouchEvent<HTMLDivElement>,
        handleType: "start" | "end"
      ) => {
        e.preventDefault();
        e.stopPropagation();

        if (isPlaying) pause();

        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();

        // Get client position from either mouse or touch event
        const clientX =
          "touches" in e
            ? e.touches[0].clientX
            : (e as React.MouseEvent<HTMLDivElement, MouseEvent>).clientX;

        // Store initial values in ref
        dragStartValuesRef.current = {
          clientX,
          rectLeft: rect.left,
          rectWidth: rect.width,
          initialValue:
            handleType === "start"
              ? trimPreview.startTime
              : trimPreview.endTime,
        };

        isDraggingRef.current = true;
        dragTypeRef.current = handleType;

        // Improve UX with cursor styles
        document.body.style.cursor = "ew-resize";

        // Update selected segment without re-rendering
        setSelectedSegment(handleType);

        // Attach document-level event listeners
        document.addEventListener("mousemove", handleTrimDrag);
        document.addEventListener("touchmove", handleTrimDragTouch, {
          passive: false,
        });
        document.addEventListener("mouseup", handleTrimDragEnd);
        document.addEventListener("touchend", handleTrimDragEnd);
      },
      [isPlaying, pause, trimPreview.startTime, trimPreview.endTime]
    );

    const handleTrimDrag = useCallback(
      (e: MouseEvent) => {
        if (!isDraggingRef.current || !dragTypeRef.current) return;

        e.preventDefault();

        // Calculate time based on mouse position - optimized to reduce calculations
        const { clientX, rectWidth, initialValue } = dragStartValuesRef.current;

        // Use a simple percentage calculation that's faster
        const pixelsMoved = e.clientX - clientX;
        const percentageMoved = pixelsMoved / rectWidth;
        const timeDelta = percentageMoved * duration;

        // Calculate new time
        const newTime = Math.max(
          0,
          Math.min(duration, initialValue + timeDelta)
        );

        // Apply constraints and update
        if (dragTypeRef.current === "start") {
          if (newTime < trimPreview.endTime - 0.1) {
            // Use requestAnimationFrame to throttle updates
            requestAnimationFrame(() => {
              applyTrimChange("startTime", newTime, true);
              seek(newTime);
            });
          }
        } else {
          if (newTime > trimPreview.startTime + 0.1) {
            requestAnimationFrame(() => {
              applyTrimChange("endTime", newTime, true);
              seek(Math.max(0, newTime - 0.1));
            });
          }
        }
      },
      [
        duration,
        trimPreview.startTime,
        trimPreview.endTime,
        applyTrimChange,
        seek,
      ]
    );

    // Handle trim drag (touch)
    const handleTrimDragTouch = useCallback(
      (e: TouchEvent) => {
        if (
          !isDraggingRef.current ||
          !dragTypeRef.current ||
          e.touches.length === 0
        )
          return;

        e.preventDefault();

        const touch = e.touches[0];

        // Calculate time based on touch position
        const { clientX, rectWidth, initialValue } = dragStartValuesRef.current;

        // Use a simple percentage calculation that's faster
        const pixelsMoved = touch.clientX - clientX;
        const percentageMoved = pixelsMoved / rectWidth;
        const timeDelta = percentageMoved * duration;

        // Calculate new time
        const newTime = Math.max(
          0,
          Math.min(duration, initialValue + timeDelta)
        );

        // Apply constraints and update
        if (dragTypeRef.current === "start") {
          if (newTime < trimPreview.endTime - 0.1) {
            // Use requestAnimationFrame to throttle updates
            requestAnimationFrame(() => {
              applyTrimChange("startTime", newTime, true);
              seek(newTime);
            });
          }
        } else {
          if (newTime > trimPreview.startTime + 0.1) {
            requestAnimationFrame(() => {
              applyTrimChange("endTime", newTime, true);
              seek(Math.max(0, newTime - 0.1));
            });
          }
        }
      },
      [
        duration,
        trimPreview.startTime,
        trimPreview.endTime,
        applyTrimChange,
        seek,
      ]
    );

    // End trimming drag operation
    const handleTrimDragEnd = useCallback(() => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setSelectedSegment(null);

      dragTypeRef.current = null;
      document.body.style.cursor = "default";

      // Remove event listeners
      document.removeEventListener("mousemove", handleTrimDrag);
      document.removeEventListener("touchmove", handleTrimDragTouch);
      document.removeEventListener("mouseup", handleTrimDragEnd);
      document.removeEventListener("touchend", handleTrimDragEnd);

      // Apply the final trim preview after drag ends
      previewEdit("trim");
    }, [handleTrimDrag, previewEdit]);

    // Apply start time from input
    const applyStartTime = useCallback(() => {
      const newStartTime = parseTimecode(startTimeInput);
      if (newStartTime >= 0 && newStartTime < trimPreview.endTime) {
        applyTrimChange("startTime", newStartTime);
        seek(newStartTime);
      } else {
        // Reset invalid input
        setStartTimeInput(formatTimecode(trimPreview.startTime));
      }
    }, [
      startTimeInput,
      trimPreview.endTime,
      trimPreview.startTime,
      parseTimecode,
      applyTrimChange,
      seek,
    ]);

    // Apply end time from input
    const applyEndTime = useCallback(() => {
      const newEndTime = parseTimecode(endTimeInput);
      if (newEndTime > trimPreview.startTime && newEndTime <= duration) {
        applyTrimChange("endTime", newEndTime);
        seek(Math.max(0, newEndTime - 0.1)); // Just before the end
      } else {
        // Reset invalid input
        setEndTimeInput(formatTimecode(trimPreview.endTime));
      }
    }, [
      endTimeInput,
      trimPreview.startTime,
      duration,
      trimPreview.endTime,
      parseTimecode,
      applyTrimChange,
      seek,
    ]);

    // Apply trim changes - now with improved processing
    const handleApplyTrim = useCallback(async () => {
      if (isApplying || isProcessing) return;

      setIsApplying(true);

      try {
        console.log("Applying trim from", trim.startTime, "to", trim.endTime);

        // Seek to trim start before applying
        seek(trim.startTime);

        // Call applyEdit to actually process the audio
        const result = await applyEdit("trim");

        if (result) {
          console.log("Trim successfully applied:", result);
          if (onSuccess) {
            onSuccess("Audio trim applied successfully");
          }

          // Apply is now disabled until changes are made again
          setApplyEnabled(false);
        } else {
          console.error("Failed to apply trim");
        }
      } catch (error) {
        console.error("Error applying trim:", error);
      } finally {
        setIsApplying(false);
      }
    }, [
      trim.startTime,
      trim.endTime,
      seek,
      applyEdit,
      isApplying,
      isProcessing,
      onSuccess,
    ]);

    // Reset trim to full duration
    const resetTrim = useCallback(() => {
      applyTrimChange("startTime", 0, true);
      applyTrimChange("endTime", duration);
      setStartTimeInput(formatTimecode(0));
      setEndTimeInput(formatTimecode(duration));
    }, [duration, applyTrimChange]);

    // Fine adjustment controls
    const adjustTrimPoint = useCallback(
      (point: "start" | "end", delta: number) => {
        if (point === "start") {
          const newStartTime = Math.max(
            0,
            Math.min(trimPreview.startTime + delta, trimPreview.endTime - 0.1)
          );
          applyTrimChange("startTime", newStartTime);
          seek(newStartTime);
        } else {
          const newEndTime = Math.max(
            trimPreview.startTime + 0.1,
            Math.min(trimPreview.endTime + delta, duration)
          );
          applyTrimChange("endTime", newEndTime);
          seek(Math.max(0, newEndTime - 0.1));
        }
      },
      [
        trimPreview.startTime,
        trimPreview.endTime,
        duration,
        applyTrimChange,
        seek,
      ]
    );

    // Jump to trim points
    const jumpToStart = useCallback(() => {
      seek(trimPreview.startTime);
      setSelectedSegment("start");
    }, [trimPreview.startTime, seek]);

    const jumpToEnd = useCallback(() => {
      seek(Math.max(0, trimPreview.endTime - 0.1));
      setSelectedSegment("end");
    }, [trimPreview.endTime, seek]);

    // Format duration as seconds
    const formatDuration = useCallback((seconds: number): string => {
      if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
      }
    }, []);

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
        }
      };
    }, [previewTimeout]);

    return (
      <div
        className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Trim Audio</h2>

            {/* Apply button - only enabled if changes are made */}
            <button
              className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                isApplying || isProcessing
                  ? isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-500"
                  : applyEnabled
                    ? isDarkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } ${isApplying || isProcessing ? "cursor-not-allowed" : ""}`}
              onClick={handleApplyTrim}
              disabled={isApplying || isProcessing || !applyEnabled}
            >
              {isApplying || isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Apply Trim
                </>
              )}
            </button>
          </div>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Set start and end points to trim your audio
          </p>
        </div>

        {/* Visual Trimmer - Now with better visual feedback */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div
                className={`text-sm font-medium ${
                  selectedSegment === "start"
                    ? isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : ""
                }`}
              >
                Start: {formatDuration(trimPreview.startTime)}
              </div>
              <div
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Duration:{" "}
                {formatDuration(trimPreview.endTime - trimPreview.startTime)}
              </div>
              <div
                className={`text-sm font-medium ${
                  selectedSegment === "end"
                    ? isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : ""
                }`}
              >
                End: {formatDuration(trimPreview.endTime)}
              </div>
            </div>

            {/* Timeline visualization with instant feedback */}
            <div
              ref={timelineRef}
              className={`relative h-12 rounded-md ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              } overflow-hidden`}
            >
              {/* Enhanced visual elements */}

              {/* Trimmed left portion (excluded) */}
              <div
                className={`absolute top-0 bottom-0 left-0 ${
                  isDarkMode ? "bg-gray-900/70" : "bg-gray-300/70"
                }`}
                style={{
                  width: `${(trimPreview.startTime / duration) * 100}%`,
                }}
              />

              {/* Trimmed right portion (excluded) */}
              <div
                className={`absolute top-0 bottom-0 right-0 ${
                  isDarkMode ? "bg-gray-900/70" : "bg-gray-300/70"
                }`}
                style={{
                  width: `${((duration - trimPreview.endTime) / duration) * 100}%`,
                }}
              />

              {/* Kept portion (included) with gradient background */}
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500/30 to-indigo-500/30"
                style={{
                  left: `${(trimPreview.startTime / duration) * 100}%`,
                  right: `${((duration - trimPreview.endTime) / duration) * 100}%`,
                }}
              />

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{
                  left: `${(currentTime / duration) * 100}%`,
                }}
              >
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2" />
              </div>

              {/* Start handle with enhanced styling */}
              <div
                className={`absolute top-0 bottom-0 cursor-ew-resize z-10 w-4 ${
                  isDraggingRef.current && dragTypeRef.current === "start"
                    ? "opacity-70"
                    : "opacity-100"
                }`}
                style={{
                  left: `calc(${(trimPreview.startTime / duration) * 100}% - 8px)`,
                }}
                onMouseDown={(e) => handleTrimDragStart(e, "start")}
                onTouchStart={(e) => handleTrimDragStart(e, "start")}
              >
                <div
                  className={`absolute inset-y-0 left-1/2 w-1 bg-blue-500 transform -translate-x-1/2 ${
                    selectedSegment === "start" ? "ring-2 ring-blue-400" : ""
                  }`}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full opacity-70" />
              </div>

              {/* End handle with enhanced styling */}
              <div
                className={`absolute top-0 bottom-0 cursor-ew-resize z-10 w-4 ${
                  isDraggingRef.current && dragTypeRef.current === "end"
                    ? "opacity-70"
                    : "opacity-100"
                }`}
                style={{
                  left: `calc(${(trimPreview.endTime / duration) * 100}% - 8px)`,
                }}
                onMouseDown={(e) => handleTrimDragStart(e, "end")}
                onTouchStart={(e) => handleTrimDragStart(e, "end")}
              >
                <div
                  className={`absolute inset-y-0 left-1/2 w-1 bg-blue-500 transform -translate-x-1/2 ${
                    selectedSegment === "end" ? "ring-2 ring-blue-400" : ""
                  }`}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full opacity-70" />
              </div>
            </div>

            {/* Time labels with enhanced visuals */}
            <div className="flex justify-between text-xs opacity-70">
              <div>{formatDuration(0)}</div>
              <div>{formatDuration(duration / 2)}</div>
              <div>{formatDuration(duration)}</div>
            </div>
          </div>

          {/* Trim actions */}
          <div className="flex justify-center space-x-2 mt-4">
            <button
              className={`flex items-center p-2 rounded ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={jumpToStart}
              title="Jump to start point"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>

            <button
              className={`flex items-center px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => (isPlaying ? pause() : play())}
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <button
              className={`flex items-center p-2 rounded ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={jumpToEnd}
              title="Jump to end point"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM6 9a1 1 0 000 2h3.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L9.586 9H6z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Rest of the component remains the same */}

        {/* ... */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Precise Trim Points</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Start time input */}
            <div>
              <label className="block text-xs mb-1">Start Time</label>
              <div className="flex">
                <input
                  type="text"
                  value={startTimeInput}
                  onChange={(e) => setStartTimeInput(e.target.value)}
                  onBlur={applyStartTime}
                  onKeyDown={(e) => e.key === "Enter" && applyStartTime()}
                  className={`px-3 py-2 rounded-l-md text-sm w-full ${
                    isDarkMode
                      ? "bg-gray-800 text-white border-gray-700 focus:border-blue-500"
                      : "bg-white text-gray-900 border-gray-300 focus:border-blue-500"
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />

                <button
                  className={`px-3 py-2 rounded-r-md border ${
                    isDarkMode
                      ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                      : "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                  }`}
                  onClick={applyStartTime}
                >
                  Set
                </button>
              </div>

              {/* Fine adjustment */}
              <div className="flex justify-between mt-2">
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("start", -1)}
                  title="Back 1 second"
                >
                  -1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("start", -0.1)}
                  title="Back 0.1 second"
                >
                  -0.1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("start", 0.1)}
                  title="Forward 0.1 second"
                >
                  +0.1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("start", 1)}
                  title="Forward 1 second"
                >
                  +1s
                </button>
              </div>
            </div>

            {/* End time input */}
            <div>
              <label className="block text-xs mb-1">End Time</label>
              <div className="flex">
                <input
                  type="text"
                  value={endTimeInput}
                  onChange={(e) => setEndTimeInput(e.target.value)}
                  onBlur={applyEndTime}
                  onKeyDown={(e) => e.key === "Enter" && applyEndTime()}
                  className={`px-3 py-2 rounded-l-md text-sm w-full ${
                    isDarkMode
                      ? "bg-gray-800 text-white border-gray-700 focus:border-blue-500"
                      : "bg-white text-gray-900 border-gray-300 focus:border-blue-500"
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />

                <button
                  className={`px-3 py-2 rounded-r-md border ${
                    isDarkMode
                      ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                      : "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                  }`}
                  onClick={applyEndTime}
                >
                  Set
                </button>
              </div>

              {/* Fine adjustment */}
              <div className="flex justify-between mt-2">
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("end", -1)}
                  title="Back 1 second"
                >
                  -1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("end", -0.1)}
                  title="Back 0.1 second"
                >
                  -0.1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("end", 0.1)}
                  title="Forward 0.1 second"
                >
                  +0.1s
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  onClick={() => adjustTrimPoint("end", 1)}
                  title="Forward 1 second"
                >
                  +1s
                </button>
              </div>
            </div>
          </div>

          {/* Toggle detailed controls */}
          <button
            className={`mt-4 px-3 py-2 w-full rounded-md text-sm flex items-center justify-center ${
              showFrameStepper
                ? isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                : isDarkMode
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setShowFrameStepper(!showFrameStepper)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {showFrameStepper ? "Hide Fine Controls" : "Show Fine Controls"}
          </button>

          {/* Fine control stepper */}
          <AnimatePresence>
            {showFrameStepper && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-3"
              >
                <div
                  className={`p-3 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  <div className="text-xs mb-2">
                    Fine controls for precise trimming
                  </div>

                  <div className="flex justify-between space-x-2">
                    <button
                      className={`flex-1 p-2 rounded ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      onClick={() => seek(Math.max(0, currentTime - 0.05))}
                      title="Previous frame"
                    >
                      <svg
                        className="w-5 h-5 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    <button
                      className={`flex-1 p-2 rounded ${
                        selectedSegment === "start"
                          ? isDarkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      onClick={() => {
                        applyTrimChange("startTime", currentTime);
                        setSelectedSegment("start");
                        setStartTimeInput(formatTimecode(currentTime));
                      }}
                    >
                      Set Start
                    </button>

                    <button
                      className={`flex-1 p-2 rounded ${
                        selectedSegment === "end"
                          ? isDarkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      onClick={() => {
                        applyTrimChange("endTime", currentTime);
                        setSelectedSegment("end");
                        setEndTimeInput(formatTimecode(currentTime));
                      }}
                    >
                      Set End
                    </button>

                    <button
                      className={`flex-1 p-2 rounded ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                      onClick={() =>
                        seek(Math.min(duration, currentTime + 0.05))
                      }
                      title="Next frame"
                    >
                      <svg
                        className="w-5 h-5 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="text-xs text-center mt-2 opacity-70">
                    Current: {formatDuration(currentTime)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium mb-3">Common Trim Presets</h3>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              className={`p-2 rounded text-center text-sm ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => {
                // Remove first 2 seconds
                const newStart = Math.min(2, duration * 0.1);
                applyTrimChange("startTime", newStart);
                applyTrimChange("endTime", duration);
                seek(newStart);
                setStartTimeInput(formatTimecode(newStart));
                setEndTimeInput(formatTimecode(duration));
              }}
            >
              Skip First 2s
            </button>

            <button
              className={`p-2 rounded text-center text-sm ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => {
                // Trim last 2 seconds
                const newEnd = Math.max(0, duration - 2);
                applyTrimChange("startTime", 0);
                applyTrimChange("endTime", newEnd);
                seek(Math.max(0, newEnd - 0.1));
                setStartTimeInput(formatTimecode(0));
                setEndTimeInput(formatTimecode(newEnd));
              }}
            >
              Remove Last 2s
            </button>

            <button
              className={`p-2 rounded text-center text-sm ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => {
                // First 30 seconds only
                const newEnd = Math.min(30, duration);
                applyTrimChange("startTime", 0);
                applyTrimChange("endTime", newEnd);
                seek(0);
                setStartTimeInput(formatTimecode(0));
                setEndTimeInput(formatTimecode(newEnd));
              }}
            >
              First 30s Only
            </button>

            <button
              className={`p-2 rounded text-center text-sm ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => {
                // Middle portion
                const middle = duration / 2;
                const newStart = Math.max(0, middle - 15);
                const newEnd = Math.min(duration, middle + 15);
                applyTrimChange("startTime", newStart);
                applyTrimChange("endTime", newEnd);
                seek(newStart);
                setStartTimeInput(formatTimecode(newStart));
                setEndTimeInput(formatTimecode(newEnd));
              }}
            >
              Middle Section
            </button>
          </div>

          <button
            className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
              trimPreview.startTime !== 0 || trimPreview.endTime !== duration
                ? isDarkMode
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
                : isDarkMode
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={resetTrim}
            disabled={
              trimPreview.startTime === 0 && trimPreview.endTime === duration
            }
          >
            Reset to Full Audio
          </button>

          <p className="text-xs text-center mt-2 opacity-70">
            Tip: Drag the handles in the timeline for visual trimming
          </p>
        </div>
      </div>
    );
  }
);

export default AudioTrimPanel;
