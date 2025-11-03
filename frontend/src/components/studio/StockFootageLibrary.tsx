import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Check,
  Play,
  Loader2,
  Film,
  Clock,
  Image as ImageIcon,
  Video,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { observer } from "mobx-react-lite";

interface PexelsVideo {
  id: number;
  url: string;
  width: number;
  height: number;
  duration: number;
  image: string; // Thumbnail
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  user: {
    name: string;
    url: string;
  };
}

interface PexelsPhoto {
  id: number;
  url: string;
  width: number;
  height: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  photographer: string;
  photographer_url: string;
}

interface SelectedClip {
  url: string;
  name: string;
  thumbnail: string;
  duration: number;
  pexels_id: number;
  media_type: "video" | "image";
}

interface StockFootageLibraryProps {
  onClose: () => void;
  onSelect: (clips: SelectedClip[]) => void;
  initiallySelected?: SelectedClip[];
  maxSelection?: number;
  videoDuration?: number; // For intelligent duration limiting
}

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";

const StockFootageLibrary: React.FC<StockFootageLibraryProps> = ({
  onClose,
  onSelect,
  initiallySelected = [],
  maxSelection = 10,
  videoDuration = 30,
}) => {
  const [searchQuery, setSearchQuery] = useState("business office");
  const [mediaType, setMediaType] = useState<"videos" | "photos">("videos");
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [selectedClips, setSelectedClips] =
    useState<SelectedClip[]>(initiallySelected);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Filters
  const [orientation, setOrientation] = useState<string>("all");
  const [minDuration, setMinDuration] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(60);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      handleSearch();
    } else {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType]);

  // Calculate current total duration
  const totalSelectedDuration = selectedClips.reduce(
    (sum, clip) => sum + clip.duration,
    0
  );
  const durationPercentage = (totalSelectedDuration / videoDuration) * 100;
  const maxRecommendedDuration = videoDuration * 0.5; // 50% of video duration

  const handleSearch = async (resetPage = true) => {
    if (!PEXELS_API_KEY) {
      setError(
        "Pexels API key not configured. Please add VITE_PEXELS_API_KEY to your .env file."
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setPage(1);
        setVideos([]);
        setPhotos([]);
      }

      if (mediaType === "videos") {
        let url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
          searchQuery
        )}&per_page=15&page=${currentPage}`;

        if (orientation !== "all") {
          url += `&orientation=${orientation}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch videos from Pexels");
        }

        const data = await response.json();

        // Filter by duration
        const filteredVideos = data.videos.filter((video: PexelsVideo) => {
          return video.duration >= minDuration && video.duration <= maxDuration;
        });

        if (resetPage) {
          setVideos(filteredVideos);
        } else {
          setVideos((prev) => [...prev, ...filteredVideos]);
        }

        setHasMore(data.videos.length === 15);
      } else {
        // Search for photos
        let url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          searchQuery
        )}&per_page=15&page=${currentPage}`;

        if (orientation !== "all") {
          url += `&orientation=${orientation}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch photos from Pexels");
        }

        const data = await response.json();

        if (resetPage) {
          setPhotos(data.photos || []);
        } else {
          setPhotos((prev) => [...prev, ...(data.photos || [])]);
        }

        setHasMore((data.photos || []).length === 15);
      }

      setPage((p) => p + 1);
    } catch (err: any) {
      console.error("Pexels API error:", err);
      setError(err.message || "Failed to load stock footage");
    } finally {
      setIsLoading(false);
    }
  };

  const canSelectMore = (additionalDuration: number): boolean => {
    const newTotal = totalSelectedDuration + additionalDuration;
    return newTotal <= maxRecommendedDuration;
  };

  const toggleVideoSelection = (video: PexelsVideo) => {
    const clipId = video.id;
    const isSelected = selectedClips.some((c) => c.pexels_id === clipId);

    if (isSelected) {
      setSelectedClips((prev) => prev.filter((c) => c.pexels_id !== clipId));
    } else {
      // Check duration limit
      if (!canSelectMore(video.duration)) {
        setError(
          `Adding this clip would exceed ${((maxRecommendedDuration / videoDuration) * 100).toFixed(0)}% of video duration (${maxRecommendedDuration.toFixed(1)}s)`
        );
        setTimeout(() => setError(null), 4000);
        return;
      }

      if (selectedClips.length >= maxSelection) {
        setError(`Maximum ${maxSelection} clips can be selected`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Find HD quality video file
      const hdFile =
        video.video_files.find((f) => f.quality === "hd") ||
        video.video_files[0];

      const newClip: SelectedClip = {
        url: hdFile.link,
        name: `${searchQuery.replace(/\s+/g, "-")}-${video.id}.mp4`,
        thumbnail: video.image,
        duration: video.duration,
        pexels_id: video.id,
        media_type: "video",
      };

      setSelectedClips((prev) => [...prev, newClip]);
    }
  };

  const togglePhotoSelection = (photo: PexelsPhoto) => {
    const clipId = photo.id;
    const isSelected = selectedClips.some((c) => c.pexels_id === clipId);

    if (isSelected) {
      setSelectedClips((prev) => prev.filter((c) => c.pexels_id !== clipId));
    } else {
      // Photos default to 5 seconds
      const photoDuration = 5;

      // Check duration limit
      if (!canSelectMore(photoDuration)) {
        setError(
          `Adding this photo would exceed ${((maxRecommendedDuration / videoDuration) * 100).toFixed(0)}% of video duration (${maxRecommendedDuration.toFixed(1)}s)`
        );
        setTimeout(() => setError(null), 4000);
        return;
      }

      if (selectedClips.length >= maxSelection) {
        setError(`Maximum ${maxSelection} clips can be selected`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      const newClip: SelectedClip = {
        url: photo.src.large2x,
        name: `${searchQuery.replace(/\s+/g, "-")}-${photo.id}.jpg`,
        thumbnail: photo.src.medium,
        duration: photoDuration, // 5 seconds for images
        pexels_id: photo.id,
        media_type: "image",
      };

      setSelectedClips((prev) => [...prev, newClip]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddSelected = () => {
    onSelect(selectedClips);
    onClose();
  };

  const currentItems = mediaType === "videos" ? videos : photos;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        // Only close if clicking the backdrop itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ pointerEvents: "auto" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                Stock Footage Library
              </h2>
              <p className="text-[11px] text-slate-500">
                Search and select high-quality stock videos or photos for your B-roll
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Media Type Tabs */}
          <div
            onClickCapture={(e) => {
              e.stopPropagation();
            }}
            className="mb-3"
          >
            <Tabs
              value={mediaType}
              onValueChange={(value) => {
                setMediaType(value as "videos" | "photos");
              }}
            >
              <TabsList className="grid w-full max-w-xs grid-cols-2 h-8">
                <TabsTrigger value="videos" className="flex items-center gap-1.5 text-xs">
                  <Video className="h-3.5 w-3.5" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center gap-1.5 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Photos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder={`Search stock ${mediaType} (e.g., 'office meeting', 'nature landscape')`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(true);
                  }
                }}
                className="pl-9 h-9 text-[13px] border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <Button
              onClick={() => handleSearch(true)}
              disabled={isLoading || !searchQuery}
              className="bg-blue-600 hover:bg-blue-700 h-9 px-5 text-[13px]"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-2.5">
            <Select value={orientation} onValueChange={setOrientation}>
              <SelectTrigger className="w-36 h-8 text-[11px] border-slate-300">
                <SelectValue placeholder="Orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[11px]">All Orientations</SelectItem>
                <SelectItem value="landscape" className="text-[11px]">Landscape</SelectItem>
                <SelectItem value="portrait" className="text-[11px]">Portrait</SelectItem>
                <SelectItem value="square" className="text-[11px]">Square</SelectItem>
              </SelectContent>
            </Select>

            {mediaType === "videos" && (
              <>
                <Input
                  type="number"
                  placeholder="Min duration (s)"
                  value={minDuration}
                  onChange={(e) => setMinDuration(Number(e.target.value))}
                  className="w-28 h-8 text-[11px] border-slate-300"
                  min={0}
                />
                <Input
                  type="number"
                  placeholder="Max duration (s)"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(Number(e.target.value))}
                  className="w-28 h-8 text-[11px] border-slate-300"
                  min={0}
                />
              </>
            )}
          </div>

          {/* Duration Warning */}
          {durationPercentage > 40 && (
            <div
              className={`mt-2.5 p-2 rounded-md flex items-start gap-1.5 text-[11px] ${
                durationPercentage > 50
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Duration Warning:</span> Selected clips total{" "}
                {totalSelectedDuration.toFixed(1)}s (
                {durationPercentage.toFixed(0)}% of video). Recommended max is {maxRecommendedDuration.toFixed(1)}s (50%).
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700">
              {error}
            </div>
          )}

          {isLoading && currentItems.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-[13px] text-slate-600">Searching Pexels...</p>
              </div>
            </div>
          )}

          {!isLoading && currentItems.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Film className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-600">
                  No {mediaType} found. Try a different search term.
                </p>
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            key={mediaType}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-3">
              {mediaType === "videos"
                ? videos.map((video) => {
                    const isSelected = selectedClips.some(
                      (c) => c.pexels_id === video.id
                    );

                    return (
                      <div key={video.id}>
                        <Card
                          className={`relative overflow-hidden cursor-pointer transition-all border ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
                              : "border-slate-200 hover:border-blue-400 hover:shadow-sm"
                          }`}
                          onClick={() => toggleVideoSelection(video)}
                        >
                          <div className="relative aspect-video bg-slate-100">
                            <img
                              src={video.image}
                              alt={`Stock video ${video.id}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="h-10 w-10 text-white drop-shadow-lg" />
                            </div>

                            {/* Selection Checkbox */}
                            <div className="absolute top-1.5 left-1.5">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-blue-500 border-blue-500 scale-110"
                                    : "bg-white/95 border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute bottom-1.5 right-1.5">
                              <Badge className="text-[10px] h-5 px-1.5 bg-black/85 text-white border-0">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                {formatDuration(video.duration)}
                              </Badge>
                            </div>
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[10px] text-slate-500 truncate">
                              {video.user.name}
                            </p>
                          </div>
                        </Card>
                      </div>
                    );
                  })
                : photos.map((photo) => {
                    const isSelected = selectedClips.some(
                      (c) => c.pexels_id === photo.id
                    );

                    return (
                      <div key={photo.id}>
                        <Card
                          className={`relative overflow-hidden cursor-pointer transition-all border ${
                            isSelected
                              ? "border-emerald-500 ring-2 ring-emerald-200 shadow-md"
                              : "border-slate-200 hover:border-emerald-400 hover:shadow-sm"
                          }`}
                          onClick={() => togglePhotoSelection(photo)}
                        >
                          <div className="relative aspect-video bg-slate-100">
                            <img
                              src={photo.src.medium}
                              alt={`Stock photo ${photo.id}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-white drop-shadow-lg" />
                            </div>

                            {/* Selection Checkbox */}
                            <div className="absolute top-1.5 left-1.5">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-emerald-500 border-emerald-500 scale-110"
                                    : "bg-white/95 border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Photo Badge */}
                            <div className="absolute bottom-1.5 right-1.5">
                              <Badge className="text-[10px] h-5 px-1.5 bg-emerald-500 text-white border-0">
                                Photo (5s)
                              </Badge>
                            </div>
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[10px] text-slate-500 truncate">
                              {photo.photographer}
                            </p>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Load More */}
          {hasMore && !isLoading && currentItems.length > 0 && (
            <div className="flex justify-center mt-5">
              <Button
                variant="outline"
                onClick={() => handleSearch(false)}
                className="text-[13px] h-8 px-4 border-slate-300 hover:bg-slate-50"
              >
                Load More
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[12px] text-slate-600">
            <span className="font-medium">{selectedClips.length}</span> clips selected •{" "}
            <span className="font-medium">{totalSelectedDuration.toFixed(1)}s</span> total (
            {durationPercentage.toFixed(0)}% of video)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="h-8 px-4 text-[13px]">
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedClips.length === 0}
              className="bg-blue-600 hover:bg-blue-700 h-8 px-4 text-[13px]"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Add {selectedClips.length} Clip
              {selectedClips.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default observer(StockFootageLibrary);
