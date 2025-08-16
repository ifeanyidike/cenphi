// components/ai-studio/service-config/HighlightSegment.tsx
import { Brain, Eye } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type Props = {
  setHighlightPreviewModal: Dispatch<SetStateAction<boolean>>;
  selectedSegments: string[];
  setSelectedSegments: Dispatch<SetStateAction<string[]>>;
};
const HighlightSegment = ({
  setHighlightPreviewModal,
  selectedSegments,
  setSelectedSegments,
}: Props) => {
  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl p-4 border border-indigo-50 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                AI-Powered Segment Selection
              </h3>
              <p className="text-sm text-gray-600">
                Preview and select the most impactful moments from your
                testimonials
              </p>
            </div>
          </div>
          <button
            onClick={() => setHighlightPreviewModal(true)}
            className="flex text-sm items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Eye className="h-5 w-5" />
            Preview & Select Segments
          </button>
        </div>

        {selectedSegments.length > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-indigo-600">
                  {selectedSegments.length} segments
                </span>{" "}
                selected for processing
              </div>
              <button
                onClick={() => setSelectedSegments([])}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightSegment;
