import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";

interface NoiseReductionPanelProps {
  onSuccess?: (message: string) => void;
}

const NoiseReductionPanel: React.FC<NoiseReductionPanelProps> = observer(
  ({ onSuccess }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const {
      noiseReduction,
      setNoiseReduction,
      applyEdit,
      previewEdit,
      hasPendingChanges,
      isProcessing,
    } = audioEditorManager;

    // Local state
    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [applyEnabled, setApplyEnabled] = useState(false);
    const [noiseType, setNoiseType] = useState<string>("ambient");
    const [previewTimeout, setPreviewTimeout] = useState<number | null>(null);

    // Noise profiles
    const noiseProfiles = [
      {
        id: "ambient",
        label: "Ambient Noise",
        description: "General background noise, room tone",
      },
      {
        id: "hum",
        label: "Hum & Buzz",
        description: "Electrical noise, low-frequency interference",
      },
      {
        id: "fan",
        label: "Computer Fan",
        description: "Consistent mechanical background noise",
      },
      {
        id: "breath",
        label: "Breath Noise",
        description: "Pops, plosives, and breath sounds",
      },
      {
        id: "custom",
        label: "Custom",
        description: "Manual noise profile configuration",
      },
    ];

    // Check for pending changes
    useEffect(() => {
      setApplyEnabled(hasPendingChanges("noise-reduction"));
    }, [noiseReduction, hasPendingChanges]);

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
      property: keyof typeof noiseReduction,
      value: number
    ) => {
      setNoiseReduction({ [property]: value });

      // Clear previous timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      // Create new timeout for preview
      const timeout = setTimeout(() => {
        previewEdit("noise-reduction");
      }, 300);

      setPreviewTimeout(timeout);
    };

    // Apply noise profile
    const applyNoiseProfile = (profileId: string) => {
      setNoiseType(profileId);

      // Apply different preset values depending on the profile
      switch (profileId) {
        case "ambient":
          setNoiseReduction({
            strength: 60,
            sensitivity: 50,
            preserveVoice: 75,
          });
          break;
        case "hum":
          setNoiseReduction({
            strength: 75,
            sensitivity: 40,
            preserveVoice: 80,
          });
          break;
        case "fan":
          setNoiseReduction({
            strength: 70,
            sensitivity: 60,
            preserveVoice: 70,
          });
          break;
        case "breath":
          setNoiseReduction({
            strength: 45,
            sensitivity: 70,
            preserveVoice: 65,
          });
          break;
        case "custom":
          // Keep current settings
          break;
      }

      // Clear previous timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      // Create preview after profile is applied
      const timeout = setTimeout(() => {
        previewEdit("noise-reduction");
      }, 300);

      setPreviewTimeout(timeout);
    };

    // Apply noise reduction
    const handleApplyNoiseReduction = async () => {
      if (isApplying || isProcessing) return;

      setIsApplying(true);
      try {
        // Apply the noise reduction
        const result = await applyEdit("noise-reduction");

        // Show success message
        if (result && onSuccess) {
          onSuccess("Noise reduction applied successfully!");
        }

        setApplyEnabled(false);
      } catch (error) {
        console.error("Error applying noise reduction:", error);
      } finally {
        setIsApplying(false);
      }
    };

    // Reset to default
    const resetToDefault = () => {
      setNoiseReduction({
        strength: 50,
        sensitivity: 50,
        preserveVoice: 75,
      });
      setNoiseType("ambient");

      // Clear previous timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      // Create new preview
      const timeout = setTimeout(() => {
        previewEdit("noise-reduction");
      }, 300);

      setPreviewTimeout(timeout);
    };

    return (
      <div
        className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Noise Reduction</h2>

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
              onClick={handleApplyNoiseReduction}
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
                  Apply Reduction
                </>
              )}
            </button>
          </div>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Remove background noise from your audio
          </p>
        </div>

        {/* Noise Profile Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Noise Profile</h3>
          <div className="grid grid-cols-1 gap-2">
            {noiseProfiles.map((profile) => (
              <button
                key={profile.id}
                className={`flex flex-col p-3 rounded-lg text-left transition-colors ${
                  noiseType === profile.id
                    ? isDarkMode
                      ? "bg-blue-800/40 border border-blue-700"
                      : "bg-blue-100 border border-blue-200"
                    : isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
                onClick={() => applyNoiseProfile(profile.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{profile.label}</span>
                  {noiseType === profile.id && (
                    <svg
                      className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
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
                </div>
                <span
                  className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {profile.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Noise Reduction Controls */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Noise Reduction Strength */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">
                  Reduction Strength
                </label>
                <span className="text-sm">{noiseReduction.strength}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={noiseReduction.strength}
                  onChange={(e) =>
                    handleSliderChange("strength", parseInt(e.target.value))
                  }
                  className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
                />
                <div
                  className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                    isDarkMode ? "bg-blue-600" : "bg-blue-500"
                  }`}
                  style={{ left: `calc(${noiseReduction.strength}% - 8px)` }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Higher values remove more noise but may affect audio quality
              </p>
            </div>

            {/* Sensitivity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Sensitivity</label>
                <span className="text-sm">{noiseReduction.sensitivity}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={noiseReduction.sensitivity}
                  onChange={(e) =>
                    handleSliderChange("sensitivity", parseInt(e.target.value))
                  }
                  className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
                />
                <div
                  className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                    isDarkMode ? "bg-blue-600" : "bg-blue-500"
                  }`}
                  style={{ left: `calc(${noiseReduction.sensitivity}% - 8px)` }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                How aggressively to detect and identify noise
              </p>
            </div>

            {/* Preserve Voice */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Preserve Voice</label>
                <span className="text-sm">{noiseReduction.preserveVoice}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={noiseReduction.preserveVoice}
                  onChange={(e) =>
                    handleSliderChange(
                      "preserveVoice",
                      parseInt(e.target.value)
                    )
                  }
                  className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
                />
                <div
                  className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                    isDarkMode ? "bg-blue-600" : "bg-blue-500"
                  }`}
                  style={{
                    left: `calc(${noiseReduction.preserveVoice}% - 8px)`,
                  }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Prioritizes keeping vocal content clear while reducing noise
              </p>
            </div>

            {/* Advanced settings toggle */}
            <button
              className={`w-full flex items-center justify-between px-4 py-2 mt-2 rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="text-sm font-medium">Advanced Settings</span>
              <svg
                className={`w-5 h-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
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

            {/* Advanced settings (collapsible) */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden rounded-lg p-4 ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Noise floor visualization (simulated) */}
                    <div>
                      <h4 className="text-xs font-medium mb-2">
                        Noise Floor Visualization
                      </h4>
                      <div className="relative h-20 bg-gray-900 rounded-md overflow-hidden">
                        {/* Simulated noise profile visualization */}
                        <div className="absolute inset-0 flex items-end">
                          {Array.from({ length: 32 }).map((_, i) => {
                            const height = Math.random() * 0.3 + 0.1;
                            return (
                              <div
                                key={i}
                                className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 opacity-60"
                                style={{ height: `${height * 100}%` }}
                              ></div>
                            );
                          })}
                        </div>

                        {/* Noise threshold line */}
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-red-500"
                          style={{ bottom: `${noiseReduction.sensitivity}%` }}
                        ></div>

                        {/* Labels */}
                        <div className="absolute bottom-1 left-2 text-xs text-white opacity-70">
                          Noise Floor
                        </div>
                        <div className="absolute top-1 right-2 text-xs text-white opacity-70">
                          Threshold: {noiseReduction.sensitivity}%
                        </div>
                      </div>
                    </div>

                    {/* Auto-learn section */}
                    <div>
                      <h4 className="text-xs font-medium mb-2">
                        Noise Sample Learning
                      </h4>
                      <button
                        className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-indigo-800 hover:bg-indigo-700 text-white"
                            : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                        }`}
                        onClick={() => {
                          // In a real implementation, this would analyze
                          // a selection of audio to learn the noise profile

                          // For now, just set a custom profile
                          setNoiseType("custom");

                          // Show a success message
                          if (onSuccess) {
                            onSuccess("Noise profile learned from selection");
                          }
                        }}
                      >
                        Learn from Selection
                      </button>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        Select a portion of audio containing only noise to
                        improve detection accuracy
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips section */}
            <div
              className={`p-4 rounded-lg mt-2 ${
                isDarkMode ? "bg-blue-900/20" : "bg-blue-50"
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
                <h3 className="text-sm font-medium">Pro Tips</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start with a low strength setting (30-50%) and increase
                gradually until noise is reduced without affecting voice
                quality. Higher "Preserve Voice" settings work best for
                testimonials.
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
            onClick={resetToDefault}
          >
            Reset to Default
          </button>
        </div>
      </div>
    );
  }
);

export default NoiseReductionPanel;
