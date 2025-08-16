// components/ai-studio/service-config/HighlightSegmentModal.tsx
import {
  Brain,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  RectangleHorizontal,
  Square,
  RectangleVertical,
} from "lucide-react";
import { Segment } from "../types";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Testimonial } from "@/types/testimonial";

// Professional Video Player Component
const ProfessionalVideoPlayer = ({
  videoUrl,
  currentSegment,
  selectedSegments,
  segments,
  isPlayingAll,
  onSegmentComplete,
  onAllSegmentsComplete,
}: {
  videoUrl: string;
  currentSegment: Segment | null;
  selectedSegments: string[];
  segments: Segment[];
  isPlayingAll: boolean;
  onSegmentComplete: () => void;
  onAllSegmentsComplete: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">(
    "16:9"
  );

  const selectedSegmentObjects = segments.filter((s) =>
    selectedSegments.includes(s.id)
  );
  const activeSegment = isPlayingAll
    ? selectedSegmentObjects[currentSegmentIndex]
    : currentSegment;
  const segmentDuration = activeSegment
    ? activeSegment.endTime - activeSegment.startTime
    : 0;
  const segmentCurrentTime = activeSegment
    ? Math.max(0, currentTime - activeSegment.startTime)
    : 0;

  // Initialize video when segment changes
  useEffect(() => {
    if (activeSegment && videoRef.current) {
      const video = videoRef.current;
      setIsLoading(true);
      video.currentTime = activeSegment.startTime;
      setCurrentTime(activeSegment.startTime);
      setDuration(segmentDuration);
    }
  }, [activeSegment?.id]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      setCurrentTime(currentVideoTime);

      // Check if we've reached the end of the current segment
      if (activeSegment && currentVideoTime >= activeSegment.endTime) {
        video.pause();
        setIsPlaying(false);

        if (
          isPlayingAll &&
          currentSegmentIndex < selectedSegmentObjects.length - 1
        ) {
          // Move to next segment after a brief pause
          setTimeout(() => {
            const nextIndex = currentSegmentIndex + 1;
            setCurrentSegmentIndex(nextIndex);
            const nextSegment = selectedSegmentObjects[nextIndex];
            if (nextSegment) {
              video.currentTime = nextSegment.startTime;
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch(console.error);
            }
            onSegmentComplete();
          }, 300);
        } else if (isPlayingAll) {
          // All segments completed
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

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [
    activeSegment,
    isPlayingAll,
    currentSegmentIndex,
    selectedSegmentObjects.length,
  ]);

  // Reset segment index when starting new playback
  useEffect(() => {
    if (isPlayingAll) {
      setCurrentSegmentIndex(0);
    }
  }, [isPlayingAll]);

  const togglePlay = async () => {
    if (!videoRef.current || !activeSegment) return;

    const video = videoRef.current;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        // If we're at the end of the segment, restart from beginning
        if (video.currentTime >= activeSegment.endTime) {
          video.currentTime = activeSegment.startTime;
        }
        await video.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || !activeSegment) return;

    const progress = parseFloat(e.target.value);
    const newTime = activeSegment.startTime + progress * segmentDuration;
    videoRef.current.currentTime = Math.min(newTime, activeSegment.endTime);
  };

  const restart = () => {
    if (!videoRef.current || !activeSegment) return;
    videoRef.current.currentTime = activeSegment.startTime;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
      {/* Video Element */}
      <div className="relative flex justify-center bg-black">
        <video
          ref={videoRef}
          className="object-cover max-w-full"
          style={getAspectRatioStyle()}
          src={videoUrl}
          preload="metadata"
          playsInline
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {/* Play Button Overlay */}
        {!isPlaying && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-black ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Professional Controls */}
      <div className="bg-gradient-to-b from-gray-900 to-black p-4">
        {/* Progress Bar */}
        <div className="relative mb-4 group">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={
              segmentDuration > 0 ? segmentCurrentTime / segmentDuration : 0
            }
            onChange={handleSeek}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(segmentCurrentTime)}</span>
            <span>{formatTime(segmentDuration)}</span>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={restart}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              title="Restart Segment"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={!activeSegment}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <div className="w-20 relative group">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </div>

          {/* Center Info */}
          {isPlayingAll && selectedSegmentObjects.length > 1 && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <div className="px-3 py-1 bg-blue-600 rounded-full text-white text-xs">
                {currentSegmentIndex + 1} of {selectedSegmentObjects.length}
              </div>
              <span>Playing Sequence</span>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAspectRatio}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              title={`Aspect Ratio: ${aspectRatio}`}
            >
              {getAspectRatioIcon()}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Segment Info */}
        {activeSegment && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                  {Math.floor(activeSegment.startTime)}s -{" "}
                  {Math.floor(activeSegment.endTime)}s
                </span>
                {isPlayingAll && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                    Sequence Mode
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {activeSegment.customerInfo.name}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {activeSegment.customerInfo.company}
                </span>
              </div>
            </div>
            <p className="text-white text-sm leading-relaxed">
              "{activeSegment.text}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Modal Component
const HighlightSegmentModal = ({
  isOpen,
  onClose,
  testimonials,
  onSegmentsSelected,
  videoPreviewUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  testimonials: Testimonial[];
  onSegmentsSelected: Dispatch<SetStateAction<string[]>>;
  videoPreviewUrl: string;
}) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<Segment | null>(null);
  const [analysisMode, setAnalysisMode] = useState("emotion");
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  useEffect(() => {
    if (isOpen && testimonials.length > 0) {
      fetchSegments();
    }
  }, [isOpen, testimonials]);

  useEffect(() => {
    if (segments.length > 0 && !currentPreview) {
      setCurrentPreview(segments[0]);
    }
  }, [segments, currentPreview]);

  useEffect(() => {
    if (selectedSegments.length === 1) {
      const segment = segments.find((s) => s.id === selectedSegments[0]);
      if (segment) {
        setCurrentPreview(segment);
        setIsPlayingAll(false);
      }
    }
  }, [selectedSegments, segments]);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const mockSegments = testimonials.flatMap((testimonial) =>
        testimonial.media_type === "video"
          ? [
              {
                id: `${testimonial.id}_1`,
                testimonialId: testimonial.id,
                text: "This solution completely transformed our entire workflow process and increased our team's productivity by over 300%",
                startTime: 2,
                endTime: 12,
                emotion: "excitement",
                confidence: 0.95,
                businessValue: 0.92,
                engagementScore: 0.88,
                theme: "transformation",
                keyPhrase: "300% productivity increase",
                estimatedViralPotential: 0.85,
                customerInfo: {
                  name: testimonial.customer_name,
                  company: testimonial.company,
                  avatar: testimonial.thumbnail,
                },
              },
              {
                id: `${testimonial.id}_2`,
                text: "The ROI was immediate - we saw results within the first week and saved over $50,000 in the first quarter alone",
                startTime: 12,
                endTime: 20,
                emotion: "satisfaction",
                confidence: 0.89,
                businessValue: 0.96,
                engagementScore: 0.91,
                theme: "metrics",
                keyPhrase: "$50,000 savings",
                estimatedViralPotential: 0.78,
                customerInfo: {
                  name: testimonial.customer_name,
                  company: testimonial.company,
                  avatar: testimonial.thumbnail,
                },
              },
              {
                id: `${testimonial.id}_3`,
                text: "I would absolutely recommend this to any business facing similar challenges - it's a game changer",
                startTime: 20,
                endTime: 30,
                emotion: "trust",
                confidence: 0.92,
                businessValue: 0.87,
                engagementScore: 0.94,
                theme: "recommendation",
                keyPhrase: "absolutely recommend",
                estimatedViralPotential: 0.82,
                customerInfo: {
                  name: testimonial.customer_name,
                  company: testimonial.company,
                  avatar: testimonial.thumbnail,
                },
              },
              {
                id: `${testimonial.id}_4`,
                text: "The support team was incredibly responsive and helped us implement everything seamlessly",
                startTime: 30,
                endTime: 42,
                emotion: "satisfaction",
                confidence: 0.87,
                businessValue: 0.82,
                engagementScore: 0.86,
                theme: "support",
                keyPhrase: "incredibly responsive",
                estimatedViralPotential: 0.75,
                customerInfo: {
                  name: testimonial.customer_name,
                  company: testimonial.company,
                  avatar: testimonial.thumbnail,
                },
              },
            ]
          : []
      );
      setSegments(mockSegments);
    } finally {
      setLoading(false);
    }
  };

  const previewSegment = (segment: Segment) => {
    setCurrentPreview(segment);
    setIsPlayingAll(false);
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments((prev) => {
      const newSelected = prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId];
      return newSelected;
    });
  };

  const playAllSelected = () => {
    if (selectedSegments.length > 0) {
      const firstSegment = segments.find((s) => s.id === selectedSegments[0]);
      if (firstSegment) {
        setCurrentPreview(firstSegment);
        setIsPlayingAll(true);
        // Small delay to ensure state is updated
        setTimeout(() => {
          const video = document.querySelector("video");
          if (video) {
            video.currentTime = firstSegment.startTime;
            video.play().catch(console.error);
          }
        }, 100);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9)
      return "text-emerald-700 bg-emerald-100 border-emerald-200";
    if (score >= 0.8) return "text-amber-700 bg-amber-100 border-amber-200";
    return "text-slate-600 bg-slate-100 border-slate-200";
  };

  const getAnalysisScore = (segment: any) => {
    switch (analysisMode) {
      case "emotion":
        return segment.confidence;
      case "engagement":
        return segment.engagementScore;
      case "business_value":
        return segment.businessValue;
      default:
        return segment.confidence;
    }
  };

  const selectHighValueSegments = () => {
    const highValueSegments = segments
      .filter((s) => getAnalysisScore(s) > 0.8)
      .map((s) => s.id);
    setSelectedSegments(highValueSegments);
  };

  const calculateTotalDuration = () => {
    return selectedSegments.reduce((total, segmentId) => {
      const segment = segments.find((s) => s.id === segmentId);
      return total + (segment ? segment.endTime - segment.startTime : 0);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI-Powered Segment Selection
              </h2>
              <p className="text-gray-600 mt-1">
                Choose the most impactful moments for your content
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">
                  Analysis Mode:
                </span>
                <select
                  value={analysisMode}
                  onChange={(e) => setAnalysisMode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="emotion">Emotional Impact</option>
                  <option value="engagement">Viral Potential</option>
                  <option value="business_value">Business Value</option>
                </select>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600 text-lg">
              Analyzing video segments with AI...
            </p>
          </div>
        ) : (
          <div className="flex h-[75vh]">
            {/* Video Panel */}
            <div className="w-1/2 p-6 bg-gray-50">
              <ProfessionalVideoPlayer
                videoUrl={
                  videoPreviewUrl ||
                  testimonials[0]?.media_url ||
                  "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
                }
                currentSegment={currentPreview}
                selectedSegments={selectedSegments}
                segments={segments}
                isPlayingAll={isPlayingAll}
                onSegmentComplete={() => {}}
                onAllSegmentsComplete={() => setIsPlayingAll(false)}
              />

              {/* Play All Button */}
              {selectedSegments.length > 1 && (
                <div className="mt-6">
                  <button
                    onClick={playAllSelected}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Play className="h-5 w-5" />
                    <span className="font-medium">
                      Play All Selected Segments ({selectedSegments.length})
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Segments List */}
            <div className="w-1/2 overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Segments ({segments.length})
                  </h3>
                  <div className="text-sm text-gray-600 font-medium">
                    {selectedSegments.length} selected
                  </div>
                </div>

                <div className="space-y-4">
                  {segments
                    .sort((a, b) => getAnalysisScore(b) - getAnalysisScore(a))
                    .map((segment) => (
                      <motion.div
                        key={segment.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          selectedSegments.includes(segment.id)
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : currentPreview?.id === segment.id
                              ? "border-indigo-400 bg-indigo-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                                {Math.floor(segment.startTime)}s -{" "}
                                {Math.floor(segment.endTime)}s
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-medium ${
                                  segment.theme === "transformation"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                    : segment.theme === "metrics"
                                      ? "bg-green-100 text-green-800 border border-green-200"
                                      : segment.theme === "support"
                                        ? "bg-orange-100 text-orange-800 border border-orange-200"
                                        : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {segment.theme}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-bold border ${getScoreColor(getAnalysisScore(segment))}`}
                              >
                                {Math.round(getAnalysisScore(segment) * 100)}%
                              </span>
                            </div>
                            <p className="text-gray-900 text-sm leading-relaxed mb-3 line-clamp-2">
                              "{segment.text}"
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                <span className="font-medium">
                                  {segment.keyPhrase}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>
                                  {Math.round(
                                    segment.estimatedViralPotential * 100
                                  )}
                                  % viral
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-3">
                            <button
                              onClick={() => toggleSegment(segment.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                selectedSegments.includes(segment.id)
                                  ? "border-blue-500 bg-blue-500 scale-110"
                                  : "border-gray-300 hover:border-blue-400 hover:scale-105"
                              }`}
                            >
                              {selectedSegments.includes(segment.id) && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </button>
                            <button
                              onClick={() => previewSegment(segment)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                currentPreview?.id === segment.id
                                  ? "text-indigo-600 bg-indigo-100"
                                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              }`}
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={selectHighValueSegments}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Select All High-Value (
                {segments.filter((s) => getAnalysisScore(s) > 0.8).length})
              </button>
              <button
                onClick={() => setSelectedSegments([])}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {selectedSegments.length}
                </span>{" "}
                segments selected
                {selectedSegments.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                    {Math.round(calculateTotalDuration())}s total
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onSegmentsSelected(selectedSegments);
                  onClose();
                }}
                disabled={selectedSegments.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
              >
                Use Selected Segments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightSegmentModal;
