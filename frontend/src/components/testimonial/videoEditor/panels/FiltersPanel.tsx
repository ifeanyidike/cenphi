import React, { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../../repo/workspace_hub";
import type { VideoFilter } from "../../../../repo/managers/video_editor";

const FiltersPanel: React.FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const { videoFilters, setFilter, previewEdit } = videoEditorManager;

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showCompareSplitView, setShowCompareSplitView] = useState(false);
  const [previewDebounceTimeout, setPreviewDebounceTimeout] = useState<
    number | null
  >(null);
  const [filterPreviewValues, setFilterPreviewValues] = useState({
    ...videoFilters,
  });

  // Apply filter changes with debouncing for better performance
  const applyFilterChanges = useCallback(
    (filter: VideoFilter, value: number) => {
      // Update preview values immediately for UI responsiveness
      setFilterPreviewValues((prev) => ({
        ...prev,
        [filter]: value,
      }));

      // Update the store
      setFilter(filter, value);

      // Clear existing timeout if there is one
      if (previewDebounceTimeout) {
        clearTimeout(previewDebounceTimeout);
      }

      // Debounce the actual preview generation
      const timeout = setTimeout(async () => {
        try {
          await previewEdit("filters");
        } catch (error) {
          console.error("Failed to apply filters:", error);
        }
      }, 300);

      setPreviewDebounceTimeout(timeout);
    },
    [previewDebounceTimeout, previewEdit, setFilter]
  );

  // Presets for common filter combinations
  const filterPresets = [
    {
      id: "original",
      name: "Original",
      values: {
        grayscale: 0,
        sepia: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
      },
    },
    {
      id: "grayscale",
      name: "Black & White",
      values: {
        grayscale: 100,
        sepia: 0,
        brightness: 110,
        contrast: 110,
        saturation: 0,
      },
    },
    {
      id: "sepia",
      name: "Sepia",
      values: {
        grayscale: 0,
        sepia: 80,
        brightness: 105,
        contrast: 105,
        saturation: 90,
      },
    },
    {
      id: "vivid",
      name: "Vivid",
      values: {
        grayscale: 0,
        sepia: 0,
        brightness: 105,
        contrast: 120,
        saturation: 130,
      },
    },
    {
      id: "cool",
      name: "Cool",
      values: {
        grayscale: 20,
        sepia: 0,
        brightness: 100,
        contrast: 110,
        saturation: 80,
      },
    },
    {
      id: "warm",
      name: "Warm",
      values: {
        grayscale: 0,
        sepia: 30,
        brightness: 105,
        contrast: 105,
        saturation: 110,
      },
    },
    {
      id: "dramatic",
      name: "Dramatic",
      values: {
        grayscale: 0,
        sepia: 10,
        brightness: 105,
        contrast: 140,
        saturation: 110,
      },
    },
    {
      id: "muted",
      name: "Muted",
      values: {
        grayscale: 10,
        sepia: 10,
        brightness: 95,
        contrast: 90,
        saturation: 70,
      },
    },
  ];

  // Apply filter preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = filterPresets.find((p) => p.id === presetId);
      if (preset) {
        setSelectedPreset(presetId);

        // Update preview values for UI
        setFilterPreviewValues(preset.values as typeof videoFilters);

        // Apply each filter value from the preset to the store
        Object.entries(preset.values).forEach(([filter, value]) => {
          setFilter(filter as VideoFilter, value as number);
        });

        // Preview changes
        handleApplyFilters();
      }
    },
    [setFilter]
  );

  // Check if current filters match a preset
  const checkIfMatchesPreset = useCallback(() => {
    for (const preset of filterPresets) {
      let matches = true;

      for (const [filter, value] of Object.entries(preset.values)) {
        if (videoFilters[filter as VideoFilter] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return preset.id;
      }
    }

    return null;
  }, [videoFilters, filterPresets]);

  // Update selected preset when filters change
  useEffect(() => {
    setSelectedPreset(checkIfMatchesPreset());
  }, [videoFilters, checkIfMatchesPreset]);

  // Initialize filter preview values
  useEffect(() => {
    setFilterPreviewValues({ ...videoFilters });
  }, [videoFilters]);

  // Handle individual filter change
  const handleFilterChange = useCallback(
    (filter: VideoFilter, value: number) => {
      applyFilterChanges(filter, value);
      setSelectedPreset(null); // Clear selected preset as we're making custom adjustments
    },
    [applyFilterChanges]
  );

  // Apply all filters and preview
  const handleApplyFilters = async () => {
    if (isApplying) return;

    setIsApplying(true);
    try {
      await previewEdit("filters");
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setIsApplying(false);
    }
  };

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    applyPreset("original");
  }, [applyPreset]);

  // Format slider value for display
  const formatSliderValue = useCallback(
    (filter: VideoFilter, value: number) => {
      switch (filter) {
        case "grayscale":
        case "sepia":
          return `${value}%`;
        case "brightness":
        case "contrast":
        case "saturation":
          return value === 100 ? "1.0" : (value / 100).toFixed(2);
        default:
          return value;
      }
    },
    []
  );

  // Get filter range and default based on filter type
  const getFilterRange = useCallback((filter: VideoFilter) => {
    switch (filter) {
      case "grayscale":
      case "sepia":
        return { min: 0, max: 100, step: 5, default: 0 };
      case "brightness":
      case "contrast":
      case "saturation":
        return { min: 50, max: 150, step: 5, default: 100 };
      default:
        return { min: 0, max: 100, step: 1, default: 0 };
    }
  }, []);

  // Get a nice display name for filter
  const getFilterDisplayName = useCallback((filter: VideoFilter) => {
    switch (filter) {
      case "grayscale":
        return "Grayscale";
      case "sepia":
        return "Sepia";
      case "brightness":
        return "Brightness";
      case "contrast":
        return "Contrast";
      case "saturation":
        return "Saturation";
      default:
        return filter.charAt(0).toUpperCase() + filter.slice(1);
    }
  }, []);

  // Cleanup preview generation on unmount
  useEffect(() => {
    return () => {
      if (previewDebounceTimeout) {
        clearTimeout(previewDebounceTimeout);
      }
    };
  }, [previewDebounceTimeout]);

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Video Filters</h2>

          {/* Apply button */}
          {/* <button
            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
              isApplying
                ? isDarkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-500"
                : isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
            } ${isApplying ? "cursor-not-allowed" : ""}`}
            onClick={handleApplyFilters}
            disabled={isApplying}
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
          </button> */}
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Apply and adjust video filters
        </p>
      </div>

      {/* Filter Presets */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium mb-3">Filter Presets</h3>
        <div className="grid grid-cols-4 gap-2">
          {filterPresets.map((preset) => (
            <button
              key={preset.id}
              className={`rounded-md p-1 flex flex-col items-center transition-all ${
                selectedPreset === preset.id
                  ? isDarkMode
                    ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900"
                    : "bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => applyPreset(preset.id)}
            >
              <div
                className={`w-14 h-10 mb-1 rounded-md overflow-hidden ${
                  preset.id === "original"
                    ? isDarkMode
                      ? "border border-gray-700"
                      : "border border-gray-300"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    preset.id === "original" ? "transparent" : undefined,
                  filter: `
                    grayscale(${preset.values.grayscale / 100})
                    sepia(${preset.values.sepia / 100})
                    brightness(${preset.values.brightness / 100})
                    contrast(${preset.values.contrast / 100})
                    saturate(${preset.values.saturation / 100})
                  `,
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzYwN2Q4YiIgZD0iTTguNSAxMy41TDExIDExTDEzLjUgMTMuNUwxNyA5Ljc1TDIxIDEzLjVWMTkuNUgzVjEzLjVMNy41IDlMMTEuNSAxM1oiLz48Y2lyY2xlIGN4PSI3IiBjeT0iOCIgcj0iMiIgZmlsbD0iIzYwN2Q4YiIvPjwvc3ZnPg==')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <span className="text-xs whitespace-nowrap">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Advanced Adjustments</h3>

          {/* Compare toggle */}
          <button
            className={`flex items-center text-xs rounded-full py-1 px-2 ${
              showCompareSplitView
                ? isDarkMode
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white"
                : isDarkMode
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-200 text-gray-600"
            }`}
            onClick={() => setShowCompareSplitView(!showCompareSplitView)}
          >
            <svg
              className="w-3.5 h-3.5 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3v2a5 5 0 00-3.54 8.54l-1.41 1.41A7 7 0 0110 3zm0 16a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M20 10a10 10 0 01-17.54 6.54l1.41-1.41A8 8 0 0010 4V2a10 10 0 0110 8z" />
            </svg>
            {showCompareSplitView ? "Compare: ON" : "Compare: OFF"}
          </button>
        </div>

        {/* Filter sliders */}
        {Object.entries(filterPreviewValues)
          .filter(([filter]) => filter !== "none")
          .map(([filter, value]) => {
            const filterInfo = getFilterRange(filter as VideoFilter);
            const displayName = getFilterDisplayName(filter as VideoFilter);
            const formattedValue = formatSliderValue(
              filter as VideoFilter,
              value
            );

            return (
              <div key={filter} className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium">{displayName}</label>
                  <div
                    className={`text-xs px-2 py-0.5 rounded ${
                      value !== filterInfo.default
                        ? isDarkMode
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                        : isDarkMode
                          ? "bg-gray-800 text-gray-400"
                          : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {formattedValue}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className={`p-1 rounded ${
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"
                    }`}
                    onClick={() =>
                      handleFilterChange(
                        filter as VideoFilter,
                        Math.max(filterInfo.min, value - filterInfo.step)
                      )
                    }
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <input
                    type="range"
                    min={filterInfo.min}
                    max={filterInfo.max}
                    step={filterInfo.step}
                    value={value}
                    onChange={(e) =>
                      handleFilterChange(
                        filter as VideoFilter,
                        Number(e.target.value)
                      )
                    }
                    className="flex-1"
                  />

                  <button
                    className={`p-1 rounded ${
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"
                    }`}
                    onClick={() =>
                      handleFilterChange(
                        filter as VideoFilter,
                        Math.min(filterInfo.max, value + filterInfo.step)
                      )
                    }
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <button
                    className={`p-1 text-xs ${
                      value !== filterInfo.default
                        ? isDarkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      handleFilterChange(
                        filter as VideoFilter,
                        filterInfo.default
                      )
                    }
                    disabled={value === filterInfo.default}
                  >
                    Reset
                  </button>
                </div>
              </div>
            );
          })}

        {/* Preview of filters */}
        <div
          className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <h4 className="text-xs font-medium mb-3">Filter Preview</h4>
          <div
            className="h-20 rounded-md overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500"
            style={{
              filter: `
                grayscale(${filterPreviewValues.grayscale / 100})
                sepia(${filterPreviewValues.sepia / 100})
                brightness(${filterPreviewValues.brightness / 100})
                contrast(${filterPreviewValues.contrast / 100})
                saturate(${filterPreviewValues.saturation / 100})
              `,
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="p-3 bg-white/30 backdrop-blur-sm rounded text-white text-xs font-medium">
                Preview {selectedPreset ? `(${selectedPreset})` : "(Custom)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset All Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            Object.entries(videoFilters).some(([filter, value]) => {
              const defaultValue = getFilterRange(
                filter as VideoFilter
              ).default;
              return value !== defaultValue;
            })
              ? isDarkMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
              : isDarkMode
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={resetFilters}
          disabled={
            !Object.entries(videoFilters).some(([filter, value]) => {
              const defaultValue = getFilterRange(
                filter as VideoFilter
              ).default;
              return value !== defaultValue;
            })
          }
        >
          Reset All Filters
        </button>

        <p className="text-xs text-center mt-2 opacity-70">
          Tip: Try the presets first, then fine-tune with the sliders
        </p>
      </div>
    </div>
  );
});

export default FiltersPanel;
