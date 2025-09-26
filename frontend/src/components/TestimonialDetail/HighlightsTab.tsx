// components/TestimonialDetail/HighlightsTab.tsx
import {
  Brain,
  Sparkles,
  RefreshCw,
  Plus,
  GripVertical,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "../ai-studio/HighlightVideoPlayer";
import { Segment } from "@/types/ai-service";
import { HIGHLIGHT_TYPES, HighlightType } from "@/utils/highlights";
import { TestimonialArtifact } from "@/types/testimonial";
import { preset_manager } from "@/repo/managers/preset_manager";

interface HighlightsTabProps {
  artifacts: TestimonialArtifact[];
  videoUrl: string;
  onGenerateHighlights: (type: HighlightType) => void;
  onRegenerateHighlights: (type: HighlightType) => void;
  onSaveHighlightOrder?: (
    type: HighlightType,
    segments: Segment[]
  ) => Promise<void>;
}

// Get available highlight types from artifacts
const getAvailableHighlightTypes = (
  highlights: Record<string, Segment[]>[]
): HighlightType[] => {
  const availableTypes = new Set<HighlightType>();

  highlights.forEach((highlight) => {
    Object.keys(highlight).forEach((key) => {
      if (key in HIGHLIGHT_TYPES && highlight[key].length > 0) {
        availableTypes.add(key as HighlightType);
      }
    });
  });

  return Array.from(availableTypes);
};

// Draggable Segment Item Component
const DraggableSegmentItem = ({
  segment,
  index,
  isSelected,
  isDragging,
  onPlay,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  segment: Segment;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  onPlay: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 group ${
        isSelected ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-gray-50"
      } ${isDragging ? "opacity-50 rotate-2 scale-105" : ""}`}
      onClick={onPlay}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

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

// Individual highlight type section with reordering
const HighlightTypeSection = ({
  type,
  segments: originalSegments,
  videoUrl,
  onRegenerate,
  onSave,
  isAvailable,
}: {
  type: HighlightType;
  segments: Segment[];
  videoUrl: string;
  onRegenerate: () => void;
  onSave?: (segments: Segment[]) => Promise<void>;
  isAvailable: boolean;
}) => {
  const [segments, setSegments] = useState<Segment[]>(originalSegments);
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(
    segments.length > 0 ? segments[0] : null
  );
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const config = HIGHLIGHT_TYPES[type];
  const IconComponent = config.icon;

  // Update segments when originalSegments change
  useEffect(() => {
    setSegments(originalSegments);
    setHasUnsavedChanges(false);
  }, [originalSegments]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(segments) !== JSON.stringify(originalSegments);
    setHasUnsavedChanges(hasChanges);
  }, [segments, originalSegments]);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSegments = [...segments];
    const draggedSegment = newSegments[draggedIndex];

    // Remove the dragged item
    newSegments.splice(draggedIndex, 1);

    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newSegments.splice(insertIndex, 0, draggedSegment);

    setSegments(newSegments);
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(segments);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSegments(originalSegments);
    setHasUnsavedChanges(false);
  };

  if (!isAvailable) {
    return (
      <div className="text-center py-12">
        <div
          className={`w-16 h-16 rounded-2xl bg-${config.color}-50 flex items-center justify-center mx-auto mb-4`}
        >
          <IconComponent className={`h-8 w-8 text-${config.color}-500`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {config.label} Available
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {config.description}. Generate AI-powered highlights to identify these
          key moments.
        </p>
        <Button
          onClick={onRegenerate}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate {config.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-${config.color}-50 flex items-center justify-center`}
          >
            <IconComponent className={`h-5 w-5 text-${config.color}-500`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-600">
              {segments.length} segments found
              {hasUnsavedChanges && (
                <span className="text-orange-600 ml-2">• Unsaved changes</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {segments.length > 1 && (
            <Button
              onClick={playAllSegments}
              variant="outline"
              size="sm"
              className="text-purple-600 hover:text-purple-700"
            >
              Play All ({segments.length})
            </Button>
          )}

          {hasUnsavedChanges && (
            <>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-700"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Order"}
              </Button>
            </>
          )}

          <Button onClick={onRegenerate} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate
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

        {/* Segments List with Drag & Drop */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Available Segments</h4>
            {segments.length > 1 && (
              <p className="text-xs text-gray-500">
                Drag segments to reorder • Changes auto-save
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {segments.map((segment, index) => (
              <DraggableSegmentItem
                key={`${segment.start_time}-${segment.end_time}-${index}`}
                segment={segment}
                index={index}
                isSelected={currentSegment === segment}
                isDragging={draggedIndex === index}
                onPlay={() => playSegment(segment)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {segments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No segments available for this highlight type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Highlights Tab Component
const HighlightsTab = ({
  artifacts,
  videoUrl,
  onGenerateHighlights,
  onRegenerateHighlights,
  onSaveHighlightOrder,
}: HighlightsTabProps) => {
  const [activeHighlightType, setActiveHighlightType] =
    useState<HighlightType>("highlights");
  //   const [globalSaving, setGlobalSaving] = useState(false);

  // Extract and normalize highlights from artifacts
  const highlightArtifacts = artifacts.filter(
    (a) => a.processing_type === "highlight_extraction"
  );

  const highlights =
    preset_manager.getAndNormalizeHighlights(highlightArtifacts);
  const availableTypes = getAvailableHighlightTypes(highlights);

  // Get segments for current highlight type
  const getCurrentSegments = (): Segment[] => {
    const highlightRecord = highlights.find((h) => h[activeHighlightType]);
    return highlightRecord?.[activeHighlightType] || [];
  };

  const currentSegments = getCurrentSegments();

  const handleSaveHighlightOrder = async (
    type: HighlightType,
    segments: Segment[]
  ) => {
    if (onSaveHighlightOrder) {
      await onSaveHighlightOrder(type, segments);
    }
  };

  const stats = useMemo(() => {
    const totalSegments =
      highlights?.reduce(
        (total, h) =>
          total +
          Object.values(h || {}).reduce(
            (sum, segments) => sum + (segments?.length || 0),
            0
          ),
        0
      ) || 0;

    const totalTypes = Object.keys(HIGHLIGHT_TYPES || {}).length;
    const availableCount = availableTypes?.length || 0;
    const missingCount = Math.max(0, totalTypes - availableCount);

    return {
      totalSegments,
      availableCount,
      missingCount,
      hasData: highlights && highlights.length > 0,
    };
  }, [highlights, availableTypes]);

  //   // Save all highlights with unsaved changes
  //   const handleSaveAll = async () => {
  //     if (!onSaveHighlightOrder) return;

  //     setGlobalSaving(true);
  //     try {
  //       // This would need to be implemented based on your data structure
  //       // For now, just save the current active type
  //       const segments = getCurrentSegments();
  //       await onSaveHighlightOrder(activeHighlightType, segments);
  //     } catch (error) {
  //       console.error("Failed to save all:", error);
  //     } finally {
  //       setGlobalSaving(false);
  //     }
  //   };

  // If no highlights exist at all
  if (highlights.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Highlights Generated
          </h3>
          <p className="text-gray-600 mb-4">
            Generate AI-powered highlights to identify key moments, emotional
            peaks, and important segments in this testimonial.
          </p>
          <Button
            onClick={() => onGenerateHighlights("highlights")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate All Highlights
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card className="p-3">
        <CardHeader>
          <CardTitle className="p-2 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
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
                  onClick={() => onGenerateHighlights("highlights")}
                  size="sm"
                  variant="outline"
                  className="text-purple-600 hover:text-purple-700"
                  disabled={stats.missingCount === 0}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {stats.missingCount === 0
                    ? "All Generated"
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
            const isAvailable = availableTypes.includes(type as HighlightType);
            const IconComponent = config.icon;

            return (
              <TabsTrigger
                key={type}
                value={type}
                className={`relative text-xs p-2 ${
                  isAvailable
                    ? "data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
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
              onRegenerate={() => onRegenerateHighlights(type as HighlightType)}
              onSave={
                onSaveHighlightOrder
                  ? (segments) =>
                      handleSaveHighlightOrder(type as HighlightType, segments)
                  : undefined
              }
              isAvailable={availableTypes.includes(type as HighlightType)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default HighlightsTab;
