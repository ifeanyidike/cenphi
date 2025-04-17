import React, { useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { AudioEffect } from "../../../../repo/managers/audio_editor";

// Effect preset definitions
interface EffectPreset {
  id: string;
  name: string;
  description: string;
  effects: Record<AudioEffect, number>;
}

// Define effect presets
const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "clear-voice",
    name: "Clear Voice",
    description: "Enhance speech clarity for testimonials",
    effects: {
      none: 0,
      reverb: 15,
      "eq-voice": 70,
      boost: 40,
      warmth: 30,
      clarity: 65,
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "Clean, balanced sound for business testimonials",
    effects: {
      none: 0,
      reverb: 20,
      "eq-voice": 60,
      boost: 25,
      warmth: 40,
      clarity: 55,
    },
  },
  {
    id: "warm-tone",
    name: "Warm Tone",
    description: "Add warmth and depth to the voice",
    effects: {
      none: 0,
      reverb: 25,
      "eq-voice": 40,
      boost: 20,
      warmth: 75,
      clarity: 35,
    },
  },
  {
    id: "studio-quality",
    name: "Studio Quality",
    description: "Professional studio sound with presence",
    effects: {
      none: 0,
      reverb: 35,
      "eq-voice": 55,
      boost: 30,
      warmth: 45,
      clarity: 60,
    },
  },
];

// Effect descriptions for tooltips
const EFFECT_DESCRIPTIONS: Record<AudioEffect, string> = {
  none: "No effect applied",
  reverb: "Adds depth and space to the audio",
  "eq-voice": "Optimizes frequency balance for human voice",
  boost: "Increases overall volume and presence",
  warmth: "Adds rich, warm tones to the audio",
  clarity: "Enhances crisp, clear high frequencies",
};

interface EffectsPanelProps {
  onSuccess?: (message: string) => void;
}

