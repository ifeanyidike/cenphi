import React, { useState, useEffect, useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { AspectRatio, VideoCrop } from "../../../../repo/managers/video_editor";
import { debounce } from "lodash";
import { aspectRatioHandler } from "../../../../services/aspect-ratio-handler";

type CropPreset = {
  id: string;
  name: string;
  icon: React.ReactNode;
  crop: VideoCrop;
};

const CropPanel: React.FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    crop,
    setCrop,
    aspectRatio,
    setAspectRatio,
    customAspectRatio,
    setCustomAspectRatio,
    videoWidth,
    videoHeight,
    previewEdit,
    applyEdit,
    originalAspectRatio,
    hasPendingChanges,
  } = videoEditorManager;

  // State management
  const [customWidth, setCustomWidth] = useState<string>(
    customAspectRatio.width.toString()
  );
  const [customHeight, setCustomHeight] = useState<string>(
    customAspectRatio.height.toString()
  );
  const [showCustomRatio, setShowCustomRatio] = useState<boolean>(
    aspectRatio === "custom"
  );
  const [, setCropPreview] = useState<string | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(
    aspectRatio !== "original"
  );
  const [, setInteractionInProgress] = useState<boolean>(false);

  // Refs
  const cropInteractionTimeoutRef = useRef<number | null>(null);

  // Create debounced preview function for better performance
  const debouncedPreview = useCallback(
    debounce(async () => {
      try {
        // This uses canvas-based instant preview
        await previewEdit("crop");
      } catch (error) {
        console.error("Failed to preview crop:", error);
      }
    }, 100), // 100ms debounce
    [previewEdit]
  );

  // Initialize component - ensure crop settings are consistent with aspect ratio
  useEffect(() => {
    if (aspectRatio !== "original" && aspectRatio !== "custom") {
      validateAndAdjustCrop();
    }

    // Enable apply button when there are pending changes
    const checkPendingChanges = () => {
      return hasPendingChanges("crop");
    };

    // Start interaction tracking
    setInteractionInProgress(checkPendingChanges());
  }, []);

  // Reset crop to full frame
  const resetCrop = useCallback(() => {
    setInteractionStarted();

    // Reset to full frame crop
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setCropPreview(null);

    // If aspect ratio is locked, also reset to original
    if (aspectRatioLocked) {
      setAspectRatio("original");
    }

    // Run preview with slight delay
    setTimeout(() => {
      debouncedPreview();
      setInteractionEnded();
    }, 50);
  }, [setCrop, aspectRatioLocked, setAspectRatio, debouncedPreview]);

  // Generate preview when crop changes
  useEffect(() => {
    if (
      crop.x !== 0 ||
      crop.y !== 0 ||
      crop.width !== 100 ||
      crop.height !== 100
    ) {
      debouncedPreview();
    } else {
      setCropPreview(null);
    }
  }, [crop, debouncedPreview]);

  // Helper to start interaction tracking
  const setInteractionStarted = useCallback(() => {
    setInteractionInProgress(true);

    // Inform canvas coordinator about interaction
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.setInteracting?.(true);
    }

    // Clear any existing timeout
    if (cropInteractionTimeoutRef.current) {
      clearTimeout(cropInteractionTimeoutRef.current);
      cropInteractionTimeoutRef.current = null;
    }
  }, []);

  // Helper to end interaction tracking
  const setInteractionEnded = useCallback(() => {
    // Use a timeout to avoid too many state updates
    if (cropInteractionTimeoutRef.current) {
      clearTimeout(cropInteractionTimeoutRef.current);
    }

    cropInteractionTimeoutRef.current = window.setTimeout(() => {
      setInteractionInProgress(false);

      // Inform canvas coordinator interaction is done
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.setInteracting?.(false);
      }

      cropInteractionTimeoutRef.current = null;
    }, 500);
  }, []);

  // Apply actual crop changes using FFmpeg
  const applyChanges = async () => {
    setIsApplyingChanges(true);

    try {
      // First ensure preview is up to date
      await previewEdit("crop");

      // Then do the actual processing
      const result = await applyEdit("crop");

      if (result) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error("Error applying crop:", error);
    } finally {
      setIsApplyingChanges(false);
    }
  };

  // Validate and adjust crop to maintain aspect ratio constraints
  const validateAndAdjustCrop = useCallback(() => {
    if (aspectRatio === "original") return;

    // let targetRatio: number;

    // // Get the correct aspect ratio value
    // switch (aspectRatio) {
    //   case "16:9":
    //     targetRatio = 16 / 9;
    //     break;
    //   case "4:3":
    //     targetRatio = 4 / 3;
    //     break;
    //   case "1:1":
    //     targetRatio = 1;
    //     break;
    //   case "9:16":
    //     targetRatio = 9 / 16;
    //     break;
    //   case "custom":
    //     targetRatio = customAspectRatio.width / customAspectRatio.height;
    //     break;
    //   default:
    //     return; // Don't adjust
    // }

    // Use the aspect ratio handler to calculate the proper crop
    const newCrop = aspectRatioHandler.changeAspectRatio(
      crop,
      aspectRatio,
      originalAspectRatio,
      aspectRatio === "custom" ? customAspectRatio : undefined
    );

    // Apply the new crop if it's different
    if (
      newCrop.x !== crop.x ||
      newCrop.y !== crop.y ||
      newCrop.width !== crop.width ||
      newCrop.height !== crop.height
    ) {
      setCrop(newCrop);
    }
  }, [aspectRatio, crop, originalAspectRatio, customAspectRatio, setCrop]);

  // Watch for aspect ratio changes
  useEffect(() => {
    setInteractionStarted();

    if (aspectRatio === "custom") {
      setShowCustomRatio(true);
      setAspectRatioLocked(true);
    } else {
      setShowCustomRatio(false);
      setAspectRatioLocked(aspectRatio !== "original");

      if (aspectRatio !== "original") {
        validateAndAdjustCrop();
      }
    }

    setInteractionEnded();
  }, [
    aspectRatio,
    validateAndAdjustCrop,
    setInteractionStarted,
    setInteractionEnded,
  ]);

  // Change aspect ratio with proper crop adjustment
  const changeAspectRatio = useCallback(
    (ratio: AspectRatio) => {
      setInteractionStarted();

      setAspectRatio(ratio);
      setShowAspectRatios(false);

      // Set the aspect ratio lock state
      setAspectRatioLocked(ratio !== "original");

      // Run preview with slight delay
      setTimeout(() => {
        debouncedPreview();
        setInteractionEnded();
      }, 50);
    },
    [
      setAspectRatio,
      debouncedPreview,
      setInteractionStarted,
      setInteractionEnded,
    ]
  );

  // Apply custom aspect ratio
  const applyCustomRatio = useCallback(() => {
    setInteractionStarted();

    const width = parseInt(customWidth);
    const height = parseInt(customHeight);

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      setCustomAspectRatio(width, height);
      setAspectRatio("custom");

      // Apply the custom ratio to the crop after a short delay
      setTimeout(() => {
        validateAndAdjustCrop();
        debouncedPreview();
        setInteractionEnded();
      }, 50);
    } else {
      setInteractionEnded();
    }
  }, [
    customWidth,
    customHeight,
    setCustomAspectRatio,
    setAspectRatio,
    validateAndAdjustCrop,
    debouncedPreview,
    setInteractionStarted,
    setInteractionEnded,
  ]);

  // Crop presets with visual thumbnails
  const cropPresets: CropPreset[] = [
    {
      id: "left-half",
      name: "Left Half",
      icon: (
        <div className="w-full h-full flex">
          <div className="w-1/2 h-full bg-blue-500 bg-opacity-50"></div>
          <div className="w-1/2 h-full bg-gray-400 bg-opacity-20"></div>
        </div>
      ),
      crop: { x: 0, y: 0, width: 50, height: 100 },
    },
    {
      id: "right-half",
      name: "Right Half",
      icon: (
        <div className="w-full h-full flex">
          <div className="w-1/2 h-full bg-gray-400 bg-opacity-20"></div>
          <div className="w-1/2 h-full bg-blue-500 bg-opacity-50"></div>
        </div>
      ),
      crop: { x: 50, y: 0, width: 50, height: 100 },
    },
    {
      id: "top-half",
      name: "Top Half",
      icon: (
        <div className="w-full h-full flex flex-col">
          <div className="w-full h-1/2 bg-blue-500 bg-opacity-50"></div>
          <div className="w-full h-1/2 bg-gray-400 bg-opacity-20"></div>
        </div>
      ),
      crop: { x: 0, y: 0, width: 100, height: 50 },
    },
    {
      id: "bottom-half",
      name: "Bottom Half",
      icon: (
        <div className="w-full h-full flex flex-col">
          <div className="w-full h-1/2 bg-gray-400 bg-opacity-20"></div>
          <div className="w-full h-1/2 bg-blue-500 bg-opacity-50"></div>
        </div>
      ),
      crop: { x: 0, y: 50, width: 100, height: 50 },
    },
    {
      id: "center",
      name: "Center Focus",
      icon: (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-blue-500 bg-opacity-50"></div>
        </div>
      ),
      crop: { x: 25, y: 25, width: 50, height: 50 },
    },
    {
      id: "rule-thirds",
      name: "Rule of Thirds",
      icon: (
        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
          <div className="col-start-2 row-start-2 bg-blue-500 bg-opacity-50"></div>
        </div>
      ),
      crop: { x: 33, y: 33, width: 33, height: 33 },
    },
  ];

  // Apply a crop preset
  const applyCropPreset = useCallback(
    (preset: CropPreset) => {
      setInteractionStarted();

      // If aspect ratio is locked, temporarily unlock it to allow applying the preset
      const currentAspectRatio = aspectRatio;

      if (currentAspectRatio !== "original") {
        setAspectRatio("original");
      }

      // Apply the preset
      setCrop(preset.crop);

      // If there was a fixed aspect ratio, reapply it after the crop is set
      if (currentAspectRatio !== "original") {
        setTimeout(() => {
          setAspectRatio(currentAspectRatio);
        }, 50);
      }

      // Update preview after a short delay
      setTimeout(() => {
        debouncedPreview();
        setInteractionEnded();
      }, 100);
    },
    [
      aspectRatio,
      setAspectRatio,
      setCrop,
      debouncedPreview,
      setInteractionStarted,
      setInteractionEnded,
    ]
  );

  // Get crop dimensions in pixels
  const getCropPixelDimensions = useCallback(() => {
    return {
      x: Math.round((crop.x / 100) * videoWidth),
      y: Math.round((crop.y / 100) * videoHeight),
      width: Math.round((crop.width / 100) * videoWidth),
      height: Math.round((crop.height / 100) * videoHeight),
    };
  }, [crop, videoWidth, videoHeight]);

  // Derived value: Can apply changes
  const canApplyChanges = hasPendingChanges("crop");

  const [, setShowAspectRatios] = useState(false);

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div
        className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Crop Video</h2>

          {/* Apply button */}
          <button
            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
              isApplyingChanges
                ? isDarkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-500"
                : canApplyChanges
                  ? isDarkMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } ${isApplyingChanges || !canApplyChanges ? "cursor-not-allowed" : ""}`}
            onClick={canApplyChanges ? applyChanges : undefined}
            disabled={isApplyingChanges || !canApplyChanges}
          >
            {isApplyingChanges ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Applying...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Apply
              </>
            )}
          </button>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Adjust crop frame size and position
        </p>

        {showSuccessMessage && (
          <div
            className={`mt-2 py-1.5 px-3 rounded-md text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center justify-center transition-opacity duration-300`}
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Crop applied successfully!
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Crop dimensions display */}
        <div
          className={`mb-3 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm ${isDarkMode ? "bg-gray-800" : "bg-blue-50"}`}
        >
          <div>
            <span
              className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              X:
            </span>{" "}
            <span className="font-medium">{Math.round(crop.x)}%</span>
            <span className="ml-1 text-xs text-gray-500">
              ({getCropPixelDimensions().x}px)
            </span>
          </div>
          <div>
            <span
              className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Y:
            </span>{" "}
            <span className="font-medium">{Math.round(crop.y)}%</span>
            <span className="ml-1 text-xs text-gray-500">
              ({getCropPixelDimensions().y}px)
            </span>
          </div>
          <div>
            <span
              className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Width:
            </span>{" "}
            <span className="font-medium">{Math.round(crop.width)}%</span>
            <span className="ml-1 text-xs text-gray-500">
              ({getCropPixelDimensions().width}px)
            </span>
          </div>
          <div>
            <span
              className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Height:
            </span>{" "}
            <span className="font-medium">{Math.round(crop.height)}%</span>
            <span className="ml-1 text-xs text-gray-500">
              ({getCropPixelDimensions().height}px)
            </span>
          </div>
        </div>

        {/* Aspect Ratio Controls */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3
              className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Aspect Ratio
            </h3>
            <div className="flex items-center space-x-1">
              <span
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Lock Ratio:
              </span>
              <button
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${
                  aspectRatioLocked
                    ? isDarkMode
                      ? "bg-blue-600"
                      : "bg-blue-500"
                    : isDarkMode
                      ? "bg-gray-700"
                      : "bg-gray-300"
                }`}
                onClick={() => {
                  const newLocked = !aspectRatioLocked;
                  setAspectRatioLocked(newLocked);

                  // If locking, apply current aspect ratio
                  // If unlocking, set to original
                  if (newLocked) {
                    if (aspectRatio === "original") {
                      // Default to 16:9 when enabling lock
                      changeAspectRatio("16:9");
                    }
                  } else {
                    changeAspectRatio("original");
                  }
                }}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-transform transform ${
                    aspectRatioLocked ? "translate-x-5 bg-white" : "bg-gray-200"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { id: "original", name: "Free" },
              { id: "16:9", name: "16:9" },
              { id: "4:3", name: "4:3" },
              { id: "1:1", name: "1:1" },
              { id: "9:16", name: "9:16" },
              { id: "custom", name: "Custom" },
            ].map((ratio) => (
              <button
                key={ratio.id}
                className={`py-2 rounded-md text-sm font-medium ${
                  aspectRatio === ratio.id
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-all`}
                onClick={() => changeAspectRatio(ratio.id as AspectRatio)}
              >
                {ratio.name}
              </button>
            ))}
          </div>

          {/* Custom aspect ratio input */}
          <AnimatePresence>
            {showCustomRatio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={`p-3 rounded-lg mb-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      min="1"
                      max="100"
                      className={`w-16 px-2 py-1 rounded-md text-sm ${
                        isDarkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-900 border-gray-300"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      min="1"
                      max="100"
                      className={`w-16 px-2 py-1 rounded-md text-sm ${
                        isDarkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-900 border-gray-300"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        isDarkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } transition-colors`}
                      onClick={applyCustomRatio}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Crop Presets */}
        <section className="mb-6">
          <h3
            className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Quick Crop Presets
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {cropPresets.map((preset) => (
              <button
                key={preset.id}
                className={`p-2 rounded-lg text-sm ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
                onClick={() => applyCropPreset(preset)}
              >
                <div className="relative w-full h-12 mb-2 rounded overflow-hidden">
                  {preset.icon}
                </div>
                <div className="text-center font-medium">{preset.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Instruction tips */}
        <div className="mb-6">
          <div
            className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
          >
            <h4
              className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Tips:
            </h4>
            <ul
              className={`text-xs space-y-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              <li>• Drag directly on the video to adjust the crop area</li>
              <li>• Lock aspect ratio to maintain proportions</li>
              <li>• Apply a preset then fine-tune as needed</li>
              <li>• Changes preview in real-time</li>
              <li>• Click "Apply" when you're happy with the crop</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div
        className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
            crop.x !== 0 ||
            crop.y !== 0 ||
            crop.width !== 100 ||
            crop.height !== 100
              ? isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              : isDarkMode
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          onClick={resetCrop}
          disabled={
            crop.x === 0 &&
            crop.y === 0 &&
            crop.width === 100 &&
            crop.height === 100
          }
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset Crop
          </div>
        </motion.button>
      </div>
    </div>
  );
});

export default CropPanel;
