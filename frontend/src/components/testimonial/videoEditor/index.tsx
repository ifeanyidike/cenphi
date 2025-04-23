import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import VideoEditor from "./VideoEditor";
import { initializeVideoEditor } from "../../../utils/initialize";
import PerformanceOptimizer from "./PerformanceOptimizer";
import { Testimonial } from "@/types/testimonial";

// Initialize the video editor and its dependencies
initializeVideoEditor();

interface VideoEditorWrapperProps {
  testimonial: Testimonial;
  onClose: () => void;
  onSave: (testimonial: Testimonial) => void;
}

const VideoEditorWrapper: React.FC<VideoEditorWrapperProps> = observer(
  ({ testimonial, onClose, onSave }) => {
    // Detect environment capabilities on component mount
    useEffect(() => {
      console.log("Video Editor Wrapper mounted");

      // Additional setup if needed

      // Cleanup on unmount
      return () => {
        console.log("Video Editor Wrapper unmounted");
        // Ensure all resources are properly released
        if (typeof window !== "undefined" && window.canvasCoordinator) {
          window.canvasCoordinator.stopRendering();
        }

        // Clear any transform caches
        if (workspaceHub.videoEditorManager) {
          workspaceHub.videoEditorManager.stopCanvasRendering();
        }
      };
    }, []);

    return (
      <>
        <AnimatePresence>
          <VideoEditor
            testimonial={testimonial}
            onClose={onClose}
            onSave={onSave}
          />
        </AnimatePresence>

        {/* Add performance optimizer */}
        <PerformanceOptimizer />
      </>
    );
  }
);

export default VideoEditorWrapper;
