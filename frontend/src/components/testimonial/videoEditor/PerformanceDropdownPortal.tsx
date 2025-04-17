import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";

interface PerformanceOption {
  id: "performance" | "balanced" | "quality";
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface PerformanceDropdownPortalProps {
  showPerformanceOptions: boolean;
  setShowPerformanceOptions: (show: boolean) => void;
  handlePerformanceChange: (preset: string) => void;
  useHighPerformanceMode: boolean;
  qualityPreset: string;
  isDarkMode: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

interface DropdownPosition {
  top: number;
  right: number;
  width: number;
}

interface PerformanceDropdownProps {
  isDarkMode: boolean;
  showPerformanceOptions: boolean;
  setShowPerformanceOptions: (show: boolean) => void;
  handlePerformanceChange: (preset: string) => void;
  useHighPerformanceMode: boolean;
  qualityPreset: string;
}

// Create a Portal component for the dropdown
const PerformanceDropdownPortal: React.FC<PerformanceDropdownPortalProps> = ({
  showPerformanceOptions,
  setShowPerformanceOptions,
  handlePerformanceChange,
  useHighPerformanceMode,
  qualityPreset,
  isDarkMode,
  buttonRef,
}) => {
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    right: 0,
    width: 0,
  });

  useEffect(() => {
    if (buttonRef.current && showPerformanceOptions) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
        width: Math.max(rect.width, 240), // Minimum width for dropdown
      });
    }
  }, [showPerformanceOptions, buttonRef]);

  if (!showPerformanceOptions) return null;

  const performanceOptions: PerformanceOption[] = [
    {
      id: "performance",
      label: "Performance Mode",
      description: "Lower quality, better performance",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "balanced",
      label: "Balanced Mode",
      description: "Recommended for most devices",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
    },
    {
      id: "quality",
      label: "Quality Mode",
      description: "High quality, needs more power",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
  ];

  return ReactDOM.createPortal(
    <>
      {/* Overlay to capture clicks outside */}
      <div
        className="fixed inset-0 h-full w-full z-[9999]"
        onClick={() => setShowPerformanceOptions(false)}
      />

      {/* The actual dropdown */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15 }}
        className={`fixed shadow-xl z-[10000] rounded-lg overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          width: "240px",
        }}
      >
        <div className="py-1">
          {performanceOptions.map((option) => (
            <button
              key={option.id}
              className={`flex items-start w-full px-4 py-3 text-sm text-left transition-colors duration-150 ${
                (option.id === "performance" && useHighPerformanceMode) ||
                (option.id === "balanced" &&
                  !useHighPerformanceMode &&
                  qualityPreset === "balanced") ||
                (option.id === "quality" &&
                  !useHighPerformanceMode &&
                  qualityPreset === "high")
                  ? isDarkMode
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-blue-50 text-blue-700"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700/50"
                    : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handlePerformanceChange(option.id)}
            >
              <div
                className={`mr-3 p-1.5 rounded-md ${
                  (option.id === "performance" && useHighPerformanceMode) ||
                  (option.id === "balanced" &&
                    !useHighPerformanceMode &&
                    qualityPreset === "balanced") ||
                  (option.id === "quality" &&
                    !useHighPerformanceMode &&
                    qualityPreset === "high")
                    ? isDarkMode
                      ? "bg-blue-600"
                      : "bg-blue-100"
                    : isDarkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    (option.id === "performance" && useHighPerformanceMode) ||
                    (option.id === "balanced" &&
                      !useHighPerformanceMode &&
                      qualityPreset === "balanced") ||
                    (option.id === "quality" &&
                      !useHighPerformanceMode &&
                      qualityPreset === "high")
                      ? isDarkMode
                        ? "text-blue-300"
                        : "text-blue-600"
                      : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                  }`}
                >
                  {option.description}
                </div>
              </div>
              {/* Selected indicator */}
              {((option.id === "performance" && useHighPerformanceMode) ||
                (option.id === "balanced" &&
                  !useHighPerformanceMode &&
                  qualityPreset === "balanced") ||
                (option.id === "quality" &&
                  !useHighPerformanceMode &&
                  qualityPreset === "high")) && (
                <svg
                  className={`w-5 h-5 ml-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </>,
    document.body
  );
};

// Modified Performance Dropdown component to use in your VideoEditor component
const PerformanceDropdown: React.FC<PerformanceDropdownProps> = observer(
  ({
    isDarkMode,
    showPerformanceOptions,
    setShowPerformanceOptions,
    handlePerformanceChange,
    useHighPerformanceMode,
    qualityPreset,
  }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="relative">
        <button
          ref={buttonRef}
          className={`p-2 rounded-md text-sm flex items-center ${
            isDarkMode
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setShowPerformanceOptions(!showPerformanceOptions)}
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="hidden sm:inline">Performance</span>
          <svg
            className={`w-4 h-4 ml-1 transition-transform ${showPerformanceOptions ? "rotate-180" : ""}`}
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
          {showPerformanceOptions && (
            <PerformanceDropdownPortal
              showPerformanceOptions={showPerformanceOptions}
              setShowPerformanceOptions={setShowPerformanceOptions}
              handlePerformanceChange={handlePerformanceChange}
              useHighPerformanceMode={useHighPerformanceMode}
              qualityPreset={qualityPreset}
              isDarkMode={isDarkMode}
              buttonRef={buttonRef}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export default PerformanceDropdown;
