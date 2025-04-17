import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { AudioEditMode } from "../../../repo/managers/audio_editor";
import { workspaceHub } from "../../../repo/workspace_hub";

interface ToolButton {
  id: AudioEditMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  shortcut?: string;
}

const AudioEditorToolbar: React.FC = observer(() => {
  const { audioEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    activeEditMode,
    setEditMode,
    undo,
    redo,
    editHistory,
    historyIndex,
    isPlaying,
    play,
    pause,
    showSubtitles,
    toggleSubtitles,
    duration,
    currentTime,
  } = audioEditorManager;

  const [hoveredTool, setHoveredTool] = useState<AudioEditMode | null>(null);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tool buttons configuration
  const toolButtons: ToolButton[] = [
    {
      id: "trim",
      label: "Trim",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: "Trim audio duration",
      shortcut: "T",
    },
    {
      id: "enhance",
      label: "Enhance",
      icon: (
        <svg
          className="w-5 h-5"
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
      description: "Enhance audio quality",
      shortcut: "E",
    },
    {
      id: "noise-reduction",
      label: "Noise",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 010-7.07m-2.829 9.9a9 9 0 010-12.73"
          />
        </svg>
      ),
      description: "Reduce background noise",
      shortcut: "N",
    },
    {
      id: "normalize",
      label: "Volume",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 010-7.07m-2.829 9.9a9 9 0 010-12.73"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 12l2 2 2-2m-2-2v4"
          />
        </svg>
      ),
      description: "Normalize volume levels",
      shortcut: "V",
    },
    {
      id: "effects",
      label: "Effects",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
      description: "Apply audio effects",
      shortcut: "F",
    },
    {
      id: "subtitles",
      label: "Subtitles",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
      description: "Add and edit subtitles/transcript",
      shortcut: "S",
    },
  ];

  // Toggle edit mode
  const toggleEditMode = (mode: AudioEditMode) => {
    if (activeEditMode === mode) {
      setEditMode(null);
    } else {
      setEditMode(mode);
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle setting the playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    audioEditorManager.setPlaybackRate(speed);
    setShowSpeedOptions(false);
  };

  return (
    <div
      className={`p-2 sm:px-4 py-2 flex items-center justify-between z-20 border-b transition-colors duration-150 ${
        isDarkMode
          ? "bg-gray-800/95 backdrop-blur-md shadow-lg border-gray-700/50"
          : "bg-white/95 backdrop-blur-md shadow-lg border-gray-200/50"
      }`}
    >
      {/* Left side toolbar */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center overflow-hidden">
          <motion.button
            whileHover={
              historyIndex > 0
                ? {
                    scale: 1.05,
                    backgroundColor: isDarkMode
                      ? "rgba(55, 65, 81, 0.9)"
                      : "rgba(243, 244, 246, 0.9)",
                  }
                : {}
            }
            whileTap={historyIndex > 0 ? { scale: 0.95 } : {}}
            className={`p-1.5 rounded-l-md ${
              historyIndex > 0
                ? isDarkMode
                  ? "text-white bg-gray-800/70 hover:bg-gray-700"
                  : "text-gray-700 bg-gray-100/70 hover:bg-gray-200"
                : isDarkMode
                  ? "text-gray-600 bg-gray-800/50 cursor-not-allowed"
                  : "text-gray-300 bg-gray-100/50 cursor-not-allowed"
            }`}
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </motion.button>
          <motion.button
            whileHover={
              historyIndex < editHistory.length - 1
                ? {
                    scale: 1.05,
                    backgroundColor: isDarkMode
                      ? "rgba(55, 65, 81, 0.9)"
                      : "rgba(243, 244, 246, 0.9)",
                  }
                : {}
            }
            whileTap={
              historyIndex < editHistory.length - 1 ? { scale: 0.95 } : {}
            }
            className={`p-1.5 rounded-r-md ${
              historyIndex < editHistory.length - 1
                ? isDarkMode
                  ? "text-white bg-gray-800/70 hover:bg-gray-700"
                  : "text-gray-700 bg-gray-100/70 hover:bg-gray-200"
                : isDarkMode
                  ? "text-gray-600 bg-gray-800/50 cursor-not-allowed"
                  : "text-gray-300 bg-gray-100/50 cursor-not-allowed"
            }`}
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </motion.button>
        </div>

        <div className="h-8 border-l border-gray-300 dark:border-gray-600 opacity-30"></div>

        {/* Play/Pause button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => (isPlaying ? pause() : play())}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </motion.button>

        {/* Rewind 5s */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => audioEditorManager.seek(Math.max(0, currentTime - 5))}
          title="Rewind 5 seconds"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.555-16.168A1 1 0 0111 2v5a1 1 0 01-1 1H7.237a1 1 0 00-.753.343L5.5 9.342l-.975-.974a1 1 0 111.414-1.414l.264.263V5a1 1 0 011-1h2.343a1 1 0 00.753-.343l.53-.53zM11 14a1 1 0 01-1 1H7.5a1 1 0 110-2H10v-1.5a1 1 0 112 0V13a1 1 0 01-1 1z"
              clipRule="evenodd"
              transform="rotate(260, 10, 10)"
            />
          </svg>
        </motion.button>

        {/* Forward 5s */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() =>
            audioEditorManager.seek(Math.min(duration, currentTime + 5))
          }
          title="Forward 5 seconds"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.555-16.168A1 1 0 0111 2v5a1 1 0 01-1 1H7.237a1 1 0 00-.753.343L5.5 9.342l-.975-.974a1 1 0 111.414-1.414l.264.263V5a1 1 0 011-1h2.343a1 1 0 00.753-.343l.53-.53zM11 14a1 1 0 01-1 1H7.5a1 1 0 110-2H10v-1.5a1 1 0 112 0V13a1 1 0 01-1 1z"
              clipRule="evenodd"
              transform="rotate(85, 10, 10)"
            />
          </svg>
        </motion.button>

        {/* Subtitles Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-md ${
            showSubtitles
              ? isDarkMode
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={toggleSubtitles}
          title={showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.191 10.053a.656.656 0 00-.191-.463l-.037-.036a12.365 12.365 0 00-1.552-1.359 3.93 3.93 0 001.165-2.802c0-2.193-1.786-3.979-3.979-3.979h-4.712c-2.193 0-3.979 1.786-3.979 3.979 0 1.106.447 2.086 1.165 2.802a12.404 12.404 0 00-1.535 1.33l-.037.037a.653.653 0 00-.19.462c0 .18.073.34.19.462l.037.036a12.412 12.412 0 003.08 2.11 3.939 3.939 0 00-.71 2.256c0 2.193 1.786 3.979 3.979 3.979h4.712c2.193 0 3.979-1.786 3.979-3.979 0-.834-.249-1.607-.71-2.256a12.373 12.373 0 003.08-2.11l.037-.036a.658.658 0 00.208-.462zM8.885 6.052h2.214c.69 0 1.254.563 1.254 1.254a1.26 1.26 0 01-1.254 1.254H8.885a1.26 1.26 0 01-1.254-1.254c0-.708.564-1.254 1.254-1.254zm2.214 7.895H8.885a1.26 1.26 0 01-1.254-1.254c0-.708.564-1.254 1.254-1.254h2.214c.69 0 1.254.563 1.254 1.254a1.26 1.26 0 01-1.254 1.254z" />
          </svg>
        </motion.button>

        {/* Playback Speed Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded-md flex items-center ${
              isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            title="Playback Speed"
          >
            <span className="text-xs font-mono mr-1">{playbackSpeed}x</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>

          <AnimatePresence>
            {showSpeedOptions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute top-full left-0 mt-1 z-50 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-md shadow-lg ring-1 ring-black ring-opacity-5`}
              >
                <div className="py-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      className={`px-4 py-2 text-sm w-full text-left ${
                        playbackSpeed === speed
                          ? isDarkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-800"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time display */}
        <div
          className={`hidden sm:flex items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Center Toolbar - Edit Tools */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        {toolButtons.map((tool) => (
          <div key={tool.id} className="relative">
            <motion.button
              className={`p-1.5 flex flex-col items-center rounded-lg transition-colors ${
                activeEditMode === tool.id
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => toggleEditMode(tool.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${tool.description}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
            >
              {tool.icon}
              <span className="text-xs mt-1 hidden sm:inline">
                {tool.label}
              </span>
              {tool.shortcut && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {tool.shortcut}
                </span>
              )}
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredTool === tool.id && !activeEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute z-30 w-40 bottom-full left-1/2 -translate-x-1/2 px-2 py-1 mb-1 rounded-md text-xs shadow-lg ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300"
                      : "bg-white text-gray-700"
                  } border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  {tool.description}
                  {tool.shortcut && (
                    <span className="block mt-1 opacity-70">
                      Shortcut: {tool.shortcut}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Right Toolbar - Export */}
      <div className="flex items-center space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-1.5 rounded-lg hidden md:flex items-center gap-2 font-medium ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20"
          }`}
          onClick={() => setEditMode("export")}
        >
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </motion.button>

        {/* Mobile export button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-1.5 rounded-full md:hidden ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
          }`}
          onClick={() => setEditMode("export")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
});

export default AudioEditorToolbar;
