import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";

const AutoRecoveryPrompt: React.FC = observer(() => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    projectId: string;
    timestamp: number;
  } | null>(null);
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;

  useEffect(() => {
    // Check for auto-save data with slight delay to ensure editor is fully initialized
    const timer = setTimeout(() => {
      const autoSaveData = videoEditorManager.checkAutoSave();
      if (autoSaveData) {
        setRecoveryData(autoSaveData);
        setShowPrompt(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [videoEditorManager]);

  const handleRecover = () => {
    const success = videoEditorManager.loadAutoSave();
    if (success) {
      console.log("Successfully recovered auto-saved state");
    } else {
      console.error("Failed to recover auto-saved state");
    }
    setShowPrompt(false);
  };

  const handleDiscard = () => {
    videoEditorManager.clearAutoSave();
    setShowPrompt(false);
  };

  if (!showPrompt || !recoveryData) return null;

  const formattedTime = new Date(recoveryData.timestamp).toLocaleString();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 w-80 p-4 rounded-lg shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Recover Unsaved Changes?</h3>
          <p className="text-sm mt-1 opacity-80">
            We found unsaved changes from your previous editing session.
          </p>
          <p className="text-xs mt-2 opacity-70">Last saved: {formattedTime}</p>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            onClick={handleDiscard}
          >
            Discard
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            onClick={handleRecover}
          >
            Recover
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default AutoRecoveryPrompt;
