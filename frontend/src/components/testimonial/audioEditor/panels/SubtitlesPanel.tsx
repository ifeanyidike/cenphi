import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { AudioSubtitle } from "../../../../repo/managers/audio_editor";

interface SubtitlesPanelProps {
  onSuccess?: (message: string) => void;
}

const SubtitlesPanel: React.FC<SubtitlesPanelProps> = observer(
  ({ onSuccess }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const {
      subtitles,
      addSubtitle,
      updateSubtitle,
      activeSubtitleId,
      setActiveSubtitle,
      currentTime,
      duration,
      seek,
      applyEdit,
    } = audioEditorManager;

    const [editMode, setEditMode] = useState<"list" | "edit" | "transcript">(
      "list"
    );
    const [newSubtitleText, setNewSubtitleText] = useState("");
    const [transcriptText, setTranscriptText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [sortOption, setSortOption] = useState<"time" | "length">("time");
    const [showStyleOptions, setShowStyleOptions] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] =
      useState<AudioSubtitle | null>(null);
    const transcriptRef = useRef<HTMLTextAreaElement>(null);

    // Initialize transcript text from existing subtitles
    useEffect(() => {
      if (
        editMode === "transcript" &&
        !transcriptText &&
        subtitles.length > 0
      ) {
        const text = subtitles
          .sort((a, b) => a.startTime - b.startTime)
          .map((s) => s.text)
          .join("\n\n");
        setTranscriptText(text);
      }
    }, [editMode, transcriptText, subtitles]);

    // Handle AI generation of subtitles
    const generateSubtitles = async () => {
      setIsGenerating(true);

      try {
        await applyEdit("subtitles");
        if (onSuccess) {
          onSuccess("Subtitles generated successfully");
        }
      } catch (error) {
        console.error("Error generating subtitles:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Add a new subtitle at the current time
    const handleAddSubtitle = () => {
      if (!newSubtitleText.trim()) return;

      const startTime = currentTime;
      // Estimate an appropriate end time - either 5 seconds later or the end of the audio
      const endTime = Math.min(startTime + 5, duration);

      const subtitle = addSubtitle(startTime, endTime, newSubtitleText);
      setNewSubtitleText("");
      setActiveSubtitle(subtitle.id);
      setSelectedSubtitle(subtitle);
      setEditMode("edit");

      if (onSuccess) {
        onSuccess("Subtitle added");
      }
    };

    // Save edited subtitle
    const saveSubtitleEdit = () => {
      if (!selectedSubtitle) return;

      updateSubtitle(selectedSubtitle.id, {
        text: selectedSubtitle.text,
        startTime: selectedSubtitle.startTime,
        endTime: selectedSubtitle.endTime,
        style: selectedSubtitle.style,
      });

      setEditMode("list");
      if (onSuccess) {
        onSuccess("Subtitle updated");
      }
    };

    // Parse transcript text into individual subtitles
    const parseTranscript = () => {
      if (!transcriptText.trim()) return;

      setIsImporting(true);

      // Split by double newline or period
      const segments = transcriptText
        .split(/\n\n|\.\s+/)
        .filter((text) => text.trim().length > 0)
        .map((text) => text.trim());

      // Calculate time distribution
      const segmentDuration = duration / segments.length;

      // Clear existing subtitles (would need confirmation in real app)
      // For this demo we'll just add the new ones

      // Create subtitles with evenly distributed times
      segments.forEach((text, index) => {
        const startTime = index * segmentDuration;
        const endTime = Math.min((index + 1) * segmentDuration, duration);

        addSubtitle(startTime, endTime, text);
      });

      setEditMode("list");
      setIsImporting(false);

      if (onSuccess) {
        onSuccess(`${segments.length} subtitles created from transcript`);
      }
    };

    // Format time as MM:SS.MS
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 10);
      return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
    };

    // Sort subtitles based on the selected sort option
    const sortedSubtitles = [...subtitles].sort((a, b) => {
      if (sortOption === "time") {
        return a.startTime - b.startTime;
      } else {
        // sort by length
        return b.text.length - a.text.length;
      }
    });

    // Render different views based on edit mode
    const renderEditModeContent = () => {
      switch (editMode) {
        case "edit":
          return (
            <div className="space-y-4">
              {selectedSubtitle && (
                <>
                  <div className="flex justify-between items-center">
                    <h3
                      className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      Edit Subtitle
                    </h3>
                    <button
                      className={`p-1.5 rounded-full ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      }`}
                      onClick={() => setEditMode("list")}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Text
                      </label>
                      <textarea
                        className={`w-full px-3 py-2 rounded-md resize-none ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        rows={4}
                        value={selectedSubtitle.text}
                        onChange={(e) =>
                          setSelectedSubtitle({
                            ...selectedSubtitle,
                            text: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1.5 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Start Time
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            className={`w-full px-3 py-2 rounded-l-md ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            value={formatTime(selectedSubtitle.startTime)}
                            onChange={(e) => {
                              const timeComponents = e.target.value
                                .split(/[:.]/)
                                .map(Number);
                              let newTime = 0;
                              if (timeComponents.length === 3) {
                                // MM:SS.MS
                                newTime =
                                  timeComponents[0] * 60 +
                                  timeComponents[1] +
                                  timeComponents[2] * 0.1;
                              } else if (timeComponents.length === 2) {
                                // MM:SS
                                newTime =
                                  timeComponents[0] * 60 + timeComponents[1];
                              }

                              if (
                                !isNaN(newTime) &&
                                newTime >= 0 &&
                                newTime < selectedSubtitle.endTime
                              ) {
                                setSelectedSubtitle({
                                  ...selectedSubtitle,
                                  startTime: newTime,
                                });
                              }
                            }}
                          />
                          <button
                            className={`px-2 rounded-r-md ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-gray-200 border-l-0"
                                : "bg-gray-100 border-gray-300 text-gray-700 border-l-0"
                            } border`}
                            onClick={() => {
                              setSelectedSubtitle({
                                ...selectedSubtitle,
                                startTime: currentTime,
                              });
                            }}
                            title="Use current time"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1.5 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          End Time
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            className={`w-full px-3 py-2 rounded-l-md ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            value={formatTime(selectedSubtitle.endTime)}
                            onChange={(e) => {
                              const timeComponents = e.target.value
                                .split(/[:.]/)
                                .map(Number);
                              let newTime = 0;
                              if (timeComponents.length === 3) {
                                // MM:SS.MS
                                newTime =
                                  timeComponents[0] * 60 +
                                  timeComponents[1] +
                                  timeComponents[2] * 0.1;
                              } else if (timeComponents.length === 2) {
                                // MM:SS
                                newTime =
                                  timeComponents[0] * 60 + timeComponents[1];
                              }

                              if (
                                !isNaN(newTime) &&
                                newTime > selectedSubtitle.startTime &&
                                newTime <= duration
                              ) {
                                setSelectedSubtitle({
                                  ...selectedSubtitle,
                                  endTime: newTime,
                                });
                              }
                            }}
                          />
                          <button
                            className={`px-2 rounded-r-md ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-gray-200 border-l-0"
                                : "bg-gray-100 border-gray-300 text-gray-700 border-l-0"
                            } border`}
                            onClick={() => {
                              setSelectedSubtitle({
                                ...selectedSubtitle,
                                endTime: currentTime,
                              });
                            }}
                            title="Use current time"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        className={`text-sm font-medium flex items-center ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                        onClick={() => setShowStyleOptions(!showStyleOptions)}
                      >
                        <svg
                          className={`w-4 h-4 mr-1 transition-transform ${
                            showStyleOptions ? "rotate-90" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Style Options
                      </button>

                      <AnimatePresence>
                        {showStyleOptions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  className={`block text-xs font-medium mb-1 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Position
                                </label>
                                <select
                                  className={`w-full px-2 py-1.5 rounded-md text-sm ${
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                  value={selectedSubtitle.position}
                                  onChange={(e) =>
                                    setSelectedSubtitle({
                                      ...selectedSubtitle,
                                      position: e.target.value as
                                        | "top"
                                        | "middle"
                                        | "bottom",
                                    })
                                  }
                                >
                                  <option value="top">Top</option>
                                  <option value="middle">Middle</option>
                                  <option value="bottom">Bottom</option>
                                </select>
                              </div>

                              <div>
                                <label
                                  className={`block text-xs font-medium mb-1 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Font
                                </label>
                                <select
                                  className={`w-full px-2 py-1.5 rounded-md text-sm ${
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                  value={selectedSubtitle.style.fontFamily}
                                  onChange={(e) =>
                                    setSelectedSubtitle({
                                      ...selectedSubtitle,
                                      style: {
                                        ...selectedSubtitle.style,
                                        fontFamily: e.target.value,
                                      },
                                    })
                                  }
                                >
                                  <option value="Arial">Arial</option>
                                  <option value="Helvetica">Helvetica</option>
                                  <option value="Times New Roman">
                                    Times New Roman
                                  </option>
                                  <option value="Courier New">
                                    Courier New
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div>
                                <label
                                  className={`block text-xs font-medium mb-1 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Text Color
                                </label>
                                <input
                                  type="color"
                                  className="w-full h-8 rounded cursor-pointer"
                                  value={selectedSubtitle.style.color}
                                  onChange={(e) =>
                                    setSelectedSubtitle({
                                      ...selectedSubtitle,
                                      style: {
                                        ...selectedSubtitle.style,
                                        color: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <label
                                  className={`block text-xs font-medium mb-1 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Background
                                </label>
                                <input
                                  type="color"
                                  className="w-full h-8 rounded cursor-pointer"
                                  value={selectedSubtitle.style.backgroundColor.replace(
                                    /rgba\((.*),\s*[\d.]+\)/,
                                    "rgb($1)"
                                  )}
                                  onChange={(e) => {
                                    // Convert RGB to RGBA with existing opacity
                                    const rgb = e.target.value;
                                    const r = parseInt(rgb.slice(1, 3), 16);
                                    const g = parseInt(rgb.slice(3, 5), 16);
                                    const b = parseInt(rgb.slice(5, 7), 16);
                                    const a = selectedSubtitle.style.opacity;
                                    const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;

                                    setSelectedSubtitle({
                                      ...selectedSubtitle,
                                      style: {
                                        ...selectedSubtitle.style,
                                        backgroundColor: rgba,
                                      },
                                    });
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  className={`block text-xs font-medium mb-1 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Opacity
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  className="w-full h-8 rounded cursor-pointer"
                                  value={selectedSubtitle.style.opacity}
                                  onChange={(e) => {
                                    const opacity = parseFloat(e.target.value);
                                    // Update opacity and background color
                                    const bgColor =
                                      selectedSubtitle.style.backgroundColor;
                                    const newBgColor = bgColor.replace(
                                      /rgba\((.*?),\s*[\d.]+\)/,
                                      `rgba($1, ${opacity})`
                                    );

                                    setSelectedSubtitle({
                                      ...selectedSubtitle,
                                      style: {
                                        ...selectedSubtitle.style,
                                        opacity: opacity,
                                        backgroundColor: newBgColor,
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        className={`py-2 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() => seek(selectedSubtitle.startTime)}
                      >
                        Jump to Start
                      </button>

                      <button
                        className={`py-2 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() => seek(selectedSubtitle.endTime - 0.1)}
                      >
                        Jump to End
                      </button>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                      <button
                        className={`w-full py-2 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        onClick={saveSubtitleEdit}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );

        case "transcript":
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3
                  className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Edit Transcript
                </h3>
                <button
                  className={`p-1.5 rounded-full ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                  onClick={() => setEditMode("list")}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Edit the full transcript. Each paragraph will become a separate
                subtitle.
              </p>

              <textarea
                ref={transcriptRef}
                className={`w-full px-3 py-2 rounded-md resize-none ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                rows={10}
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Enter your transcript here. Split paragraphs with blank lines to create separate subtitles."
              />

              <div className="flex justify-end space-x-3">
                <button
                  className={`py-2 px-3 rounded-md text-sm font-medium ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setEditMode("list")}
                >
                  Cancel
                </button>

                <button
                  className={`py-2 px-4 rounded-md text-sm font-medium flex items-center ${
                    isImporting || !transcriptText.trim()
                      ? isDarkMode
                        ? "bg-blue-800/50 text-blue-300 cursor-not-allowed"
                        : "bg-blue-300 text-white cursor-not-allowed"
                      : isDarkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  onClick={parseTranscript}
                  disabled={isImporting || !transcriptText.trim()}
                >
                  {isImporting ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4 mr-2"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing
                    </>
                  ) : (
                    "Create Subtitles"
                  )}
                </button>
              </div>
            </div>
          );

        case "list":
        default:
          return (
            <div>
              {/* Header with action buttons */}
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {subtitles.length
                    ? `${subtitles.length} Subtitle${subtitles.length === 1 ? "" : "s"}`
                    : "No Subtitles"}
                </h3>

                <div className="flex items-center space-x-2">
                  <select
                    className={`text-xs rounded px-2 py-1 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700 text-gray-300"
                        : "bg-white border-gray-300 text-gray-700"
                    } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                  >
                    <option value="time">Sort by Time</option>
                    <option value="length">Sort by Length</option>
                  </select>

                  <button
                    className={`p-1.5 rounded-full ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    }`}
                    onClick={() => setEditMode("transcript")}
                    title="Edit Full Transcript"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Auto-generate button for empty state */}
              {subtitles.length === 0 ? (
                <div
                  className={`p-6 rounded-lg border-2 border-dashed flex flex-col items-center ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800/50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 mb-3 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
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
                  <p
                    className={`text-sm mb-4 text-center ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No subtitles yet. Generate automatically or create manually.
                  </p>
                  <div className="space-y-2 w-full">
                    <button
                      className={`w-full py-2 rounded-md text-sm font-medium flex items-center justify-center ${
                        isGenerating
                          ? isDarkMode
                            ? "bg-blue-800/50 text-blue-300 cursor-not-allowed"
                            : "bg-blue-300 text-white cursor-not-allowed"
                          : isDarkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                      onClick={generateSubtitles}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4 mr-2"
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Generating Subtitles...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Auto-Generate Subtitles
                        </>
                      )}
                    </button>

                    <button
                      className={`w-full py-2 rounded-md text-sm font-medium ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setEditMode("transcript")}
                    >
                      Enter Transcript Manually
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Subtitle list */}
                  <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                    {sortedSubtitles.map((subtitle) => (
                      <div
                        key={subtitle.id}
                        className={`p-3 rounded-lg border ${
                          subtitle.id === activeSubtitleId
                            ? isDarkMode
                              ? "bg-blue-900/20 border-blue-700"
                              : "bg-blue-50 border-blue-300"
                            : isDarkMode
                              ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                        } cursor-pointer transition-colors duration-150`}
                        onClick={() => {
                          setActiveSubtitle(subtitle.id);
                          setSelectedSubtitle(subtitle);
                          setEditMode("edit");
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div
                            className={`text-xs font-mono ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {formatTime(subtitle.startTime)} -{" "}
                            {formatTime(subtitle.endTime)}
                          </div>
                          <button
                            className={`p-1 rounded-full ${
                              isDarkMode
                                ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                                : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              seek(subtitle.startTime);
                            }}
                            title="Jump to this subtitle"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                        <p
                          className={`mt-1 text-sm line-clamp-2 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {subtitle.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add subtitle form */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className={`flex-1 px-3 py-2 rounded-md ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        placeholder="Add new subtitle at current time..."
                        value={newSubtitleText}
                        onChange={(e) => setNewSubtitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSubtitleText.trim()) {
                            handleAddSubtitle();
                          }
                        }}
                      />
                      <button
                        className={`px-3 py-2 rounded-md ${
                          !newSubtitleText.trim()
                            ? isDarkMode
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : isDarkMode
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        onClick={handleAddSubtitle}
                        disabled={!newSubtitleText.trim()}
                      >
                        Add
                      </button>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Press Enter to add subtitle at {formatTime(currentTime)}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
      }
    };

    return (
      <div
        className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Subtitles</h2>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Add and edit subtitles for your audio
          </p>
        </div>

        {/* Panel Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {renderEditModeContent()}
        </div>
      </div>
    );
  }
);

export default SubtitlesPanel;
