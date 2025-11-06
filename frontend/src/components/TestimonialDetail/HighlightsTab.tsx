// components/TestimonialDetail/HighlightsTab.tsx
import { Brain, Sparkles, RefreshCw, Plus, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notification } from "antd";
import VideoPlayer from "./HighlightVideoPlayer";
import { Segment } from "@/types/ai-service";
import { HIGHLIGHT_TYPES, HighlightType } from "@/utils/highlights";
import { TestimonialArtifact, Testimonial } from "@/types/testimonial";
import {
  getAvailableHighlightTypes as getAvailableTypesFromTestimonial,
  parseMomentsFromArtifacts,
} from "@/utils/momentHelpers";

interface HighlightsTabProps {
  testimonialId: string;
  artifacts: TestimonialArtifact[];
  videoUrl: string;
  onGenerateHighlights: (type: HighlightType) => Promise<void>;
  onRegenerateHighlights: (type: HighlightType) => Promise<void>;
}

// Loading Overlay Component
const LoadingOverlay = ({ message }: { message: string }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
        <p className="text-sm font-medium text-gray-900">{message}</p>
        <p className="text-xs text-gray-600">This may take a moment...</p>
      </div>
    </div>
  );
};

// Segment Item Component (view-only, no drag & drop)
const SegmentItem = ({
  segment,
  index,
  isSelected,
  onPlay,
}: {
  segment: Segment;
  index: number;
  isSelected: boolean;
  onPlay: () => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-1 ring-gray-400 bg-gray-50" : "hover:bg-gray-50"
      }`}
      onClick={onPlay}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs bg-gray-50">
                  #{index + 1}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.floor(segment.start_time)}s -{" "}
                  {Math.floor(segment.end_time)}s
                </Badge>
                {segment.theme && (
                  <Badge variant="secondary" className="text-xs">
                    {segment.theme}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">
                {Math.floor(segment.end_time - segment.start_time)}s
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              "{segment.text}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Individual highlight type section (view-only, no reordering)
const HighlightTypeSection = ({
  type,
  segments,
  videoUrl,
  onRegenerate,
  onGenerate,
  isAvailable,
  isLoading,
}: {
  type: HighlightType;
  segments: Segment[];
  videoUrl: string;
  onRegenerate: () => void;
  onGenerate: () => void;
  isAvailable: boolean;
  isLoading?: boolean;
}) => {
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(
    segments.length > 0 ? segments[0] : null
  );
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const config = HIGHLIGHT_TYPES[type];
  const IconComponent = config.icon;

  const playSegment = (segment: Segment) => {
    setCurrentSegment(segment);
    setIsPlayingAll(false);
  };

  const playAllSegments = () => {
    if (segments.length > 0) {
      setCurrentSegment(segments[0]);
      setSelectedSegmentIds(segments.map((_, idx) => idx.toString()));
      setIsPlayingAll(true);
    }
  };

  if (!isAvailable) {
    return (
      <div className="text-center py-8 relative">
        {isLoading && (
          <LoadingOverlay message={`Generating ${config.label}...`} />
        )}
        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <IconComponent className="h-5 w-5 text-gray-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          No {config.label} Available
        </h3>
        <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
          {config.description}. Generate highlights to identify key moments.
        </p>
        <Button
          onClick={onGenerate}
          size="sm"
          className="text-xs h-7"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          {isLoading ? "Generating..." : `Generate ${config.label}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <LoadingOverlay message={`Regenerating ${config.label}...`} />
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {config.label}
            </h3>
            <p className="text-xs text-gray-600">
              {segments.length} {segments.length === 1 ? "segment" : "segments"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {segments.length > 1 && (
            <Button
              onClick={playAllSegments}
              variant="outline"
              size="sm"
              className="text-xs h-7 text-gray-700 hover:text-gray-900"
              disabled={isLoading}
            >
              Play All ({segments.length})
            </Button>
          )}

          <Button
            onClick={onRegenerate}
            variant="outline"
            size="sm"
            className="text-xs h-7 text-gray-600 hover:text-gray-700 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {isLoading ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div>
          <VideoPlayer
            videoUrl={videoUrl}
            currentSegment={currentSegment}
            selectedSegmentIds={selectedSegmentIds}
            segments={segments}
            isPlayingAll={isPlayingAll}
            onSegmentComplete={() => {}}
            onAllSegmentsComplete={() => setIsPlayingAll(false)}
          />
        </div>

        {/* Segments List (view-only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Available Segments
            </h4>
          </div>

          <div className="max-h-[700px] overflow-y-auto space-y-2">
            {segments.map((segment, index) => (
              <SegmentItem
                key={`${segment.start_time}-${segment.end_time}-${index}`}
                segment={segment}
                index={index}
                isSelected={currentSegment === segment}
                onPlay={() => playSegment(segment)}
              />
            ))}
          </div>

          {segments.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p className="text-xs">
                No segments available for this highlight type.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Highlights Tab Component
const HighlightsTab = ({
  testimonialId,
  artifacts,
  videoUrl,
  onGenerateHighlights,
  onRegenerateHighlights,
}: HighlightsTabProps) => {
  const [activeHighlightType, setActiveHighlightType] =
    useState<HighlightType>("highlights");

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [api, contextHolder] = notification.useNotification();

  const handleGenerateHighlights = async (type: HighlightType) => {
    const config = HIGHLIGHT_TYPES[type];
    setLoadingStates((prev) => ({ ...prev, [type]: true }));

    // Show loading notification
    const loadingKey = `loading-${type}-${Date.now()}`;
    api.info({
      key: loadingKey,
      message: "Generating Highlights",
      description: `Creating ${config.label}... This may take a moment.`,
      icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      duration: 0, // Don't auto-close
    });

    try {
      await onGenerateHighlights(type);

      // Close loading notification
      api.destroy(loadingKey);

      // Show success notification
      api.success({
        message: "Highlights Generated",
        description: `${config.label} have been successfully generated!`,
        duration: 4,
      });
    } catch {
      // Close loading notification
      api.destroy(loadingKey);

      // Show error notification
      api.error({
        message: "Generation Failed",
        description: `Failed to generate ${config.label}. Please try again.`,
        duration: 5,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleRegenerateHighlights = async (type: HighlightType) => {
    const config = HIGHLIGHT_TYPES[type];
    setLoadingStates((prev) => ({ ...prev, [type]: true }));

    // Show loading notification
    const loadingKey = `regenerating-${type}-${Date.now()}`;
    api.info({
      key: loadingKey,
      message: "Regenerating Highlights",
      description: `Recreating ${config.label}... This may take a moment.`,
      icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      duration: 0,
    });

    try {
      await onRegenerateHighlights(type);

      api.destroy(loadingKey);

      api.success({
        message: "Highlights Regenerated",
        description: `${config.label} have been successfully regenerated!`,
        duration: 4,
      });
    } catch {
      api.destroy(loadingKey);

      api.error({
        message: "Regeneration Failed",
        description: `Failed to regenerate ${config.label}. Please try again.`,
        duration: 5,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleGenerateMissing = async () => {
    const missingTypes = Object.keys(HIGHLIGHT_TYPES).filter(
      (type) => !normalizedAvailableTypes.includes(type as HighlightType)
    ) as HighlightType[];

    if (missingTypes.length === 0) return;

    const loadingKey = `generating-missing-${Date.now()}`;
    api.info({
      key: loadingKey,
      message: "Generating Missing Highlights",
      description: `Generating ${missingTypes.length} missing highlight type(s)...`,
      icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      duration: 0,
    });

    try {
      // Generate all missing types
      await Promise.all(missingTypes.map((type) => onGenerateHighlights(type)));

      api.destroy(loadingKey);

      api.success({
        message: "All Highlights Generated",
        description: `Successfully generated ${missingTypes.length} missing highlight type(s)!`,
        duration: 4,
      });
    } catch {
      api.destroy(loadingKey);

      api.error({
        message: "Generation Failed",
        description: "Failed to generate some highlights. Please try again.",
        duration: 5,
      });
    }
  };

  // Parse all moments from artifacts using momentHelpers
  // Use JSON.stringify for stable dependency comparison
  const artifactsJson = JSON.stringify(artifacts);
  const allMoments = useMemo(() => {
    return parseMomentsFromArtifacts(artifacts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactsJson]);

  // Get available types
  const availableTypes = getAvailableTypesFromTestimonial({
    id: testimonialId,
    artifacts: artifacts,
  } as Testimonial) as HighlightType[];

  // Map "general" to "highlights" to match HIGHLIGHT_TYPES keys
  const normalizedAvailableTypes = availableTypes.map((type: any) =>
    type === "general" ? "highlights" : type
  ) as HighlightType[];

  // Get segments for current highlight type
  const allMomentsJson = JSON.stringify(allMoments);
  const currentSegments = useMemo((): Segment[] => {
    const moments = allMoments.filter((m) => {
      if (
        (activeHighlightType as any) === "general" ||
        activeHighlightType === "highlights"
      ) {
        return (
          m.type === "general" ||
          m.type === "highlight" ||
          (m.type as any) === "highlights"
        );
      }
      return m.type === activeHighlightType;
    });

    return moments.map((moment) => ({
      id: moment.id,
      start_time: moment.start_time / 1000,
      end_time: moment.end_time / 1000,
      text: moment.text,
      theme: moment.theme as any,
      importance_score: moment.importance_score,
      engagement_score: moment.engagement_score,
      keywords: moment.keywords,
      thumbnail_url: moment.thumbnail_url,
      words: [] as any,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMomentsJson, activeHighlightType]);

  const stats = useMemo(() => {
    const totalSegments = allMoments.length;
    const totalTypes = Object.keys(HIGHLIGHT_TYPES || {}).length;
    const availableCount = normalizedAvailableTypes?.length || 0;
    const missingCount = Math.max(0, totalTypes - availableCount);

    return {
      totalSegments,
      availableCount,
      missingCount,
      hasData: allMoments.length > 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMomentsJson, normalizedAvailableTypes.length]);

  const isGeneratingAll = loadingStates["generate-all"] || false;

  // If no highlights exist at all
  if (allMoments.length === 0) {
    return (
      <>
        {contextHolder}
        <Card className="relative">
          {isGeneratingAll && (
            <LoadingOverlay message="Generating all highlights..." />
          )}
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text font-semibold text-gray-900 mb-2">
              No Highlights Generated
            </h3>
            <p className="text-gray-600 mb-4 text-xs">
              Generate AI-powered highlights to identify key moments, emotional
              peaks, and important segments in this testimonial.
            </p>
            <div className="flex items-center justify-center">
              <Button
                onClick={() => {
                  setLoadingStates({ "generate-all": true });
                  handleGenerateHighlights("highlights");
                }}
                disabled={isGeneratingAll}
                className="bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
              >
                {isGeneratingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGeneratingAll ? "Generating..." : "Generate All Highlights"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="space-y-6">
        {/* Overview Stats */}
        <Card className="p-3">
          <CardHeader>
            <CardTitle className="p-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-gray-600" />
              Highlights Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats.hasData ? (
              <div className="text-center py-4 text-gray-500">
                No highlights data available
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {stats.availableCount}
                  </div>
                  <div className="text-sm text-gray-600">Types Available</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {stats.totalSegments}
                  </div>
                  <div className="text-sm text-gray-600">Total Segments</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {stats.missingCount}
                  </div>
                  <div className="text-sm text-gray-600">Missing Types</div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleGenerateMissing}
                    size="sm"
                    variant="outline"
                    className="text-gray-600 hover:text-gray-700 flex items-center gap-1"
                    disabled={
                      stats.missingCount === 0 ||
                      loadingStates["generate-missing"]
                    }
                  >
                    {loadingStates["generate-missing"] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {stats.missingCount === 0
                      ? "All Generated"
                      : loadingStates["generate-missing"]
                        ? "Generating..."
                        : "Generate Missing"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Highlight Type Tabs */}
        <Tabs
          value={activeHighlightType}
          onValueChange={(value) =>
            setActiveHighlightType(value as HighlightType)
          }
        >
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
            {Object.entries(HIGHLIGHT_TYPES).map(([type, config]) => {
              const isAvailable = normalizedAvailableTypes.includes(
                type as HighlightType
              );
              const IconComponent = config.icon;

              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className={`relative text-xs p-2 ${
                    isAvailable
                      ? "data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900"
                      : "opacity-60"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <IconComponent className="h-3 w-3" />
                    <span className="hidden sm:block">
                      {config.label.split(" ")[0]}
                    </span>
                  </div>
                  {!isAvailable && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.keys(HIGHLIGHT_TYPES).map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              <HighlightTypeSection
                type={type as HighlightType}
                segments={type === activeHighlightType ? currentSegments : []}
                videoUrl={videoUrl}
                onRegenerate={() =>
                  handleRegenerateHighlights(type as HighlightType)
                }
                onGenerate={() =>
                  handleGenerateHighlights(type as HighlightType)
                }
                isAvailable={normalizedAvailableTypes.includes(
                  type as HighlightType
                )}
                isLoading={loadingStates[type] || false}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default HighlightsTab;
