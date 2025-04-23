import React from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { Button, Badge } from "../../UI";
import { Edit, Share, Note } from "../../UI/icons";
import { workspaceHub } from "@/repo/workspace_hub";

interface ExtractionPanelProps {
  panelVariants: any;
  isDarkMode: boolean;
}

const ExtractionPanel: React.FC<ExtractionPanelProps> = observer(
  ({ panelVariants, isDarkMode }) => {
    const imageEditorManager = workspaceHub.imageEditorManager;

    return (
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={`p-5 border-t ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`font-medium text-base ${isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            Text Recognition Results
          </h3>

          <Badge
            variant="soft"
            color={imageEditorManager.extractedText ? "success" : "warning"}
            size="sm"
          >
            {imageEditorManager.extractedText
              ? "Text Extracted"
              : imageEditorManager.extractingText
                ? "Processing..."
                : "Ready"}
          </Badge>
        </div>

        {imageEditorManager.extractingText ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin h-12 w-12 text-blue-500 mb-4">
              <svg
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p
              className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              Analyzing image and extracting text...
            </p>
            <p className="text-xs text-slate-400 mt-2">
              This may take a few moments depending on image complexity
            </p>
          </div>
        ) : imageEditorManager.extractedText ? (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-lg mb-4 ${
                isDarkMode ? "bg-slate-700" : "bg-slate-50"
              }`}
            >
              <p
                className={`text-base ${isDarkMode ? "text-white" : "text-slate-700"}`}
              >
                {imageEditorManager.extractedText}
              </p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={14} />}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
                onClick={() => {
                  // Create text overlay with extracted text
                  imageEditorManager.addTextOverlay(
                    50, // center x
                    50, // center y
                    imageEditorManager.extractedText || ""
                  );
                  imageEditorManager.applyTextOverlays();

                  // Switch to edit mode
                  imageEditorManager.setTool("text");
                }}
              >
                Add as Text Overlay
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<Share size={14} />}
                onClick={() => {
                  navigator.clipboard.writeText(
                    imageEditorManager.extractedText || ""
                  );
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-full">
              <Note size={24} className="text-blue-500" />
            </div>
            <p
              className={`text-sm mb-4 text-center max-w-md ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              Extract text content from your image using optical character
              recognition technology
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => imageEditorManager.extractText()}
            >
              Start Text Extraction
            </Button>
          </div>
        )}
      </motion.div>
    );
  }
);

export default ExtractionPanel;
