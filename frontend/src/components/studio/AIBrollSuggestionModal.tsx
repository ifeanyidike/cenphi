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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl max-h-[92vh] m-4 overflow-hidden"
        >
          <Card className="relative bg-white dark:bg-gray-900 shadow-2xl border-slate-200/50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">
                      AI B-roll Suggestions
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {cachedSuggestions
                        ? "Using cached suggestions"
                        : "Curated video clips based on your content"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {suggestions && !isLoading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="h-7 px-2.5 text-[10px] hover:bg-slate-100"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 w-7 p-0 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-md border border-blue-100/50 dark:border-blue-900/20">
                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  AI suggestions currently support videos only. Use Browse Library for images.
                </span>
              </div>

              {/* Themes & Keywords */}
              {suggestions && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="mt-3 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Lightbulb className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Detected Themes
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {suggestions.themes.map((theme, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[9px] h-5 px-2 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                    {suggestions.ai_analysis}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[calc(92vh-240px)]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-9 w-9 text-violet-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-white">
                      AI is analyzing your content
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      This may take a few seconds
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center border border-red-200/50 dark:border-red-900/20">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-center max-w-md">
                    <p className="text-[11px] font-medium text-slate-900 dark:text-white">
                      {error}
                    </p>
                    <Button
                      onClick={fetchSuggestions}
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 px-4 text-[10px]"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {suggestions && !isLoading && !error && (
                <div className="space-y-4">
                  {suggestions.suggested_clips.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        No suitable B-roll clips found. Try manual selection.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
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
                            className="h-7 px-2.5 text-[10px] hover:bg-slate-100"
                          >
                            {selectedClipIds.size ===
                            suggestions.suggested_clips.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>

                        {/* Duration Budget Indicator */}
                        {suggestions.duration_budget && (
                          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                            <div className="flex items-center justify-between text-[10px] mb-2">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                B-roll Budget (30% of video)
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {formatDuration(suggestions.total_duration)} /{" "}
                                {formatDuration(suggestions.duration_budget)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${Math.min((suggestions.total_duration / suggestions.duration_budget) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                              AI pre-selected clips that fit within your video's duration budget
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {suggestions.suggested_clips.map((clip, index) => {
                          const isSelected = selectedClipIds.has(
                            clip.pexels_id
                          );

                          return (
                            <motion.div
                              key={clip.pexels_id}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.03,
                                ease: [0.16, 1, 0.3, 1]
                              }}
                            >
                              <Card
                                className={`group relative overflow-hidden cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "ring-2 ring-violet-500 ring-offset-2 shadow-lg"
                                    : "hover:ring-2 hover:ring-slate-300 hover:shadow-md border-slate-200/80"
                                }`}
                                onClick={() =>
                                  toggleClipSelection(clip.pexels_id)
                                }
                              >
                                {/* Thumbnail */}
                                <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
                                  <img
                                    src={clip.thumbnail}
                                    alt={clip.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    {clip.media_type === "video" ? (
                                      <Play className="h-8 w-8 text-white drop-shadow-lg" />
                                    ) : (
                                      <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                                    )}
                                  </div>

                                  {/* Selection Checkbox */}
                                  <div className="absolute top-2 left-2">
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shadow-sm ${
                                        isSelected
                                          ? "bg-violet-500 border-violet-500 scale-110"
                                          : "bg-white/95 border-slate-300 group-hover:border-violet-400"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleClipSelection(clip.pexels_id);
                                      }}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                      )}
                                    </div>
                                  </div>

                                  {/* Media Type Badge */}
                                  <div className="absolute top-2 right-2">
                                    <Badge
                                      className={`text-[9px] h-5 px-1.5 border-0 shadow-sm ${
                                        clip.media_type === "video"
                                          ? "bg-blue-500 text-white"
                                          : "bg-green-500 text-white"
                                      }`}
                                    >
                                      {clip.media_type === "video" ? (
                                        <>
                                          <Video className="h-2.5 w-2.5 mr-0.5" />
                                          Video
                                        </>
                                      ) : (
                                        <>
                                          <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                                          Photo
                                        </>
                                      )}
                                    </Badge>
                                  </div>

                                  {/* Duration Badge */}
                                  <div className="absolute bottom-2 right-2">
                                    <Badge className="text-[9px] h-5 px-1.5 bg-black/75 backdrop-blur-sm text-white border-0">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {formatDuration(clip.duration)}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="p-2.5">
                                  <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white truncate leading-tight">
                                    {clip.name}
                                  </h4>
                                  <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {clip.relevance_explanation}
                                  </p>
                                  <div className="mt-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] h-4 px-1.5 bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30"
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
              <div className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="text-slate-900 dark:text-white font-semibold tabular-nums">{selectedClipIds.size}</span> clips selected
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="text-slate-900 dark:text-white font-semibold tabular-nums">
                      {formatDuration(
                        suggestions.suggested_clips
                          .filter((c) => selectedClipIds.has(c.pexels_id))
                          .reduce((sum, c) => sum + c.duration, 0)
                      )}
                    </span>{" "}
                    total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="h-9 px-4 text-[11px] border-slate-300 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={selectedClipIds.size === 0}
                      className="h-9 px-4 text-[11px] font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" strokeWidth={2.5} />
                      Add {selectedClipIds.size} Clip{selectedClipIds.size !== 1 ? "s" : ""}
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
