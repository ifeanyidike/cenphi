import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  X,
  SkipBack,
  SkipForward,
  Sparkles,
  PictureInPicture2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { observer } from "mobx-react-lite";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  thumbnail_url?: string;
  metadata?: {
    duration?: number;
    size?: string;
    format?: string;
    platform?: string;
    category?: string;
  };
  onProcessFurther?: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  thumbnail_url,
  title,
  metadata,
  onProcessFurther,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setLoadProgress(0);
      setHasError(false);
    }
  }, [isOpen]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering, showSettings]);

  // Auto-hide volume slider
  useEffect(() => {
    if (showVolumeSlider) {
      volumeTimeoutRef.current = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 2000);
    }

    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, [showVolumeSlider]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "j":
          skip(-10);
          break;
        case "l":
          skip(10);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          setShowVolumeSlider(true);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          setShowVolumeSlider(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, isPlaying, volume, isFullscreen]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(
          videoRef.current.buffered.length - 1
        );
        setBuffered((bufferedEnd / videoRef.current.duration) * 100);
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(100);
  }, []);

  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(
        videoRef.current.buffered.length - 1
      );
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setLoadProgress((bufferedEnd / duration) * 100);
      }
    }
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error("Video failed to load:", videoUrl);
  }, [videoUrl]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const time = pos * duration;
      videoRef.current.currentTime = time;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, currentTime + seconds)
      );
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.error("Picture-in-Picture failed:", error);
      }
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `${title.replace(/\s+/g, "-")}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[9999] flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative ${
              isFullscreen ? "w-full h-full" : "w-[92vw] max-w-7xl max-h-[92vh]"
            } flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={() => {
              setIsHovering(true);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
            }}
          >
            {/* Header - Minimal & Non-Obstructive */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
                >
                  {/* Subtle gradient fade at top only */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />

                  <div className="relative flex items-start justify-between p-4 pointer-events-auto">
                    {/* Left side - Title and metadata */}
                    <div className="flex-1 min-w-0 pr-4">
                      <h3
                        className="text-sm font-semibold text-white mb-1.5 truncate drop-shadow-lg"
                        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
                      >
                        {title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {metadata?.category && (
                          <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white text-[9px] h-4 px-1.5 shadow-lg">
                            {metadata.category}
                          </Badge>
                        )}
                        {metadata?.platform && (
                          <Badge className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-md border-0 text-white text-[9px] h-4 px-1.5 shadow-lg">
                            {metadata.platform}
                          </Badge>
                        )}
                        {metadata?.format && (
                          <span
                            className="text-[9px] text-white/70 drop-shadow-lg"
                            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                          >
                            {metadata.format.toUpperCase()}
                          </span>
                        )}
                        {metadata?.size && (
                          <span
                            className="text-[9px] text-white/70 drop-shadow-lg"
                            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                          >
                            {metadata.size}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side - Close button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex-shrink-0 shadow-xl transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Container */}
            <div
              className={`relative ${
                isFullscreen ? "w-full h-full" : "w-full"
              } flex items-center justify-center bg-black ${
                !isFullscreen && "rounded-xl"
              } overflow-hidden`}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className={`${
                  isFullscreen ? "w-full h-full" : "max-w-full max-h-[85vh]"
                } object-contain`}
                preload="metadata"
                crossOrigin="anonymous"
                poster={thumbnail_url}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={handleCanPlay}
                onProgress={handleProgress}
                onError={handleError}
                onClick={togglePlay}
              />

              {/* Center Play Button */}
              <AnimatePresence>
                {!isPlaying && !isLoading && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 backdrop-blur-[2px]" />
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/80 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-20 h-20 rounded-full bg-white/95 backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                        <Play
                          className="h-8 w-8 text-slate-900 ml-1"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Loading State */}
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  {loadProgress > 0 && loadProgress < 100 && (
                    <div className="w-48 space-y-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/60 rounded-full transition-all duration-300"
                          style={{ width: `${loadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/50 text-center">
                        Loading {Math.round(loadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm text-white/90 text-center">
                    Failed to load video
                  </p>
                  <p className="text-[10px] text-white/50 text-center max-w-xs">
                    The video might be too large, unavailable, or in an
                    unsupported format
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setHasError(false);
                      setIsLoading(true);
                      if (videoRef.current) {
                        videoRef.current.load();
                      }
                    }}
                    className="mt-2 h-8 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px]"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Volume Indicator */}
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl rounded-lg px-4 py-3 shadow-2xl"
                  >
                    <div className="flex items-center gap-2">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                      <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${volume * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-white/80 w-7">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute bottom-0 left-0 right-0 z-30 p-4"
                >
                  <div className="backdrop-blur-xl bg-gradient-to-t from-black/70 via-black/50 to-transparent rounded-xl shadow-2xl">
                    {/* Progress Bar */}
                    <div className="px-5 pt-3 pb-2">
                      <div
                        className="group relative w-full h-1 bg-white/15 rounded-full cursor-pointer"
                        onClick={handleSeek}
                      >
                        {/* Buffered */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/25 rounded-full transition-all"
                          style={{ width: `${buffered}%` }}
                        />
                        {/* Progress */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                        {/* Hover Indicator */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            left: `${progress}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="px-5 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Left Controls */}
                        <div className="flex items-center gap-1.5">
                          {/* Play/Pause */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePlay}
                            className="h-9 w-9 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          >
                            {isPlaying ? (
                              <Pause
                                className="h-3.5 w-3.5"
                                fill="currentColor"
                              />
                            ) : (
                              <Play
                                className="h-3.5 w-3.5 ml-0.5"
                                fill="currentColor"
                              />
                            )}
                          </Button>

                          {/* Skip Buttons */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => skip(-10)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Back 10s (J)"
                          >
                            <SkipBack className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => skip(10)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Forward 10s (L)"
                          >
                            <SkipForward className="h-3 w-3" />
                          </Button>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-[10px] font-medium text-white/90 ml-1.5">
                            <span>{formatTime(currentTime)}</span>
                            <span className="text-white/30">/</span>
                            <span className="text-white/50">
                              {formatTime(duration)}
                            </span>
                          </div>

                          {/* Volume */}
                          <div className="flex items-center gap-1.5 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              title="Mute (M)"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={isMuted ? 0 : volume}
                              onChange={(e) =>
                                handleVolumeChange(parseFloat(e.target.value))
                              }
                              className="w-16 h-1 bg-white/15 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                            />
                          </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-1.5">
                          {/* Settings (Playback Speed) */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSettings(!showSettings)}
                              className="h-8 px-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-[9px] font-semibold transition-colors"
                              title="Playback speed"
                            >
                              {playbackRate}x
                            </Button>

                            <AnimatePresence>
                              {showSettings && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full mb-2 right-0 bg-black/95 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-white/10 min-w-[100px]"
                                >
                                  <div className="text-[9px] font-medium text-white/50 px-2 py-1">
                                    Speed
                                  </div>
                                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                    <button
                                      key={rate}
                                      onClick={() => changePlaybackRate(rate)}
                                      className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                                        playbackRate === rate
                                          ? "bg-white/20 text-white"
                                          : "text-white/70 hover:bg-white/10 hover:text-white"
                                      }`}
                                    >
                                      {rate === 1 ? "Normal" : `${rate}x`}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* PIP */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePictureInPicture}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Picture-in-Picture"
                          >
                            <PictureInPicture2 className="h-3 w-3" />
                          </Button>

                          {/* Download */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Download video"
                          >
                            <Download className="h-3 w-3" />
                          </Button>

                          {/* Share */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Share video"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>

                          {/* Process Further */}
                          {onProcessFurther && (
                            <Button
                              size="sm"
                              onClick={onProcessFurther}
                              className="h-8 px-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg text-[10px] font-semibold ml-1"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Enhance
                            </Button>
                          )}

                          {/* Fullscreen */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Fullscreen (F)"
                          >
                            {isFullscreen ? (
                              <Minimize2 className="h-3 w-3" />
                            ) : (
                              <Maximize2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default observer(VideoPreviewModal);
