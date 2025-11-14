import React, { useState } from "react";
import { X, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspaceHub } from "@/repo/workspace_hub";
import { AspectRatio } from "@/components/common/platform-selection";
import StockFootageLibrary from "./StockFootageLibrary";
import AIBrollSuggestionModal from "./AIBrollSuggestionModal";
import BrollDurationIndicator from "./BrollDurationIndicator";
import { AIBrollSuggestionResponse } from "@/services/studioAPI";
import { ContextType } from "./utils/brollHelpers";
import { useVideoDuration } from "./hooks/useVideoDuration";
import { observer } from "mobx-react-lite";

// Export types for reuse
export interface BrollClip {
  url: string;
  name: string;
  thumbnail?: string;
  duration?: number;
  pexels_id?: number;
  start_time?: number;
  media_type?: "video" | "image";
}

export interface BrollConfig {
  placement_strategy: "auto" | "even" | "custom";
  max_broll_duration: number;
  transition_type: "fade" | "dissolve" | "cut";
  broll_clips: BrollClip[];
}

export interface BrollCache {
  testimonialId: string | undefined;
  suggestions: AIBrollSuggestionResponse;
  timestamp: number;
}

interface BrollConfigSectionProps {
  // Required props
  brollConfig: BrollConfig;
  onBrollConfigChange: (config: BrollConfig) => void;
  testimonialId: string | undefined;
  contextType: ContextType;

  // Optional props
  aspectRatio?: AspectRatio;
  maxSelection?: number;
  videoDuration?: number; // Override duration (e.g., for story videos using selected moments)
  transcriptText?: string; // Override transcript text (for clips/moments with their own text)

  // Cache management (optional - if not provided, managed internally)
  cachedAISuggestions?: {
    testimonialId: string | undefined;
    suggestions: AIBrollSuggestionResponse;
    timestamp: number;
  } | null;
  onCacheSuggestions?: (cache: {
    testimonialId: string | undefined;
    suggestions: AIBrollSuggestionResponse;
    timestamp: number;
  }) => void;
}

