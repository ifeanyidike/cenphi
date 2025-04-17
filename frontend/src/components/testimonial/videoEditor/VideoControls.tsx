import { FC, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { SkipBackIcon, SkipForwardIcon, VolumeXIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";

interface ControlsProps {
  showControls: boolean;
  isDraggingProgress: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  bufferedTime: number;
  showVolumeSlider: boolean;
  showSpeedOptions: boolean;
  setShowSpeedOptions: (show: boolean) => void;
  setIsDraggingProgress: (isDragging: boolean) => void;
  controlsTimeout: number | null;
  showControlsTemporarily: () => void;
  setShowVolumeSlider: (show: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isFullscreen: boolean;
}

const Controls: FC<ControlsProps> = ({
  showControls,
  isDraggingProgress,
  videoRef,
  bufferedTime,
  showVolumeSlider,
  showSpeedOptions,
  setShowSpeedOptions,
  setIsDraggingProgress,
  controlsTimeout,
  showControlsTemporarily,
  setShowVolumeSlider,
  containerRef,
  isFullscreen,
}) => {
  const { videoEditorManager } = workspaceHub;
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    showSubtitles,
    play,
    pause,
    seek,
    toggleMute,
    setVolume,
    setPlaybackRate,
  } = videoEditorManager;

  // State variables for enhanced UI
  const [isHoveringProgressBar, setIsHoveringProgressBar] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeControlTimeoutRef = useRef<number | null>(null);

  // Progress bar hover handling
  const handleProgressBarHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !duration) return;

      setIsHoveringProgressBar(true);
      const rect = progressBarRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const hoverRatio = offsetX / rect.width;
      setHoverPosition(hoverRatio * duration);
    },
    [duration]
  );

  const handleProgressBarLeave = useCallback(() => {
    setIsHoveringProgressBar(false);
  }, []);

  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!progressBarRef.current || !videoRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const clickPosition = offsetX / rect.width;
      const newTime = clickPosition * duration;

      seek(newTime);
    },
    [duration, seek]
  );

  // Progress bar dragging
  const handleProgressBarDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      setIsDraggingProgress(true);

      if (isPlaying) {
        pause();
      }

      const rect = progressBarRef.current?.getBoundingClientRect();
      const startX = e.clientX;
      const startPosition = currentTime / duration;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaPosition = deltaX / (rect?.width || 1);
        let newPosition = startPosition + deltaPosition;

        // Clamp position between 0 and 1
        newPosition = Math.max(0, Math.min(1, newPosition));

        const newTime = newPosition * duration;
        seek(newTime);
      };

      const handleMouseUp = () => {
        setIsDraggingProgress(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);

        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
          showControlsTemporarily();
        }
      };

      const handleTouchMove = (touchEvent: TouchEvent) => {
        if (touchEvent.touches.length > 0) {
          const touch = touchEvent.touches[0];
          const mockEvent = { clientX: touch.clientX } as MouseEvent;
          handleMouseMove(mockEvent);
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Add touch support
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleMouseUp);
    },
    [
      isPlaying,
      currentTime,
      duration,
      pause,
      seek,
      controlsTimeout,
      showControlsTemporarily,
    ]
  );

  // Skip forward/backward
  const skipForward = useCallback(() => {
    seek(Math.min(currentTime + 10, duration));
  }, [currentTime, duration, seek]);

  const skipBackward = useCallback(() => {
    seek(Math.max(currentTime - 10, 0));
  }, [currentTime, seek]);

  // Volume control
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);

      if (newVolume === 0) {
        videoEditorManager.isMuted = true;
      } else if (isMuted) {
        videoEditorManager.isMuted = false;
      }
    },
    [isMuted, setVolume]
  );

  // Handle volume control visibility
  const handleVolumeHover = useCallback((isHovering: boolean) => {
    if (volumeControlTimeoutRef.current) {
      clearTimeout(volumeControlTimeoutRef.current);
    }

    if (isHovering) {
      setShowVolumeSlider(true);
    } else {
      volumeControlTimeoutRef.current = window.setTimeout(() => {
        setShowVolumeSlider(false);
      }, 800);
    }
  }, []);

  // Format time with seconds-only for short durations
  const formatTime = useCallback(
    (seconds: number) => {
      if (duration < 600) {
        // Less than 10 minutes
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      } else {
        // Format with hours for longer videos
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return hours > 0
          ? `${hours}:${mins.toString().padStart(2, "0")}:${secs
              .toString()
              .padStart(2, "0")}`
          : `${mins}:${secs.toString().padStart(2, "0")}`;
      }
    },
    [duration]
  );

  // Handle fullscreen toggling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Could not enter fullscreen mode:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Could not exit fullscreen mode:", err);
        });
      }
    }
  }, [isFullscreen]);

  return (
    <AnimatePresence>
      {(showControls || isDraggingProgress || !isPlaying) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-sm z-20"
        >
          <div
            ref={progressBarRef}
            className="relative h-1 w-full bg-gray-700/60 rounded-full cursor-pointer mb-5 group"
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarHover}
            onMouseLeave={handleProgressBarLeave}
            onMouseDown={handleProgressBarDragStart}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const mockEvent = {
                preventDefault: () => e.preventDefault(),
                clientX: touch.clientX,
              } as React.MouseEvent<HTMLDivElement, MouseEvent>;
              handleProgressBarDragStart(mockEvent);
            }}
          >
            {/* Preview tooltip on hover */}
            {isHoveringProgressBar && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-11 bg-gray-900 text-white text-xs font-medium rounded-md py-1.5 px-3 transform -translate-x-1/2 z-30 border border-gray-800/50 shadow-xl"
                style={{
                  left: `${(hoverPosition / duration) * 100}%`,
                }}
              >
                {formatTime(hoverPosition)}
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-gray-900 absolute -bottom-1 left-1/2 transform -translate-x-1/2"></div>
              </motion.div>
            )}

            <div
              className="absolute h-full bg-white/20 rounded-full transition-all duration-300"
              style={{ width: `${(bufferedTime / duration) * 100}%` }}
            />

            <div
              className="absolute h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${(currentTime / duration) * 100}%`,
                background: "linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)",
                boxShadow: "0 0 4px rgba(59, 130, 246, 0.6)",
              }}
            />

            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-gradient-to-b from-white/40 to-transparent h-1/2"></div>
            </div>

            <div
              className={`absolute top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200 shadow-lg ${
                isDraggingProgress || showControls || isHoveringProgressBar
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
              }`}
              style={{
                left: `${(currentTime / duration) * 100}%`,
                background: "white",
                boxShadow: "0 0 6px rgba(59, 130, 246, 0.8)",
              }}
            >
              <div className="absolute inset-[3px] rounded-full bg-blue-500"></div>
            </div>

            {/* Enhanced time markers */}
            <div className="absolute w-full flex justify-between items-center -top-6">
              <span className="text-[10px] text-gray-300 font-medium">
                {formatTime(0)}
              </span>
              <span className="text-[10px] text-gray-300 font-medium">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls row with better alignment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Play/Pause with better icon */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-white hover:text-blue-400 transition-colors focus:outline-none flex-shrink-0 w-6"
                onClick={() => (isPlaying ? pause() : play())}
              >
                {isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 5V19M16 5V19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 4.75L17.25 12L6 19.25V4.75Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.button>

              <div className="flex items-center space-x-5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/90 hover:text-blue-400 transition-colors focus:outline-none flex-shrink-0"
                  onClick={skipBackward}
                >
                  <SkipBackIcon className="!w-6 !h-6" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/90 hover:text-blue-400 transition-colors focus:outline-none flex-shrink-0"
                  onClick={skipForward}
                >
                  <SkipForwardIcon className="!w-6 !h-6" />
                </motion.button>
              </div>

              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => handleVolumeHover(true)}
                onMouseLeave={() => handleVolumeHover(false)}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/90 hover:text-blue-400 transition-colors focus:outline-none"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeXIcon className="!w-6 !h-6" />
                  ) : volume < 0.5 ? (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.5 12C15.5 10.9 14.9 9.9 14 9.4M3 10.5V13.5C3 14.3284 3.67157 15 4.5 15H7.5L12.5 19V5L7.5 9H4.5C3.67157 9 3 9.67157 3 10.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.5 7.5C20.8 9.1 21.5 11 21.5 12C21.5 13 20.8 14.9 19.5 16.5M15.5 10.5C16 11 16.5 11.5 16.5 12C16.5 12.5 16 13 15.5 13.5M3 10.5V13.5C3 14.3284 3.67157 15 4.5 15H7.5L12.5 19V5L7.5 9H4.5C3.67157 9 3 9.67157 3 10.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 bottom-full mb-3 p-3 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-800/50"
                      onMouseEnter={() => handleVolumeHover(true)}
                      onMouseLeave={() => handleVolumeHover(false)}
                    >
                      {/* COMPLETELY REDESIGNED VOLUME SLIDER */}
                      <div className="flex flex-col items-center justify-center h-20">
                        <div className="relative h-16 w-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute bottom-0 w-full rounded-full transition-all duration-300"
                            style={{
                              height: `${isMuted ? 0 : volume * 100}%`,
                              background:
                                "linear-gradient(to top, #3b82f6, #4f46e5)",
                            }}
                          />

                          {/* Elegant slider handle */}
                          <div
                            className="absolute w-4 h-4 bg-white border border-gray-200/20 rounded-full shadow-md left-1/2 transform -translate-x-1/2"
                            style={{
                              bottom: `calc(${isMuted ? 0 : volume * 100}% - 8px)`,
                            }}
                          />
                        </div>

                        {/* Hidden input for functionality */}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="absolute h-16 w-6 appearance-none bg-transparent opacity-0 cursor-pointer"
                          style={{
                            transform: "rotate(270deg)",
                            transformOrigin: "center center",
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-shrink-0">
                <div className="text-white text-sm font-medium px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1.5 text-gray-400">/</span>
                  <span className="text-gray-300">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-5">
              <div className="relative flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white/90 hover:text-blue-400 transition-colors focus:outline-none flex items-center px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10"
                  onClick={() => setShowSpeedOptions(!showSpeedOptions)}
                >
                  <span className="text-sm font-medium mr-1.5">
                    {playbackRate}x
                  </span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {showSpeedOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-3 py-1.5 px-1 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-800/50 min-w-24"
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          className={`block w-full text-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                            playbackRate === speed
                              ? "bg-blue-600/80 text-white"
                              : "text-white/90 hover:bg-gray-800/90"
                          }`}
                          onClick={() => {
                            setPlaybackRate(speed);
                            setShowSpeedOptions(false);
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Subtitles toggle with better icon */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative text-white/90 hover:text-blue-400 transition-colors focus:outline-none flex-shrink-0 ${
                  showSubtitles ? "text-blue-400" : "text-white/90"
                }`}
                onClick={() =>
                  runInAction(() => {
                    videoEditorManager.toggleSubtitles();
                  })
                }
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.75 19.25H18.25C19.3546 19.25 20.25 18.3546 20.25 17.25V6.75C20.25 5.64543 19.3546 4.75 18.25 4.75H5.75C4.64543 4.75 3.75 5.64543 3.75 6.75V17.25C3.75 18.3546 4.64543 19.25 5.75 19.25Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.75 15.25H16.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.75 12.25H16.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.75 9.25H13.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {showSubtitles && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                  ></motion.div>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-white/90 hover:text-blue-400 transition-colors focus:outline-none flex-shrink-0"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.5 9.5L9.5 14.5M9.5 9.5L9.5 14.5L14.5 14.5M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 3H21M21 3V9M21 3L14 10M9 21H3M3 21V15M3 21L10 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default observer(Controls);
