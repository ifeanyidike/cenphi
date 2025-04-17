import React from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { Button, Badge, Slider } from "../../UI";
import {
  ArrowCounterClockwise,
  Maximize,
  Minimize,
  Plus,
  Minus,
  RotateLeft,
  RotateRight,
} from "../../UI/icons";
import { workspaceHub } from "@/repo/workspace_hub";

interface ZoomPanelProps {
  panelVariants: any;
  isDarkMode: boolean;
}

const ZoomPanel: React.FC<ZoomPanelProps> = observer(
  ({ panelVariants, isDarkMode }) => {
    const imageEditorManager = workspaceHub.imageEditorManager;
    // Handle auto-save when making adjustments
    const debouncedSave = React.useRef<number | null>(null);

    const saveChanges = () => {
      if (debouncedSave.current) {
        clearTimeout(debouncedSave.current);
      }
      debouncedSave.current = window.setTimeout(() => {
        imageEditorManager.applyAdjustments();
      }, 500);
    };

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
            Zoom & Rotation Controls
          </h3>

          <Badge variant="soft" color="info" size="sm">
            {Math.round(imageEditorManager.zoom)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Zoom Level
            </label>
            <div className="flex items-center">
              <button
                className={`p-2 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
                onClick={() => {
                  const newZoom = Math.max(50, imageEditorManager.zoom - 10);
                  imageEditorManager.applyQuickAdjustment("zoom", newZoom);
                  saveChanges();
                }}
                aria-label="Zoom out"
              >
                <Minus size={18} />
              </button>

              <Slider
                min={50}
                max={300}
                step={10}
                value={imageEditorManager.zoom}
                onChange={(val: number) =>
                  imageEditorManager.applyQuickAdjustment("zoom", val)
                }
                onChangeEnd={saveChanges}
                className="mx-2 flex-grow"
              />

              <button
                className={`p-2 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
                onClick={() => {
                  const newZoom = Math.min(300, imageEditorManager.zoom + 10);
                  imageEditorManager.applyQuickAdjustment("zoom", newZoom);
                  saveChanges();
                }}
                aria-label="Zoom in"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("zoom", 100);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                100%
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("zoom", 150);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                150%
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("zoom", 200);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                200%
              </Button>
            </div>
          </div>

          <div className="bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Rotation: {imageEditorManager.rotation}°
            </label>
            <div className="flex items-center">
              <button
                className={`p-2 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
                onClick={() => {
                  const newRotation = (imageEditorManager.rotation - 90) % 360;
                  imageEditorManager.applyQuickAdjustment(
                    "rotation",
                    newRotation
                  );
                  saveChanges();
                }}
                aria-label="Rotate left"
              >
                <RotateLeft size={18} />
              </button>

              <Slider
                min={-180}
                max={180}
                step={5}
                value={imageEditorManager.rotation}
                onChange={(val: number) =>
                  imageEditorManager.applyQuickAdjustment("rotation", val)
                }
                onChangeEnd={saveChanges}
                className="mx-2 flex-grow"
              />

              <button
                className={`p-2 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
                onClick={() => {
                  const newRotation = (imageEditorManager.rotation + 90) % 360;
                  imageEditorManager.applyQuickAdjustment(
                    "rotation",
                    newRotation
                  );
                  saveChanges();
                }}
                aria-label="Rotate right"
              >
                <RotateRight size={18} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("rotation", 0);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                0°
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("rotation", 90);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                90°
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("rotation", 180);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                180°
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment("rotation", 270);
                  saveChanges();
                }}
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                270°
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center justify-center ${isDarkMode ? "border-slate-700 text-slate-300" : ""}`}
            onClick={() => {
              imageEditorManager.applyQuickAdjustment("zoom", 100);
              imageEditorManager.applyQuickAdjustment("rotation", 0);
              saveChanges();
            }}
            icon={<ArrowCounterClockwise size={14} />}
          >
            Reset View
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`flex items-center justify-center ${isDarkMode ? "border-slate-700 text-slate-300" : ""}`}
            onClick={() => imageEditorManager.toggleFullscreen()}
            icon={
              imageEditorManager.isFullscreen ? (
                <Minimize size={14} />
              ) : (
                <Maximize size={14} />
              )
            }
          >
            {imageEditorManager.isFullscreen
              ? "Exit Fullscreen"
              : "Fullscreen Mode"}
          </Button>
        </div>
      </motion.div>
    );
  }
);

export default ZoomPanel;