const EffectsPanel: React.FC<EffectsPanelProps> = observer(({ onSuccess }) => {
  const { audioEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    effects,
    setEffect,
    applyEdit,
    previewEdit,
    isProcessing,
    hasPendingChanges,
  } = audioEditorManager;

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAllEffects, setShowAllEffects] = useState(true);
  const [hoveredEffect, setHoveredEffect] = useState<AudioEffect | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<AudioEffect | null>(
    null
  );
  const [previewTimeout, setPreviewTimeout] = useState<number | null>(null);

  // Find matching preset or set to custom
  useEffect(() => {
    const matchingPreset = EFFECT_PRESETS.find((preset) => {
      return Object.entries(preset.effects).every(
        ([effect, value]) => effects[effect as AudioEffect] === value
      );
    });

    setActivePreset(matchingPreset?.id || null);
  }, [effects]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
    };
  }, [previewTimeout]);

  // Apply a preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = EFFECT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      // Apply each effect in the preset
      Object.entries(preset.effects).forEach(([effect, value]) => {
        setEffect(effect as AudioEffect, value);
      });

      // Update active preset
      setActivePreset(presetId);

      // Create preview with debouncing
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }

      const timeout = setTimeout(() => {
        previewEdit("effects");
      }, 300);

      setPreviewTimeout(timeout);
    },
    [setEffect, previewEdit, previewTimeout]
  );

  // Apply the effects to the audio
  const handleApplyEffects = async () => {
    if (isApplying || isProcessing) return;

    setIsApplying(true);
    try {
      const result = await applyEdit("effects");
      if (result && onSuccess) {
        onSuccess("Effects applied successfully!");
      }
    } catch (error) {
      console.error("Error applying effects:", error);
    } finally {
      setIsApplying(false);
    }
  };

  // Handle effect value change with debounced preview
  const handleEffectChange = (effect: AudioEffect, value: number) => {
    setEffect(effect, value);

    // Update preset status
    const matchingPreset = EFFECT_PRESETS.find((preset) => {
      return Object.entries({ ...preset.effects, [effect]: value }).every(
        ([e, v]) =>
          e === effect ? v === value : effects[e as AudioEffect] === v
      );
    });

    setActivePreset(matchingPreset?.id || null);

    // Debounce preview to prevent excessive processing
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }

    const timeout = setTimeout(() => {
      previewEdit("effects");
    }, 300);

    setPreviewTimeout(timeout);
  };

  // Reset all effects to zero
  const resetEffects = () => {
    Object.keys(effects).forEach((effect) => {
      setEffect(effect as AudioEffect, 0);
    });
    setActivePreset(null);

    // Clear any pending preview
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }

    // Create a new preview
    previewEdit("effects");
  };

  // Effect component with slider and value
  const EffectControl = ({
    effect,
    label,
  }: {
    effect: AudioEffect;
    label: string;
  }) => (
    <div
      className={`mb-6 ${
        selectedEffect === effect
          ? isDarkMode
            ? "bg-gray-700/50 p-3 rounded-lg"
            : "bg-blue-50/50 p-3 rounded-lg"
          : ""
      }`}
      onClick={() =>
        setSelectedEffect(effect === selectedEffect ? null : effect)
      }
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h3
            className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"}`}
            onMouseEnter={() => setHoveredEffect(effect)}
            onMouseLeave={() => setHoveredEffect(null)}
          >
            {label}
          </h3>
          {hoveredEffect === effect && (
            <div
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              {EFFECT_DESCRIPTIONS[effect]}
            </div>
          )}
        </div>
        <span
          className={`text-xs font-mono ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
        >
          {effects[effect]}%
        </span>
      </div>
      <div className="flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={effects[effect]}
          onChange={(e) => handleEffectChange(effect, parseInt(e.target.value))}
          className={`w-full h-2 ${
            isDarkMode
              ? "bg-gray-700 accent-blue-500"
              : "bg-gray-200 accent-blue-600"
          } rounded-lg appearance-none cursor-pointer`}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Audio Effects</h2>

          <button
            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
              effects.none === 0 &&
              effects.reverb === 0 &&
              effects["eq-voice"] === 0 &&
              effects.boost === 0 &&
              effects.warmth === 0 &&
              effects.clarity === 0
                ? isDarkMode
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isDarkMode
                  ? "bg-red-600/80 text-white hover:bg-red-700"
                  : "bg-red-500 text-white hover:bg-red-600"
            }`}
            onClick={resetEffects}
            disabled={
              effects.none === 0 &&
              effects.reverb === 0 &&
              effects["eq-voice"] === 0 &&
              effects.boost === 0 &&
              effects.warmth === 0 &&
              effects.clarity === 0
            }
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Reset
          </button>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Apply professional audio effects to enhance your testimonial
        </p>
      </div>

      {/* Presets Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3
          className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
        >
          Quick Effects Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {EFFECT_PRESETS.map((preset) => (
            <motion.button
              key={preset.id}
              className={`p-3 rounded-lg text-left transition-colors ${
                activePreset === preset.id
                  ? isDarkMode
                    ? "bg-blue-700/30 border border-blue-600"
                    : "bg-blue-50 border border-blue-300"
                  : isDarkMode
                    ? "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                    : "bg-white border border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => applyPreset(preset.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4
                className={`text-sm font-medium mb-1 ${
                  activePreset === preset.id
                    ? isDarkMode
                      ? "text-blue-300"
                      : "text-blue-700"
                    : isDarkMode
                      ? "text-white"
                      : "text-gray-800"
                }`}
              >
                {preset.name}
              </h4>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {preset.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Effects Controls */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Customize Effects
          </h3>
          <button
            className={`text-xs px-2 py-1 rounded-md ${
              isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setShowAllEffects(!showAllEffects)}
          >
            {showAllEffects ? "Show Main Effects" : "Show All Effects"}
          </button>
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Always show the main effects */}
            <EffectControl effect="clarity" label="Clarity" />
            <EffectControl effect="eq-voice" label="Voice EQ" />
            <EffectControl effect="warmth" label="Warmth" />

            {/* Conditionally show additional effects */}
            {showAllEffects && (
              <>
                <EffectControl effect="boost" label="Volume Boost" />
                <EffectControl effect="reverb" label="Reverb" />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Effect details when an effect is selected */}
        <AnimatePresence>
          {selectedEffect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <h3 className="font-medium mb-2">
                {selectedEffect === "eq-voice"
                  ? "Voice EQ"
                  : selectedEffect === "clarity"
                    ? "Clarity"
                    : selectedEffect === "warmth"
                      ? "Warmth"
                      : selectedEffect === "boost"
                        ? "Volume Boost"
                        : selectedEffect === "reverb"
                          ? "Reverb"
                          : "Effect"}
              </h3>
              <p className="text-sm mb-3">
                {EFFECT_DESCRIPTIONS[selectedEffect]}
              </p>
              <div className="text-xs">
                {selectedEffect === "eq-voice" &&
                  "Optimizes frequency balance specifically for voice testimonials, reducing muddiness and emphasizing speech clarity."}
                {selectedEffect === "clarity" &&
                  "Enhances high-frequency detail while reducing harshness, making voices sound more articulate and professional."}
                {selectedEffect === "warmth" &&
                  "Adds pleasing low-mid frequencies that give the voice a fuller, more intimate sound without muddiness."}
                {selectedEffect === "boost" &&
                  "Intelligently increases perceived loudness without distortion, making the testimonial more impactful."}
                {selectedEffect === "reverb" &&
                  "Adds a subtle sense of space and ambience that makes the recording sound more natural and polished."}
              </div>
              <button
                className="mt-3 text-xs underline opacity-70"
                onClick={() => setSelectedEffect(null)}
              >
                Close details
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Apply Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div
          className={`p-3 rounded-lg mb-4 ${
            isDarkMode
              ? "bg-blue-900/20 border border-blue-900/30"
              : "bg-blue-50 border border-blue-100"
          }`}
        >
          <p className="text-xs">
            <span
              className={`font-medium ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
            >
              Pro Tip:
            </span>{" "}
            Apply effects one at a time for precise control over your audio
            quality.
          </p>
        </div>
        <button
          className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
            isApplying || isProcessing
              ? isDarkMode
                ? "bg-indigo-700/50 text-white cursor-wait"
                : "bg-indigo-300 text-white cursor-wait"
              : !hasPendingChanges("effects")
                ? isDarkMode
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isDarkMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/20"
          }`}
          onClick={handleApplyEffects}
          disabled={isApplying || isProcessing || !hasPendingChanges("effects")}
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
              Applying Effects...
            </>
          ) : (
            <>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Apply Effects
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default EffectsPanel;
