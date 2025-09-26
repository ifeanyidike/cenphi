// components/TestimonialDetail/ClipSelectionBar.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles, Target, X, Clock, Play } from "lucide-react";

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
  // onEnhanceAll,
  // onOptimizeAll,
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
                    Ready for batch processing
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onCreateStory}
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs px-3"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Create Story
                </Button>

                {/* Enhanced Enhance Button with Coming Soon */}
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-200 text-gray-600 cursor-not-allowed text-xs px-3 relative overflow-hidden"
                  >
                    <Sparkles className="h-3 w-3 mr-1 opacity-50" />
                    Enhance
                    <div className="absolute top-0 right-0 -mr-1 -mt-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200 font-medium"
                      >
                        Soon
                      </Badge>
                    </div>
                  </Button>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Bulk enhancement coming soon!
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {/* Enhanced Optimize Button with Coming Soon */}
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-gray-200 text-gray-600 cursor-not-allowed text-xs px-3 relative overflow-hidden"
                  >
                    <Target className="h-3 w-3 mr-1 opacity-50" />
                    Optimize
                    <div className="absolute top-0 right-0 -mr-1 -mt-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-4 bg-purple-100 text-purple-700 border-purple-200 font-medium"
                      >
                        Soon
                      </Badge>
                    </div>
                  </Button>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Bulk optimization coming soon!
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

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
