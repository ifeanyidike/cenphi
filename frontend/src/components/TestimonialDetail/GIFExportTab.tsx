// components/TestimonialDetail/GIFExportTab.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Loader2,
  Check,
  Download,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Film,
  Gauge,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface GIFExportTabProps {
  videoUrl: string;
  testimonialId: string;
}

interface GIFExportResult {
  gif_url: string;
  file_size: number;
  width: number;
  duration: number;
  fps: number;
  quality: string;
  processing_time: number;
}

const GIFExportTab: React.FC<GIFExportTabProps> = ({
  videoUrl,
  testimonialId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // GIF export settings
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [width, setWidth] = useState(480);
  const [fps, setFPS] = useState(15);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("medium");

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<GIFExportResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const serverAddr = import.meta.env.VITE_API_URL;

  // Update current time as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };

    const updateDuration = () => {
      setVideoDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  // Ensure duration doesn't exceed available time
  useEffect(() => {
    if (videoDuration > 0) {
      const maxDuration = videoDuration - startTime;
      if (duration > maxDuration) {
        setDuration(Math.max(1, Math.min(maxDuration, 10)));
      }
    }
  }, [startTime, videoDuration, duration]);

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

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = value[0];
    video.currentTime = newTime;
    setStartTime(newTime);
    setCurrentTime(newTime);
  };

  const resetPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = startTime;
    setCurrentTime(startTime);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const token = await authStore.getToken().then((r: any) => r.token);

      const response = await fetch(`${serverAddr}/export/gif`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testimonial_id: testimonialId,
          start_time: startTime,
          duration: duration,
          width: width,
          fps: fps,
          quality: quality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export GIF");
      }

      const data = await response.json();
      setExportResult(data);
    } catch (err) {
      console.error("Failed to export GIF:", err);
      setError(err instanceof Error ? err.message : "Failed to export GIF");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadGIF = () => {
    if (!exportResult?.gif_url) return;

    const link = document.createElement("a");
    link.href = exportResult.gif_url;
    link.download = `testimonial-${testimonialId}-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const estimatedSize = Math.round(
    (width / 480) *
      (fps / 15) *
      duration *
      (quality === "high" ? 150 : quality === "medium" ? 100 : 70)
  );

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50/30 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <ImageIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    GIF Export Studio
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Create shareable animated GIFs from your video
                  </p>
                </div>
              </div>
            </div>
            {exportResult && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-2.5 py-1 shadow-sm">
                <Check className="h-3 w-3 mr-1" strokeWidth={2.5} />
                Exported
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Film className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                  Duration
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {duration.toFixed(1)}s
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Package className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                  Est. Size
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                ~{estimatedSize} KB
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Gauge className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                  Quality
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 capitalize">
                {quality}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                  FPS
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">{fps} fps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        {/* Left: Video Preview & Timeline */}
        <div className="space-y-4">
          {/* Video Preview */}
          <Card className="border border-slate-200 bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
                {/* Play/Pause Overlay */}
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors group"
                >
                  {!isPlaying && (
                    <div className="w-20 h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform">
                      <Play
                        className="h-9 w-9 text-slate-900 ml-1.5"
                        strokeWidth={2}
                      />
                    </div>
                  )}
                </button>

                {/* Selection Range Indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{
                      marginLeft: `${(startTime / videoDuration) * 100}%`,
                      width: `${(duration / videoDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Playback Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-slate-700" />
                    ) : (
                      <Play className="h-4 w-4 text-slate-700 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPreview}
                    className="h-9 px-3 text-[11px] rounded-lg hover:bg-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reset
                  </Button>
                  <div className="flex-1" />
                  <span className="text-[11px] font-medium text-slate-600">
                    {formatTime(currentTime)} / {formatTime(videoDuration)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Controls */}
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <Label className="text-xs font-semibold text-slate-900">
                    Select Time Range
                  </Label>
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] px-2.5 py-1">
                  {formatTime(startTime)} → {formatTime(startTime + duration)}
                </Badge>
              </div>

              {/* Timeline Slider */}
              <div className="space-y-3">
                <div className="relative pt-2">
                  <Slider
                    value={[startTime]}
                    onValueChange={handleSeek}
                    max={videoDuration || 100}
                    step={0.1}
                    className="w-full"
                  />
                  {/* Start Marker */}
                  <div
                    className="absolute top-0 -translate-x-1/2 pointer-events-none"
                    style={{
                      left: `${(startTime / videoDuration) * 100}%`,
                    }}
                  >
                    <div className="w-0.5 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  {/* End Marker */}
                  <div
                    className="absolute top-0 -translate-x-1/2 pointer-events-none"
                    style={{
                      left: `${((startTime + duration) / videoDuration) * 100}%`,
                    }}
                  >
                    <div className="w-0.5 h-2 bg-teal-500 rounded-full" />
                  </div>
                </div>

                {/* Time Labels */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                  <span>0:00</span>
                  <span className="text-emerald-600 font-semibold">
                    Start: {formatTime(startTime)}
                  </span>
                  <span>{formatTime(videoDuration)}</span>
                </div>
              </div>

              {/* Duration Input */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex-1">
                  <Label className="text-[10px] text-slate-600 mb-1.5 block font-medium">
                    GIF Duration (seconds)
                  </Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(
                        Math.max(1, Math.min(10, Number(e.target.value)))
                      )
                    }
                    min={1}
                    max={10}
                    step={0.5}
                    className="h-9 text-xs font-semibold border-slate-300"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-slate-600 mb-1.5 block font-medium">
                    End Time
                  </Label>
                  <div className="h-9 flex items-center justify-center px-3 rounded-lg bg-white border border-slate-300">
                    <span className="text-xs font-bold text-slate-900">
                      {formatTime(startTime + duration)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Export Settings & Results */}
        <div className="space-y-4">
          {/* Export Settings */}
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Export Settings
                </span>
              </div>

              {/* Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-slate-700 font-medium">
                    Width
                  </Label>
                  <span className="text-xs font-bold text-slate-900">
                    {width}px
                  </span>
                </div>
                <Slider
                  value={[width]}
                  onValueChange={(value) => setWidth(value[0])}
                  min={240}
                  max={720}
                  step={60}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>

              {/* FPS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-slate-700 font-medium">
                    Frame Rate
                  </Label>
                  <span className="text-xs font-bold text-slate-900">
                    {fps} fps
                  </span>
                </div>
                <Slider
                  value={[fps]}
                  onValueChange={(value) => setFPS(value[0])}
                  min={10}
                  max={30}
                  step={5}
                  className="w-full"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  Higher FPS = smoother animation but larger file size
                </p>
              </div>

              {/* Quality */}
              <div className="space-y-2">
                <Label className="text-[11px] text-slate-700 font-medium">
                  Quality Preset
                </Label>
                <Select
                  value={quality}
                  onValueChange={(value: any) => setQuality(value)}
                >
                  <SelectTrigger className="h-10 text-xs font-medium border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs">
                      <div className="flex items-center justify-between w-full">
                        <span>Low Quality</span>
                        <span className="text-[10px] text-slate-500 ml-3">
                          Smallest
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium" className="text-xs">
                      <div className="flex items-center justify-between w-full">
                        <span>Medium Quality</span>
                        <span className="text-[10px] text-slate-500 ml-3">
                          Balanced
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high" className="text-xs">
                      <div className="flex items-center justify-between w-full">
                        <span>High Quality</span>
                        <span className="text-[10px] text-slate-500 ml-3">
                          Best
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              {!exportResult && (
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 text-xs font-bold"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating GIF...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" strokeWidth={2.5} />
                      Create GIF
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Export Results */}
          <AnimatePresence>
            {exportResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    {/* Success Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-emerald-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Check className="h-5 w-5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          GIF Created Successfully!
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">
                          Processing time:{" "}
                          {exportResult.processing_time.toFixed(1)}s
                        </p>
                      </div>
                    </div>

                    {/* GIF Preview */}
                    <div className="relative rounded-lg overflow-hidden border-2 border-emerald-200 bg-white shadow-lg">
                      <img
                        src={exportResult.gif_url}
                        alt="Generated GIF"
                        className="w-full h-auto"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-2 py-1 shadow-md">
                          <Film className="h-3 w-3 mr-1" />
                          GIF
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-white border border-emerald-100">
                        <p className="text-[9px] text-slate-600 mb-1 font-medium">
                          File Size
                        </p>
                        <p className="text-xs font-bold text-slate-900">
                          {formatFileSize(exportResult.file_size)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-emerald-100">
                        <p className="text-[9px] text-slate-600 mb-1 font-medium">
                          Dimensions
                        </p>
                        <p className="text-xs font-bold text-slate-900">
                          {exportResult.width}px
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-emerald-100">
                        <p className="text-[9px] text-slate-600 mb-1 font-medium">
                          Duration
                        </p>
                        <p className="text-xs font-bold text-slate-900">
                          {exportResult.duration}s
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-emerald-100">
                        <p className="text-[9px] text-slate-600 mb-1 font-medium">
                          Frame Rate
                        </p>
                        <p className="text-xs font-bold text-slate-900">
                          {exportResult.fps} fps
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadGIF}
                        className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Download GIF
                      </Button>
                      <Button
                        onClick={() => setExportResult(null)}
                        variant="outline"
                        className="flex-1 h-10 border-slate-300 text-xs font-medium"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-2" />
                        Create Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GIFExportTab;
