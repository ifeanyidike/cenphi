import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";

interface EnhancePanelProps {
  onSuccess?: (message: string) => void;
}

const EnhancePanel: React.FC<EnhancePanelProps> = observer(({ onSuccess }) => {
  const { audioEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    enhancement,
    setEnhancement,
    previewEdit,
    applyEdit,
    hasPendingChanges,
    isProcessing,
  } = audioEditorManager;

  // Local state
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [applyEnabled, setApplyEnabled] = useState(false);
  const [presetName, setPresetName] = useState<string>("Custom");
  const [previewTimeout, setPreviewTimeout] = useState<number | null>(null);

  // Presets for quick enhancement
  const presets = [
    {
      name: "Voice Clarity",
      values: {
        voiceClarity: 75,
        bassTone: 40,
        midTone: 70,
        trebleTone: 60,
        presence: 65,
      },
    },
    {
      name: "Podcast Ready",
      values: {
        voiceClarity: 65,
        bassTone: 55,
        midTone: 65,
        trebleTone: 55,
        presence: 60,
      },
    },
    {
      name: "Warm Sound",
      values: {
        voiceClarity: 50,
        bassTone: 65,
        midTone: 60,
        trebleTone: 45,
        presence: 50,
      },
    },
    {
      name: "Crisp & Clear",
      values: {
        voiceClarity: 70,
        bassTone: 35,
        midTone: 60,
        trebleTone: 75,
        presence: 70,
      },
    },
    {
      name: "Neutral",
      values: {
        voiceClarity: 50,
        bassTone: 50,
        midTone: 50,
        trebleTone: 50,
        presence: 50,
      },
    },
  ];

  // Check for pending changes
  useEffect(() => {
    setApplyEnabled(hasPendingChanges("enhance"));
  }, [enhancement, hasPendingChanges]);

  // Determine if using a preset or custom settings
  useEffect(() => {
    let matchedPreset = presets.find(
      (preset) =>
        preset.values.voiceClarity === enhancement.voiceClarity &&
        preset.values.bassTone === enhancement.bassTone &&
        preset.values.midTone === enhancement.midTone &&
        preset.values.trebleTone === enhancement.trebleTone &&
        preset.values.presence === enhancement.presence
    );

    setPresetName(matchedPreset ? matchedPreset.name : "Custom");
  }, [enhancement]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
    };
  }, [previewTimeout]);

  // Handle slider changes with debounced preview
  const handleSliderChange = (
    property: keyof typeof enhancement,
    value: number
  ) => {
    setEnhancement({ [property]: value });

    // Debounce preview generation
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }

    const timeout = setTimeout(() => {
      previewEdit("enhance");
    }, 300);

    setPreviewTimeout(timeout);
  };

  // Apply preset with preview
  const applyPreset = (preset: (typeof presets)[0]) => {
    setEnhancement(preset.values);
    setShowPresets(false);
    setPresetName(preset.name);

    // Clear any previous timeout
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }

    // Schedule a new preview
    const timeout = setTimeout(() => {
      previewEdit("enhance");
    }, 300);

    setPreviewTimeout(timeout);
  };

  // Apply enhancement changes
  const handleApplyEnhancement = async () => {
    if (isApplying || isProcessing) return;

    setIsApplying(true);
    try {
      // Apply the enhancement
      const result = await applyEdit("enhance");

      // Show success message
      if (result && onSuccess) {
        onSuccess("Audio enhancement applied successfully!");
      }

      setApplyEnabled(false);
    } catch (error) {
      console.error("Error applying enhancement:", error);
    } finally {
      setIsApplying(false);
    }
  };

  // Reset to neutral
  const resetToNeutral = () => {
    // Apply the neutral preset
    const neutralPreset = presets.find((preset) => preset.name === "Neutral");
    if (neutralPreset) {
      setEnhancement(neutralPreset.values);
      setPresetName("Neutral");

      // Clear previous timeout and create new preview
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      const timeout = setTimeout(() => {
        previewEdit("enhance");
      }, 300);

      setPreviewTimeout(timeout);
    }
  };

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Enhance Audio</h2>

          {/* Apply button */}
          <button
            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
              isApplying || isProcessing
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
            } ${isApplying || isProcessing ? "cursor-not-allowed" : ""}`}
            onClick={handleApplyEnhancement}
            disabled={isApplying || isProcessing || !applyEnabled}
          >
            {isApplying || isProcessing ? (
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
                Apply Enhancement
              </>
            )}
          </button>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Enhance your audio quality with fine-tuned adjustments
        </p>
      </div>

      {/* Presets Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">Active Preset:</h3>
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDarkMode
                  ? "bg-indigo-900/50 text-indigo-300"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {presetName}
            </span>
          </div>

          <div className="relative">
            <button
              className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => setShowPresets(!showPresets)}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              Presets
              <svg
                className={`w-4 h-4 ml-1 transition-transform ${showPresets ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {showPresets && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } ring-1 ring-black ring-opacity-5`}
                >
                  <div className="py-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                          presetName === preset.name
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-100 text-blue-800"
                            : isDarkMode
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.name}
                        {presetName === preset.name && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Enhancement Sliders */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Voice Clarity */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Voice Clarity</label>
              <span className="text-sm">{enhancement.voiceClarity}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={enhancement.voiceClarity}
                onChange={(e) =>
                  handleSliderChange("voiceClarity", parseInt(e.target.value))
                }
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
              />
              <div
                className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                }`}
                style={{ left: `calc(${enhancement.voiceClarity}% - 8px)` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Enhances vocal frequencies and improves speech intelligibility
            </p>
          </div>

          {/* Bass Tone */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Bass Tone</label>
              <span className="text-sm">{enhancement.bassTone}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={enhancement.bassTone}
                onChange={(e) =>
                  handleSliderChange("bassTone", parseInt(e.target.value))
                }
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
              />
              <div
                className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                }`}
                style={{ left: `calc(${enhancement.bassTone}% - 8px)` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Controls low frequency response for warmth and fullness
            </p>
          </div>

          {/* Mid Tone */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Mid Tone</label>
              <span className="text-sm">{enhancement.midTone}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={enhancement.midTone}
                onChange={(e) =>
                  handleSliderChange("midTone", parseInt(e.target.value))
                }
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
              />
              <div
                className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                }`}
                style={{ left: `calc(${enhancement.midTone}% - 8px)` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Shapes the middle frequencies where most speech content resides
            </p>
          </div>

          {/* Treble Tone */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Treble Tone</label>
              <span className="text-sm">{enhancement.trebleTone}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={enhancement.trebleTone}
                onChange={(e) =>
                  handleSliderChange("trebleTone", parseInt(e.target.value))
                }
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
              />
              <div
                className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                }`}
                style={{ left: `calc(${enhancement.trebleTone}% - 8px)` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Adjusts high frequencies for crispness and clarity
            </p>
          </div>

          {/* Presence */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Presence</label>
              <span className="text-sm">{enhancement.presence}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={enhancement.presence}
                onChange={(e) =>
                  handleSliderChange("presence", parseInt(e.target.value))
                }
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
              />
              <div
                className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                }`}
                style={{ left: `calc(${enhancement.presence}% - 8px)` }}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Enhances upper midrange for more "forward" sound and speech
              intelligibility
            </p>
          </div>

          {/* Advanced options - could be expanded in a real implementation */}
          <div
            className={`p-4 rounded-lg mt-4 mb-2 ${
              isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
            }`}
          >
            <div className="flex items-center mb-2">
              <svg
                className="w-4 h-4 mr-2 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-medium">Enhancement Tips</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For spoken testimonials, start with the "Voice Clarity" preset and
              fine-tune for your specific voice. Increase presence for more
              clarity or bass tone for a warmer sound.
            </p>
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <button
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          onClick={resetToNeutral}
        >
          Reset to Neutral
        </button>
      </div>
    </div>
  );
});

export default EnhancePanel;
