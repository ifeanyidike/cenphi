import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { formatTimecode } from "@/utils/general";

const ExportPanel: React.FC = observer(() => {
  const { audioEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    trim,
    processedAudioUrl,
    exportFormat,
    exportQuality,
    setExportFormat,
    setExportQuality,
    prepareExport,
    isProcessing,
    processingProgress,
    processingStatus,
  } = audioEditorManager;

  // Local state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [exportStarted, setExportStarted] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportName, setExportName] = useState(
    `audio_testimonial_${new Date().getTime()}`
  );
  const [includeTrim, setIncludeTrim] = useState(true);
  const [includeEnhancement, setIncludeEnhancement] = useState(true);
  const [includeNoiseReduction, setIncludeNoiseReduction] = useState(true);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [includeEffects, setIncludeEffects] = useState(true);

  // Helper functions for file size estimates
  const getFormattedFileSize = () => {
    // Get estimated file size from store or calculate based on format, duration and quality
    // This is a simplified estimate
    const trimmedDuration = trim.endTime - trim.startTime;
    let bitrate = 0;

    switch (exportFormat) {
      case "mp3":
        bitrate =
          exportQuality === "low" ? 96 : exportQuality === "medium" ? 128 : 320; // kbps
        break;
      case "wav":
        bitrate =
          exportQuality === "low"
            ? 705
            : exportQuality === "medium"
              ? 1411
              : 3072; // kbps (16-bit/44.1kHz to 24-bit/48kHz)
        break;
      case "ogg":
        bitrate =
          exportQuality === "low" ? 80 : exportQuality === "medium" ? 128 : 256; // kbps
        break;
    }

    // Calculate size: bitrate (kbps) * duration (s) / 8 = size in KB
    const sizeKB = (bitrate * trimmedDuration) / 8;

    // Format the size
    if (sizeKB > 1024) {
      return `${(sizeKB / 1024).toFixed(2)} MB`;
    } else {
      return `${Math.round(sizeKB)} KB`;
    }
  };

  // Handle format change
  const handleFormatChange = (format: "mp3" | "wav" | "ogg") => {
    setExportFormat(format);
  };

  // Handle quality change
  const handleQualityChange = (quality: "low" | "medium" | "high") => {
    setExportQuality(quality);
  };

  // Handle export action
  const handleExport = async () => {
    setExportStarted(true);
    const result = await prepareExport();
    if (result) {
      setExportedUrl(result);
    }
  };

  // Handle preview playback
  const togglePreview = () => {
    if (!previewAudio) return;

    if (isPreviewPlaying) {
      previewAudio.pause();
    } else {
      previewAudio.play();
    }
  };

  // Initialize and clean up preview audio
  useEffect(() => {
    // Create audio element for preview
    const audio = new Audio();
    setPreviewAudio(audio);

    // Set up event listeners
    audio.addEventListener("play", () => setIsPreviewPlaying(true));
    audio.addEventListener("pause", () => setIsPreviewPlaying(false));
    audio.addEventListener("ended", () => setIsPreviewPlaying(false));

    // Set source when available
    if (processedAudioUrl) {
      audio.src = processedAudioUrl;
      audio.load();
    }

    // Clean up
    return () => {
      audio.pause();
      audio.removeEventListener("play", () => setIsPreviewPlaying(true));
      audio.removeEventListener("pause", () => setIsPreviewPlaying(false));
      audio.removeEventListener("ended", () => setIsPreviewPlaying(false));
    };
  }, []);

  // Update audio source when processed URL changes
  useEffect(() => {
    if (previewAudio && processedAudioUrl) {
      previewAudio.src = processedAudioUrl;
      previewAudio.load();
    }
  }, [processedAudioUrl, previewAudio]);

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Export Audio</h2>

          {exportedUrl && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex"
            >
              <a
                href={exportedUrl}
                download={`${exportName}.${exportFormat}`}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                  isDarkMode
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download
              </a>
            </motion.div>
          )}
        </div>
      </div>

      {/* File Name */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2">File Name</label>
        <input
          type="text"
          value={exportName}
          onChange={(e) => setExportName(e.target.value)}
          className={`w-full px-3 py-2 rounded-md text-sm ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-gray-900"
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Enter file name"
        />
      </div>

      {/* Format Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2">Format</label>
        <div className="grid grid-cols-3 gap-2">
          {["mp3", "wav", "ogg"].map((format) => (
            <button
              key={format}
              className={`py-2 px-3 rounded-md text-sm font-medium ${
                exportFormat === format
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() =>
                handleFormatChange(format as "mp3" | "wav" | "ogg")
              }
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs opacity-70">
          {exportFormat === "mp3" &&
            "Best for sharing, good balance of quality and size"}
          {exportFormat === "wav" &&
            "Highest quality, lossless but large file size"}
          {exportFormat === "ogg" &&
            "Good quality with smaller file size than MP3"}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2">Quality</label>
        <div className="grid grid-cols-3 gap-2">
          {["low", "medium", "high"].map((quality) => (
            <button
              key={quality}
              className={`py-2 px-3 rounded-md text-sm font-medium ${
                exportQuality === quality
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() =>
                handleQualityChange(quality as "low" | "medium" | "high")
              }
            >
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-2">
          <div className="text-xs opacity-70">
            {exportQuality === "low" && "Good for speech, smaller file size"}
            {exportQuality === "medium" && "Balanced quality and file size"}
            {exportQuality === "high" && "Best audio quality, larger file size"}
          </div>
          <div className="text-xs font-medium">{getFormattedFileSize()}</div>
        </div>
      </div>

      {/* Included Edits */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2">Include Edits</label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-trim"
              checked={includeTrim}
              onChange={(e) => setIncludeTrim(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="include-trim" className="ml-2 text-sm">
              Trimming ({formatTimecode(trim.startTime)} -{" "}
              {formatTimecode(trim.endTime)})
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-enhancement"
              checked={includeEnhancement}
              onChange={(e) => setIncludeEnhancement(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="include-enhancement" className="ml-2 text-sm">
              Voice Enhancement
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-noise"
              checked={includeNoiseReduction}
              onChange={(e) => setIncludeNoiseReduction(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="include-noise" className="ml-2 text-sm">
              Noise Reduction
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-effects"
              checked={includeEffects}
              onChange={(e) => setIncludeEffects(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="include-effects" className="ml-2 text-sm">
              Audio Effects
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-subtitles"
              checked={includeSubtitles}
              onChange={(e) => setIncludeSubtitles(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500"
            />
            <label htmlFor="include-subtitles" className="ml-2 text-sm">
              Export Subtitles/Transcript (SRT)
            </label>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium mb-2">Export Summary</h3>
        <div
          className={`p-3 rounded-md text-sm ${
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="opacity-70">Format:</div>
            <div className="font-medium">{exportFormat.toUpperCase()}</div>
            <div className="opacity-70">Quality:</div>
            <div className="font-medium">{exportQuality}</div>
            <div className="opacity-70">Duration:</div>
            <div className="font-medium">
              {formatTimecode(trim.endTime - trim.startTime)}
            </div>
            <div className="opacity-70">File Size:</div>
            <div className="font-medium">{getFormattedFileSize()}</div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {processedAudioUrl && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Preview</h3>
          <div
            className={`p-3 rounded-md flex items-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <button
              className={`p-2 rounded-full ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={togglePreview}
            >
              {isPreviewPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <div className="ml-3 flex-1">
              <div className="text-sm">Preview your audio export</div>
              <div className="text-xs opacity-70">
                {isPreviewPlaying ? "Playing" : "Click to play"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-auto p-4">
        <AnimatePresence>
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-center text-sm font-medium">
                {processingStatus || "Processing..."}
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-center text-xs">
                {Math.round(processingProgress)}%
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 px-4 rounded-lg text-center text-white font-medium ${
                exportStarted && exportedUrl
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={handleExport}
            >
              {exportStarted && exportedUrl ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Export Complete
                </span>
              ) : (
                "Export Audio"
              )}
            </motion.button>
          )}
        </AnimatePresence>

        <div className="text-center text-xs mt-2 opacity-70">
          {exportedUrl
            ? "Your export is ready for download"
            : `Export will generate a ${exportFormat.toUpperCase()} file with your edits`}
        </div>
      </div>
    </div>
  );
});

export default ExportPanel;
