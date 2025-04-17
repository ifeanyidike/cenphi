import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, FC, SetStateAction } from "react";

type AudioEditorShortcutsProps = {
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: Dispatch<SetStateAction<boolean>>;
  isDarkMode: boolean;
};

const AudioEditorShortcuts: FC<AudioEditorShortcutsProps> = ({
  showKeyboardShortcuts,
  setShowKeyboardShortcuts,
  isDarkMode,
}) => {
  return (
    <AnimatePresence>
      {showKeyboardShortcuts && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <motion.div
            className={`relative w-full max-w-2xl p-6 rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Keyboard Shortcuts
              </h3>
              <button
                className={`p-1 rounded-full ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                onClick={() => setShowKeyboardShortcuts(false)}
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

            <div className="grid grid-cols-2 gap-6">
              {/* Playback Controls */}
              <div>
                <h4
                  className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Playback Controls
                </h4>
                <ul
                  className={`space-y-2 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <li className="flex justify-between">
                    <span>Play/Pause</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      Space
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Step Back</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      ←
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Step Forward</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      →
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Jump Back 5s</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      J
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Jump Forward 5s</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      L
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Jump Back 10s</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      Shift + ←
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Jump Forward 10s</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      Shift + →
                    </span>
                  </li>
                </ul>
              </div>

              {/* Editing Tools */}
              <div>
                <h4
                  className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Editing Tools
                </h4>
                <ul
                  className={`space-y-2 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <li className="flex justify-between">
                    <span>Trim Tool</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      T
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Enhancement Tool</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      E
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Noise Reduction</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      N
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Volume/Normalize</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      V
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Effects Tool</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      F
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Subtitles Tool</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      S
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Undo</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      Ctrl + Z
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Redo</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      Ctrl + Y
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h4
                className={`text-sm font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Timeline Tips
              </h4>
              <ul
                className={`space-y-1 text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>Click on the waveform to seek to a specific position</li>
                <li>
                  Use the mouse wheel while holding Ctrl to zoom in/out on the
                  timeline
                </li>
                <li>Drag trim handles to adjust trim points precisely</li>
                <li>Click on a subtitle segment to edit it</li>
                <li>Double-click on a marker to jump to that position</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isDarkMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioEditorShortcuts;
