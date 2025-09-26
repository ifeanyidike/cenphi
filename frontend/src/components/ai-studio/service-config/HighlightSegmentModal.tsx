// components/ai-studio/service-config/HighlightSegmentModal.tsx
import { Brain, Play, X, Check, ChevronDown, Zap, Info } from "lucide-react";
import { Segment } from "@/types/ai-service";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import VideoPlayer from "../HighlightVideoPlayer";
import ModalPortal from "@/utils/ModalPortal";
import { HIGHLIGHT_TYPES, HighlightType } from "@/utils/highlights";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";

// Main Modal Component
type Props = {
  isOpen: boolean;
  onClose: () => void;
  highlightSegments: Record<string, Segment[]>[];
  updateConfig: (key: string, value: any) => void;
  minSelection?: number;
};
const HighlightSegmentModal = ({
  isOpen,
  onClose,
  highlightSegments,
  updateConfig,
  minSelection = 1,
}: Props) => {
  const [selectedHighlightType, setSelectedHighlightType] =
    useState<HighlightType>("highlights");
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<Segment | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  // Get current highlight data based on selected type
  const currentHighlightRecord = highlightSegments?.find((record) => {
    return record.hasOwnProperty(selectedHighlightType);
  });

  const currentSegments = currentHighlightRecord?.[selectedHighlightType] || [];

  // Reset selection when highlight type changes
  useEffect(() => {
    setSelectedSegmentIds([]);
    setCurrentPreview(null);
    setIsPlayingAll(false);
  }, [selectedHighlightType]);

  // Set initial preview when segments change
  useEffect(() => {
    if (currentSegments.length > 0 && !currentPreview) {
      setCurrentPreview(currentSegments[0]);
    }
  }, [currentSegments, currentPreview]);

  // Update preview when single segment is selected
  useEffect(() => {
    if (selectedSegmentIds.length === 1) {
      const segmentId = selectedSegmentIds[0];
      const segment = currentSegments.find((c) => c.id === segmentId);
      if (segment) {
        setCurrentPreview(segment);
        setIsPlayingAll(false);
      }
    }
  }, [selectedSegmentIds, currentSegments]);

  const previewSegment = (segment: Segment) => {
    setCurrentPreview(segment);
    setIsPlayingAll(false);
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegmentIds((prev) => {
      const newSelected = prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId];
      return newSelected;
    });
  };

  const playAllSelected = () => {
    if (selectedSegmentIds.length > 0) {
      const firstSegmentId = selectedSegmentIds[0];
      const firstSegment = currentSegments.find((s) => s.id === firstSegmentId);
      if (firstSegment) {
        setCurrentPreview(firstSegment);
        setIsPlayingAll(true);
        setTimeout(() => {
          const video = document.querySelector("video");
          if (video) {
            video.currentTime = firstSegment.start_time;
            video.play().catch(console.error);
          }
        }, 100);
      }
    }
  };

  const selectAllSegments = () => {
    const allIds = currentSegments.map((_, index) => index.toString());
    setSelectedSegmentIds(allIds);
  };

  const calculateTotalDuration = () => {
    return selectedSegmentIds?.reduce((total, segmentId) => {
      const segment = currentSegments.find((s) => s.id === segmentId);
      return total + (segment ? segment.end_time - segment.start_time : 0);
    }, 0);
  };

  const handleConfirmSelection = () => {
    if (selectedSegmentIds.length === 0) {
      // If no segments selected, use all segments of the selected type
      const result = currentHighlightRecord
        ? [
            {
              [selectedHighlightType]:
                currentHighlightRecord[selectedHighlightType],
            },
          ]
        : [];
      updateConfig("segments", result);
    } else {
      // Use selected segments only
      const selectedSegments = selectedSegmentIds
        .map((id) => currentSegments.find((s) => s.id === id)!)
        .filter(Boolean);
      updateConfig("segments", [{ [selectedHighlightType]: selectedSegments }]);
    }
    onClose();
  };

  const isSelectionValid =
    selectedSegmentIds.length >= minSelection ||
    selectedSegmentIds.length === 0;

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-lg border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Segment Selection
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose the most impactful moments for your content
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Highlight Type Selector */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Highlight Type
                  </span>
                  <div className="relative">
                    <select
                      value={selectedHighlightType}
                      onChange={(e) =>
                        setSelectedHighlightType(
                          e.target.value as HighlightType
                        )
                      }
                      className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white text-sm text-gray-700 focus:border-gray-400 focus:outline-none min-w-[200px]"
                    >
                      {Object.entries(HIGHLIGHT_TYPES).map(
                        ([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        )
                      )}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Highlight Type Description */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full bg-${HIGHLIGHT_TYPES[selectedHighlightType].color}-500`}
              />
              <span className="text-xs text-gray-600">
                {HIGHLIGHT_TYPES[selectedHighlightType].description}
              </span>
            </div>
          </div>

          <div className="flex h-[75vh]">
            {/* Video Panel */}
            <div className="w-1/2 p-6 bg-gray-50/50 border-r border-gray-100">
              {currentSegments.length > 0 ? (
                <>
                  <VideoPlayer
                    videoUrl={
                      aiStudioManager.selectedTestimonial?.media_url || ""
                    }
                    currentSegment={currentPreview}
                    selectedSegmentIds={selectedSegmentIds}
                    segments={currentSegments}
                    isPlayingAll={isPlayingAll}
                    onSegmentComplete={() => {}}
                    onAllSegmentsComplete={() => setIsPlayingAll(false)}
                  />

                  {/* Play All Button */}
                  {selectedSegmentIds.length > 1 && (
                    <div className="mt-4">
                      <button
                        onClick={playAllSelected}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        <Play className="h-4 w-4" />
                        Play All Selected ({selectedSegmentIds.length})
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl">
                  <div className="text-center">
                    <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No segments available for this highlight type
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Segments List */}
            <div className="w-1/2 overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Available Segments ({currentSegments.length})
                  </h3>
                  <div className="text-xs text-gray-600 font-medium">
                    {selectedSegmentIds.length} selected
                  </div>
                </div>

                {currentSegments.length > 0 ? (
                  <div className="space-y-3">
                    {currentSegments.map((segment) => (
                      <motion.div
                        key={segment.id}
                        whileHover={{ scale: 1.005 }}
                        className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                          selectedSegmentIds.includes(segment.id)
                            ? "border-gray-900 bg-gray-50"
                            : currentPreview === segment
                              ? "border-gray-400 bg-gray-50/50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                {Math.floor(segment.start_time)}s -{" "}
                                {Math.floor(segment.end_time)}s
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                {segment.theme}
                              </span>
                            </div>
                            <p className="text-gray-900 text-sm leading-relaxed mb-2">
                              "{segment.text}"
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => toggleSegment(segment.id)}
                              className={`w-5 h-5 rounded border transition-all ${
                                selectedSegmentIds.includes(segment.id)
                                  ? "border-gray-900 bg-gray-900"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {selectedSegmentIds.includes(segment.id) && (
                                <Check className="h-3 w-3 text-white m-0.5" />
                              )}
                            </button>
                            <button
                              onClick={() => previewSegment(segment)}
                              className={`p-1.5 rounded transition-all ${
                                currentPreview === segment
                                  ? "text-gray-900 bg-gray-100"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}
                            >
                              <Play className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-6 w-6 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      No Segments Available
                    </h4>
                    <p className="text-xs text-gray-500">
                      This highlight type has no segments for the selected
                      testimonial
                    </p>

                    <button
                      onClick={handleConfirmSelection}
                      className="px-4 py-2 my-6 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Generate {selectedHighlightType} highlights
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentSegments.length > 0 && (
                  <>
                    <button
                      onClick={selectAllSegments}
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                      Select All ({currentSegments.length})
                    </button>
                    <button
                      onClick={() => setSelectedSegmentIds([])}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Selection Info */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  {selectedSegmentIds.length === 0 &&
                    currentSegments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <Info className="h-3 w-3" />
                        All {selectedHighlightType} highlights will be used
                      </div>
                    )}
                  <span className="font-medium text-gray-900">
                    {selectedSegmentIds.length}
                  </span>
                  segments
                  {selectedSegmentIds.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {Math.round(calculateTotalDuration())}s
                    </span>
                  )}
                </div>
                <button
                  onClick={handleConfirmSelection}
                  disabled={!isSelectionValid || currentSegments.length === 0}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Use Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default observer(HighlightSegmentModal);
