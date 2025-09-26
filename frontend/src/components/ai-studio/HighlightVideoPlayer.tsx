// components/ai-studio/HighlightVideoPlayer.tsx - Fixed Version
import {
  Maximize,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  RefreshCw,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Segment } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

// Video Player Component
const VideoPlayer = ({
  videoUrl,
  currentSegment,
  selectedSegmentIds,
  segments,
  isPlayingAll,
  onSegmentComplete,
  onAllSegmentsComplete,
}: {
  videoUrl: string;
  currentSegment: Segment | null;
  selectedSegmentIds: string[];
  segments: Segment[];
  isPlayingAll: boolean;
  onSegmentComplete: () => void;
  onAllSegmentsComplete: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">(
    "16:9"
  );
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false);
  const [isSegmentComplete, setIsSegmentComplete] = useState(false);

  // Refs to track state
  const isPlayingRef = useRef(isPlaying);
  const activeSegmentRef = useRef(currentSegment);
  const isSeeking = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    activeSegmentRef.current = currentSegment;
  }, [currentSegment]);

  const selectedSegmentObjects = segments.filter((_, index) =>
    selectedSegmentIds.includes(index.toString())
  );

  const activeSegment = isPlayingAll
    ? selectedSegmentObjects[currentSegmentIndex]
    : currentSegment;

  const segmentDuration = activeSegment
    ? activeSegment.end_time - activeSegment.start_time
    : 0;

  const segmentCurrentTime = activeSegment
    ? Math.max(0, currentTime - activeSegment.start_time)
    : 0;

  // Safe video operations
  const safeVideoOperation = useCallback(
    async (operation: () => Promise<void> | void) => {
      const video = videoRef.current;
      if (!video) return;

      try {
        await operation();
      } catch (error) {
        console.error("Video operation failed:", error);
        // Reset playing state if operation fails
        setIsPlaying(false);
      }
    },
    []
  );

  // Initialize video when segment changes
  useEffect(() => {
    if (activeSegment && videoRef.current) {
      const video = videoRef.current;

      // Pause video first to avoid conflicts
      video.pause();
      setIsPlaying(false);
      setIsLoading(true);
      setIsSegmentComplete(false);

      // Set the video time
      video.currentTime = activeSegment.start_time;
      setCurrentTime(activeSegment.start_time);
      setDuration(segmentDuration);
    }
  }, [activeSegment, segmentDuration]);

  // Enhanced video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      setCurrentTime(currentVideoTime);

      // Check if we've reached the end of the current segment
      if (
        activeSegment &&
        currentVideoTime >= activeSegment.end_time &&
        !isSegmentComplete
      ) {
        setIsSegmentComplete(true);
        video.pause();
        setIsPlaying(false);

        if (
          isPlayingAll &&
          currentSegmentIndex < selectedSegmentObjects.length - 1
        ) {
          // Move to next segment
          setTimeout(() => {
            const nextIndex = currentSegmentIndex + 1;
            setCurrentSegmentIndex(nextIndex);
            const nextSegment = selectedSegmentObjects[nextIndex];
            if (nextSegment) {
              video.currentTime = nextSegment.start_time;
              setIsSegmentComplete(false);
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch(console.error);
            }
            onSegmentComplete();
          }, 100);
        } else if (isPlayingAll) {
          setCurrentSegmentIndex(0);
          onAllSegmentsComplete();
        }
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleSeeked = () => {
      // When seeking is complete, restore playing state if it was playing before
      isSeeking.current = false;
      if (wasPlayingBeforeSeek && activeSegment) {
        video
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(console.error);
      }
      setWasPlayingBeforeSeek(false);
    };

    const handleSeeking = () => {
      isSeeking.current = true;
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleStalled = () => {
      console.warn("Video stalled");
      setIsLoading(true);
    };

    // Add event listeners
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("error", handleError);
    video.addEventListener("stalled", handleStalled);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("error", handleError);
      video.removeEventListener("stalled", handleStalled);
    };
  }, [
    activeSegment,
    isPlayingAll,
    currentSegmentIndex,
    selectedSegmentObjects.length,
    onSegmentComplete,
    onAllSegmentsComplete,
    wasPlayingBeforeSeek,
    isSegmentComplete,
  ]);

  // Reset segment index when starting to play all
  useEffect(() => {
    if (isPlayingAll) {
      setCurrentSegmentIndex(0);
      setIsSegmentComplete(false);
    }
  }, [isPlayingAll]);

  const togglePlay = async () => {
    if (!videoRef.current || !activeSegment) return;

    const video = videoRef.current;

    await safeVideoOperation(async () => {
      if (isPlaying) {
        video.pause();
      } else {
        // If at the end of segment, restart from beginning
        if (video.currentTime >= activeSegment.end_time || isSegmentComplete) {
          video.currentTime = activeSegment.start_time;
          setIsSegmentComplete(false);
        }

        // Ensure video is ready to play
        if (video.readyState >= 2) {
          await video.play();
        } else {
          // Wait for video to be ready
          video.addEventListener(
            "canplay",
            async () => {
              try {
                await video.play();
              } catch (error) {
                console.error("Delayed play failed:", error);
              }
            },
            { once: true }
          );
        }
      }
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !activeSegment) return;

    const video = videoRef.current;
    const progress = parseFloat(e.target.value);
    const newTime = activeSegment.start_time + progress * segmentDuration;
    const clampedTime = Math.min(
      Math.max(newTime, activeSegment.start_time),
      activeSegment.end_time
    );

    // Store current playing state
    setWasPlayingBeforeSeek(isPlaying);
    setIsSegmentComplete(false);

    // Seek to new position
    video.currentTime = clampedTime;
  };

  const restart = () => {
    if (!videoRef.current || !activeSegment) return;

    const video = videoRef.current;
    const wasPlaying = isPlaying;

    video.pause();
    video.currentTime = activeSegment.start_time;
    setIsSegmentComplete(false);

    if (wasPlaying) {
      setTimeout(() => {
        video
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(console.error);
      }, 100);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
  };

  const toggleAspectRatio = () => {
    setAspectRatio((prev) => {
      switch (prev) {
        case "16:9":
          return "1:1";
        case "1:1":
          return "9:16";
        case "9:16":
          return "16:9";
        default:
          return "16:9";
      }
    });
  };

  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case "16:9":
        return { aspectRatio: "16/9", height: "auto" };
      case "1:1":
        return { aspectRatio: "1/1", height: "320px" };
      case "9:16":
        return { aspectRatio: "9/16", height: "400px" };
      default:
        return { aspectRatio: "16/9", height: "auto" };
    }
  };

  const getAspectRatioIcon = () => {
    switch (aspectRatio) {
      case "16:9":
        return <RectangleHorizontal className="h-4 w-4" />;
      case "1:1":
        return <Square className="h-4 w-4" />;
      case "9:16":
        return <RectangleVertical className="h-4 w-4" />;
      default:
        return <RectangleHorizontal className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    segmentDuration > 0 ? (segmentCurrentTime / segmentDuration) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Video Container */}
      <div className="relative bg-black">
        <div className="relative flex justify-center">
          <video
            ref={videoRef}
            className="object-cover max-w-full"
            style={getAspectRatioStyle()}
            src={videoUrl}
            preload="metadata"
            playsInline
            muted={false}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-white animate-spin" />
            </div>
          )}

          {/* Play Button Overlay */}
          {!isPlaying && !isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-black ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        {/* Progress Bar */}
        <div className="relative mb-4">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all duration-150"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={
              segmentDuration > 0
                ? Math.min(segmentCurrentTime / segmentDuration, 1)
                : 0
            }
            onChange={handleSeek}
            className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(segmentCurrentTime)}</span>
            <span>{formatTime(segmentDuration)}</span>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
              disabled={!activeSegment}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <div className="w-16">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Center Info */}
          {isPlayingAll && selectedSegmentObjects.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="px-2 py-1 bg-gray-900 text-white rounded-full">
                {currentSegmentIndex + 1} of {selectedSegmentObjects.length}
              </div>
              <span>Sequence</span>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAspectRatio}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Aspect: ${aspectRatio}`}
            >
              {getAspectRatioIcon()}
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fullscreen"
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Segment Info */}
        {activeSegment && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                  {Math.floor(activeSegment.start_time)}s -{" "}
                  {Math.floor(activeSegment.end_time)}s
                </span>
                {isPlayingAll && (
                  <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded font-medium">
                    Sequence
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{activeSegment.theme}</div>
            </div>
            <p className="text-gray-900 text-sm leading-relaxed">
              "{activeSegment.text}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(VideoPlayer);
