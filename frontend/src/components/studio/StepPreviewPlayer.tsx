import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  CheckCircle2,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewArtifact } from '@/hooks/useStudioSSE';

interface StepPreviewPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: PreviewArtifact | null;
  stepName?: string;
  stepStatus?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  onAccept?: () => void;
  onRetry?: () => void;
  onSkip?: () => void;
  onDownload?: (url: string) => void;
}

const StepPreviewPlayer: React.FC<StepPreviewPlayerProps> = ({
  isOpen,
  onClose,
  preview,
  stepName,
  stepStatus,
  onAccept,
  onRetry,
  onSkip,
  onDownload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!preview) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStepName = (name?: string) => {
    if (!name) return 'Preview';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(preview.previewUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">
              {formatStepName(stepName)}
            </h2>
            {stepStatus && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  stepStatus === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : stepStatus === 'failed'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {stepStatus}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Preview Area */}
        <div ref={containerRef} className="relative bg-black">
          {preview.previewType === 'video' ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={preview.previewUrl}
                className="w-full aspect-video object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={handlePlayPause}
              />

              {/* Video Controls Overlay */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer"
                    onClick={handlePlayPause}
                  >
                    <div className="bg-white/90 rounded-full p-6 hover:scale-110 transition-transform">
                      <Play className="h-10 w-10 text-slate-800" fill="currentColor" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  />

                  <div className="flex items-center justify-between gap-4">
                    {/* Left Controls */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/10"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/10"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      <span className="text-xs text-white font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/10"
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4" />
                        ) : (
                          <Maximize className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : preview.previewType === 'image' || preview.previewType === 'thumbnail' ? (
            <div className="relative min-h-[400px] flex items-center justify-center p-8">
              <img
                src={preview.previewUrl}
                alt={stepName || 'Preview'}
                className="max-w-full max-h-[600px] object-contain"
              />
            </div>
          ) : null}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-800/50 border-t border-slate-700">
          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            {preview.width && preview.height && (
              <div>
                <span className="text-slate-500">Resolution:</span>{' '}
                <span className="text-slate-300 font-medium">
                  {preview.width}x{preview.height}
                </span>
              </div>
            )}
            {preview.duration && (
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <span className="text-slate-300 font-medium">
                  {formatTime(preview.duration)}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Type:</span>{' '}
              <span className="text-slate-300 font-medium capitalize">
                {preview.previewType}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {stepStatus === 'failed' && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Step
              </Button>
            )}

            {stepStatus === 'in_progress' && onSkip && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onSkip();
                  onClose();
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Step
              </Button>
            )}

            {stepStatus === 'completed' && onAccept && (
              <Button
                size="sm"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept & Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StepPreviewPlayer;
