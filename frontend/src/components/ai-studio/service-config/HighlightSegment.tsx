// components/ai-studio/service-config/HighlightSegment.tsx
import { Brain, Eye, X, Zap } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Segment } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

type Props = {
  setHighlightPreviewModal: Dispatch<SetStateAction<boolean>>;
  selectedSegments: Record<string, Segment[]>[];
  clearSegments: () => void;
};

const HighlightSegment = ({
  setHighlightPreviewModal,
  selectedSegments,
  clearSegments,
}: Props) => {
  // Calculate total segments across all highlight types
  const totalSegments = selectedSegments?.reduce((total, highlightRecord) => {
    return (
      total +
      Object.values(highlightRecord).reduce((subtotal, segments) => {
        return subtotal + (segments ? segments.length : 0);
      }, 0)
    );
  }, 0);

  // Get the primary highlight type that has segments
  const getPrimaryHighlightInfo = () => {
    for (const highlightRecord of selectedSegments) {
      for (const [highlightType, segments] of Object.entries(highlightRecord)) {
        if (segments && segments.length > 0) {
          return {
            type: highlightType,
            count: segments.length,
          };
        }
      }
    }
    return null;
  };

  const primaryInfo = totalSegments > 0 ? getPrimaryHighlightInfo() : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                AI-Powered Segment Selection
              </h3>
              <p className="text-xs text-gray-500">
                Preview and select the most impactful moments from your
                testimonials
              </p>
            </div>
          </div>
          <button
            onClick={() => setHighlightPreviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4" />
            Preview & Select
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {totalSegments > 0 ? (
          <div className="space-y-4">
            {/* Selected Segments Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <span className="text-sm text-gray-900 font-medium">
                    {totalSegments} segment{totalSegments > 1 ? "s" : ""}
                  </span>
                  <span className="text-sm text-gray-500">
                    selected from {primaryInfo?.type?.replace("_", " ")}{" "}
                    highlights
                  </span>
                </div>
                <button
                  onClick={() => clearSegments()}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>

            {/* Breakdown by Highlight Type */}
            <div className="space-y-2">
              {selectedSegments.map((highlightRecord, recordIndex) => (
                <div key={recordIndex}>
                  {Object.entries(highlightRecord).map(
                    ([highlightType, segments]) => {
                      if (!segments || segments.length === 0) return null;

                      const segmentCount = segments.length;
                      const totalDuration = segments.reduce(
                        (total, segment) => {
                          return (
                            total + (segment.end_time - segment.start_time)
                          );
                        },
                        0
                      );

                      return (
                        <div
                          key={highlightType}
                          className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                              <Zap className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {highlightType.replace("_", " ")} Highlights
                              </span>
                              <div className="text-xs text-gray-500">
                                {segmentCount} segment
                                {segmentCount > 1 ? "s" : ""} selected
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {totalDuration.toFixed(1)}s total
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Brain className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              No Segments Selected
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Use the preview to identify and select key moments
            </p>
            <button
              onClick={() => setHighlightPreviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Eye className="h-4 w-4" />
              Start Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(HighlightSegment);
