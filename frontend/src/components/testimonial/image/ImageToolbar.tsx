import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Tooltip } from "../UI";
import { ToolType } from "../../../repo/managers/image_editor";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  Crop,
  MagnifyingGlassPlus,
  TextT,
  Pencil,
  SlidersHorizontal,
  Maximize,
  Minimize,
  Cursor,
  Plus,
  Minus,
} from "../UI/icons";
import { workspaceHub } from "@/repo/workspace_hub";

const ImageToolbar: React.FC = observer(() => {
  // Tool button component with improved design and clarity
  const imageEditorManager = workspaceHub.imageEditorManager;

  // Drawing control states
  const [currentDrawingSettings, setCurrentDrawingSettings] = React.useState({
    strokeWidth: 3,
    color: "#FF0000",
  });

  return (
    <>
      {/* Image control overlay with improved tooltips and spacing */}
      <div
        className="absolute top-3 right-3 flex space-x-2"
        style={{ zIndex: 50 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 bg-black bg-opacity-50 backdrop-blur-sm rounded-md text-white hover:bg-opacity-70 transition-all"
          onClick={() => imageEditorManager.toggleFullscreen()}
          title={
            imageEditorManager.isFullscreen ? "Exit Fullscreen" : "Fullscreen"
          }
        >
          {imageEditorManager.isFullscreen ? (
            <Minimize size={18} />
          ) : (
            <Maximize size={18} />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 bg-black bg-opacity-50 backdrop-blur-sm rounded-md text-white hover:bg-opacity-70 transition-all"
          onClick={() => {
            imageEditorManager.resetAdjustments();
            imageEditorManager.applyAdjustments();
          }}
          title="Reset All Adjustments"
        >
          <ArrowCounterClockwise size={18} />
        </motion.button>

        {/* Undo/Redo buttons */}
        <motion.button
          whileHover={{ scale: imageEditorManager.canUndo() ? 1.05 : 1 }}
          whileTap={{ scale: imageEditorManager.canUndo() ? 0.95 : 1 }}
          className={`p-2.5 bg-black bg-opacity-50 backdrop-blur-sm rounded-md text-white transition-all ${!imageEditorManager.canUndo() ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-70"}`}
          onClick={async () => {
            if (imageEditorManager.canUndo()) {
              const success = await imageEditorManager.performUndo();
              if (!success) {
                console.warn("Undo operation failed or was not needed");
              }
            }
          }}
          disabled={!imageEditorManager.canUndo()}
          title="Undo"
        >
          <ArrowCounterClockwise size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: imageEditorManager.canRedo() ? 1.05 : 1 }}
          whileTap={{ scale: imageEditorManager.canRedo() ? 0.95 : 1 }}
          className={`p-2.5 bg-black bg-opacity-50 backdrop-blur-sm rounded-md text-white transition-all ${!imageEditorManager.canRedo() ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-70"}`}
          onClick={async () => {
            if (imageEditorManager.canRedo()) {
              const success = await imageEditorManager.performRedo();
              if (!success) {
                console.warn("Redo operation failed or was not needed");
              }
            }
          }}
          disabled={!imageEditorManager.canRedo()}
          title="Redo"
        >
          <ArrowClockwise size={18} />
        </motion.button>
      </div>

      {/* Redesigned floating tool palette with clear labels */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 backdrop-blur-md rounded-lg shadow-xl px-2 py-2 flex items-center space-x-1 border border-gray-700"
        style={{ zIndex: 50 }}
      >
        <ToolButton tool="select" label="Select" icon={<Cursor size={20} />} />

        <ToolButton
          tool="zoom"
          label="Zoom (Click to zoom in)"
          icon={<MagnifyingGlassPlus size={20} />}
        />

        <ToolButton
          tool="crop"
          label="Crop (Click to select area)"
          icon={<Crop size={20} />}
        />

        <ToolButton
          tool="annotate"
          label="Add Note (Click to place)"
          icon={<TextT size={20} />}
        />

        <ToolButton
          tool="text"
          label="Add Text (Click to place)"
          icon={<TextT size={20} />}
        />

        <ToolButton
          tool="draw"
          label="Draw on Image"
          icon={<Pencil size={20} />}
        />

        <ToolButton
          tool="adjust"
          label="Adjust Image Properties"
          icon={<SlidersHorizontal size={20} />}
        />

        {/* Drawing controls when drawing tool is active */}
        {imageEditorManager.selectedTool === "draw" && (
          <div className="pl-2 ml-2 border-l border-gray-600 flex space-x-2 items-center">
            <Tooltip title="Brush Color">
              <input
                type="color"
                value={currentDrawingSettings.color}
                onChange={(e) =>
                  setCurrentDrawingSettings({
                    ...currentDrawingSettings,
                    color: e.target.value,
                  })
                }
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
            </Tooltip>

            <div className="flex items-center space-x-1">
              <Tooltip title="Decrease Brush Size">
                <button
                  className="p-1 text-white rounded hover:bg-gray-700"
                  onClick={() =>
                    setCurrentDrawingSettings({
                      ...currentDrawingSettings,
                      strokeWidth: Math.max(
                        1,
                        currentDrawingSettings.strokeWidth - 1
                      ),
                    })
                  }
                >
                  <Minus size={12} />
                </button>
              </Tooltip>

              <span className="text-white text-xs">
                {currentDrawingSettings.strokeWidth}px
              </span>

              <Tooltip title="Increase Brush Size">
                <button
                  className="p-1 text-white rounded hover:bg-gray-700"
                  onClick={() =>
                    setCurrentDrawingSettings({
                      ...currentDrawingSettings,
                      strokeWidth: Math.min(
                        20,
                        currentDrawingSettings.strokeWidth + 1
                      ),
                    })
                  }
                >
                  <Plus size={12} />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default ImageToolbar;

const ToolButton = observer(
  ({
    tool,
    label,
    icon,
    onClick,
  }: {
    tool: ToolType;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
  }) => {
    const imageEditorManager = workspaceHub.imageEditorManager;
    // Function to ensure tool switching works correctly
    const switchTool = (tool: ToolType, callback?: () => void) => {
      imageEditorManager.setTool(tool);
      if (callback) callback();
    };

    return (
      <Tooltip title={label} placement="top">
        <button
          className={`relative p-2.5 rounded-md transition-all duration-150 ${
            imageEditorManager.selectedTool === tool
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            switchTool(tool, onClick);
          }}
          aria-label={label}
        >
          {icon}
          <span className="sr-only">{label}</span>
          {imageEditorManager.selectedTool === tool && (
            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
          )}
        </button>
      </Tooltip>
    );
  }
);
