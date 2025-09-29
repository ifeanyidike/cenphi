// components/TestimonialDetail/TabRenderers.tsx
import {
  Scissors,
  Video,
  Palette,
  FileText,
  Zap,
  Mic,
  Download,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Save,
  X,
  TrendingUp,
  Award,
  Sparkles,
  Target,
  Clock,
  Lightbulb,
  Play,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ClipSelectionBar from "./ClipSelectionBar";
import AudioCard from "./AudioCard";
import ShareButton from "./ShareButton";
import { TestimonialArtifact } from "@/types/testimonial";
import { ServiceType } from "@/types/ai-service";
import AIStoryUtilities from "@/utils/aistory-utilities";

const enhancementMap: Record<string, string> = {
  enhanced_traditional: "Traditional enhancement",
  professional_encoding: "Professional encoding",
  ai_noise_removal: "Noise removal",
};

// Types
interface ClippingData {
  generated_clips: {
    clips: Array<{
      id: string;
      artifactId?: string;
      url: string;
      theme: string;
      title: string;
      end_time: number;
      start_time: number;
      duration: number;
      engagement_score: number;
      transcript?: string;
      metadata?: any;
    }>;
    detection_method: "automatic" | "manual";
  };
}

interface StoryVideoData {
  story_video_url: string;
}

interface EnhancementData {
  enhanced_url: string;
  applied_enhancements: string[];
  quality_score: number;
  media_type: string;
}

interface TextPolishingData {
  content: string;
  word_count: number;
  created_at: string;
  format: "markdown" | "text" | "html";
}

interface ContentGenerationData {
  generated_content: Array<{
    content_type: string;
    title: string;
    content: string;
    word_count: number;
    created_at: string;
    format: "markdown" | "text" | "html";
  }>;
  source_testimonials: string[];
}

const hasProcessingType = (
  appliedServices: string[] | undefined,
  serviceType: ServiceType
): boolean => {
  return appliedServices?.includes(serviceType) || false;
};

export interface TabRenderProps {
  artifacts: TestimonialArtifact[];
  onGenerateMore?: () => void;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  copiedItems: Set<string>;
  editingContent: { [key: string]: string };
  onStartEditing: (id: string, content: string) => void;
  onSaveContent: (id: string) => void;
  onCancelEditing: (id: string) => void;
  onUpdateEditingContent: (id: string, content: string) => void;

  onProcessClip?: (clip: any, serviceType: ServiceType) => void;
  onProcessArtifact?: (
    artifact: TestimonialArtifact,
    serviceType: ServiceType,
    from?: string
  ) => void;

  selectedClips?: string[];
  onClipSelectionChange?: (selected: string[]) => void;
  onProcessMultipleClips?: (clips: any[], serviceType: ServiceType) => void;
  selectionMode?: boolean; // ADD THIS
  onSelectionModeChange?: (mode: boolean) => void;

  onVideoPreview?: (videoUrl: string, title: string, metadata?: any) => void;
  onViewLineage?: (content: any) => void;
}

// Utility function
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const renderClippingArtifacts = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  onProcessClip,
  selectedClips = [],
  onClipSelectionChange,
  onProcessMultipleClips,
  selectionMode = false,
  onSelectionModeChange,
  onViewLineage,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Clips Generated
          </h3>
          <p className="text-gray-600 mb-4">
            Create engaging video clips from key moments in this testimonial.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Scissors className="h-4 w-4 mr-2" />
            Generate Clips
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Flatten clips for selection tracking
  const allClips = artifacts.flatMap((artifact, artifactIndex) => {
    const data = artifact.data as ClippingData;
    return (data?.generated_clips?.clips || []).map((clip, clipIndex) => ({
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

  // AI Smart Selection - picks top engagement clips
  // const handleAISmartSelection = () => {
  //   if (!onClipSelectionChange || !onProcessMultipleClips) return;

  //   // Sort clips by engagement score and select top 3-5
  //   const sortedClips = [...allClips].sort(
  //     (a, b) => b.engagement_score - a.engagement_score
  //   );
  //   const topClips = sortedClips.slice(
  //     0,
  //     Math.min(5, Math.max(3, sortedClips.length))
  //   );
  //   const selectedIds = topClips.map((clip) => clip.id);

  //   onClipSelectionChange(selectedIds);
  //   if (onSelectionModeChange) {
  //     onSelectionModeChange(true);
  //   }

  //   // Auto-trigger story mode after a brief delay
  //   setTimeout(() => {
  //     onProcessMultipleClips(topClips, "story_mode");
  //   }, 1500);
  // };

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
    <div className="space-y-6 relative">
      {/* AI Smart Selection Header */}
      {onClipSelectionChange && allClips.length > 1 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Create Story Video
                </h3>
                <p className="text-xs text-gray-600">
                  Automatically combine your best clips into a compelling story
                </p>
              </div>
            </div>
            <Button
              onClick={handleAISmartSelection}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
            >
              <Play className="h-3 w-3 mr-2" />
              Create Story
            </Button>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      {onClipSelectionChange && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Manual Selection
              </h3>
              <p className="text-xs text-gray-600">
                {selectionMode
                  ? "Click clips to select them for batch processing"
                  : "Choose specific clips for custom processing"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={selectionMode ? "default" : "outline"}
                onClick={() => {
                  if (onSelectionModeChange) {
                    onSelectionModeChange(!selectionMode);
                    if (!selectionMode && selectedClips.length > 0) {
                      onClipSelectionChange([]);
                    }
                  }
                }}
                className={
                  selectionMode
                    ? "bg-blue-600 hover:bg-blue-700 text-xs"
                    : "text-xs"
                }
              >
                {selectionMode ? "Exit Selection" : "Multi-Select"}
              </Button>
              {selectionMode && selectedClips.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onClipSelectionChange([])}
                  className="text-gray-600 hover:text-gray-800 text-xs"
                >
                  Clear ({selectedClips.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clips Display */}
      <div className="space-y-6">
        {artifacts.map((artifact) => {
          const data = artifact.data as ClippingData;
          const clips = data?.generated_clips?.clips || [];

          return (
            <Card key={artifact.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-purple-600" />
                    Generated Clips
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {clips.length} clip{clips.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-300"
                    >
                      {data.generated_clips?.detection_method || "automatic"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clips.map((clip, clipIndex) => {
                    const clipId = clip.id;
                    clip.artifactId = artifact.id;
                    const isSelected = selectedClips.includes(clipId);

                    return (
                      <div
                        key={clipIndex}
                        className={`relative group transition-all duration-300 ${
                          selectionMode ? "cursor-pointer" : ""
                        }`}
                        onClick={
                          selectionMode
                            ? () => toggleClipSelection(clipId)
                            : undefined
                        }
                      >
                        <Card
                          className={`overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? "ring-2 ring-blue-500 shadow-lg shadow-blue-100 transform scale-[1.02]"
                              : "hover:shadow-lg hover:shadow-gray-200"
                          }`}
                        >
                          {/* Professional Selection Indicator */}
                          {selectionMode && (
                            <div className="absolute top-4 right-4 z-20">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                                  isSelected
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 scale-110"
                                    : "bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:shadow-md"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-5 h-5 text-white" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-gray-200 group-hover:bg-blue-200 transition-colors duration-200"></div>
                                )}
                              </div>
                            </div>
                          )}

                          <CardContent className="p-4 space-y-4">
                            {/* Video Player */}
                            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
                              <video
                                src={clip.url}
                                controls={!selectionMode}
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                            </div>

                            {/* Clip Metadata */}
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {clip.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium border-gray-300"
                                  >
                                    {clip.theme}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(clip.duration)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    {Math.round(clip.engagement_score * 100)}%
                                  </span>
                                </div>
                              </div>

                              {/* Transcript Preview */}
                              {clip.transcript && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                                    {clip.transcript}
                                  </p>
                                </div>
                              )}

                              {/* Action Buttons - Only in normal mode */}
                              {!selectionMode && (
                                <div className="flex items-center gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onDownload(clip.url, `${clip.title}.mp4`)
                                    }
                                    className="flex-1 border-gray-300 hover:border-gray-400"
                                  >
                                    <Download className="h-3 w-3 mr-2" />
                                    Download
                                  </Button>
                                  <ShareButton
                                    testimonialId={artifact.testimonial_id}
                                    content={`Check out this amazing testimonial clip: "${clip.title}"`}
                                    artifactType="video"
                                    videoUrl={clip.url}
                                    size="sm"
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      onCopyToClipboard(clip.url, clip.id)
                                    }
                                    className="px-3"
                                  >
                                    {copiedItems.has(clip.id) ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>

                                  {/* Individual Processing Buttons */}
                                  <div className="">
                                    {!hasProcessingType(
                                      clip.metadata?.applied_services,
                                      "enhancement"
                                    ) &&
                                      onProcessClip && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            onProcessClip(clip, "enhancement")
                                          }
                                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3"
                                          title="Enhance this clip"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                        </Button>
                                      )}
                                    {!hasProcessingType(
                                      clip.metadata?.applied_services,
                                      "platform_optimizer"
                                    ) &&
                                      onProcessClip && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            console.log(
                                              "clip before processing",
                                              clip
                                            );
                                            onProcessClip(
                                              clip,
                                              "platform_optimizer"
                                            );
                                          }}
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50 px-3"
                                          title="Optimize for platforms"
                                        >
                                          <Target className="h-3 w-3" />
                                        </Button>
                                      )}

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-gray-700 hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onViewLineage) {
                                          onViewLineage({
                                            id: `${artifact.id}:${clip.id}`,
                                            type: "clip", // or "artifact" depending on your data structure
                                            title: clip.theme,
                                            url: clip.url,
                                            metadata: clip.metadata,
                                          });
                                        }
                                      }}
                                    >
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      Lineage
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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

// Story Video Artifacts Renderer
export const renderStoryVideoArtifacts = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  onProcessArtifact,
  onVideoPreview,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Story Videos
          </h3>
          <p className="text-gray-600 mb-4">
            Create engaging story videos that highlight key moments and
            emotional impact.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Video className="h-4 w-4 mr-2" />
            Generate Story Videos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map((artifact) => {
        const data = artifact.data as StoryVideoData;

        return (
          <Card
            key={artifact.id}
            className="hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-600" />
                  Story Video
                </h4>
              </div>

              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  src={data.story_video_url}
                  controls
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onVideoPreview) {
                        onVideoPreview(data.story_video_url, "Story Video");
                      }
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Full Screen
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onDownload(data.story_video_url, "story-video.mp4")
                  }
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <ShareButton
                  testimonialId={artifact.testimonial_id}
                  content="🎬 Check out this amazing testimonial story video! It perfectly captures the customer experience and impact."
                  artifactType="video"
                  videoUrl={data.story_video_url}
                  size="sm"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onCopyToClipboard(
                      data.story_video_url,
                      `story-${artifact.id}`
                    )
                  }
                >
                  {copiedItems.has(`story-${artifact.id}`) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(data.story_video_url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                {!hasProcessingType(
                  artifact.processing_metadata?.applied_services,
                  "enhancement"
                ) &&
                  onProcessArtifact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onProcessArtifact(artifact, "enhancement")}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  )}
                {!hasProcessingType(
                  artifact.processing_metadata?.applied_services,
                  "platform_optimizer"
                ) &&
                  onProcessArtifact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onProcessArtifact(
                          artifact,
                          "platform_optimizer",
                          "story_video"
                        )
                      }
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Target className="h-3 w-3" />
                    </Button>
                  )}
              </div>

              <div className="text-xs text-gray-500">
                Created: {new Date(artifact.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Enhancement Artifacts Renderer
export const renderEnhancementArtifacts = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  onProcessArtifact,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Video Enhancements
          </h3>
          <p className="text-gray-600 mb-4">
            Enhance video quality with AI-powered improvements like noise
            reduction, color correction, and stabilization.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Palette className="h-4 w-4 mr-2" />
            Enhance Video
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map((artifact) => {
        const data = artifact.data as EnhancementData;

        return (
          <Card
            key={artifact.id}
            className="hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Enhanced {data.media_type}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">
                        Quality: {Math.round(data.quality_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  src={data.enhanced_url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              {data.applied_enhancements &&
                data.applied_enhancements.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-2">
                      Applied Enhancements:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {data.applied_enhancements.map((enhancement, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {enhancementMap[enhancement]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onDownload(data.enhanced_url, "enhanced-video.mp4")
                  }
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onCopyToClipboard(
                      data.enhanced_url,
                      `enhancement-${artifact.id}`
                    )
                  }
                >
                  {copiedItems.has(`enhancement-${artifact.id}`) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(data.enhanced_url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>

                {!hasProcessingType(
                  artifact.processing_metadata?.applied_services,
                  "platform_optimizer"
                ) &&
                  onProcessArtifact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onProcessArtifact(artifact, "platform_optimizer")
                      }
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Target className="h-3 w-3" />
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Narration Artifacts Renderer
export const renderNarrationArtifacts = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
}: TabRenderProps): JSX.Element => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Narration Audio
          </h3>
          <p className="text-gray-600 mb-4">
            Generate professional narration audio from testimonial text using AI
            voice synthesis.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Mic className="h-4 w-4 mr-2" />
            Generate Narration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {artifacts.map((artifact) => (
        <AudioCard
          key={artifact.id}
          artifact={artifact}
          onDownload={onDownload}
          onCopyToClipboard={onCopyToClipboard}
          copiedItems={copiedItems}
        />
      ))}
    </div>
  );
};
// Text Polishing Artifacts Renderer
export const renderTextPolishingArtifacts = ({
  artifacts,
  onGenerateMore,
  onCopyToClipboard,
  copiedItems,
  editingContent,
  onStartEditing,
  onSaveContent,
  onCancelEditing,
  onUpdateEditingContent,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Text Polishing
          </h3>
          <p className="text-gray-600 mb-4">
            Polish and refine testimonial text for better impact, clarity, and
            professional presentation.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Polish Text
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {artifacts.map((artifact) => {
        const data = artifact.data as TextPolishingData;
        const contentId = `polishing-${artifact.id}`;
        const isEditing = Object.prototype.hasOwnProperty.call(
          editingContent,
          contentId
        );

        return (
          <Card key={artifact.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Polished Text
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {data.format}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {data.word_count} words
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(data.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onSaveContent(contentId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancelEditing(contentId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartEditing(contentId, data.content)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onCopyToClipboard(
                        data.content,
                        `polishing-copy-${artifact.id}`
                      )
                    }
                  >
                    {copiedItems.has(`polishing-copy-${artifact.id}`) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={editingContent[contentId]}
                  onChange={(e) =>
                    onUpdateEditingContent(contentId, e.target.value)
                  }
                  className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Edit your polished content here..."
                />
              ) : (
                <div className="prose prose-gray max-w-none">
                  {data.format === "markdown" ? (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: data.content
                          ?.replace(/\n/g, "<br>")
                          ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          ?.replace(/\*(.*?)\*/g, "<em>$1</em>"),
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{data.content}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Content Generation Artifacts Renderer
export const renderContentGenerationArtifacts = ({
  artifacts,
  onGenerateMore,
  onCopyToClipboard,
  copiedItems,
  editingContent,
  onStartEditing,
  onSaveContent,
  onCancelEditing,
  onUpdateEditingContent,
}: TabRenderProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Generated Content
          </h3>
          <p className="text-gray-600 mb-4">
            Generate marketing content like case studies, blog posts, and social
            media content.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {artifacts.map((artifact) => {
        const data = artifact.data as ContentGenerationData;
        const content = data?.generated_content || [];

        return (
          <div key={artifact.id} className="space-y-4">
            {content.map((item, index) => {
              const contentId = `${artifact.id}-${index}`;
              const isEditing = Object.prototype.hasOwnProperty.call(
                editingContent,
                contentId
              );

              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.content_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {item.word_count} words
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onSaveContent(contentId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCancelEditing(contentId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                onStartEditing(contentId, item.content)
                              }
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <ShareButton
                              testimonialId={artifact.testimonial_id}
                              content={item.content}
                              artifactType="text"
                              size="sm"
                            />
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onCopyToClipboard(item.content, `content-${index}`)
                          }
                        >
                          {copiedItems.has(`content-${index}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <textarea
                        value={editingContent[contentId]}
                        onChange={(e) =>
                          onUpdateEditingContent(contentId, e.target.value)
                        }
                        className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Edit your content here..."
                      />
                    ) : (
                      <div className="prose prose-gray max-w-none">
                        {item.format === "markdown" ? (
                          <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: item.content
                                ?.replace(/\n/g, "<br>")
                                ?.replace(
                                  /\*\*(.*?)\*\*/g,
                                  "<strong>$1</strong>"
                                )
                                ?.replace(/\*(.*?)\*/g, "<em>$1</em>"),
                            }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {item.content}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Viral Analysis Data Interface
interface ViralAnalysisData {
  analysis_results?: {
    overall_score: number;
    platform_scores: Record<
      string,
      {
        score: number;
        reasons: string[];
        optimization_tips: string[];
      }
    >;
    insights: {
      key_moments: Array<{
        timestamp: number;
        reason: string;
        impact_score: number;
      }>;
      improvement_suggestions: string[];
      viral_elements: string[];
    };
    trending_alignment?: {
      matched_topics: string[];
      trend_score: number;
    };
  };
}

// Viral Analysis Artifacts Renderer
export const renderViralAnalysisArtifacts = ({
  artifacts,
  onGenerateViralClips,
  onGenerateViralOptimization,
}: TabRenderProps & {
  onGenerateViralClips?: () => void;
  onGenerateViralOptimization?: (platform: string) => void;
}) => {
  if (artifacts.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Viral Content Generation
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Create viral-optimized clips and platform-specific content using
              AI-powered viral analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGenerateViralClips}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg px-6 py-3"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Generate Viral Clips
              </Button>

              <div className="relative group">
                <Button
                  onClick={() => onGenerateViralOptimization?.("tiktok")}
                  variant="outline"
                  className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 px-6 py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Viral Platform Optimization
                </Button>

                {/* Platform selection dropdown could be added here */}
                <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white border rounded-lg shadow-lg p-2 space-y-1 min-w-[200px] z-10">
                  <button
                    onClick={() => onGenerateViralOptimization?.("tiktok")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                  >
                    🎵 TikTok Optimization
                  </button>
                  <button
                    onClick={() =>
                      onGenerateViralOptimization?.("instagram_reels")
                    }
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                  >
                    📸 Instagram Reels
                  </button>
                  <button
                    onClick={() =>
                      onGenerateViralOptimization?.("youtube_shorts")
                    }
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                  >
                    ▶️ YouTube Shorts
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  <strong>Viral Clips:</strong> AI analyzes your content to
                  identify the most engaging moments and creates optimized clips
                  for maximum reach.
                  <br />
                  <strong>Platform Optimization:</strong> Content is tailored
                  for specific platforms with viral insights built-in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {artifacts.map((artifact) => {
        const data = artifact.data as ViralAnalysisData;
        const analysis = data?.analysis_results;

        if (!analysis) return null;

        return (
          <div key={artifact.id} className="space-y-6">
            {/* Overall Score Card */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Overall Viral Score
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(analysis.overall_score * 10)}/10
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        analysis.overall_score >= 0.8
                          ? "bg-green-100 text-green-800 border-green-200"
                          : analysis.overall_score >= 0.6
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {analysis.overall_score >= 0.8
                        ? "High Potential"
                        : analysis.overall_score >= 0.6
                          ? "Medium Potential"
                          : "Low Potential"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${analysis.overall_score * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platform Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Platform Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(analysis.platform_scores).map(
                    ([platform, data]) => (
                      <div
                        key={platform}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {platform === "tiktok"
                                ? "🎵"
                                : platform === "instagram_reels"
                                  ? "📸"
                                  : platform === "youtube_shorts"
                                    ? "▶️"
                                    : platform === "twitter"
                                      ? "🐦"
                                      : platform === "linkedin"
                                        ? "💼"
                                        : "🌐"}
                            </span>
                            <span className="font-medium text-sm capitalize">
                              {platform.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-lg font-bold">
                            {Math.round(data.score * 10)}/10
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${data.score * 100}%` }}
                          />
                        </div>

                        {data.reasons.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              Key Factors
                            </p>
                            {data.reasons.slice(0, 2).map((reason, idx) => (
                              <p key={idx} className="text-xs text-gray-600">
                                • {reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {analysis.insights && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Key Moments */}
                {analysis.insights.key_moments &&
                  analysis.insights.key_moments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-green-500" />
                          Key Viral Moments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysis.insights.key_moments
                            .slice(0, 3)
                            .map((moment, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-green-700">
                                    {Math.floor(moment.timestamp / 60)}:
                                    {(moment.timestamp % 60)
                                      .toString()
                                      .padStart(2, "0")}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">
                                    {moment.reason}
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Impact:{" "}
                                    {Math.round(moment.impact_score * 100)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Improvement Suggestions */}
                {analysis.insights.improvement_suggestions &&
                  analysis.insights.improvement_suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          Optimization Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysis.insights.improvement_suggestions
                            .slice(0, 4)
                            .map((suggestion, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                  <ArrowRight className="h-3 w-3 text-purple-600" />
                                </div>
                                <p className="text-sm text-gray-900">
                                  {suggestion}
                                </p>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}

            {/* Trending Alignment */}
            {analysis.trending_alignment &&
              analysis.trending_alignment.matched_topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-pink-500" />
                      Trending Topics Alignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Trend Match Score
                      </span>
                      <span className="text-lg font-bold text-pink-600">
                        {Math.round(
                          analysis.trending_alignment.trend_score * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.trending_alignment.matched_topics.map(
                        (topic, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-pink-100 text-pink-800 border-pink-200"
                          >
                            {topic}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        );
      })}
    </div>
  );
};
