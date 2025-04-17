import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";

interface NormalizePanelProps {
  onSuccess?: (message: string) => void;
}

const NormalizePanel: React.FC<NormalizePanelProps> = observer(
  ({ onSuccess }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const {
      volumeNormalize,
      setVolumeNormalize,
      applyEdit,
      previewEdit,
      hasPendingChanges,
      isProcessing,
    } = audioEditorManager;

    // Local state
    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [applyEnabled, setApplyEnabled] = useState(false);
    const [normalizeMode, setNormalizeMode] = useState<string>("balanced");
    const [previewTimeout, setPreviewTimeout] = useState<number | null>(null);

    // Audio level visualization (simulated)
    const [audioLevels, setAudioLevels] = useState<number[]>([]);
    const [previewLevels, setPreviewLevels] = useState<number[]>([]);

    // Normalization modes
    const normalizeModes = [
      {
        id: "light",
        label: "Light",
        value: 30,
        description: "Subtle normalization to preserve dynamics",
      },
      {
        id: "balanced",
        label: "Balanced",
        value: 60,
        description: "Standard normalization for most audio",
      },
      {
        id: "aggressive",
        label: "Aggressive",
        value: 85,
        description: "Maximize loudness for clearer speech",
      },
      {
        id: "custom",
        label: "Custom",
        value: volumeNormalize,
        description: "Manual normalization level",
      },
    ];

    // Check for pending changes
    useEffect(() => {
      setApplyEnabled(hasPendingChanges("normalize"));
    }, [volumeNormalize, hasPendingChanges]);

    // Generate simulated audio levels for visualization
    useEffect(() => {
      // Generate random audio levels for visualization (in a real implementation, this would use actual audio data)
      const levels = Array.from({ length: 100 }, () => {
        // Generate values between 0.05 and 0.8 with some peaks
        const base = Math.random() * 0.6 + 0.05;
        const peak = Math.random() > 0.85 ? Math.random() * 0.4 : 0;
        return Math.min(base + peak, 0.8);
      });

      setAudioLevels(levels);

      // Calculate preview levels
      calculatePreviewLevels(levels, volumeNormalize);
    }, []);

    // Update preview levels when volumeNormalize changes
    useEffect(() => {
      calculatePreviewLevels(audioLevels, volumeNormalize);
    }, [volumeNormalize, audioLevels]);

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
        }
      };
    }, [previewTimeout]);

    // Calculate preview levels based on normalization value
    const calculatePreviewLevels = (levels: number[], normalize: number) => {
      if (!levels.length) return;

      // Find max level
      const maxLevel = Math.max(...levels);

      // Calculate target level based on normalization (0-100)
      const targetLevel = 0.2 + (normalize / 100) * 0.8; // 0.2 to 1.0

      // Calculate scale factor
      const scaleFactor = targetLevel / maxLevel;

      // Apply normalization to levels
      const newLevels = levels.map((level) =>
        Math.min(level * scaleFactor, 1.0)
      );

      setPreviewLevels(newLevels);
    };

    // Handle slider change with debounced preview
    const handleSliderChange = (value: number) => {
      setVolumeNormalize(value);
      setNormalizeMode("custom");

      // Debounce preview generation
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      const timeout = setTimeout(() => {
        previewEdit("normalize");
      }, 300);

      setPreviewTimeout(timeout);
    };

    // Apply normalization preset
    const applyPreset = (preset: { id: string; value: number }) => {
      setNormalizeMode(preset.id);
      setVolumeNormalize(preset.value);

      // Clear previous timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      // Generate preview
      const timeout = setTimeout(() => {
        previewEdit("normalize");
      }, 300);

      setPreviewTimeout(timeout);
    };

    // Apply normalization
    const handleApplyNormalization = async () => {
      if (isApplying || isProcessing) return;

      setIsApplying(true);
      try {
        // Apply the normalization
        const result = await applyEdit("normalize");

        // Show success message
        if (result && onSuccess) {
          onSuccess("Volume normalization applied successfully!");
        }

        setApplyEnabled(false);
      } catch (error) {
        console.error("Error applying normalization:", error);
      } finally {
        setIsApplying(false);
      }
    };

    return (
      <div
        className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Volume Normalize</h2>

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
              onClick={handleApplyNormalization}
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
                  Apply Normalization
                </>
              )}
            </button>
          </div>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Normalize audio volume for consistent levels
          </p>
        </div>

        {/* Visualization */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Volume Visualization</h3>

          <div className="relative h-32 bg-gray-900 rounded-lg overflow-hidden">
            {/* Original audio levels */}
            <div className="absolute inset-0 px-2 flex items-end">
              {audioLevels.map((level, i) => (
                <div
                  key={`original-${i}`}
                  className="w-full bg-gray-500 dark:bg-gray-600 opacity-40"
                  style={{ height: `${level * 100}%` }}
                ></div>
              ))}
            </div>

            {/* Normalized levels */}
            <div className="absolute inset-0 px-2 flex items-end">
              {previewLevels.map((level, i) => (
                <div
                  key={`normalized-${i}`}
                  className="w-full bg-gradient-to-t from-green-500 to-blue-500"
                  style={{ height: `${level * 100}%` }}
                ></div>
              ))}
            </div>

            {/* Target level line */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500"
              style={{ bottom: `${volumeNormalize}%` }}
            ></div>

            {/* Labels */}
            <div className="absolute bottom-2 left-3 text-xs text-white">
              Original
            </div>
            <div className="absolute bottom-2 right-3 text-xs text-white">
              Normalized
            </div>
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div>Quieter</div>
            <div>Target: {volumeNormalize}%</div>
            <div>Louder</div>
          </div>
        </div>

        {/* Normalization Options */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Normalization Level</h3>
          <div className="relative mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={volumeNormalize}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600`}
            />
            <div
              className={`absolute pointer-events-none top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                isDarkMode ? "bg-blue-600" : "bg-blue-500"
              }`}
              style={{ left: `calc(${volumeNormalize}% - 8px)` }}
            />
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-3 gap-2">
            {normalizeModes.slice(0, 3).map((mode) => (
              <button
                key={mode.id}
                className={`p-2 rounded-lg text-center text-sm transition-colors ${
                  normalizeMode === mode.id
                    ? isDarkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                onClick={() => applyPreset(mode)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
            {normalizeMode === "custom"
              ? "Custom: " + volumeNormalize + "%"
              : normalizeModes.find((m) => m.id === normalizeMode)
                  ?.description || ""}
          </div>
        </div>

        {/* Advanced settings */}
        <div className="p-4 flex-1 overflow-y-auto">
          <button
            className={`w-full flex items-center justify-between py-2 px-4 rounded-lg ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="text-sm font-medium">Technical Details</span>
            <svg
              className={`w-5 h-5 transition-transform ${showDetails ? "rotate-180" : ""}`}
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
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <h4 className="text-sm font-medium mb-2">
                    About Normalization
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Normalization analyzes your audio's peak levels and adjusts
                    the volume to reach a target level without distortion. This
                    ensures consistent loudness throughout your testimonial.
                  </p>

                  <h4 className="text-sm font-medium mb-2">
                    Technical Metrics
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Original Peak Level:
                      </span>
                      <span
                        className={isDarkMode ? "text-white" : "text-gray-800"}
                      >
                        -12.5 dB
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Target Level:
                      </span>
                      <span
                        className={isDarkMode ? "text-white" : "text-gray-800"}
                      >
                        {-18 + volumeNormalize * 0.16} dB
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Gain Adjustment:
                      </span>
                      <span
                        className={isDarkMode ? "text-white" : "text-gray-800"}
                      >
                        +{(volumeNormalize * 0.2).toFixed(1)} dB
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        LUFS Target:
                      </span>
                      <span
                        className={isDarkMode ? "text-white" : "text-gray-800"}
                      >
                        {-24 + volumeNormalize * 0.16} LUFS
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pro tips */}
          <div
            className={`mt-4 p-4 rounded-lg ${
              isDarkMode ? "bg-indigo-900/20" : "bg-indigo-50"
            }`}
          >
            <div className="flex items-center mb-2">
              <svg
                className="w-4 h-4 mr-2 text-indigo-500"
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
            <p className="text-xs text-gray-600 dark:text-gray-300">
              For testimonials, a "Balanced" normalization setting usually works
              best. If your recording has inconsistent volume levels, try the
              "Aggressive" setting to make quieter sections more audible.
            </p>
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
            onClick={() => {
              setVolumeNormalize(0);
              setNormalizeMode("balanced");

              // Clear previous timeout
              if (previewTimeout) {
                clearTimeout(previewTimeout);
              }

              // Create new preview
              const timeout = setTimeout(() => {
                previewEdit("normalize");
              }, 300);

              setPreviewTimeout(timeout);
            }}
          >
            Reset Normalization
          </button>
        </div>
      </div>
    );
  }
);

export default NormalizePanel;
