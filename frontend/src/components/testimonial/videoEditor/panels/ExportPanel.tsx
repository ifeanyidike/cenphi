import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { formatTimecode } from "@/utils/general";
const ExportPanel = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    exportFormat,
    exportQuality,
    setExportQuality,
    prepareExport,
    duration,
    trim,
    videoWidth,
    videoHeight,
    aspectRatio,
    subtitles,
  } = videoEditorManager;

  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "preview">(
    "settings"
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customFilename, setCustomFilename] = useState("video_export");
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);

  // Calculate estimated file size based on settings
  useEffect(() => {
    // Simple estimation algorithm - in a real app, this would be more sophisticated
    const trimmedDuration = trim.endTime - trim.startTime;
    setEstimatedDuration(trimmedDuration);

    let bitrate = 0;

    // Base bitrate on quality
    switch (exportQuality) {
      case "low":
        bitrate = 1000; // 1 Mbps
        break;
      case "medium":
        bitrate = 2500; // 2.5 Mbps
        break;
      case "high":
        bitrate = 5000; // 5 Mbps
        break;
      default:
        bitrate = 2500;
    }

    // Adjust for format
    if (exportFormat === "webm") {
      bitrate *= 0.8; // WebM is typically more efficient
    } else if (exportFormat === "gif") {
      bitrate *= 0.4; // GIFs are smaller but lower quality
    }

    // Calculate size in MB (bitrate in Kbps * duration in seconds / 8000)
    const sizeInMB = (bitrate * trimmedDuration) / 8000;

    if (sizeInMB < 1) {
      setEstimatedSize(`${Math.round(sizeInMB * 1000)} KB`);
    } else {
      setEstimatedSize(`${sizeInMB.toFixed(1)} MB`);
    }
  }, [exportFormat, exportQuality, trim.startTime, trim.endTime]);

  // Handle export button click
  // const handleExport = async () => {
  //   setIsExporting(true);
  //   try {
  //     const url = await prepareExport();
  //     if (url) {
  //       setExportedUrl(url);
  //       setActiveTab("preview");
  //     }
  //   } catch (error) {
  //     console.error("Export failed:", error);
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Force the canvas to render the current state
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.clearTransformCache();
      }

      // Use the store's export functionality
      const url = await prepareExport();
      if (url) {
        setExportedUrl(url);
        setActiveTab("preview");
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // const captureCanvasThumbnail = async () => {
  //   if (typeof window !== "undefined" && window.canvasCoordinator) {
  //     try {
  //       // Get the current canvas state as a data URL
  //       const thumbnailUrl = window.canvasCoordinator.captureFrame();
  //       return thumbnailUrl;
  //     } catch (error) {
  //       console.error("Error capturing canvas thumbnail:", error);
  //     }
  //   }
  //   return null;
  // };

  // Handle download of exported video
  const handleDownload = () => {
    if (exportedUrl) {
      const a = document.createElement("a");
      a.href = exportedUrl;
      a.download = `${customFilename}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Generate summary of applied edits
  const getEditSummary = () => {
    const edits = [];

    // Check for trimming
    if (trim.startTime > 0 || trim.endTime < duration) {
      edits.push(
        `Trimmed: ${formatTimecode(trim.startTime)} to ${formatTimecode(trim.endTime)}`
      );
    }

    // Check for aspect ratio changes
    if (aspectRatio !== "original") {
      edits.push(`Aspect Ratio: ${aspectRatio}`);
    }

    // Check for subtitles
    if (subtitles.length > 0) {
      edits.push(`Subtitles: ${subtitles.length} added`);
    }

    // Add more edit types as needed

    return edits.length > 0 ? edits : ["Original video without edits"];
  };

  // // Define format options
  // const formatOptions = [
  //   { id: "mp4", label: "MP4", description: "Best compatibility" },
  //   { id: "webm", label: "WebM", description: "Smaller file size" },
  //   { id: "gif", label: "GIF", description: "For short clips" },
  // ];

  // Define quality options
  const qualityOptions = [
    { id: "low", label: "Low", description: "360p - Smaller file" },
    { id: "medium", label: "Medium", description: "720p - Balanced" },
    { id: "high", label: "High", description: "1080p - Best quality" },
  ];

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Export Video</h2>

          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === "settings"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-600"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === "preview"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-600"
              } ${!exportedUrl ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => exportedUrl && setActiveTab("preview")}
              disabled={!exportedUrl}
            >
              Preview
            </button>
          </div>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Prepare your video for export with custom settings
        </p>
      </div>

      {/* Settings Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "settings" ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            {/* Format Selection */}
            {/* <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {formatOptions.map((format) => (
                  <button
                    key={format.id}
                    className={`p-3 rounded-lg text-center border transition-colors ${
                      exportFormat === format.id
                        ? isDarkMode
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-blue-50 border-blue-500 text-blue-600"
                        : isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setExportFormat(format.id as any)}
                  >
                    <div className="text-lg font-semibold">{format.label}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {format.description}
                    </div>
                  </button>
                ))}
              </div>
            </div> */}

            {/* Quality Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <div className="space-y-2">
                {qualityOptions.map((quality) => (
                  <button
                    key={quality.id}
                    className={`w-full p-3 rounded-lg flex items-center border ${
                      exportQuality === quality.id
                        ? isDarkMode
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-blue-50 border-blue-500 text-blue-600"
                        : isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setExportQuality(quality.id as any)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{quality.label}</div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {quality.description}
                      </div>
                    </div>
                    {exportQuality === quality.id && (
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium mb-2">
                File Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-l-md ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <div
                  className={`px-3 py-2 rounded-r-md border-t border-r border-b ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-400 border-gray-600"
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }`}
                >
                  .{exportFormat}
                </div>
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-2">
              <button
                className={`flex items-center text-sm ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <svg
                  className={`w-4 h-4 mr-1 transition-transform ${
                    showAdvanced ? "rotate-90" : ""
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
                Advanced Settings
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2 space-y-3"
                  >
                    {/* Advanced setting options - disabled for simplicity */}
                    <div
                      className={`p-3 rounded-md ${
                        isDarkMode ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="text-sm font-medium mb-2">
                        Subtitle Options
                      </h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="burn-subtitles"
                          className="mr-2"
                          checked={true}
                          readOnly
                        />
                        <label htmlFor="burn-subtitles" className="text-sm">
                          Burn subtitles into video
                        </label>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-md ${
                        isDarkMode ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="text-sm font-medium mb-2">
                        Audio Options
                      </h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="normalize-audio"
                          className="mr-2"
                          checked={true}
                          readOnly
                        />
                        <label htmlFor="normalize-audio" className="text-sm">
                          Normalize audio levels
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export Summary */}
            <div
              className={`mt-6 p-4 rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <h3 className="text-sm font-semibold mb-2">Export Summary</h3>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Format:
                </div>
                <div className="font-medium">{exportFormat.toUpperCase()}</div>

                <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Quality:
                </div>
                <div className="font-medium">{exportQuality}</div>

                <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Resolution:
                </div>
                <div className="font-medium">
                  {videoWidth && videoHeight
                    ? `${videoWidth} × ${videoHeight}`
                    : "Original"}
                </div>

                <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Duration:
                </div>
                <div className="font-medium">
                  {formatTimecode(estimatedDuration)}
                </div>

                <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Est. Size:
                </div>
                <div className="font-medium">
                  {estimatedSize || "Calculating..."}
                </div>
              </div>

              <div className="text-sm mb-1 font-medium">Applied Edits:</div>
              <ul className="text-xs space-y-1 ml-1">
                {getEditSummary().map((edit, index) => (
                  <li
                    key={index}
                    className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                  >
                    • {edit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Export Button */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/20"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                }`}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Processing Video...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export Video
                  </>
                )}
              </motion.button>

              <p className="text-xs text-center mt-2 opacity-70">
                Processing may take a moment depending on video length and
                selected options
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto p-4 flex flex-col"
          >
            {exportedUrl ? (
              <>
                <div className="bg-black rounded-lg overflow-hidden mb-4 flex-1 flex items-center justify-center">
                  <video
                    src={exportedUrl}
                    className="max-w-full max-h-full"
                    controls
                    autoPlay
                  />
                </div>

                <div className="space-y-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        Filename:
                      </span>
                      <span className="font-medium">
                        {customFilename}.{exportFormat}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        Size:
                      </span>
                      <span className="font-medium">{estimatedSize}</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center ${
                      isDarkMode
                        ? "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg shadow-green-900/20"
                        : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg shadow-green-500/20"
                    }`}
                    onClick={handleDownload}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Video
                  </motion.button>

                  <div className="flex space-x-3">
                    <button
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setActiveTab("settings")}
                    >
                      Edit Settings
                    </button>

                    <button
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                        isDarkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                      onClick={handleExport}
                    >
                      Re-Export
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <svg
                  className={`w-16 h-16 mb-4 ${
                    isDarkMode ? "text-gray-700" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-center opacity-70">
                  Export your video first to preview it here
                </p>
                <button
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                    isDarkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  onClick={() => setActiveTab("settings")}
                >
                  Go to Export Settings
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ExportPanel;
