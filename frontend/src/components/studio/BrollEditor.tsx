import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  GripVertical,
  ImageIcon,
  Plus,
  Trash2,
  Film,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StockFootageLibrary from "./StockFootageLibrary";

interface BrollClip {
  id: string;
  url: string;
  name: string;
  thumbnail?: string;
  duration: number;
  start_time: number; // When to insert in the main video
  broll_duration: number; // How long to show the B-roll
  transition: "fade" | "dissolve" | "cut";
  pexels_id?: number;
}

interface BrollEditorConfig {
  placement_strategy: "auto" | "beginning" | "end" | "custom";
  max_broll_duration: number;
  transition_type: "fade" | "dissolve" | "cut";
  broll_clips: BrollClip[];
}

interface BrollEditorProps {
  config: BrollEditorConfig;
  onConfigChange: (config: BrollEditorConfig) => void;
  videoUrl?: string;
  videoDuration: number; // Total video duration in seconds
}

const BrollEditor: React.FC<BrollEditorProps> = ({
  config,
  onConfigChange,
  videoUrl,
  videoDuration,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showStockLibrary, setShowStockLibrary] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Sync video playback with current time
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Update current time when video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(videoDuration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const addBrollClip = (clips: any[]) => {
    const newClips = clips.map((clip, index) => ({
      id: `broll-${Date.now()}-${index}`,
      url: clip.url,
      name: clip.name,
      thumbnail: clip.thumbnail,
      duration: clip.duration,
      start_time: Math.min(currentTime, videoDuration - 5), // Insert at current time or near end
      broll_duration: Math.min(clip.duration, config.max_broll_duration),
      transition: config.transition_type,
      pexels_id: clip.pexels_id,
    }));

    onConfigChange({
      ...config,
      broll_clips: [...config.broll_clips, ...newClips],
    });
  };

  const removeBrollClip = (id: string) => {
    onConfigChange({
      ...config,
      broll_clips: config.broll_clips.filter((clip) => clip.id !== id),
    });
  };

  const updateBrollClip = (id: string, updates: Partial<BrollClip>) => {
    onConfigChange({
      ...config,
      broll_clips: config.broll_clips.map((clip) =>
        clip.id === id ? { ...clip, ...updates } : clip
      ),
    });
  };

  const reorderBrollClips = (newOrder: BrollClip[]) => {
    onConfigChange({
      ...config,
      broll_clips: newOrder,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // // Calculate timeline scale
  // const timelineWidth = 800; // pixels
  // const pixelsPerSecond = timelineWidth / videoDuration;

  const selectedClip = config.broll_clips.find(
    (clip) => clip.id === selectedClipId
  );

  return (
    <Card className="p-6 border-2 border-teal-200 bg-gradient-to-br from-teal-50/30 to-white">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
          <Film className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            B-roll Editor
          </h3>
          <p className="text-xs text-slate-600">
            Position and customize B-roll footage insertions
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {config.broll_clips.length} clips
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Video Preview */}
        {videoUrl && (
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              playsInline
            />

            {/* Playback Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Timeline Scrubber */}
              <div className="mb-3">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(-5)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(5)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-xs text-white font-mono">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>
              </div>
            </div>

            {/* Current Time Indicator on Video */}
            {config.broll_clips.map((clip) => {
              const isActive =
                currentTime >= clip.start_time &&
                currentTime < clip.start_time + clip.broll_duration;

              if (!isActive) return null;

              return (
                <div
                  key={clip.id}
                  className="absolute top-3 right-3 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                >
                  <ImageIcon className="h-3 w-3" />
                  B-roll: {clip.name.substring(0, 20)}...
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-700">
              B-roll Timeline
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStockLibrary(true)}
              className="h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add B-roll
            </Button>
          </div>

          <div
            ref={timelineRef}
            className="relative bg-slate-100 rounded-lg p-4 min-h-[120px]"
          >
            {/* Time Markers */}
            <div className="relative h-6 mb-3">
              {Array.from({ length: Math.ceil(videoDuration / 10) + 1 }).map(
                (_, i) => {
                  const time = i * 10;
                  if (time > videoDuration) return null;

                  return (
                    <div
                      key={i}
                      className="absolute top-0 flex flex-col items-center"
                      style={{ left: `${(time / videoDuration) * 100}%` }}
                    >
                      <div className="w-px h-2 bg-slate-400" />
                      <span className="text-xs text-slate-500 mt-1">
                        {formatTime(time)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            {/* Main Video Track */}
            <div className="relative h-8 bg-blue-100 rounded mb-3 border border-blue-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-700">
                  Main Video
                </span>
              </div>
            </div>

            {/* B-roll Clips Track */}
            <div className="relative min-h-[40px]">
              {config.broll_clips.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-center">
                  <div>
                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      No B-roll clips added yet
                    </p>
                    <p className="text-xs text-slate-400">
                      Click "Add B-roll" to get started
                    </p>
                  </div>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={config.broll_clips}
                  onReorder={reorderBrollClips}
                  className="space-y-2"
                >
                  {config.broll_clips.map((clip) => {
                    const leftPercent = (clip.start_time / videoDuration) * 100;
                    const widthPercent =
                      (clip.broll_duration / videoDuration) * 100;

                    return (
                      <Reorder.Item key={clip.id} value={clip}>
                        <div
                          className={`relative h-12 rounded border-2 transition-all cursor-pointer ${
                            selectedClipId === clip.id
                              ? "border-teal-500 bg-teal-50 shadow-md"
                              : "border-teal-200 bg-teal-100 hover:border-teal-400"
                          }`}
                          onClick={() => setSelectedClipId(clip.id)}
                          style={{
                            marginLeft: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: "80px",
                          }}
                        >
                          {/* Grip Handle */}
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <GripVertical className="h-4 w-4 text-teal-600" />
                          </div>

                          {/* Clip Info */}
                          <div className="absolute inset-0 flex items-center justify-center px-8">
                            <div className="text-center truncate">
                              <p className="text-xs font-medium text-teal-900 truncate">
                                {clip.name.substring(0, 15)}
                              </p>
                              <p className="text-xs text-teal-600">
                                {formatTime(clip.broll_duration)}
                              </p>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBrollClip(clip.id);
                            }}
                            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>

            {/* Current Time Indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none"
              style={{ left: `${(currentTime / videoDuration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Selected Clip Editor */}
        <AnimatePresence>
          {selectedClip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4 bg-teal-50 border-teal-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedClip.thumbnail && (
                      <img
                        src={selectedClip.thumbnail}
                        alt={selectedClip.name}
                        className="w-20 h-11 object-cover rounded"
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {selectedClip.name}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Original: {formatTime(selectedClip.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClipId(null)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Start Time */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Insert At (seconds)
                    </Label>
                    <Slider
                      value={[selectedClip.start_time]}
                      onValueChange={(value) =>
                        updateBrollClip(selectedClip.id, {
                          start_time: value[0],
                        })
                      }
                      min={0}
                      max={Math.max(
                        0,
                        videoDuration - selectedClip.broll_duration
                      )}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(selectedClip.start_time)}
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      B-roll Duration (seconds)
                    </Label>
                    <Slider
                      value={[selectedClip.broll_duration]}
                      onValueChange={(value) =>
                        updateBrollClip(selectedClip.id, {
                          broll_duration: value[0],
                        })
                      }
                      min={1}
                      max={Math.min(
                        selectedClip.duration,
                        config.max_broll_duration
                      )}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(selectedClip.broll_duration)}
                    </p>
                  </div>

                  {/* Transition */}
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">
                      Transition Effect
                    </Label>
                    <Select
                      value={selectedClip.transition}
                      onValueChange={(value: "fade" | "dissolve" | "cut") =>
                        updateBrollClip(selectedClip.id, {
                          transition: value,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="dissolve">Dissolve</SelectItem>
                        <SelectItem value="cut">Cut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      removeBrollClip(selectedClip.id);
                      setSelectedClipId(null);
                    }}
                    className="w-full h-9"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove This Clip
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Tips:</strong> Drag clips to reorder • Click a clip to
            edit timing • Use the timeline slider to preview different sections
            • B-roll will overlay the main video at the specified times
          </p>
        </div>
      </div>

      {/* Stock Footage Library Modal */}
      {showStockLibrary && (
        <StockFootageLibrary
          onClose={() => setShowStockLibrary(false)}
          onSelect={(clips) => addBrollClip(clips)}
          initiallySelected={[]}
          maxSelection={5}
        />
      )}
    </Card>
  );
};

export default BrollEditor;
