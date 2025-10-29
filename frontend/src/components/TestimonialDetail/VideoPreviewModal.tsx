import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Minimize,
  Download,
  Share2,
  X,
  SkipBack,
  SkipForward,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isPlaying && !isHovering) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
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
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative ${isFullscreen ? "w-full h-full" : "w-[90vw] max-w-6xl max-h-[90vh] mx-4"} flex flex-col`}
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
            {/* Header - Floating */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 right-0 z-20 p-6"
                >
                  <div className="backdrop-blur-2xl bg-gradient-to-b from-black/80 to-transparent rounded-2xl border border-white/10 p-4 shadow-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                          {title}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          {metadata?.category && (
                            <Badge className="bg-white/10 backdrop-blur-xl border-white/20 text-white text-[9px] px-2 py-0.5">
                              {metadata.category}
                            </Badge>
                          )}
                          {metadata?.platform && (
                            <Badge className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-xl border-0 text-white text-[9px] px-2 py-0.5">
                              {metadata.platform}
                            </Badge>
                          )}
                          {metadata?.format && (
                            <span className="text-[10px] text-white/60">
                              {metadata.format.toUpperCase()}
                            </span>
                          )}
                          {metadata?.size && (
                            <span className="text-[10px] text-white/60">
                              {metadata.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-9 w-9 p-0 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white flex-shrink-0 ml-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Container */}
            <div
              className={`relative ${isFullscreen ? "w-full h-full" : "w-full"} flex items-center justify-center bg-black rounded-2xl overflow-hidden`}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className={`${isFullscreen ? "w-full h-full" : "max-w-full max-h-[80vh]"} object-contain`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />

              {/* Center Play Button Overlay */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm" />
                    <div className="relative">
                      <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative w-24 h-24 rounded-full bg-white/95 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20 group-hover:scale-110 transition-transform">
                        <Play
                          className="h-10 w-10 text-slate-900 ml-1.5"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Loading State */}
              {duration === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Controls - Floating Bottom */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 z-20 p-6"
                >
                  <div className="backdrop-blur-2xl bg-gradient-to-t from-black/80 to-transparent rounded-2xl border border-white/10 shadow-2xl">
                    {/* Progress Bar */}
                    <div className="px-4 pt-4 pb-2">
                      <div
                        className="group relative w-full h-1.5 bg-white/20 rounded-full overflow-visible cursor-pointer"
                        onClick={handleSeek}
                      >
                        {/* Buffered */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/30 rounded-full transition-all"
                          style={{ width: `${buffered}%` }}
                        />
                        {/* Progress */}
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                        {/* Thumb */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            left: `${progress}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="px-4 pb-4 pt-2">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2">
                          {/* Play/Pause */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePlay}
                            className="h-10 w-10 p-0 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white"
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" fill="currentColor" />
                            ) : (
                              <Play
                                className="h-4 w-4 ml-0.5"
                                fill="currentColor"
                              />
                            )}
                          </Button>

                          {/* Skip Buttons */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => skip(-10)}
                            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                          >
                            <SkipBack className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => skip(10)}
                            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                          >
                            <SkipForward className="h-3.5 w-3.5" />
                          </Button>

                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90 ml-2">
                            <span>{formatTime(currentTime)}</span>
                            <span className="text-white/40">/</span>
                            <span className="text-white/60">
                              {formatTime(duration)}
                            </span>
                          </div>

                          {/* Volume */}
                          <div className="flex items-center gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
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
                              className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                            />
                          </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                          {/* Playback Speed */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={changePlaybackRate}
                            className="h-9 px-3 rounded-full hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-semibold"
                          >
                            {playbackRate}x
                          </Button>

                          {/* Download */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                            title="Download video"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>

                          {/* Share */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                            title="Share video"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Process Further */}
                          {onProcessFurther && (
                            <Button
                              size="sm"
                              onClick={onProcessFurther}
                              className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg text-[10px] font-semibold"
                            >
                              <Sparkles className="h-3 w-3 mr-1.5" />
                              Enhance
                            </Button>
                          )}

                          {/* Fullscreen */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                            title="Toggle fullscreen"
                          >
                            {isFullscreen ? (
                              <Minimize className="h-3.5 w-3.5" />
                            ) : (
                              <Maximize2 className="h-3.5 w-3.5" />
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

export default VideoPreviewModal;