const BrollConfigSection: React.FC<BrollConfigSectionProps> = ({
  brollConfig,
  onBrollConfigChange,
  testimonialId,
  contextType,
  aspectRatio = "9:16",
  maxSelection = 10,
  videoDuration: overrideVideoDuration,
  transcriptText: overrideTranscriptText,
  cachedAISuggestions: externalCache,
  onCacheSuggestions,
}) => {
  // Internal cache state (used if external cache not provided)
  const [internalCache, setInternalCache] = useState<{
    testimonialId: string | undefined;
    suggestions: AIBrollSuggestionResponse;
    timestamp: number;
  } | null>(null);

  const cachedAISuggestions = externalCache ?? internalCache;
  const setCachedAISuggestions = onCacheSuggestions ?? setInternalCache;

  const [showStockLibrary, setShowStockLibrary] = useState(false);
  const [showAIBrollSuggestion, setShowAIBrollSuggestion] = useState(false);

  // Only fetch duration from API if override not provided
  const { duration: fetchedDuration } = useVideoDuration(
    overrideVideoDuration !== undefined ? undefined : testimonialId, // Skip API call if override provided
    contextType
  );

  // Use override duration if provided (e.g., from parent component calculating from clips),
  // otherwise use fetched duration from testimonial API
  const videoDuration = overrideVideoDuration ?? fetchedDuration;

  // Check if video is too short for B-roll (< 20 seconds)
  const MIN_BROLL_DURATION = 20;
  const isTooShortForBroll = videoDuration < MIN_BROLL_DURATION;

  // Handle clip removal
  const handleRemoveClip = (index: number) => {
    onBrollConfigChange({
      ...brollConfig,
      broll_clips: brollConfig.broll_clips.filter((_, i) => i !== index),
    });
  };

  // Handle clips selection from Stock Library
  const handleStockLibrarySelect = (clips: BrollClip[]) => {
    const existingClips = brollConfig.broll_clips;

    // Filter out clips that are already in the config (prevent duplication)
    const existingIds = new Set(existingClips.map((c) => c.pexels_id));
    const newClipsOnly = clips.filter((c) => !existingIds.has(c.pexels_id));

    const totalExisting = existingClips.length;
    const totalNew = newClipsOnly.length;
    const totalClips = totalExisting + totalNew;

    // Evenly distribute clips across video duration
    const interval =
      totalClips > 1 ? videoDuration / (totalClips + 1) : videoDuration / 2;

    // Add start_time to new clips
    const clipsWithStartTime = newClipsOnly.map((clip, index) => ({
      ...clip,
      start_time: interval * (totalExisting + index + 1),
    }));

    onBrollConfigChange({
      ...brollConfig,
      broll_clips: [...existingClips, ...clipsWithStartTime],
    });
  };

  // Handle clips selection from AI
  const handleAIClipsSelect = (clips: BrollClip[]) => {
    // Filter out clips that are already in the config (prevent duplication)
    const existingIds = new Set(
      brollConfig.broll_clips.map((c) => c.pexels_id)
    );
    const newClipsOnly = clips.filter((c) => !existingIds.has(c.pexels_id));

    const newClips = [...brollConfig.broll_clips, ...newClipsOnly];

    onBrollConfigChange({
      ...brollConfig,
      broll_clips: newClips,
    });
  };

  // Get transcript text for AI
  const getTranscriptText = (): string => {
    // If override transcript text provided (for clips/moments), use it
    if (overrideTranscriptText) {
      return overrideTranscriptText;
    }

    // Otherwise use full testimonial content
    if (!testimonialId) return "";

    const testimonial = workspaceHub.testimonialManager.testimonials?.find(
      (t) => t.id === testimonialId
    );

    return testimonial?.content || "";
  };

  return (
    <div>
      {/* Placement Strategy */}
      <div className="mb-4">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Placement Strategy
        </Label>
        <Select
          value={brollConfig.placement_strategy}
          onValueChange={(value: any) => {
            // Prevent switching to custom (disabled)
            if (value === "custom") return;
            onBrollConfigChange({
              ...brollConfig,
              placement_strategy: value,
            });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto - AI places clips</SelectItem>
            <SelectItem value="even">Even - Clips spread equally</SelectItem>
            <SelectItem value="custom" disabled>
              <div className="flex items-center gap-2">
                <span>Custom - Manual timing control</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  Coming Soon
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          {brollConfig.placement_strategy === "auto"
            ? "AI analyzes transcript and places clips at relevant moments"
            : brollConfig.placement_strategy === "even"
              ? "Clips are distributed evenly across your video duration"
              : "Clips will be placed manually at specified times"}
        </p>
      </div>

      {/* Transition Type */}
      <div className="mb-4">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Transition Type
        </Label>
        <Select
          value={brollConfig.transition_type}
          onValueChange={(value: any) =>
            onBrollConfigChange({
              ...brollConfig,
              transition_type: value,
            })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fade">Fade</SelectItem>
            <SelectItem value="dissolve">Dissolve</SelectItem>
            <SelectItem value="cut">Cut (instant)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max B-roll Duration */}
      <div className="mb-4">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Max Duration per Clip (seconds)
        </Label>
        <Input
          type="number"
          min="1"
          max="30"
          step="0.5"
          value={brollConfig.max_broll_duration}
          onChange={(e) =>
            onBrollConfigChange({
              ...brollConfig,
              max_broll_duration: parseFloat(e.target.value),
            })
          }
          className="h-9 text-sm"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          Maximum duration for each B-roll clip insertion
        </p>
      </div>

      {/* B-roll Clips Selection */}
      <div>
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          B-roll Clips
        </Label>

        {/* Duration Indicator */}
        {brollConfig.broll_clips.length > 0 && (
          <BrollDurationIndicator
            currentDuration={brollConfig.broll_clips.reduce(
              (sum, clip) => sum + (clip.duration || 0),
              0
            )}
            videoDuration={videoDuration}
          />
        )}

        {/* Selected Clips */}
        {brollConfig.broll_clips.length > 0 && (
          <div className="space-y-2 mb-3">
            {brollConfig.broll_clips.map((clip, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {clip.thumbnail ? (
                  <img
                    src={clip.thumbnail}
                    alt={clip.name}
                    className="w-16 h-9 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-9 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {clip.name}
                  </p>
                  {clip.duration && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(clip.duration)}s
                      {clip.media_type && (
                        <span className="ml-2 text-xs text-slate-400">
                          • {clip.media_type === "video" ? "Video" : "Photo"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveClip(index)}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Action Required Notice or Too Short Warning */}
        {brollConfig.broll_clips.length === 0 && (
          <div className={`mb-3 p-3 rounded-lg ${
            isTooShortForBroll
              ? "bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800"
              : "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
          }`}>
            {isTooShortForBroll ? (
              <>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  ℹ️ Clip too short for B-roll
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  B-roll requires at least {MIN_BROLL_DURATION} seconds of video. Your clip is {Math.round(videoDuration)}s.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mb-1">
                  ⚡ Action Required: Select B-roll Clips
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Click <strong>"Get AI Suggestions"</strong> to have AI find
                  relevant clips, or <strong>"Browse Library"</strong> to search
                  manually.
                </p>
              </>
            )}
          </div>
        )}

        {/* Browse Stock Footage & AI Suggestion Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("[AIBroll] 'Get AI Suggestions' button clicked");
              console.log("[AIBroll] testimonialId:", testimonialId);
              console.log("[AIBroll] showAIBrollSuggestion will be set to:", true);
              setShowAIBrollSuggestion(true);
            }}
            disabled={isTooShortForBroll}
            className="h-10 text-sm border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Get AI Suggestions
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log("[AIBroll] 'Browse Library' button clicked");
              setShowStockLibrary(true);
            }}
            disabled={isTooShortForBroll}
            className="h-10 text-sm border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse Library
          </Button>
        </div>

        {brollConfig.broll_clips.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {brollConfig.broll_clips.length} clip
            {brollConfig.broll_clips.length !== 1 ? "s" : ""} selected • Add
            more from AI suggestions or library
          </p>
        )}
      </div>

      {/* Stock Library Modal */}
      {showStockLibrary && (
        <StockFootageLibrary
          onClose={() => setShowStockLibrary(false)}
          onSelect={handleStockLibrarySelect}
          initiallySelected={brollConfig.broll_clips.filter(
            (
              c
            ): c is {
              url: string;
              name: string;
              thumbnail: string;
              duration: number;
              pexels_id: number;
              media_type: "video" | "image";
            } =>
              !!c.thumbnail && !!c.duration && !!c.pexels_id && !!c.media_type
          )}
          maxSelection={maxSelection}
          videoDuration={videoDuration}
        />
      )}

      {/* AI B-roll Suggestion Modal */}
      {showAIBrollSuggestion && (
        <AIBrollSuggestionModal
          isOpen={showAIBrollSuggestion}
          onClose={() => {
            console.log(
              "[AIBroll] Modal closed (clips count:",
              brollConfig.broll_clips.length,
              ")"
            );
            setShowAIBrollSuggestion(false);
          }}
          transcriptText={getTranscriptText()}
          videoDuration={videoDuration}
          onSelectClips={handleAIClipsSelect}
          maxClips={5}
          orientation={aspectRatio === "9:16" ? "portrait" : "landscape"}
          cachedSuggestions={
            cachedAISuggestions?.testimonialId === testimonialId
              ? cachedAISuggestions?.suggestions ?? null
              : null
          }
          onSuggestionsLoaded={(suggestions) => {
            console.log(
              "[AIBroll] Caching suggestions for testimonial:",
              testimonialId
            );
            setCachedAISuggestions({
              testimonialId: testimonialId,
              suggestions: suggestions,
              timestamp: Date.now(),
            });
          }}
        />
      )}
    </div>
  );
};

export default observer(BrollConfigSection);
