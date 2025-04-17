import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { runInAction } from "mobx";

const HistoryPanel = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const { editHistory, historyIndex, undo, redo } = videoEditorManager;

  // Maximum number of history items to show
  const [maxVisibleItems, setMaxVisibleItems] = useState(10);

  // Calculate the range of history items to show
  const startIndex = Math.max(
    0,
    historyIndex - Math.floor(maxVisibleItems / 2)
  );
  const endIndex = Math.min(
    editHistory.length - 1,
    startIndex + maxVisibleItems - 1
  );

  const visibleHistory = editHistory.slice(
    Math.max(0, startIndex),
    Math.min(editHistory.length, endIndex + 1)
  );

  // Adjust max visible items based on available space
  useEffect(() => {
    const updateMaxItems = () => {
      const height = window.innerHeight;
      setMaxVisibleItems(Math.floor((height - 200) / 56)); // 56px per item + padding
    };

    updateMaxItems();
    window.addEventListener("resize", updateMaxItems);

    return () => {
      window.removeEventListener("resize", updateMaxItems);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed right-0 top-0 w-80 h-full z-40 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      } shadow-xl border-l ${
        isDarkMode ? "border-gray-800" : "border-gray-200"
      } overflow-hidden`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Edit History</h2>
        <button
          onClick={() =>
            runInAction(() => (videoEditorManager.activeEditMode = null))
          }
          className={`p-1 rounded-full ${
            isDarkMode
              ? "hover:bg-gray-800 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-4">
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              historyIndex > 0
                ? isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                : isDarkMode
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Undo
            </div>
          </button>

          <button
            className={`px-3 py-1.5 rounded text-sm ${
              historyIndex < editHistory.length - 1
                ? isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                : isDarkMode
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
          >
            <div className="flex items-center">
              Redo
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </button>
        </div>

        <div className="text-sm mb-2">
          <div className="flex justify-between">
            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Total Steps:
            </span>
            <span className="font-medium">{editHistory.length}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Current Position:
            </span>
            <span className="font-medium">
              {historyIndex + 1} of {editHistory.length}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {visibleHistory.map((historyItem, i) => {
            const actualIndex = startIndex + i;
            const timestamp = historyItem.timestamp
              ? new Date(historyItem.timestamp).toLocaleTimeString()
              : null;

            // Determine what changed in this history item
            let changedFeatures = [];
            if (actualIndex > 0) {
              const prevItem = editHistory[actualIndex - 1];
              if (prevItem.aspectRatio !== historyItem.aspectRatio)
                changedFeatures.push("Aspect Ratio");
              if (
                JSON.stringify(prevItem.crop) !==
                JSON.stringify(historyItem.crop)
              )
                changedFeatures.push("Crop");
              if (
                JSON.stringify(prevItem.trim) !==
                JSON.stringify(historyItem.trim)
              )
                changedFeatures.push("Trim");
              if (
                JSON.stringify(prevItem.transform) !==
                JSON.stringify(historyItem.transform)
              )
                changedFeatures.push("Transform");
              if (
                JSON.stringify(prevItem.videoFilters) !==
                JSON.stringify(historyItem.videoFilters)
              )
                changedFeatures.push("Filters");
              if (prevItem.subtitles.length !== historyItem.subtitles.length)
                changedFeatures.push("Subtitles");

              // If actionType is available, use that
              if (historyItem.actionType) {
                changedFeatures = [
                  historyItem.actionType.charAt(0).toUpperCase() +
                    historyItem.actionType.slice(1),
                ];
              }
            } else {
              changedFeatures.push("Initial State");
            }

            return (
              <motion.div
                key={actualIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-md border ${
                  actualIndex === historyIndex
                    ? isDarkMode
                      ? "bg-blue-900/30 border-blue-700"
                      : "bg-blue-50 border-blue-300"
                    : isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                } cursor-pointer transition-colors duration-150`}
                onClick={() => {
                  if (actualIndex < historyIndex) {
                    // Need to undo multiple times
                    for (let j = 0; j < historyIndex - actualIndex; j++) {
                      videoEditorManager.undo();
                    }
                  } else if (actualIndex > historyIndex) {
                    // Need to redo multiple times
                    for (let j = 0; j < actualIndex - historyIndex; j++) {
                      videoEditorManager.redo();
                    }
                  }
                }}
              >
                <div className="flex justify-between">
                  <div className="font-medium">Edit {actualIndex + 1}</div>
                  {timestamp && (
                    <div
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {timestamp}
                    </div>
                  )}
                </div>
                <div className="text-xs mt-1">{changedFeatures.join(", ")}</div>
              </motion.div>
            );
          })}
        </div>

        {editHistory.length > maxVisibleItems && (
          <div className="mt-2 text-center text-xs opacity-70">
            {editHistory.length - visibleHistory.length} more items...
          </div>
        )}

        <div className="mt-4 text-xs text-center">
          <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Shortcuts: <span className="font-mono">Ctrl+Z</span> (Undo) ·{" "}
            <span className="font-mono">Ctrl+Y</span> (Redo)
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default HistoryPanel;
