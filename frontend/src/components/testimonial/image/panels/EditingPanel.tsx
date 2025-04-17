import React from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { Button, Slider } from "../../UI";
import { ArrowCounterClockwise, Check } from "../../UI/icons";
import { ToolType } from "../../../../repo/managers/image_editor";
import { workspaceHub } from "@/repo/workspace_hub";

interface EditingPanelProps {
  panelVariants: any;
  isDarkMode: boolean;
}

const EditingPanel: React.FC<EditingPanelProps> = observer(
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
        <div className="flex justify-between items-center mb-5">
          <h3
            className={`font-medium text-base ${isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            Image Adjustments
          </h3>

          <div className="flex gap-2">
            {["annotate", "draw", "crop", "text"].map((tool) => (
              <Button
                key={tool}
                variant={
                  imageEditorManager.selectedTool === (tool as ToolType)
                    ? "primary"
                    : "outline"
                }
                size="xs"
                onClick={() => imageEditorManager.setTool(tool as ToolType)}
                className={`px-3 ${
                  imageEditorManager.selectedTool !== (tool as ToolType) &&
                  isDarkMode
                    ? "border-slate-700 text-slate-300"
                    : ""
                }`}
              >
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Brightness: {imageEditorManager.brightness}%
            </label>
            <Slider
              min={50}
              max={150}
              value={imageEditorManager.brightness}
              onChange={(val: number) =>
                imageEditorManager.applyQuickAdjustment("brightness", val)
              }
              onChangeEnd={saveChanges}
              className="w-full"
            />
          </div>

          <div className="bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Contrast: {imageEditorManager.contrast}%
            </label>
            <Slider
              min={50}
              max={150}
              value={imageEditorManager.contrast}
              onChange={(val: number) =>
                imageEditorManager.applyQuickAdjustment("contrast", val)
              }
              onChangeEnd={saveChanges}
              className="w-full"
            />
          </div>

          <div className="bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Saturation: {imageEditorManager.saturation}%
            </label>
            <Slider
              min={0}
              max={200}
              value={imageEditorManager.saturation}
              onChange={(val: number) =>
                imageEditorManager.applyQuickAdjustment("saturation", val)
              }
              onChangeEnd={saveChanges}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-5 bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 rounded-lg p-4">
          <label
            className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            Image Filters
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { name: "none", label: "Original" },
              { name: "grayscale", label: "Grayscale" },
              { name: "sepia", label: "Sepia" },
              { name: "invert", label: "Invert" },
              { name: "hue-rotate(90deg)", label: "Cool" },
              { name: "hue-rotate(180deg)", label: "Warm" },
            ].map((filterOption) => (
              <button
                key={filterOption.name}
                onClick={() => {
                  imageEditorManager.applyQuickAdjustment(
                    "filter",
                    filterOption.name
                  );
                  saveChanges();
                }}
                className={`py-2 px-3 text-sm font-medium rounded-lg flex flex-col items-center justify-center h-20 transition-all ${
                  imageEditorManager.filter === filterOption.name
                    ? isDarkMode
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-blue-50 text-blue-800 border-2 border-blue-300 shadow"
                    : isDarkMode
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-300 to-purple-300 mb-2"></div>
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              imageEditorManager.resetAdjustments();
              saveChanges();
            }}
            className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
            icon={<ArrowCounterClockwise size={14} />}
          >
            Reset All Adjustments
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => imageEditorManager.applyAdjustments()}
            icon={<Check size={14} />}
          >
            Apply Changes
          </Button>
        </div>
      </motion.div>
    );
  }
);

export default EditingPanel;
