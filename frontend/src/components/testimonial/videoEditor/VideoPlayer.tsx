import React, { useRef, useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import Controls from "./VideoControls";
import { runInAction } from "mobx";
import SubtitleOverlay from "./overlays/SubtitleOverlay";
import CropOverlay from "./overlays/CropOverlay";

interface VideoPlayerProps {
  onReady?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = observer(({ onReady }) => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    originalTestimonial,
    activeEditMode,
    processedVideoUrl,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    aspectRatio,
    customAspectRatio,
    crop,
    transform,
    videoFilters,
    play,
    pause,
    setVideoSize,
  } = videoEditorManager;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  const lastFrameTimeRef = useRef<number>(0);

  // State
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [videoNaturalSize, setVideoNaturalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState<boolean>(false);
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(
    Date.now()
  );
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [currentVideoSource, setCurrentVideoSource] = useState<string | null>(
    null
  );
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  // Calculate aspect ratio based on settings
  const getAspectRatioValue = useCallback(() => {
    switch (aspectRatio) {
      case "16:9":
        return 16 / 9;
      case "4:3":
        return 4 / 3;
      case "1:1":
        return 1;
      case "9:16":
        return 9 / 16;
      case "custom":
        return customAspectRatio.width / customAspectRatio.height;
      case "original":
      default:
        return videoNaturalSize.width / videoNaturalSize.height || 16 / 9;
    }
  }, [aspectRatio, customAspectRatio, videoNaturalSize]);

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      // Initialize the canvas coordinator with the video and canvas elements
      videoEditorManager.initializeCanvas(videoRef.current, canvasRef.current);

      // Ensure we're ready for rendering
      setIsCanvasReady(true);
    }
  }, [videoRef.current, canvasRef.current]);

  // Video source change handler
  useEffect(() => {
    const videoSource =
      processedVideoUrl || (originalTestimonial?.content as any)?.url || null;

    console.log(
      "Video source changed:",
      videoSource === processedVideoUrl
        ? "Using processed video"
        : "Using original video"
    );

    if (videoSource !== currentVideoSource) {
      setCurrentVideoSource(videoSource);
      setIsLoadingVideo(true);
      setVideoError(null);

      // Wait a moment before applying the source
      const timer = setTimeout(() => {
        if (videoRef.current && videoSource) {
          console.log("Setting new video source:", videoSource);
          videoRef.current.src = videoSource;
          videoRef.current.load();

          // If this is a processed video after trimming, ensure we reset playback position
          if (videoSource === processedVideoUrl && activeEditMode === "trim") {
            console.log("Processed trim video loaded, resetting position to 0");
            videoRef.current.currentTime = 0;
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [
    processedVideoUrl,
    originalTestimonial,
    currentVideoSource,
    activeEditMode,
  ]);

  // Update canvas size when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({
          width,
          height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      // Use 2d context with alpha for better performance
      const context = canvasRef.current.getContext("2d", {
        alpha: true,
        desynchronized: true, // Enable when available for better performance
      });
      canvasContextRef.current = context;
      if (context) {
        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        setIsCanvasReady(true);
      }
    }

    return () => {
      // Clean up animation frame on unmount
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Update canvas size based on container and aspect ratio
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !isCanvasReady) return;

    const aspectRatioValue = getAspectRatioValue();
    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Calculate the max dimensions that fit within the container
    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;

    // Calculate dimensions to fit in container while maintaining aspect ratio
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / aspectRatioValue;

    // If calculated height is too tall, scale based on height
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatioValue;
    }

    // Set canvas size with device pixel ratio for sharper rendering
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayWidth * pixelRatio);
    canvas.height = Math.round(displayHeight * pixelRatio);

    // Scale back down with CSS
    canvas.style.width = `${Math.round(displayWidth)}px`;
    canvas.style.height = `${Math.round(displayHeight)}px`;

    // Scale the context to account for the pixel ratio
    if (canvasContextRef.current) {
      canvasContextRef.current.scale(pixelRatio, pixelRatio);
    }

    // Force a redraw with the new canvas size
    renderCurrentFrame();
  }, [
    containerSize,
    aspectRatio,
    customAspectRatio,
    getAspectRatioValue,
    isCanvasReady,
  ]);

  const handleVideoMetadata = useCallback(() => {
    if (!videoRef.current) return;

    setIsLoadingVideo(false);

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    setVideoNaturalSize({
      width: videoWidth,
      height: videoHeight,
    });

    // Update video dimensions in the store
    setVideoSize(videoWidth, videoHeight);

    // If duration has changed, update it in the store
    if (videoRef.current.duration !== duration) {
      videoEditorManager.duration = videoRef.current.duration;

      // If trim end isn't set, set it to the full duration
      if (videoEditorManager.trim.endTime === 0) {
        videoEditorManager.trim.endTime = videoRef.current.duration;
      }
    }

    // Force a redraw with the new dimensions
    renderCurrentFrame();

    if (onReady) onReady();
  }, [duration, onReady, setVideoSize]);

  const handleProcessedVideoLoaded = useCallback(() => {
    if (processedVideoUrl && videoRef.current) {
      console.log("Processed video loaded successfully");

      // For trim operations, ensure we're at the beginning of the trimmed video
      if (activeEditMode === "trim") {
        videoRef.current.currentTime = 0;
        videoEditorManager.currentTime = 0;

        // Update duration to match the trimmed video length
        videoEditorManager.duration = videoRef.current.duration;
        console.log(
          "Updated duration to match trimmed video:",
          videoRef.current.duration
        );

        // Show a success notification
        if (typeof window !== "undefined") {
          const event = new CustomEvent("trimSuccess", {
            detail: { duration: videoRef.current.duration },
          });
          window.dispatchEvent(event);
        }
      }
    }
  }, [processedVideoUrl, activeEditMode, videoEditorManager]);

  // Handle time update from video element
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    // Limit updates to reduce CPU usage (e.g., update only every 30ms)
    const currentMs = performance.now();
    if (currentMs - lastFrameTimeRef.current < 30) {
      return;
    }

    lastFrameTimeRef.current = currentMs;

    // Update current time in store
    runInAction(
      () =>
        (videoEditorManager.currentTime = videoRef.current?.currentTime || 0)
    );

    // Update buffered time
    if (videoRef.current.buffered.length > 0) {
      setBufferedTime(
        videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      );
    }

    // Render the current frame
    renderCurrentFrame();
  }, []);

  // Handle video error
  const handleVideoError = useCallback(() => {
    console.error("Video error occurred");
    setIsLoadingVideo(false);
    setVideoError("Failed to load video");
  }, []);

  const renderCurrentFrame = useCallback(() => {
    // Let the CanvasCoordinator handle rendering
    if (isCanvasReady) {
      runInAction(() => {
        if (videoEditorManager.isPlaying) {
          videoEditorManager.startCanvasRendering();
        }
      });
    }
  }, [isCanvasReady]);

  const handleVideoEnded = useCallback(() => {
    // Pause the player
    pause();
    setTimeout(dispatchEndEvent, 100);

    // Force redraw of the canvas at full size to prevent the shrinking issue
    setTimeout(() => {
      renderCurrentFrame();

      // Force a canvas update if the coordinator is available
      if (window.canvasCoordinator) {
        window.canvasCoordinator.clearTransformCache();
        window.canvasCoordinator.startRendering();

        // Stop rendering after a brief period to save resources
        setTimeout(() => {
          window.canvasCoordinator.stopRendering();
        }, 500);
      }
    }, 50);
  }, [pause, renderCurrentFrame]);

  useEffect(() => {
    if (!videoRef.current) return;

    // If the source has changed and it's a processed video, make sure we reset
    if (processedVideoUrl && videoRef.current.src !== processedVideoUrl) {
      console.log("Video source has changed to processed video");
      videoRef.current.src = processedVideoUrl;
      videoRef.current.load();
      return; // Exit early as the loadedmetadata event will trigger the rest
    }

    // Update playback state
    if (isPlaying) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Error playing video:", err);
          pause();
        });
      }
    } else {
      videoRef.current.pause();
    }

    // Update current time if seeking
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }

    // Update playback rate
    videoRef.current.playbackRate = playbackRate;

    // Update volume
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [
    isPlaying,
    currentTime,
    playbackRate,
    volume,
    isMuted,
    pause,
    processedVideoUrl,
  ]);

  useEffect(() => {
    return () => {
      videoEditorManager.stopCanvasRendering();
    };
  }, []);

  // Re-render when transform/crop/filters change
  useEffect(() => {
    renderCurrentFrame();
  }, [transform, crop, videoFilters, renderCurrentFrame]);

  useEffect(() => {
    // This defensive measure ensures the canvas is repositioned if it ever gets stuck
    const monitorCanvasPosition = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;

        // Check if canvas dimensions look wrong (significantly smaller than container)
        const containerWidth = containerRef.current?.clientWidth || 0;
        const containerHeight = containerRef.current?.clientHeight || 0;
        const canvasWidth = parseInt(canvas.style.width || "0");
        const canvasHeight = parseInt(canvas.style.height || "0");

        // If canvas is less than 50% of container in either dimension, something is wrong
        const isCanvasTooSmall =
          canvasWidth < containerWidth * 0.5 ||
          canvasHeight < containerHeight * 0.5;

        if (isCanvasTooSmall) {
          console.log("Detected incorrect canvas size, fixing...");

          // Force canvas to use appropriate size
          if (window.canvasCoordinator) {
            window.canvasCoordinator.clearTransformCache();
            window.canvasCoordinator.startRendering();

            // Ensure canvas is positioned correctly
            canvas.style.position = "absolute";
            canvas.style.left = "50%";
            canvas.style.top = "50%";
            canvas.style.transform = "translate(-50%, -50%)";
          }

          // Also force a redraw
          renderCurrentFrame();
        }
      }
    };

    // Run the monitor every second
    const intervalId = setInterval(monitorCanvasPosition, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [renderCurrentFrame]);

  // Add a resize handler to ensure canvas maintains correct dimensions
  useEffect(() => {
    const handleResize = () => {
      // Force redraw of the canvas when window is resized
      setTimeout(() => {
        renderCurrentFrame();

        // Ensure canvas is positioned correctly
        if (canvasRef.current) {
          canvasRef.current.style.position = "absolute";
          canvasRef.current.style.left = "50%";
          canvasRef.current.style.top = "50%";
          canvasRef.current.style.transform = "translate(-50%, -50%)";
        }

        // Force a canvas update if the coordinator is available
        if (window.canvasCoordinator) {
          window.canvasCoordinator.clearTransformCache();
          window.canvasCoordinator.startRendering();

          // After a brief render, stop if not playing
          setTimeout(() => {
            if (!isPlaying && window.canvasCoordinator) {
              window.canvasCoordinator.stopRendering();
            }
          }, 500);
        }
      }, 100);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [renderCurrentFrame, isPlaying]);

  const dispatchEndEvent = () => {
    // Dispatch a custom event that our parent components can listen for
    const endEvent = new CustomEvent("video-ended");
    document.dispatchEvent(endEvent);
  };

  // Controls auto-hide
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    setLastUserInteraction(Date.now());

    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    if (!isDraggingProgress && isPlaying) {
      const timeout = setTimeout(() => {
        // Only hide if it's been 3 seconds since the last interaction
        if (Date.now() - lastUserInteraction >= 2800) {
          setShowControls(false);
        }
      }, 3000);
      setControlsTimeout(timeout);
    }
  }, [controlsTimeout, isDraggingProgress, isPlaying, lastUserInteraction]);

  // Handle mouse movement over container
  useEffect(() => {
    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    if (containerRef.current) {
      containerRef.current.addEventListener("mousemove", handleMouseMove);
      // Also add touch events for mobile
      containerRef.current.addEventListener("touchstart", handleMouseMove, {
        passive: true,
      });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
        containerRef.current.removeEventListener("touchstart", handleMouseMove);
      }
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [showControlsTemporarily, controlsTimeout]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle seeking through the video

  // Check if video content exists
  if (!originalTestimonial || originalTestimonial.format !== "video") {
    return (
      <div
        className={`flex justify-center items-center h-full w-full rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <div className="text-center p-8">
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? "text-gray-700" : "text-gray-300"
            }`}
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
          <h3
            className={`text-lg font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            No Video Available
          </h3>
          <p
            className={`mt-2 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Upload a video file to start editing
          </p>
        </div>
      </div>
    );
  }

  const videoSource = processedVideoUrl || originalTestimonial.media_url;

  // Helper to get the active overlay based on the editing mode
  const getActiveOverlay = useCallback(() => {
    if (!videoEditorManager.activeEditMode) {
      // Always show subtitles overlay if enabled, even when not in edit mode
      return videoEditorManager.showSubtitles ? <SubtitleOverlay /> : null;
    }

    switch (videoEditorManager.activeEditMode) {
      case "crop":
        return <CropOverlay />;
      case "subtitles":
        return videoEditorManager.showSubtitles ? <SubtitleOverlay /> : null;
      default:
        return videoEditorManager.showSubtitles ? <SubtitleOverlay /> : null;
    }
  }, [videoEditorManager.activeEditMode, videoEditorManager.showSubtitles]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden video-canvas-container ${
        isDarkMode ? "bg-gray-950" : "bg-black"
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() =>
        !isDraggingProgress &&
        !showVolumeSlider &&
        !showSpeedOptions &&
        setShowControls(false)
      }
      onTouchStart={() => showControlsTemporarily()}
    >
      <video
        ref={videoRef}
        className="hidden"
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        onLoadedMetadata={handleVideoMetadata}
        onTimeUpdate={handleTimeUpdate}
        // onEnded={() => pause()}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        onLoadedData={handleProcessedVideoLoaded}
      >
        <source src={videoSource} type="video/mp4" />
      </video>

      {/* Canvas element for rendering video with effects */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        onClick={() => (isPlaying ? pause() : play())}
      />

      {/* <div className="absolute inset-0 z-40 pointer-events-none"> */}
      {getActiveOverlay()}
      {/* </div> */}

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoadingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
          >
            <div className="text-white text-center">
              <svg
                className="w-12 h-12 mx-auto animate-spin text-blue-500"
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
              <p className="mt-3">Loading video...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-white text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-red-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">Video Error</h3>
            <p className="text-gray-300">{videoError}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              onClick={() => {
                setVideoError(null);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause overlay button */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-20 h-20 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center text-white"
              onClick={() => play()}
            >
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <Controls
        bufferedTime={bufferedTime}
        containerRef={containerRef}
        controlsTimeout={controlsTimeout}
        isDraggingProgress={isDraggingProgress}
        isFullscreen={isFullscreen}
        setIsDraggingProgress={setIsDraggingProgress}
        setShowSpeedOptions={setShowSpeedOptions}
        setShowVolumeSlider={setShowVolumeSlider}
        showControls={showControls}
        showControlsTemporarily={showControlsTemporarily}
        showSpeedOptions={showSpeedOptions}
        showVolumeSlider={showVolumeSlider}
        videoRef={videoRef}
      />
    </div>
  );
});

export default VideoPlayer;
