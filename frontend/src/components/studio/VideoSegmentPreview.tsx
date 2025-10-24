import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Check, X, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HighlightMoment } from '@/types/ai-service';
import { cn } from '@/lib/utils';

interface VideoSegmentPreviewProps {
  moment: HighlightMoment;
  videoUrl: string;
  isSelected?: boolean;
  isSkipped?: boolean;
  onAccept?: () => void;
  onSkip?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

/**
 * VideoSegmentPreview - Plays a specific segment of a video
 *
 * Features:
 * - Plays only between start_time and end_time
 * - Shows engagement score badge
 * - Accept/Reject controls
 * - Auto-loops segment
 * - Thumbnail fallback
 */
const VideoSegmentPreview: React.FC<VideoSegmentPreviewProps> = ({
  moment,
  videoUrl,
  isSelected = false,
  isSkipped = false,
  onAccept,
  onSkip,
  autoPlay = false,
  showControls = true,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const isSegmentCompleteRef = useRef(false);
  const hasInitialized = useRef(false);

  // Convert milliseconds to seconds
  const startTimeSeconds = moment.start_time / 1000;
  const endTimeSeconds = moment.end_time / 1000;
  const durationSeconds = moment.duration / 1000;

  // Initialize video when component mounts or moment changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoSegmentPreview] Initializing segment (ms):', moment.start_time, '->', moment.end_time);
    console.log('[VideoSegmentPreview] Initializing segment (s):', startTimeSeconds, '->', endTimeSeconds);

    // Reset state
    video.pause();
    setIsPlaying(false);
    setIsLoading(true);
    isSegmentCompleteRef.current = false;
    hasInitialized.current = false;

    // Wait for metadata to be loaded before setting time
    const initializeVideo = () => {
      if (video.readyState >= 1) {
        console.log('[VideoSegmentPreview] Setting currentTime to:', startTimeSeconds, 'seconds');
        video.currentTime = startTimeSeconds;
        setCurrentTime(startTimeSeconds);
        hasInitialized.current = true;
      }
    };

    if (video.readyState >= 1) {
      initializeVideo();
    } else {
      video.addEventListener('loadedmetadata', initializeVideo, { once: true });
    }

    return () => {
      video.pause();
    };
  }, [startTimeSeconds, endTimeSeconds, videoUrl]);

  // Set up video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      setCurrentTime(currentVideoTime);

      // Only enforce segment boundaries if initialized
      if (!hasInitialized.current) return;

      // Check if we've reached the end of the segment
      if (currentVideoTime >= endTimeSeconds && !isSegmentCompleteRef.current) {
        console.log('[VideoSegmentPreview] Segment complete, looping back');
        isSegmentCompleteRef.current = true;
        video.pause();
        setIsPlaying(false);

        // Loop back to start
        setTimeout(() => {
          video.currentTime = startTimeSeconds;
          isSegmentCompleteRef.current = false;
          if (autoPlay) {
            video.play().catch((err) => console.error('Loop play failed:', err));
          }
        }, 100);
      }

      // Ensure we don't go before segment start
      if (currentVideoTime < startTimeSeconds) {
        video.currentTime = startTimeSeconds;
      }
    };

    const handleLoadedMetadata = () => {
      console.log('[VideoSegmentPreview] Metadata loaded');
      if (!hasInitialized.current) {
        video.currentTime = startTimeSeconds;
        hasInitialized.current = true;
      }
    };

    const handleLoadedData = () => {
      console.log('[VideoSegmentPreview] Data loaded');
      setIsLoading(false);
      if (autoPlay && hasInitialized.current) {
        video.play().catch((err) => {
          console.error('Auto-play failed:', err);
        });
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlay = () => {
      console.log('[VideoSegmentPreview] Playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('[VideoSegmentPreview] Paused');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('[VideoSegmentPreview] Video error:', e);
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [startTimeSeconds, endTimeSeconds, autoPlay]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoSegmentPreview] Toggle play, current state:', isPlaying);

    try {
      if (isPlaying) {
        video.pause();
      } else {
        // If at the end of segment or before start, restart from beginning
        if (video.currentTime >= endTimeSeconds ||
            video.currentTime < startTimeSeconds ||
            isSegmentCompleteRef.current) {
          console.log('[VideoSegmentPreview] Restarting from:', startTimeSeconds);
          video.currentTime = startTimeSeconds;
          isSegmentCompleteRef.current = false;
        }

        // Ensure video is ready to play
        if (video.readyState >= 2) {
          console.log('[VideoSegmentPreview] Playing immediately');
          await video.play();
        } else {
          console.log('[VideoSegmentPreview] Waiting for canplay');
          // Wait for video to be ready
          const playWhenReady = async () => {
            try {
              console.log('[VideoSegmentPreview] Now playing after canplay');
              await video.play();
            } catch (error) {
              console.error('Delayed play failed:', error);
            }
          };
          video.addEventListener('canplay', playWhenReady, { once: true });
        }
      }
    } catch (err) {
      console.error('Play failed:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  // Calculate segment-relative time for display (in seconds)
  const segmentCurrentTime = Math.max(0, Math.min(currentTime - startTimeSeconds, durationSeconds));

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 transition-all',
        isSelected && !isSkipped && 'border-blue-500 bg-blue-50/30',
        isSkipped && 'border-slate-300 bg-slate-100 opacity-60',
        !isSelected && !isSkipped && 'border-slate-200 hover:border-slate-300',
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Video Preview */}
      <div className="relative aspect-video bg-slate-900">
        {/* Skipped Overlay */}
        {isSkipped && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10">
            <div className="text-center">
              <X className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-xs text-white font-medium">Skipped</p>
            </div>
          </div>
        )}
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs">Failed to load video</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              playsInline
              muted={false}
              preload="metadata"
              poster={moment.thumbnail_url}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <RefreshCw className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </>
        )}

        {/* Play/Pause Overlay */}
        {!hasError && !isLoading && (isHovering || !isPlaying) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
              {isPlaying ? (
                <Pause className="h-5 w-5 text-slate-900" />
              ) : (
                <Play className="h-5 w-5 text-slate-900 ml-0.5" />
              )}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0.5 border font-medium',
              getEngagementColor(moment.engagement_score)
            )}
          >
            <TrendingUp className="h-2.5 w-2.5 mr-1" />
            {Math.round(moment.engagement_score * 100)}%
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 bg-black/70 text-white border-0"
          >
            <Clock className="h-2.5 w-2.5 mr-1" />
            {formatTime(segmentCurrentTime)} / {formatTime(durationSeconds)}
          </Badge>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {moment.theme && (
              <p className="text-xs font-semibold text-slate-900 mb-1 truncate">
                {moment.theme}
              </p>
            )}
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {moment.text}
            </p>
          </div>
        </div>

        {/* Keywords */}
        {moment.keywords && moment.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {moment.keywords.slice(0, 3).map((keyword, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-0"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showControls && (onAccept || onSkip) && (
          <>
            {isSkipped ? (
              <Button
                onClick={onSkip}
                size="sm"
                className="w-full h-7 text-xs bg-slate-600 hover:bg-slate-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Unskip
              </Button>
            ) : isSelected ? (
              <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-medium py-1.5">
                <Check className="h-3 w-3" />
                Selected
              </div>
            ) : (
              <div className="flex gap-2">
                {onSkip && (
                  <Button
                    onClick={onSkip}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                )}
                {onAccept && (
                  <Button
                    onClick={onAccept}
                    size="sm"
                    className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Select
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default VideoSegmentPreview;
