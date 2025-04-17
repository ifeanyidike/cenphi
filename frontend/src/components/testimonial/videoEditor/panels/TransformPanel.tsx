import React, { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";

const TransformPanel: React.FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    transform,
    setTransform,
    applyEdit, // New method to explicitly apply edits
    hasPendingChanges, // New method to check for pending changes
  } = videoEditorManager;

  // State
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState("rotate"); // 'rotate' or 'flip'
  const [rotationPreview, setRotationPreview] = useState(transform.rotate);
  const [flipPreview, setFlipPreview] = useState({
    horizontal: transform.flipHorizontal,
    vertical: transform.flipVertical,
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [applyEnabled, setApplyEnabled] = useState(false);

  // Update preview values when transforms change
  useEffect(() => {
    setRotationPreview(transform.rotate);
    setFlipPreview({
      horizontal: transform.flipHorizontal,
      vertical: transform.flipVertical,
    });

    // Enable apply button if transform values have changed
    setApplyEnabled(hasPendingChanges("transform"));
  }, [transform, hasPendingChanges]);

  // Handle rotation change - instantly previewed
  const handleRotateChange = useCallback(
    (newRotation: number) => {
      // Normalize rotation to 0-360 range
      const normalizedRotation = ((newRotation % 360) + 360) % 360;

      // Update rotation preview for UI
      setRotationPreview(normalizedRotation);

      // Update transform state in store - this gives instant canvas preview
      setTransform({ rotate: normalizedRotation });
    },
    [setTransform]
  );

  // Common rotation presets with instant preview
  // const handleRotate90 = useCallback(() => {
  //   const newRotation = (transform.rotate + 90) % 360;
  //   handleRotateChange(newRotation);
  // }, [transform.rotate, handleRotateChange]);

  // const handleRotate180 = useCallback(() => {
  //   const newRotation = (transform.rotate + 180) % 360;
  //   handleRotateChange(newRotation);
  // }, [transform.rotate, handleRotateChange]);

  // const handleRotate270 = useCallback(() => {
  //   const newRotation = (transform.rotate + 270) % 360;
  //   handleRotateChange(newRotation);
  // }, [transform.rotate, handleRotateChange]);

  // Handle flip toggle with instant preview
  const handleFlipToggle = useCallback(
    (type: "horizontal" | "vertical") => {
      if (type === "horizontal") {
        // Update UI preview
        setFlipPreview((prev) => ({
          ...prev,
          horizontal: !prev.horizontal,
        }));

        // Apply to store - this gives instant canvas preview
        setTransform({ flipHorizontal: !transform.flipHorizontal });
      } else {
        // Update UI preview
        setFlipPreview((prev) => ({
          ...prev,
          vertical: !prev.vertical,
        }));

        // Apply to store - this gives instant canvas preview
        setTransform({ flipVertical: !transform.flipVertical });
      }
    },
    [transform.flipHorizontal, transform.flipVertical, setTransform]
  );

  // Apply transform changes - now uses the new applyEdit method
  const handleApplyTransform = async () => {
    if (isApplying) return;

    setIsApplying(true);
    try {
      // Process the transform using FFmpeg
      const result = await applyEdit("transform");

      if (result) {
        console.log("Transform successfully applied:", result);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Apply is now disabled until changes are made again
        setApplyEnabled(false);
      } else {
        console.error("Failed to apply transform");
      }
    } catch (error) {
      console.error("Failed to apply transform:", error);
    } finally {
      setIsApplying(false);
    }
  };

  // Reset all transformations
  const handleReset = () => {
    // Update transforms with canvas-based preview
    setTransform({
      rotate: 0,
      flipHorizontal: false,
      flipVertical: false,
    });

    // Update UI preview values
    setRotationPreview(0);
    setFlipPreview({ horizontal: false, vertical: false });
  };

  // Render rotation control display
  const renderRotationDisplay = () => {
    return (
      <div className="flex items-center justify-center py-6">
        <div
          className={`w-56 h-56 relative rounded-full border-2 ${
            isDarkMode ? "border-gray-700" : "border-gray-300"
          }`}
        >
          {/* Rotation markers */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: angle % 90 === 0 ? 2 : 1,
                height: angle % 90 === 0 ? 8 : 4,
                background: isDarkMode ? "#6B7280" : "#9CA3AF",
                transform: `rotate(${angle}deg) translateY(-28px)`,
                transformOrigin: "bottom center",
              }}
            />
          ))}

          {/* Angle text labels */}
          {[0, 90, 180, 270].map((angle) => (
            <div
              key={`text-${angle}`}
              className={`absolute text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
              style={{
                top: angle === 90 ? "2px" : angle === 270 ? "auto" : "50%",
                bottom: angle === 270 ? "2px" : "auto",
                left: angle === 180 ? "2px" : angle === 0 ? "auto" : "50%",
                right: angle === 0 ? "2px" : "auto",
                transform:
                  angle === 90 || angle === 270
                    ? "translateX(-50%)"
                    : angle === 0 || angle === 180
                      ? "translateY(-50%)"
                      : "none",
              }}
            >
              {angle}°
            </div>
          ))}

          {/* Preview rectangle showing real-time transforms */}
          <div
            className="absolute top-1/2 left-1/2 w-20 h-12 -mt-6 -ml-10 bg-blue-500/30 border border-blue-500 rounded"
            style={{
              transform: `rotate(${rotationPreview}deg) scale(${flipPreview.horizontal ? -1 : 1}, ${flipPreview.vertical ? -1 : 1})`,
            }}
          >
            <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-500/30"></div>
          </div>

          {/* Rotation indicator needle */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-1 h-24 -ml-0.5 -mt-24 origin-bottom bg-blue-500 rounded-t-full z-10"
            animate={{ rotate: rotationPreview }}
            transition={{ type: "spring", stiffness: 100 }}
          />

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-blue-500 z-20" />

          {/* Current angle display */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold z-10">
            {rotationPreview}°
          </div>
        </div>
      </div>
    );
  };

  // Render flip controls
  const renderFlipControls = () => {
    return (
      <div className="py-6 space-y-8">
        {/* Horizontal flip */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Horizontal Flip</h3>
          <div className="flex items-center justify-center gap-8">
            <div
              className={`relative w-32 h-24 flex items-center justify-center rounded-md border-2 ${
                !flipPreview.horizontal
                  ? isDarkMode
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50"
                  : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
              } cursor-pointer transition-colors duration-200`}
              onClick={() => handleFlipToggle("horizontal")}
            >
              <svg
                className="w-12 h-12 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M12 4V20" />
                <path d="M8 8L8 16" />
                <path d="M16 8L16 16" />
              </svg>
              <div className="absolute bottom-1 left-0 right-0 text-xs text-center">
                Normal
              </div>
            </div>

            <div
              className={`relative w-32 h-24 flex items-center justify-center rounded-md border-2 ${
                flipPreview.horizontal
                  ? isDarkMode
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50"
                  : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
              } cursor-pointer transition-colors duration-200`}
              onClick={() => handleFlipToggle("horizontal")}
            >
              <svg
                className="w-12 h-12 text-blue-500 transform scale-x-[-1]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M12 4V20" />
                <path d="M8 8L8 16" />
                <path d="M16 8L16 16" />
              </svg>
              <div className="absolute bottom-1 left-0 right-0 text-xs text-center">
                Flipped
              </div>
            </div>
          </div>
        </div>

        {/* Vertical flip */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Vertical Flip</h3>
          <div className="flex items-center justify-center gap-8">
            <div
              className={`relative w-32 h-24 flex items-center justify-center rounded-md border-2 ${
                !flipPreview.vertical
                  ? isDarkMode
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50"
                  : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
              } cursor-pointer transition-colors duration-200`}
              onClick={() => handleFlipToggle("vertical")}
            >
              <svg
                className="w-12 h-12 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M4 12H20" />
                <path d="M8 8L16 8" />
                <path d="M8 16L16 16" />
              </svg>
              <div className="absolute bottom-1 left-0 right-0 text-xs text-center">
                Normal
              </div>
            </div>

            <div
              className={`relative w-32 h-24 flex items-center justify-center rounded-md border-2 ${
                flipPreview.vertical
                  ? isDarkMode
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-blue-500 bg-blue-50"
                  : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
              } cursor-pointer transition-colors duration-200`}
              onClick={() => handleFlipToggle("vertical")}
            >
              <svg
                className="w-12 h-12 text-blue-500 transform scale-y-[-1]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M4 12H20" />
                <path d="M8 8L16 8" />
                <path d="M8 16L16 16" />
              </svg>
              <div className="absolute bottom-1 left-0 right-0 text-xs text-center">
                Flipped
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header with new Apply button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transform</h2>

          {/* Apply button - only enabled if changes are made */}
          <button
            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
              isApplying
                ? isDarkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-500"
                : applyEnabled
                  ? isDarkMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } ${isApplying ? "cursor-not-allowed" : ""}`}
            onClick={handleApplyTransform}
            disabled={isApplying || !applyEnabled}
          >
            {isApplying ? (
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
                Processing...
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
                Apply Transform
              </>
            )}
          </button>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Rotate and flip your video
        </p>

        {/* Success message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 py-1.5 px-3 rounded-md text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center justify-center"
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
              Transform applied successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === "rotate"
              ? isDarkMode
                ? "border-blue-500 text-blue-400"
                : "border-blue-500 text-blue-600"
              : isDarkMode
                ? "border-transparent text-gray-400 hover:text-gray-300"
                : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("rotate")}
        >
          Rotate
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === "flip"
              ? isDarkMode
                ? "border-blue-500 text-blue-400"
                : "border-blue-500 text-blue-600"
              : isDarkMode
                ? "border-transparent text-gray-400 hover:text-gray-300"
                : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("flip")}
        >
          Flip
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "rotate" ? (
            <motion.div
              key="rotate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {/* Rotation Display */}
              {renderRotationDisplay()}

              {/* Rotation Controls */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button
                  className={`p-3 rounded-md text-sm font-medium flex items-center justify-center ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => handleRotateChange(90)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  90°
                </button>
                <button
                  className={`p-3 rounded-md text-sm font-medium flex items-center justify-center ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => handleRotateChange(180)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  180°
                </button>
                <button
                  className={`p-3 rounded-md text-sm font-medium flex items-center justify-center ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => handleRotateChange(270)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  270°
                </button>
              </div>

              {/* Fine-tune rotation */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Fine-tune Rotation: {rotationPreview}°
                </label>
                <div className="flex items-center">
                  <button
                    className={`p-1 rounded ${
                      isDarkMode
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => handleRotateChange(rotationPreview - 1)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    value={rotationPreview}
                    onChange={(e) =>
                      handleRotateChange(parseInt(e.target.value))
                    }
                    className="flex-1 mx-2"
                  />
                  <button
                    className={`p-1 rounded ${
                      isDarkMode
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => handleRotateChange(rotationPreview + 1)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="flip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {renderFlipControls()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Explanation of the two-step process */}
      <div className="px-4 py-3">
        <div
          className={`p-3 rounded-lg ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"} text-sm`}
        >
          <h4 className="font-medium mb-1">Faster Transform Process</h4>
          <ul className="space-y-1 text-xs">
            <li>• Transform changes are shown in real-time</li>
            <li>
              • Changes are only <b>previewed</b> until you click "Apply
              Transform"
            </li>
            <li>
              • Click "Apply Transform" to process the video with your changes
            </li>
          </ul>
        </div>
      </div>

      {/* Reset All Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <button
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            transform.rotate !== 0 ||
            transform.flipHorizontal ||
            transform.flipVertical
              ? isDarkMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
              : isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white opacity-50 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 opacity-50 cursor-not-allowed"
          }`}
          onClick={handleReset}
          disabled={
            transform.rotate === 0 &&
            !transform.flipHorizontal &&
            !transform.flipVertical
          }
        >
          Reset All Transformations
        </button>
      </div>
    </div>
  );
});

export default TransformPanel;
