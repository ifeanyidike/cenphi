import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import AudioEditor from "./AudioEditor";
import { initializeAudioEditor } from "../../../utils/initialize";
import PerformanceOptimizer from "./PerformanceOptimizer";
import { Testimonial } from "@/types/testimonial";

interface AudioEditorWrapperProps {
  testimonial: Testimonial;
  onClose: () => void;
  onSave: (testimonial: Testimonial) => void;
}

const AudioEditorWrapper: React.FC<AudioEditorWrapperProps> = observer(
  ({ testimonial, onClose, onSave }) => {
    const [, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize the audio editor when component mounts
    useEffect(() => {
      let isMounted = true;

      async function initialize() {
        try {
          console.log("Initializing audio editor...");
          setIsLoading(true);

          // Initialize dependencies asynchronously
          await initializeAudioEditor();

          // Only update state if component is still mounted
          if (isMounted) {
            setIsInitialized(true);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Failed to initialize audio editor:", error);
          if (isMounted) {
            setInitError(
              error instanceof Error
                ? error.message
                : "Unknown initialization error"
            );
            setIsLoading(false);
          }
        }
      }

      initialize();

      // Cleanup function
      return () => {
        isMounted = false;

        console.log("Audio Editor Wrapper unmounting");

        // Ensure all resources are properly released
        if (workspaceHub.audioEditorManager) {
          workspaceHub.audioEditorManager.cleanup();
        }
      };
    }, []);

    // Error state rendering
    if (initError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-white">
              Audio Editor Error
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              {initError}
            </p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Loading state rendering
    if (isLoading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
            </div>
            <p className="mt-4 text-white text-lg font-medium">
              Loading Audio Editor...
            </p>
          </div>
        </div>
      );
    }

    // All initialized and ready to go - render the editor
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AudioEditor
              testimonial={testimonial}
              onClose={onClose}
              onSave={onSave}
            />
          </motion.div>
        </AnimatePresence>

        {/* Performance optimizer runs silently in the background */}
        <PerformanceOptimizer />
      </>
    );
  }
);

export default AudioEditorWrapper;
