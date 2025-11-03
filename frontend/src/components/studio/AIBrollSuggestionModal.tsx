import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Check,
  Loader2,
  Info,
  Play,
  Clock,
  Lightbulb,
  Image as ImageIcon,
  Video,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studioAPI, AIBrollSuggestionResponse } from "@/services/studioAPI";
import { observer } from "mobx-react-lite";

interface AIBrollSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptText: string;
  videoDuration: number;
  onSelectClips: (clips: any[]) => void;
  maxClips?: number;
  orientation?: string;
  cachedSuggestions?: AIBrollSuggestionResponse | null;
  onSuggestionsLoaded?: (suggestions: AIBrollSuggestionResponse) => void;
}

const AIBrollSuggestionModal: React.FC<AIBrollSuggestionModalProps> = ({
  isOpen,
  onClose,
  transcriptText,
  videoDuration,
  onSelectClips,
  maxClips = 5,
  orientation = "all",
  cachedSuggestions = null,
  onSuggestionsLoaded,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] =
    useState<AIBrollSuggestionResponse | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (isOpen) {
      // Check if we have cached suggestions
      if (cachedSuggestions) {
        console.log("[AIBrollModal] Using cached suggestions");
        setSuggestions(cachedSuggestions);
        const allIds = new Set(
          cachedSuggestions.suggested_clips.map((clip) => clip.pexels_id)
        );
        setSelectedClipIds(allIds);
        setIsLoading(false);
        setError(null);
        return;
      }

      // No cached suggestions, fetch new ones
      setSuggestions(null);
      setSelectedClipIds(new Set());
      setError(null);
      setIsLoading(true);

      if (!transcriptText || transcriptText.trim().length === 0) {
        console.log("[AIBrollModal] No transcript text available");
        setError(
          "No transcript available. Please ensure your video has been transcribed before using AI B-roll suggestions."
        );
        setIsLoading(false);
        return;
      }
      fetchSuggestions();
    }
  }, [isOpen, transcriptText, cachedSuggestions]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await studioAPI.suggestBroll({
        transcript_text: transcriptText,
        video_duration: videoDuration,
        max_clips: maxClips,
        orientation: orientation,
      });

      setSuggestions(data);

      // Notify parent to cache these suggestions
      if (onSuggestionsLoaded) {
        onSuggestionsLoaded(data);
      }

      // Auto-select all clips by default
      const allIds = new Set(
        data.suggested_clips.map((clip) => clip.pexels_id)
      );
      console.log("[AIBrollModal] Auto-selected clip IDs:", Array.from(allIds));
      setSelectedClipIds(allIds);
    } catch (err: any) {
      console.error("[AIBrollModal] AI broll suggestion error:", err);
      setError(
        err.message || "Failed to get AI suggestions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log("[AIBrollModal] Manually refreshing suggestions");
    setIsLoading(true);
    setError(null);
    fetchSuggestions();
  };

  const toggleClipSelection = (clipId: number) => {
    const newSelected = new Set(selectedClipIds);
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId);
    } else {
      newSelected.add(clipId);
    }
    setSelectedClipIds(newSelected);
  };

  const handleApprove = () => {
    console.log("[AIBrollModal] handleApprove called");
    console.log("[AIBrollModal] Suggestions:", suggestions);
    console.log(
      "[AIBrollModal] Selected clip IDs:",
      Array.from(selectedClipIds)
    );

    if (!suggestions) {
      console.log("[AIBrollModal] No suggestions available, returning");
      return;
    }

    const filteredClips = suggestions.suggested_clips.filter((clip) =>
      selectedClipIds.has(clip.pexels_id)
    );

    console.log("[AIBrollModal] Filtered clips count:", filteredClips.length);

    // Evenly distribute clips across video duration
    // This ensures clips don't overlap when using "custom" placement strategy
    const totalClips = filteredClips.length;
    const interval =
      totalClips > 1 ? videoDuration / (totalClips + 1) : videoDuration / 2;

    const selectedClips = filteredClips.map((clip, index) => ({
      url: clip.url,
      name: clip.name,
      thumbnail: clip.thumbnail,
      duration: clip.duration,
      pexels_id: clip.pexels_id,
      start_time: interval * (index + 1), // Evenly space clips
      media_type: clip.media_type, // Include media type
    }));

    console.log(
      "[AIBrollModal] Calling onSelectClips with clips:",
      selectedClips
    );
    onSelectClips(selectedClips);
    console.log("[AIBrollModal] onSelectClips called, now closing modal");
    onClose();
    console.log("[AIBrollModal] Modal closed");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[90vh] m-4 overflow-hidden"
        >
          <Card className="relative bg-white dark:bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      AI B-roll Suggestions
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cachedSuggestions
                        ? "Using cached suggestions"
                        : "Curated video clips based on your content"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <Info className="h-3 w-3" />
                      <span>
                        AI suggestions currently support videos only. Use Browse
                        Library for images.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {suggestions && !isLoading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="h-8 text-xs"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Themes & Keywords */}
              {suggestions && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Lightbulb className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Detected Themes:
                    </span>
                    {suggestions.themes.map((theme, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <Info className="h-3 w-3 inline mr-1" />
                    {suggestions.ai_analysis}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      AI is analyzing your content...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This may take a few seconds
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {error}
                    </p>
                    <Button
                      onClick={fetchSuggestions}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {suggestions && !isLoading && !error && (
                <div className="space-y-4">
                  {suggestions.suggested_clips.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No suitable B-roll clips found. Try manual selection.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedClipIds.size} of{" "}
                            {suggestions.suggested_clips.length} clips selected
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                selectedClipIds.size ===
                                suggestions.suggested_clips.length
                              ) {
                                setSelectedClipIds(new Set());
                              } else {
                                const allIds = new Set(
                                  suggestions.suggested_clips.map(
                                    (c) => c.pexels_id
                                  )
                                );
                                setSelectedClipIds(allIds);
                              }
                            }}
                            className="text-xs"
                          >
                            {selectedClipIds.size ===
                            suggestions.suggested_clips.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>

                        {/* Duration Budget Indicator */}
                        {suggestions.duration_budget && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                B-roll Budget (30% of video)
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDuration(suggestions.total_duration)} /{" "}
                                {formatDuration(suggestions.duration_budget)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min((suggestions.total_duration / suggestions.duration_budget) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              AI pre-selected clips that fit within your video's
                              duration budget
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestions.suggested_clips.map((clip) => {
                          const isSelected = selectedClipIds.has(
                            clip.pexels_id
                          );

                          return (
                            <motion.div
                              key={clip.pexels_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card
                                className={`relative overflow-hidden cursor-pointer transition-all border-2 ${
                                  isSelected
                                    ? "border-purple-500 shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                }`}
                                onClick={() =>
                                  toggleClipSelection(clip.pexels_id)
                                }
                              >
                                {/* Thumbnail */}
                                <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
                                  <img
                                    src={clip.thumbnail}
                                    alt={clip.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {clip.media_type === "video" ? (
                                      <Play className="h-12 w-12 text-white" />
                                    ) : (
                                      <ImageIcon className="h-12 w-12 text-white" />
                                    )}
                                  </div>

                                  {/* Selection Checkbox */}
                                  <div className="absolute top-2 left-2">
                                    <div
                                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                        isSelected
                                          ? "bg-purple-500 border-purple-500"
                                          : "bg-white/90 border-gray-300"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleClipSelection(clip.pexels_id);
                                      }}
                                    >
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Media Type Badge */}
                                  <div className="absolute top-2 right-2">
                                    <Badge
                                      className={`text-xs border-0 ${
                                        clip.media_type === "video"
                                          ? "bg-blue-500 text-white"
                                          : "bg-green-500 text-white"
                                      }`}
                                    >
                                      {clip.media_type === "video" ? (
                                        <>
                                          <Video className="h-3 w-3 mr-1" />{" "}
                                          Video
                                        </>
                                      ) : (
                                        <>
                                          <ImageIcon className="h-3 w-3 mr-1" />{" "}
                                          Photo
                                        </>
                                      )}
                                    </Badge>
                                  </div>

                                  {/* Duration Badge */}
                                  <div className="absolute bottom-2 right-2">
                                    <Badge className="text-xs bg-black/80 text-white border-0">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {formatDuration(clip.duration)}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="p-3">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {clip.name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {clip.relevance_explanation}
                                  </p>
                                  <div className="mt-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                    >
                                      {clip.search_keyword}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {suggestions && !isLoading && !error && (
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{selectedClipIds.size}</strong> clips selected •{" "}
                    <strong>
                      {formatDuration(
                        suggestions.suggested_clips
                          .filter((c) => selectedClipIds.has(c.pexels_id))
                          .reduce((sum, c) => sum + c.duration, 0)
                      )}
                    </strong>{" "}
                    total duration
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={selectedClipIds.size === 0}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add {selectedClipIds.size} Clip
                      {selectedClipIds.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default observer(AIBrollSuggestionModal);
