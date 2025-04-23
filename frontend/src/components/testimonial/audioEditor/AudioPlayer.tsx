import React, { useRef, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";

interface AudioPlayerProps {
  onReady?: () => void;
  compact?: boolean;
  showWaveform?: boolean;
  className?: string;
  onEditClick?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = observer(
  ({
    onReady,
    compact = false,
    showWaveform = true,
    className = "",
    onEditClick,
  }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const {
      isPlaying,
      currentTime,
      duration,
      volume,
      playbackRate,
      isMuted,
      seek,
      togglePlay,
      setVolume,
      toggleMute,
      setPlaybackRate,
    } = audioEditorManager;

    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const waveformContainerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);

    // State
    const [, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const [showPlaybackSpeed, setShowPlaybackSpeed] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [, setIsDraggingVolume] = useState(false);
    const [bufferedPercentage, setBufferedPercentage] = useState(0);
    const [, setHoverTime] = useState<number | null>(null);
    const [, setHoverPosition] = useState<number | null>(null);

    // Get current audio source URL
    const audioUrl =
      audioEditorManager.processedAudioUrl ||
      audioEditorManager.originalTestimonial?.media_url ||
      "";

    // Set up audio player
    // useEffect(() => {
    //   if (!audioRef.current || !audioUrl) return;

    //   console.log("Setting up audio with URL:", audioUrl);

    //   // Set volume and playback rate
    //   audioRef.current.volume = isMuted ? 0 : volume;
    //   audioRef.current.playbackRate = playbackRate;

    //   // Ensure audio source is correctly set
    //   if (audioRef.current.src !== audioUrl) {
    //     audioRef.current.src = audioUrl;
    //     audioRef.current.load();
    //   }

    //   // Set up event listeners
    //   const handleLoadedMetadata = () => {
    //     console.log("Audio metadata loaded");
    //     if (audioRef.current) {
    //       audioEditorManager.duration = audioRef.current.duration;
    //     }
    //   };

    //   const handleLoadedData = () => {
    //     console.log("Audio data loaded");
    //     setIsLoading(false);
    //     setIsReady(true);
    //     if (onReady) onReady();
    //   };

    //   const handleTimeUpdate = () => {
    //     if (audioRef.current && !isDraggingProgress) {
    //       audioEditorManager.currentTime = audioRef.current.currentTime;
    //     }
    //   };

    //   const handleProgress = () => {
    //     if (audioRef.current && audioRef.current.buffered.length > 0) {
    //       const bufferedEnd = audioRef.current.buffered.end(
    //         audioRef.current.buffered.length - 1
    //       );
    //       setBufferedPercentage(
    //         (bufferedEnd / audioRef.current.duration) * 100
    //       );
    //     }
    //   };

    //   const handleError = (e: Event) => {
    //     console.error("Audio error:", e);
    //     const errorMessage =
    //       audioRef.current?.error?.message || "Failed to load audio";
    //     setAudioError(errorMessage);
    //     setIsLoading(false);
    //   };

    //   const handleEnded = () => {
    //     audioEditorManager.pause();
    //     if (audioRef.current) {
    //       audioRef.current.currentTime = 0;
    //       audioEditorManager.currentTime = 0;
    //     }
    //   };

    //   // Add event listeners
    //   audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    //   audioRef.current.addEventListener("loadeddata", handleLoadedData);
    //   audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    //   audioRef.current.addEventListener("progress", handleProgress);
    //   audioRef.current.addEventListener("error", handleError);
    //   audioRef.current.addEventListener("ended", handleEnded);

    //   // Setup Audio Context and Analyser for visualizations only if not already set up
    //   if (
    //     !audioSetupCompleteRef.current &&
    //     window.AudioContext &&
    //     showWaveform
    //   ) {
    //     try {
    //       // Create a new AudioContext
    //       const AudioCtx =
    //         window.AudioContext || (window as any).webkitAudioContext;
    //       const context = new AudioCtx();
    //       audioContextRef.current = context;

    //       // Create an analyser node
    //       const analyser = context.createAnalyser();
    //       analyser.fftSize = 256;
    //       analyserRef.current = analyser;

    //       // Connect the audio element to the analyser WITHOUT connecting source to destination
    //       // this is a critical fix - we'll connect the analyser separately to avoid muting
    //       const source = context.createMediaElementSource(audioRef.current);
    //       sourceNodeRef.current = source;

    //       // The correct way to connect things:
    //       // MediaElement -> Analyser -> Destination
    //       source.connect(analyser);
    //       analyser.connect(context.destination);

    //       // Mark audio setup as complete
    //       audioSetupCompleteRef.current = true;
    //       console.log("Audio visualization setup complete");
    //     } catch (err) {
    //       console.error("Error setting up audio visualization:", err);
    //     }
    //   }

    //   return () => {
    //     // Remove event listeners
    //     if (audioRef.current) {
    //       audioRef.current.removeEventListener(
    //         "loadedmetadata",
    //         handleLoadedMetadata
    //       );
    //       audioRef.current.removeEventListener("loadeddata", handleLoadedData);
    //       audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    //       audioRef.current.removeEventListener("progress", handleProgress);
    //       audioRef.current.removeEventListener("error", handleError);
    //       audioRef.current.removeEventListener("ended", handleEnded);
    //     }
    //   };
    // }, [
    //   audioUrl,
    //   volume,
    //   playbackRate,
    //   isMuted,
    //   audioEditorManager,
    //   onReady,
    //   isDraggingProgress,
    //   showWaveform,
    // ]);

    useEffect(() => {
      if (!audioRef.current || !audioUrl) return;

      console.log("Setting up audio with URL:", audioUrl);

      // Set volume and playback rate
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;

      // Ensure audio source is correctly set
      if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }

      // Set up event listeners for audio element
      const handleLoadedMetadata = () => {
        console.log("Audio metadata loaded");
        if (audioRef.current) {
          audioEditorManager.duration = audioRef.current.duration;
        }
      };

      const handleLoadedData = () => {
        console.log("Audio data loaded");
        setIsLoading(false);
        setIsReady(true);
        if (onReady) onReady();
      };

      const handleTimeUpdate = () => {
        if (audioRef.current && !isDraggingProgress) {
          audioEditorManager.currentTime = audioRef.current.currentTime;
        }
      };

      const handleProgress = () => {
        if (audioRef.current && audioRef.current.buffered.length > 0) {
          const bufferedEnd = audioRef.current.buffered.end(
            audioRef.current.buffered.length - 1
          );
          setBufferedPercentage(
            (bufferedEnd / audioRef.current.duration) * 100
          );
        }
      };

      const handleError = (e: Event) => {
        console.error("Audio error:", e);
        const errorMessage =
          audioRef.current?.error?.message || "Failed to load audio";
        setAudioError(errorMessage);
        setIsLoading(false);
      };

      const handleEnded = () => {
        audioEditorManager.pause();
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioEditorManager.currentTime = 0;
        }
      };

      // Add event listeners
      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioRef.current.addEventListener("loadeddata", handleLoadedData);
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("progress", handleProgress);
      audioRef.current.addEventListener("error", handleError);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        // Remove event listeners
        if (audioRef.current) {
          audioRef.current.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          audioRef.current.removeEventListener("loadeddata", handleLoadedData);
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.current.removeEventListener("progress", handleProgress);
          audioRef.current.removeEventListener("error", handleError);
          audioRef.current.removeEventListener("ended", handleEnded);
        }
      };
    }, [
      audioUrl,
      volume,
      playbackRate,
      isMuted,
      audioEditorManager,
      onReady,
      isDraggingProgress,
    ]);

    // // Clean up audio context on unmount
    // useEffect(() => {
    //   return () => {
    //     // Cancel animation frame if active
    //     if (animationFrameRef.current) {
    //       cancelAnimationFrame(animationFrameRef.current);
    //       animationFrameRef.current = null;
    //     }

    //     // Clean up audio node connections
    //     if (sourceNodeRef.current) {
    //       try {
    //         sourceNodeRef.current.disconnect();
    //       } catch (err) {
    //         console.warn("Error disconnecting source node:", err);
    //       }
    //     }

    //     if (analyserRef.current) {
    //       try {
    //         analyserRef.current.disconnect();
    //       } catch (err) {
    //         console.warn("Error disconnecting analyser node:", err);
    //       }
    //     }

    //     // Close audio context
    //     if (
    //       audioContextRef.current &&
    //       audioContextRef.current.state !== "closed"
    //     ) {
    //       try {
    //         audioContextRef.current.close();
    //       } catch (err) {
    //         console.warn("Error closing AudioContext:", err);
    //       }
    //     }
    //   };
    // }, []);

    // Connect the waveform container to WaveformManager
    useEffect(() => {
      if (showWaveform && waveformContainerRef.current) {
        audioEditorManager.waveformManager.setContainer(
          waveformContainerRef.current
        );

        // Connect audio element to waveform manager
        if (audioRef.current) {
          audioEditorManager.waveformManager.setAudioElement(audioRef.current);
        }
      }

      return () => {
        // Clean up waveform when component unmounts
        audioEditorManager.waveformManager.setContainer(null);
      };
    }, [showWaveform]);

    // Sync playback state with the store
    // useEffect(() => {
    //   if (!audioRef.current) return;

    //   if (isPlaying) {
    //     // Resume audio context if suspended (autoplay policy)
    //     if (audioContextRef.current?.state === "suspended") {
    //       audioContextRef.current.resume().catch((err) => {
    //         console.warn("Error resuming audio context:", err);
    //       });
    //     }

    //     const playPromise = audioRef.current.play();
    //     if (playPromise !== undefined) {
    //       playPromise.catch((error) => {
    //         console.error("Error playing audio:", error);
    //         audioEditorManager.pause();
    //       });
    //     }
    //   } else {
    //     audioRef.current.pause();
    //   }
    // }, [isPlaying, audioEditorManager]);

    useEffect(() => {
      if (!audioRef.current) return;

      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing audio:", error);
            audioEditorManager.pause();
          });
        }
      } else {
        audioRef.current.pause();
      }
    }, [isPlaying, audioEditorManager]);

    // Sync current time with the store
    useEffect(() => {
      if (
        !audioRef.current ||
        isDraggingProgress ||
        Math.abs(audioRef.current.currentTime - currentTime) < 0.1
      )
        return;

      audioRef.current.currentTime = currentTime;
    }, [currentTime, isDraggingProgress]);

    // Handle volume and mute changes
    useEffect(() => {
      if (!audioRef.current) return;
      audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Handle playback rate changes
    useEffect(() => {
      if (!audioRef.current) return;
      audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    // Draw waveform visualization
    // useEffect(() => {
    //   if (!canvasRef.current || !showWaveform || !analyserRef.current) return;

    //   const canvas = canvasRef.current;
    //   const ctx = canvas.getContext("2d");
    //   if (!ctx) return;

    //   // Resize canvas to match container
    //   const resizeCanvas = () => {
    //     if (containerRef.current && canvas) {
    //       const { width, height } =
    //         containerRef.current.getBoundingClientRect();
    //       if (canvas.width !== width || canvas.height !== height) {
    //         canvas.width = width;
    //         canvas.height = height;
    //       }
    //     }
    //   };

    //   resizeCanvas();
    //   window.addEventListener("resize", resizeCanvas);

    //   // Create frequency data array
    //   const analyser = analyserRef.current;
    //   const bufferLength = analyser.frequencyBinCount;
    //   const dataArray = new Uint8Array(bufferLength);

    //   // Animation function
    //   const draw = () => {
    //     if (!ctx || !analyser) return;

    //     animationFrameRef.current = requestAnimationFrame(draw);

    //     try {
    //       // Get frequency data
    //       analyser.getByteFrequencyData(dataArray);

    //       // Clear canvas
    //       ctx.clearRect(0, 0, canvas.width, canvas.height);

    //       // Set gradient for waveform
    //       const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    //       if (isDarkMode) {
    //         gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
    //         gradient.addColorStop(1, "rgba(99, 102, 241, 0.3)");
    //       } else {
    //         gradient.addColorStop(0, "rgba(79, 70, 229, 0.7)");
    //         gradient.addColorStop(1, "rgba(79, 70, 229, 0.2)");
    //       }

    //       // Calculate bar width based on canvas size
    //       const barWidth = (canvas.width / bufferLength) * 2.5;
    //       let x = 0;

    //       // Draw frequency bars
    //       for (let i = 0; i < bufferLength; i++) {
    //         const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

    //         ctx.fillStyle = gradient;
    //         ctx.fillRect(
    //           x,
    //           (canvas.height - barHeight) / 2,
    //           barWidth,
    //           barHeight
    //         );

    //         x += barWidth + 1;
    //       }

    //       // Draw progress line
    //       const progressX = (currentTime / duration) * canvas.width;
    //       ctx.fillStyle = isDarkMode
    //         ? "rgba(255, 255, 255, 0.8)"
    //         : "rgba(0, 0, 0, 0.6)";
    //       ctx.fillRect(progressX, 0, 2, canvas.height);
    //     } catch (error) {
    //       console.error("Error in visualization:", error);
    //       cancelAnimationFrame(animationFrameRef.current!);
    //       drawStaticWaveform();
    //     }
    //   };

    //   // Draw static waveform when not playing
    //   const drawStaticWaveform = () => {
    //     if (!ctx) return;

    //     ctx.clearRect(0, 0, canvas.width, canvas.height);

    //     // Draw background
    //     const bgColor = isDarkMode
    //       ? "rgba(30, 41, 59, 0.2)"
    //       : "rgba(243, 244, 246, 0.5)";
    //     ctx.fillStyle = bgColor;
    //     ctx.fillRect(0, 0, canvas.width, canvas.height);

    //     const centerY = canvas.height / 2;
    //     const amplitude = canvas.height * 0.3;

    //     // Draw a static waveform
    //     ctx.beginPath();
    //     ctx.moveTo(0, centerY);

    //     for (let i = 0; i < canvas.width; i++) {
    //       // Create a mild sine wave with random noise
    //       const progress = i / canvas.width;
    //       const sineWave = Math.sin(progress * 15) * amplitude * 0.5;
    //       const noise = (Math.random() - 0.5) * amplitude * 0.2;
    //       const y = centerY + sineWave + noise;
    //       ctx.lineTo(i, y);
    //     }

    //     // Add gradient
    //     const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    //     if (isDarkMode) {
    //       gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    //       gradient.addColorStop(1, "rgba(99, 102, 241, 0.1)");
    //     } else {
    //       gradient.addColorStop(0, "rgba(79, 70, 229, 0.3)");
    //       gradient.addColorStop(1, "rgba(79, 70, 229, 0.05)");
    //     }

    //     ctx.strokeStyle = gradient;
    //     ctx.lineWidth = 2;
    //     ctx.stroke();

    //     // Draw buffered progress
    //     if (bufferedPercentage > 0) {
    //       const bufferedWidth = (bufferedPercentage / 100) * canvas.width;
    //       ctx.fillStyle = isDarkMode
    //         ? "rgba(255, 255, 255, 0.1)"
    //         : "rgba(0, 0, 0, 0.05)";
    //       ctx.fillRect(0, 0, bufferedWidth, canvas.height);
    //     }

    //     // Draw progress line
    //     const progressX = (currentTime / duration) * canvas.width;
    //     ctx.fillStyle = isDarkMode
    //       ? "rgba(255, 255, 255, 0.8)"
    //       : "rgba(0, 0, 0, 0.6)";
    //     ctx.fillRect(progressX, 0, 2, canvas.height);

    //     // Draw hover position if available
    //     if (hoverPosition !== null) {
    //       ctx.fillStyle = isDarkMode
    //         ? "rgba(255, 255, 255, 0.3)"
    //         : "rgba(0, 0, 0, 0.2)";
    //       ctx.fillRect(hoverPosition, 0, 1, canvas.height);
    //     }
    //   };

    //   // Start or stop animation based on playback state
    //   if (isPlaying && isReady) {
    //     if (!animationFrameRef.current) {
    //       draw();
    //     }
    //   } else {
    //     if (animationFrameRef.current) {
    //       cancelAnimationFrame(animationFrameRef.current);
    //       animationFrameRef.current = null;
    //     }
    //     drawStaticWaveform();
    //   }

    //   return () => {
    //     window.removeEventListener("resize", resizeCanvas);
    //     if (animationFrameRef.current) {
    //       cancelAnimationFrame(animationFrameRef.current);
    //       animationFrameRef.current = null;
    //     }
    //   };
    // }, [
    //   isPlaying,
    //   isReady,
    //   currentTime,
    //   duration,
    //   isDarkMode,
    //   showWaveform,
    //   bufferedPercentage,
    //   hoverPosition,
    // ]);

    // Handle seekbar click and drag
    const handleProgressClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;

        const rect = progressRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percentage = relativeX / rect.width;
        const newTime = percentage * duration;

        seek(newTime);
      },
      [duration, seek]
    );

    const handleProgressMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDraggingProgress(true);
        handleProgressClick(e);

        // Add document-level event listeners
        document.addEventListener("mousemove", handleProgressDrag);
        document.addEventListener("mouseup", handleProgressMouseUp);
      },
      [handleProgressClick]
    );

    const handleProgressDrag = useCallback(
      (e: MouseEvent) => {
        if (!progressRef.current || !duration) return;

        const rect = progressRef.current.getBoundingClientRect();
        const relativeX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        );
        const percentage = relativeX / rect.width;
        const newTime = percentage * duration;

        // Update time in store, but don't seek yet to avoid jumpy playback
        audioEditorManager.currentTime = newTime;
      },
      [duration, audioEditorManager]
    );

    const handleProgressMouseUp = useCallback(
      (e: MouseEvent) => {
        setIsDraggingProgress(false);

        if (!progressRef.current || !duration) return;

        const rect = progressRef.current.getBoundingClientRect();
        const relativeX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        );
        const percentage = relativeX / rect.width;
        const newTime = percentage * duration;

        // Now perform the actual seek
        seek(newTime);

        // Remove document-level event listeners
        document.removeEventListener("mousemove", handleProgressDrag);
        document.removeEventListener("mouseup", handleProgressMouseUp);
      },
      [duration, seek, handleProgressDrag]
    );

    // Handle progress bar hover for time preview
    const handleProgressHover = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;

        const rect = progressRef.current.getBoundingClientRect();
        const relativeX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        );
        const percentage = relativeX / rect.width;
        const hoverTimeValue = percentage * duration;

        setHoverTime(hoverTimeValue);
        setHoverPosition(relativeX);
      },
      [duration]
    );

    const handleProgressLeave = useCallback(() => {
      setHoverTime(null);
      setHoverPosition(null);
    }, []);

    // Handle volume control
    const handleVolumeChange = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeRef.current) return;

        const rect = volumeRef.current.getBoundingClientRect();
        const relativeX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        );
        const newVolume = relativeX / rect.width;

        setVolume(newVolume);
      },
      [setVolume]
    );

    const handleVolumeMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDraggingVolume(true);
        handleVolumeChange(e);

        document.addEventListener("mousemove", handleVolumeDrag);
        document.addEventListener("mouseup", handleVolumeMouseUp);
      },
      [handleVolumeChange]
    );

    const handleVolumeDrag = useCallback(
      (e: MouseEvent) => {
        if (!volumeRef.current) return;

        const rect = volumeRef.current.getBoundingClientRect();
        const relativeX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        );
        const newVolume = relativeX / rect.width;

        setVolume(newVolume);
      },
      [setVolume]
    );

    const handleVolumeMouseUp = useCallback(() => {
      setIsDraggingVolume(false);

      document.removeEventListener("mousemove", handleVolumeDrag);
      document.removeEventListener("mouseup", handleVolumeMouseUp);
    }, [handleVolumeDrag]);

    // Speed selection options
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // Format time for display
    const formatTime = (time: number) => {
      if (!isFinite(time)) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Calculate progress percentage
    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
      <div
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden transition-colors duration-300 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } ${compact ? "p-2" : "p-4"} shadow-lg ${className}`}
      >
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          className="hidden"
        />

        {/* Waveform visualization - Now using WaveformManager */}
        {showWaveform && (
          <div
            ref={waveformContainerRef}
            className={`relative w-full ${compact ? "h-20" : "h-32"} mb-2 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer`}
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
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
                    <div className="w-8 h-8 border-3 border-blue-500/30 border-t-3 border-t-blue-500 rounded-full animate-spin" />
                    <p className="mt-2 text-white text-sm">Loading Audio...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay */}
            <AnimatePresence>
              {audioError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <div className="max-w-sm p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                    <div className="flex items-center text-red-500 mb-3">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Audio Error
                      </h3>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                      {audioError}
                    </p>
                    <button
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => {
                        setAudioError(null);
                        setIsLoading(true);
                        if (audioRef.current) {
                          audioRef.current.load();
                        }
                      }}
                    >
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Buffered progress */}
          <div
            className="absolute h-full bg-gray-400 dark:bg-gray-600 rounded-full"
            style={{ width: `${bufferedPercentage}%` }}
          />

          {/* Playback progress */}
          <div
            className="absolute h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Draggable handle */}
          <div
            className="absolute w-4 h-4 bg-white dark:bg-indigo-200 rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 transition-transform"
            style={{
              left: `${progressPercentage}%`,
              top: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left controls */}
          <div className="flex items-center space-x-2">
            {/* Play/Pause button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                isDarkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
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
            </motion.button>

            {/* Skip backward button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              onClick={() => seek(Math.max(0, currentTime - 10))}
              aria-label="Skip backward 10 seconds"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>

            {/* Skip forward button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              aria-label="Skip forward 10 seconds"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>

            {/* Time display */}
            <div
              className={`text-sm font-mono ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 opacity-50">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-2">
            {/* Volume control */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeControl(true)}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
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
                ) : volume < 0.5 ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.707 16.707a1 1 0 11-1.414-1.414A5.98 5.98 0 0013 10a5.98 5.98 0 00-1.707-4.293 1 1 0 011.414-1.414A7.98 7.98 0 0115 10a7.98 7.98 0 01-2.293 5.707z"
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
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.button>

              {/* Volume slider */}
              <AnimatePresence>
                {showVolumeControl && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg shadow-lg z-10 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                    onMouseLeave={() => setShowVolumeControl(false)}
                  >
                    <div
                      ref={volumeRef}
                      className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
                      onClick={handleVolumeChange}
                      onMouseDown={handleVolumeMouseDown}
                    >
                      <div
                        className="absolute h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                        style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white rounded-full shadow-md transform -translate-y-1/2"
                        style={{
                          left: `${isMuted ? 0 : volume * 100}%`,
                          top: "50%",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Playback speed */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-8 px-2 flex items-center justify-center rounded-full ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                onClick={() => setShowPlaybackSpeed(!showPlaybackSpeed)}
                aria-label="Playback speed"
              >
                <span className="text-xs font-medium">{playbackRate}x</span>
              </motion.button>

              {/* Speed selector */}
              <AnimatePresence>
                {showPlaybackSpeed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-full right-0 mb-2 p-2 rounded-lg shadow-lg z-10 ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
                    onMouseLeave={() => setShowPlaybackSpeed(false)}
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {speedOptions.map((speed) => (
                        <motion.button
                          key={speed}
                          whileHover={{
                            backgroundColor: isDarkMode
                              ? "rgba(55, 65, 81, 1)"
                              : "rgba(243, 244, 246, 1)",
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            playbackRate === speed
                              ? isDarkMode
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-500 text-white"
                              : isDarkMode
                                ? "text-gray-200 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setPlaybackRate(speed);
                            setShowPlaybackSpeed(false);
                          }}
                        >
                          {speed}x
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit button */}
            {onEditClick && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`hidden sm:flex h-8 px-3 items-center justify-center rounded-md text-xs font-medium ${
                  isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }`}
                onClick={onEditClick}
                aria-label="Edit audio"
              >
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Edit</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default AudioPlayer;
