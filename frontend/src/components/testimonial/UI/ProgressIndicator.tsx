import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";

interface ProcessingIndicatorProps {
  inline?: boolean;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = observer(
  ({ inline = false }) => {
    const { videoEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const { isProcessing, processingStatus, processingProgress } =
      videoEditorManager;

    if (!isProcessing) return null;

    if (inline) {
      return (
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
            isDarkMode
              ? "bg-gray-800 text-white border border-gray-700"
              : "bg-white text-gray-800 border border-gray-200 shadow-sm"
          }`}
        >
          <div className="w-4 h-4 relative flex-shrink-0">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-50"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-t-2 border-blue-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <span className="text-sm font-medium">
            {processingStatus || "Processing..."}
          </span>

          {processingProgress > 0 && (
            <span className="text-xs">{Math.round(processingProgress)}%</span>
          )}
        </div>
      );
    }

    return (
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-20 h-20 mb-6">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-blue-500/30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-t-4 border-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              {processingStatus || "Processing Video..."}
            </h3>

            {processingProgress > 0 && (
              <div className="w-64 mt-4">
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-300 mt-2">
                  {Math.round(processingProgress)}%
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default ProcessingIndicator;
