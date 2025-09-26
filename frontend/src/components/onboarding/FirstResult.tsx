import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Edit3,
  Download,
  Share2,
  Bookmark,
  Clock,
  Scissors,
  Sparkles,
  ArrowRight,
  Globe,
} from "lucide-react";

interface FirstResultProps {
  videoUrl: string;
  transcript: TranscriptSegment[];
  highlights: Highlight[];
  clipUrl?: string;
  onSaveAndPublish: () => void;
  onSaveToLibrary: () => void;
  onEditTranscript: (transcript: TranscriptSegment[]) => void;
  onUpdateHighlights: (highlights: Highlight[]) => void;
}

interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

interface Highlight {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  score: number;
  category: "impact" | "emotion" | "result" | "recommendation" | "feature";
}

export const FirstResult: React.FC<FirstResultProps> = ({
  videoUrl,
  transcript,
  highlights,
  clipUrl,
  onSaveAndPublish,
  onSaveToLibrary,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(
    null
  );
  const [clipDuration, setClipDuration] = useState<15 | 30>(15);

  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const getHighlightColor = (category: string) => {
    const colors = {
      impact: "bg-red-50 border-red-200 text-red-700",
      emotion: "bg-orange-50 border-orange-200 text-orange-700",
      result: "bg-green-50 border-green-200 text-green-700",
      recommendation: "bg-blue-50 border-blue-200 text-blue-700",
      feature: "bg-purple-50 border-purple-200 text-purple-700",
    };
    return colors[category as keyof typeof colors] || colors.impact;
  };

  const getCurrentTranscriptSegment = () => {
    return transcript.find(
      (segment) =>
        currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">
                  Your processed testimonial
                </h1>
                <p className="text-sm text-gray-600 font-light">
                  We found {highlights.length} highlights and a {clipDuration}s
                  clip — edit or save
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600 font-medium">
                  Processing complete
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left: Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full aspect-video object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={handlePlayPause}
                />

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-100"
                          style={{
                            width: `${(currentTime / duration) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-white/80">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handlePlayPause}
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white ml-1" />
                          )}
                        </button>
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-4 w-4 text-white" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) =>
                              setVolume(parseFloat(e.target.value))
                            }
                            className="w-20"
                          />
                        </div>
                      </div>
                      <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Maximize className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Clip Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Scissors className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Suggested clip
                      </h3>
                      <p className="text-xs text-gray-600">
                        Perfect for social sharing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setClipDuration(15)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        clipDuration === 15
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      15s
                    </button>
                    <button
                      onClick={() => setClipDuration(30)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        clipDuration === 30
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      30s
                    </button>
                  </div>
                </div>

                {clipUrl ? (
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <video
                      src={clipUrl}
                      controls
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Generating {clipDuration}s clip...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Transcript & Highlights */}
            <div className="space-y-6">
              {/* Transcript */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Transcript
                  </h3>
                  <button
                    onClick={() => setEditingTranscript(!editingTranscript)}
                    className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {transcript.map((segment) => (
                    <motion.div
                      key={segment.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        getCurrentTranscriptSegment()?.id === segment.id
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => seekToTime(segment.startTime)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTime(segment.startTime)}
                        </span>
                        <Clock className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {segment.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI Highlights */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    AI-extracted highlights
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {highlights.length} found
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {highlights.map((highlight) => (
                    <motion.div
                      key={highlight.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedHighlight === highlight.id
                          ? "border-gray-300 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      } ${getHighlightColor(highlight.category)}`}
                      onClick={() => {
                        setSelectedHighlight(
                          selectedHighlight === highlight.id
                            ? null
                            : highlight.id
                        );
                        seekToTime(highlight.startTime);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-xs font-semibold">
                          {highlight.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                          <span className="text-xs opacity-80">
                            {Math.round(highlight.score * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-90 mb-2 leading-relaxed">
                        {highlight.description}
                      </p>
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>
                          {formatTime(highlight.startTime)} -{" "}
                          {formatTime(highlight.endTime)}
                        </span>
                        <span className="capitalize">{highlight.category}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-between">
              {/* Secondary Actions */}
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  <Edit3 className="h-4 w-4" />
                  <span>Edit transcript</span>
                </button>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Download captions</span>
                </button>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Primary Actions */}
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSaveToLibrary}
                  className="
                    px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50
                    rounded-2xl font-semibold text-sm transition-all duration-300
                    flex items-center shadow-sm hover:shadow-md
                  "
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save to Library
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSaveAndPublish}
                  className="
                    px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold
                    rounded-2xl transition-all duration-300 flex items-center
                    shadow-lg hover:shadow-xl text-sm
                  "
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Save & Publish
                  <ArrowRight className="h-4 w-4 ml-2" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 4 of 4 • Review and publish
          </p>
        </div>
      </div>
    </div>
  );
};
