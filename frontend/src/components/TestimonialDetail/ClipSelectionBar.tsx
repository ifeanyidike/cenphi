// components/TestimonialDetail/ClipSelectionBar.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Target, X, Clock, Play } from "lucide-react";

interface ClipSelectionBarProps {
  selectedCount: number;
  totalDuration: number;
  onCreateStory: () => void;
  onEnhanceAll: () => void;
  onOptimizeAll: () => void;
  onClearSelection: () => void;
}

const ClipSelectionBar: React.FC<ClipSelectionBarProps> = ({
  selectedCount,
  totalDuration,
  onCreateStory,
  onOptimizeAll,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm">
          {/* Main Content */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Selection Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Video className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {selectedCount} clips selected
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-300 text-gray-600"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.round(totalDuration)}s
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedCount === 1
                      ? "Ready to optimize"
                      : "Ready to create story video"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedCount === 1 ? (
                  <Button
                    onClick={onOptimizeAll}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Optimize Clip
                  </Button>
                ) : (
                  <Button
                    onClick={onCreateStory}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs px-3"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Create Story
                  </Button>
                )}

                <div className="w-px h-6 bg-gray-200"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClipSelectionBar;
