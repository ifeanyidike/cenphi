import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import { Button } from "../UI";
import { Note, SlidersHorizontal, MagnifyingGlassPlus } from "../UI/icons";

// Import subcomponents
import ImageHeader from "./ImageHeader";
import ImageCanvas from "./ImageCanvas";
import ImageToolbar from "./ImageToolbar";
import EditingPanel from "./panels/EditingPanel";
import ZoomPanel from "./panels/ZoomPanel";
import ExtractionPanel from "./panels/ExtractionPanel";
import ImageFooter from "./ImageFooter";
import QuickTips from "./QuickTips";

// Animations
import { containerVariants, itemVariants, panelVariants } from "./animations";
import { Testimonial } from "@/types/testimonial";

// Defining our types
interface ImageTestimonialProps {
  testimonial: Testimonial;
}

const ImageTestimonial: React.FC<ImageTestimonialProps> = observer(
  ({ testimonial }) => {
    const { uiManager, imageEditorManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // Panel states
    const [activePanel, setActivePanel] = React.useState<string | null>(null);

    // Initialize the editor with the testimonial image
    useEffect(() => {
      if (testimonial.format === "image") {
        imageEditorManager.loadImage(testimonial.media_url!);
      }
    }, [testimonial]);

    // Panel toggling
    const togglePanel = (panel: string) => {
      if (activePanel === panel) {
        setActivePanel(null);
      } else {
        setActivePanel(panel);

        if (
          panel === "extraction" &&
          !imageEditorManager.extractedText &&
          !imageEditorManager.extractingText
        ) {
          imageEditorManager.extractText();
        }
      }
    };

    if (testimonial.format !== "image") {
      return <div>Invalid testimonial type</div>;
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`rounded-xl overflow-hidden ${isDarkMode ? "text-white" : "text-slate-900"}`}
      >
        {/* Header with title and metadata */}
        <ImageHeader testimonial={testimonial} />

        {/* Main action buttons - streamlined with clear icons */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={activePanel === "extraction" ? "primary" : "outline"}
              size="xs"
              icon={<Note size={14} />}
              onClick={() => togglePanel("extraction")}
              className={
                activePanel !== "extraction" && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Extract Text
            </Button>

            <Button
              variant={activePanel === "editing" ? "primary" : "outline"}
              size="xs"
              icon={<SlidersHorizontal size={14} />}
              onClick={() => togglePanel("editing")}
              className={
                activePanel !== "editing" && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Edit Image
            </Button>

            <Button
              variant={activePanel === "zoom" ? "primary" : "outline"}
              size="xs"
              icon={<MagnifyingGlassPlus size={14} />}
              onClick={() => togglePanel("zoom")}
              className={
                activePanel !== "zoom" && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Zoom & Pan
            </Button>
          </div>
        </div>

        {/* Main image display */}
        <motion.div
          variants={itemVariants}
          className={`relative rounded-lg overflow-hidden ${
            isDarkMode
              ? "bg-slate-900 border border-slate-700"
              : "bg-white border border-slate-200"
          } ${imageEditorManager.isFullscreen ? "fixed inset-0 z-50 p-4" : ""}`}
        >
          {/* The canvas with the image and all overlays */}
          <ImageCanvas
            imageUrl={testimonial.media_url!}
            containerRef={containerRef}
            alt={"Testimonial image"}
          />

          {/* Toolbar at the bottom of the image */}
          <ImageToolbar />
        </motion.div>

        {/* Editing panel - with improved controls and layout */}
        {activePanel === "editing" && (
          <EditingPanel panelVariants={panelVariants} isDarkMode={isDarkMode} />
        )}

        {/* Zoom panel with improved controls */}
        {activePanel === "zoom" && (
          <ZoomPanel panelVariants={panelVariants} isDarkMode={isDarkMode} />
        )}

        {/* Text extraction panel with improved visualization */}
        {activePanel === "extraction" && (
          <ExtractionPanel
            panelVariants={panelVariants}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Footer stats with improved layout and actionable buttons */}
        <ImageFooter
          itemVariants={itemVariants}
          testimonial={testimonial}
          isDarkMode={isDarkMode}
        />

        {/* Help tooltip for new users */}
        <QuickTips isDarkMode={isDarkMode} />
      </motion.div>
    );
  }
);

export default ImageTestimonial;
