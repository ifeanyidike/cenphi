// components/TestimonialDetail/TabRenderers.tsx
import {
  Scissors,
  Video,
  Download,
  Copy,
  Check,
  TrendingUp,
  Target,
  Clock,
  Play,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ClipSelectionBar from "./ClipSelectionBar";
import { TestimonialArtifact } from "@/types/testimonial";
import { ServiceType } from "@/types/ai-service";
import AIStoryUtilities from "@/utils/aistory-utilities";

// Types
interface Clip {
  id: string;
  artifactId?: string;
  url: string;
  theme: string;
  title: string;
  end_time: number;
  start_time: number;
  duration: number;
  engagement_score?: number; // Optional with default fallback
  text?: string; // Clip text from backend (shown in UI)
  transcript?: string; // Alternative field name
  metadata?: any;
}

interface ClippingData {
  // Support both old and new structure
  generated_clips:
    | Array<Clip> // NEW: Array of clips directly
    | {
        clips: Array<Clip>; // OLD: Nested clips array
        detection_method?: "automatic" | "manual";
      };
  detection_method?: "automatic" | "manual"; // Can be at top level
  clips?: Array<Clip>; // Fallback: top-level clips array
}

export interface TabRenderProps {
  artifacts: TestimonialArtifact[];
  onGenerateMore?: () => void;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  copiedItems: Set<string>;

  selectedClips?: string[];
  onClipSelectionChange?: (selected: string[]) => void;
  onProcessMultipleClips?: (clips: any[], serviceType: ServiceType) => void;
  selectionMode?: boolean; // ADD THIS
  onSelectionModeChange?: (mode: boolean) => void;

  // Share handlers for clips
  onShareClip?: (clip: any, parentArtifact: any) => void;
  onShareMultipleClips?: (clips: any[], parentArtifacts: any[]) => void;
}

// Utility functions
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Helper to extract clips from both old and new data structures
const getClips = (data: ClippingData): Clip[] => {
  if (!data) return [];

  // New structure: generated_clips is array of clips directly
  if (Array.isArray(data.generated_clips)) {
    return data.generated_clips;
  }

  // Old structure: generated_clips.clips array (nested)
  if (
    data.generated_clips &&
    typeof data.generated_clips === "object" &&
    "clips" in data.generated_clips
  ) {
    return (data.generated_clips as any).clips || [];
  }

  // Fallback: top-level clips array
  if (data.clips && Array.isArray(data.clips)) {
    return data.clips;
  }

  return [];
};

export const renderClippingArtifacts = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  selectedClips = [],
  onClipSelectionChange,
  onProcessMultipleClips,
  selectionMode = false,
  onSelectionModeChange,
  onShareClip,
  onShareMultipleClips,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-50/40 via-transparent to-transparent" />
        <div className="relative px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 shadow-sm mb-6">
            <Scissors className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 tracking-tight">
            No clips yet
          </h3>
          <p className="text-[11px] text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Extract engaging clips from key moments to maximize reach and
            engagement
          </p>
          <Button
            onClick={onGenerateMore}
            className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-sm transition-all"
          >
            <Scissors className="h-3.5 w-3.5 mr-2" strokeWidth={2} />
            Generate Clips
          </Button>
        </div>
      </div>
    );
  }

  // Flatten clips for selection tracking
  const allClips = artifacts.flatMap((artifact, artifactIndex) => {
    const data = artifact.data as ClippingData;
    return getClips(data).map((clip, clipIndex) => ({
      ...clip,
      id: clip.id,
      artifactIndex,
      clipIndex,
    }));
  });

  const toggleClipSelection = (clipId: string) => {
    if (!onClipSelectionChange) return;

    const newSelected = selectedClips.includes(clipId)
      ? selectedClips.filter((id) => id !== clipId)
      : [...selectedClips, clipId];
    onClipSelectionChange(newSelected);
  };

  const handleProcessMultiple = (serviceType: ServiceType) => {
    if (!onProcessMultipleClips) return;

    const selectedClipData = selectedClips
      .map((clipId) => {
        return allClips.find((clip) => clip.id === clipId);
      })
      .filter(Boolean);

    console.log("selectedClipData", selectedClipData);

    onProcessMultipleClips(selectedClipData, serviceType);
  };

  const getTotalDuration = () => {
    return selectedClips.reduce((total, clipId) => {
      const clip = allClips.find((c) => c.id === clipId);
      return total + (clip?.duration || 0);
    }, 0);
  };

  const handleAISmartSelection = () => {
    // Use the AI utilities to intelligently select and arrange clips
    const storyResult =
      AIStoryUtilities.prepareClipsForStoryGeneration(artifacts);

    if (!storyResult.success) {
      console.error("AI Story Generation failed:", storyResult.error);
      // Show error message to user
      return;
    }

    console.log("AI selected clips:", storyResult.clips);
    console.log("Story metadata:", storyResult.metadata);

    // Process with your existing story generation logic
    if (onProcessMultipleClips) {
      onProcessMultipleClips(storyResult.clips, "story_mode");
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* AI Smart Selection - Premium Banner */}
      {onClipSelectionChange && allClips.length > 1 && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-sm">
                <Video className="h-4.5 w-4.5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[11px] font-semibold text-slate-900 tracking-tight">
                  Story Generator
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  AI-powered assembly of your best moments
                </p>
              </div>
            </div>
            <Button
              onClick={handleAISmartSelection}
              className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Play className="h-3 w-3" strokeWidth={2.5} />
              Generate Story
            </Button>
          </div>
        </div>
      )}

      {/* Selection Controls - Refined */}
      {onClipSelectionChange && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                <Scissors
                  className="h-3.5 w-3.5 text-slate-600"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h3 className="text-[11px] font-semibold text-slate-900 tracking-tight">
                  {selectionMode ? "Selection Mode" : "Clip Library"}
                </h3>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                  {selectionMode
                    ? selectedClips.length === 0
                      ? "Choose clips to process"
                      : selectedClips.length === 1
                        ? "1 selected • Add more or optimize"
                        : `${selectedClips.length} selected • Ready to process`
                    : `${allClips.length} clip${allClips.length !== 1 ? "s" : ""} available`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!selectionMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (onSelectionModeChange) {
                      onSelectionModeChange(true);
                    }
                  }}
                  className="h-8 px-3 text-[10px] font-medium border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <Target className="h-3 w-3 mr-1.5" strokeWidth={2} />
                  Select
                </Button>
              )}
              {selectionMode && selectedClips.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClipSelectionChange([])}
                    className="h-8 px-3 text-[10px] font-medium text-slate-600 hover:text-slate-800 border-slate-200 hover:border-slate-300 transition-all"
                  >
                    Clear · {selectedClips.length}
                  </Button>
                  {selectedClips.length === 1 ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleProcessMultiple("platform_optimizer")
                        }
                        className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium shadow-sm transition-all"
                      >
                        <Target className="h-3 w-3 mr-1.5" strokeWidth={2} />
                        Optimize
                      </Button>
                      {onShareClip && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedClipData = allClips.find(
                              (c) => c.id === selectedClips[0]
                            );
                            const artifact = artifacts.find(
                              (a) => a.id === selectedClipData?.artifactId
                            );
                            if (selectedClipData && artifact) {
                              onShareClip(selectedClipData, artifact);
                            }
                          }}
                          className="h-8 px-3.5 text-[10px] font-medium border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                          <Share2 className="h-3 w-3 mr-1.5" strokeWidth={2} />
                          Share
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleProcessMultiple("story_mode")}
                        className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium shadow-sm transition-all"
                      >
                        <Video className="h-3 w-3 mr-1.5" strokeWidth={2} />
                        Story · {getTotalDuration().toFixed(0)}s
                      </Button>
                      {onShareMultipleClips && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedClipData = selectedClips
                              .map((clipId) =>
                                allClips.find((c) => c.id === clipId)
                              )
                              .filter(Boolean);
                            const parentArtifacts = artifacts.filter((a) =>
                              selectedClipData.some(
                                (c) => c?.artifactId === a.id
                              )
                            );
                            if (selectedClipData.length > 0) {
                              onShareMultipleClips(
                                selectedClipData,
                                parentArtifacts
                              );
                            }
                          }}
                          className="h-8 px-3.5 text-[10px] font-medium border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                          <Share2 className="h-3 w-3 mr-1.5" strokeWidth={2} />
                          Share Carousel
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
              {selectionMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (onSelectionModeChange) {
                      onSelectionModeChange(false);
                      if (selectedClips.length > 0) {
                        onClipSelectionChange([]);
                      }
                    }
                  }}
                  className="h-8 px-3 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clips Display - Premium Grid */}
      <div className="space-y-5">
        {artifacts.map((artifact) => {
          const data = artifact.data as ClippingData;
          const clips = getClips(data);

          return (
            <div
              key={artifact.id}
              className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
            >
              {/* Header - Refined */}
              <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-100/20 via-transparent to-transparent" />
                <div className="relative flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-sm">
                      <Scissors
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-900 tracking-tight">
                        Generated Clips
                      </h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {clips.length} clip{clips.length !== 1 ? "s" : ""} ·
                        Automatic detection
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-slate-200 bg-slate-50/50 text-slate-600 px-2.5 py-1"
                  >
                    {clips.length}
                  </Badge>
                </div>
              </div>

              {/* Clips Grid */}
              <div className="p-4 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {clips.map((clip, clipIndex) => {
                    const clipId = clip.id;
                    clip.artifactId = artifact.id;
                    const isSelected = selectedClips.includes(clipId);

                    return (
                      <div
                        key={clipIndex}
                        className={`relative group ${
                          selectionMode ? "cursor-pointer" : ""
                        }`}
                        onClick={
                          selectionMode
                            ? () => toggleClipSelection(clipId)
                            : undefined
                        }
                      >
                        <div
                          className={`relative overflow-hidden rounded-lg border bg-white transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-slate-900 ring-offset-2 shadow-lg shadow-slate-900/10 scale-[1.02]"
                              : "border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60"
                          }`}
                        >
                          {/* Selection Indicator - Premium */}
                          {selectionMode && (
                            <div className="absolute top-2.5 right-2.5 z-20">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  isSelected
                                    ? "bg-slate-900 shadow-md ring-2 ring-white"
                                    : "bg-white/95 backdrop-blur-sm border border-slate-300 group-hover:border-slate-900/40"
                                }`}
                              >
                                {isSelected ? (
                                  <Check
                                    className="w-3 h-3 text-white"
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-900/20 transition-colors"></div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Video Player - Refined */}
                          <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                            <video
                              src={clip.url}
                              controls={!selectionMode}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />

                            {/* Overlay Badges - Minimal */}
                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none">
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                                  <TrendingUp
                                    className="h-2.5 w-2.5 text-emerald-400"
                                    strokeWidth={2}
                                  />
                                  <span className="text-[10px] font-medium text-white">
                                    {Math.round(
                                      (clip.engagement_score || 0.8) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                                <Clock
                                  className="h-2.5 w-2.5 text-slate-300"
                                  strokeWidth={2}
                                />
                                <span className="text-[10px] font-medium text-white">
                                  {formatTime(clip.duration)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Clip Metadata - Refined */}
                          <div className="p-3 space-y-2.5">
                            {/* Title & Theme */}
                            <div className="space-y-1.5">
                              <h4 className="font-semibold text-slate-900 text-[11px] leading-tight tracking-tight line-clamp-2">
                                {clip.title}
                              </h4>
                              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60">
                                <span className="text-[9px] font-medium text-slate-600">
                                  {clip.theme}
                                </span>
                              </div>
                            </div>

                            {/* Transcript Preview - Refined */}
                            {(clip.text || clip.transcript) && (
                              <div className="relative overflow-hidden rounded-lg bg-slate-50/80 border border-slate-200/60 p-2">
                                <p className="text-[9px] text-slate-600 leading-relaxed line-clamp-2">
                                  {clip.text || clip.transcript}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons - Premium Refined */}
                            {!selectionMode && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onDownload(clip.url, `${clip.title}.mp4`)
                                  }
                                  className="flex-1 h-7 text-[10px] font-medium border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
                                >
                                  <Download
                                    className="h-3 w-3 mr-1.5"
                                    strokeWidth={2}
                                  />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onShareClip?.(clip, artifact)}
                                  className="flex-1 h-7 text-[10px] font-medium border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
                                >
                                  <Share2
                                    className="h-3 w-3 mr-1.5"
                                    strokeWidth={2}
                                  />
                                  Share
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    onCopyToClipboard(clip.url, clip.id)
                                  }
                                  className="h-7 w-7 p-0 hover:bg-slate-100/80 transition-all"
                                >
                                  {copiedItems.has(clip.id) ? (
                                    <Check
                                      className="h-3 w-3 text-emerald-600"
                                      strokeWidth={2.5}
                                    />
                                  ) : (
                                    <Copy
                                      className="h-3 w-3 text-slate-500"
                                      strokeWidth={2}
                                    />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Professional Floating Action Bar */}
      {onProcessMultipleClips && (
        <ClipSelectionBar
          selectedCount={selectedClips.length}
          totalDuration={getTotalDuration()}
          onCreateStory={() => handleProcessMultiple("story_mode")}
          onEnhanceAll={() => handleProcessMultiple("enhancement")}
          onOptimizeAll={() => handleProcessMultiple("platform_optimizer")}
          onClearSelection={() =>
            onClipSelectionChange && onClipSelectionChange([])
          }
        />
      )}
    </div>
  );
};
