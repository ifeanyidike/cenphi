import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { useAudioSetup } from "./useAudioSetup";

interface CompactAudioPlayerProps {
  audioUrl: string;
  title?: string;
  subtitle?: string;
  className?: string;
  onEdit?: () => void;
  autoPlay?: boolean;
  showWaveform?: boolean;
}

/**
 * A simple, compact audio player for use throughout the application
 * that doesn't require the full audio editor functionality
 */
const CompactAudioPlayer: React.FC<CompactAudioPlayerProps> = observer(
  ({
    audioUrl,
    title = "Audio",
    subtitle,
    className = "",
    onEdit,
    autoPlay = false,
    showWaveform = true,
  }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSpeedOptions, setShowSpeedOptions] = useState(false);
    const [bufferedPercentage, setBufferedPercentage] = useState(0);

    // Custom hook for audio setup
    const {
      audioRef,
      canvasRef,
      containerRef,
      isReady,
      isLoading,
      error,
      play,
      pause,
      seek,
      setPlaybackRate,
      toggleMute,
      isMuted,
    } = useAudioSetup({
      audioUrl,
      onTimeUpdate: (time) => setCurrentTime(time),
      onDurationChange: (dur) => setDuration(dur),
      visualize: showWaveform,
    });

    // Auto-play if specified
    useEffect(() => {
      if (autoPlay && isReady && !isPlaying) {
        handlePlay();
      }
    }, [autoPlay, isReady, isPlaying]);

    // Update buffered percentage
    useEffect(() => {
      if (!audioRef.current) return;

      const updateBuffered = () => {
        if (audioRef.current && audioRef.current.buffered.length > 0) {
          const bufferedEnd = audioRef.current.buffered.end(
            audioRef.current.buffered.length - 1
          );
          const bufferedPercent =
            (bufferedEnd / audioRef.current.duration) * 100;
          setBufferedPercentage(bufferedPercent);
        }
      };

      const audio = audioRef.current;
      audio.addEventListener("progress", updateBuffered);

      return () => {
        audio.removeEventListener("progress", updateBuffered);
      };
    }, []);

    // Canvas update for waveform visualization
    useEffect(() => {
      if (!canvasRef.current || !showWaveform) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resize canvas to match container
      const resizeCanvas = () => {
        if (containerRef.current) {
          canvas.width = containerRef.current.offsetWidth;
          canvas.height = containerRef.current.offsetHeight;
          drawWaveform();
        }
      };

      // Draw simple static waveform
      const drawWaveform = () => {
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = isDarkMode
          ? "rgba(17, 24, 39, 0.5)"
          : "rgba(243, 244, 246, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate waveform pattern
        const centerY = canvas.height / 2;
        const amplitude = canvas.height * 0.4;

        ctx.beginPath();
        ctx.moveTo(0, centerY);

        // Create a sine wave with some variation
        for (let i = 0; i < canvas.width; i++) {
          const x = i;
          const frequency = 0.02;
          const base = Math.sin(i * frequency) * amplitude * 0.5;
          // Add some randomness for a more natural look
          const noise = Math.random() * amplitude * 0.1;
          const y = centerY + base + noise;
          ctx.lineTo(x, y);
        }

        // Gradient for the waveform
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (isDarkMode) {
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.6)");
          gradient.addColorStop(1, "rgba(79, 70, 229, 0.2)");
        } else {
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.4)");
          gradient.addColorStop(1, "rgba(79, 70, 229, 0.1)");
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw progress indicator
        if (duration > 0) {
          const progressX = (currentTime / duration) * canvas.width;
          ctx.fillStyle = isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(progressX, 0, 2, canvas.height);
        }

        // Draw buffered progress
        if (bufferedPercentage > 0) {
          const bufferedWidth = (bufferedPercentage / 100) * canvas.width;
          ctx.fillStyle = isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.05)";
          ctx.fillRect(0, 0, bufferedWidth, canvas.height);
        }
      };

      // Set up canvas and draw initial waveform
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // Update on current time change
      if (isReady) {
        drawWaveform();
      }

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [
      currentTime,
      duration,
      isDarkMode,
      isReady,
      showWaveform,
      bufferedPercentage,
    ]);

    // Handle play/pause
    const handlePlay = async () => {
      try {
        await play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    };

    const handlePause = () => {
      pause();
      setIsPlaying(false);
    };

    const togglePlay = () => {
      if (isPlaying) {
        handlePause();
      } else {
        handlePlay();
      }
    };

    // Format time as MM:SS
    const formatTime = (time: number): string => {
      if (!isFinite(time)) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Format progress percentage
    const progressPercentage =
      duration > 0 ? (currentTime / duration) * 100 : 0;

    // Handle clicks on the progress bar
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isReady) return;

      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;

      seek(newTime);
    };

    // Playback speeds
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
      <div
        className={`rounded-lg overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } shadow-sm ${className}`}
      >
        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" className="hidden" />

        {showWaveform && (
          <div
            ref={containerRef}
            className="relative w-full h-16 cursor-pointer"
            onClick={handleProgressClick}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-2 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="mt-2 text-white text-xs">Loading...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      isDarkMode
                        ? "bg-red-900/90 text-white"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Error loading audio
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="p-3">
          {/* Audio info */}
          {(title || subtitle) && (
            <div className="flex justify-between items-center mb-2">
              <div>
                {title && <h4 className="text-sm font-medium">{title}</h4>}
                {subtitle && (
                  <p
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {onEdit && (
                <button
                  className={`p-1.5 rounded-full ${
                    isDarkMode
                      ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors`}
                  onClick={onEdit}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Progress bar (if not showing waveform or as fallback) */}
          {(!showWaveform || error) && (
            <div
              className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 cursor-pointer"
              onClick={handleProgressClick}
            >
              {/* Buffered progress */}
              <div
                className="absolute h-full bg-gray-400 dark:bg-gray-600 rounded-full opacity-50"
                style={{ width: `${bufferedPercentage}%` }}
              />

              {/* Playback progress */}
              <div
                className="absolute h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause button */}
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                } transition-colors`}
                onClick={togglePlay}
                disabled={isLoading || !!error}
              >
                {isPlaying ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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

              {/* Time display */}
              <div
                className={`text-xs font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {formatTime(currentTime)}
                <span className="mx-1 opacity-50">/</span>
                {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mute toggle */}
              <button
                className={`p-1.5 rounded-full ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                } transition-colors`}
                onClick={toggleMute}
              >
                {isMuted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Playback speed */}
              <div className="relative">
                <button
                  className={`p-1.5 text-xs flex items-center rounded ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                  } transition-colors`}
                  onClick={() => setShowSpeedOptions(!showSpeedOptions)}
                >
                  <span className="font-medium">
                    {audioRef.current?.playbackRate || 1}x
                  </span>
                </button>

                {/* Speed dropdown */}
                <AnimatePresence>
                  {showSpeedOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`absolute right-0 bottom-full mb-1 p-1 rounded-md shadow-lg z-10 ${
                        isDarkMode ? "bg-gray-800" : "bg-white"
                      } border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {speedOptions.map((speed) => (
                          <button
                            key={speed}
                            className={`px-2 py-1 text-xs rounded ${
                              audioRef.current?.playbackRate === speed
                                ? isDarkMode
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-100 text-indigo-800"
                                : isDarkMode
                                  ? "hover:bg-gray-700 text-gray-300"
                                  : "hover:bg-gray-100 text-gray-700"
                            }`}
                            onClick={() => {
                              setPlaybackRate(speed);
                              setShowSpeedOptions(false);
                            }}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default CompactAudioPlayer;
