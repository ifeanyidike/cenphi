import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { AudioEditMode } from "../../../repo/managers/audio_editor";
import ModernAudioPlayer from "./AudioPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import editing panels components
import AudioTrimPanel from "./panels/AudioTrimPanel";
import EnhancePanel from "./panels/EnhancePanel";
import NoiseReductionPanel from "./panels/NoiseReductionPanel";
import NormalizePanel from "./panels/NormalizePanel";
import EffectsPanel from "./panels/EffectsPanel";
import SubtitlesPanel from "./panels/SubtitlesPanel";
import ExportPanel from "./panels/ExportPanel";
import { Testimonial } from "@/types/testimonial";

interface AudioEditorProps {
  testimonial: Testimonial;
  onClose: () => void;
  onSave: (testimonial: Testimonial) => void;
}

const AudioEditor: React.FC<AudioEditorProps> = observer(
  ({ testimonial, onClose, onSave }) => {
    const { audioEditorManager, uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [, setIsAudioReady] = useState(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] =
      useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [exitingEditor, setExitingEditor] = useState(false);
    const [activeTab, setActiveTab] = useState<AudioEditMode | "none">("none");
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Initialize audio editor
    useEffect(() => {
      if (testimonial.format !== "audio") {
        console.error("AudioEditor can only edit audio testimonials");
        onClose();
        return;
      }

      const initEditor = async () => {
        try {
          await audioEditorManager.initEditor(testimonial);
          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing audio editor:", error);
          onClose();
        }
      };

      initEditor();

      // Set up keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't capture shortcuts when typing in inputs
        if (
          ["INPUT", "TEXTAREA"].includes(
            (e.target as HTMLElement)?.tagName || ""
          )
        ) {
          return;
        }

        // Space to toggle play/pause
        if (e.code === "Space") {
          e.preventDefault();
          audioEditorManager.togglePlay();
        }

        // Keyboard shortcuts for edit modes
        if (e.key === "t") setActiveTab(activeTab === "trim" ? "none" : "trim");
        if (e.key === "e")
          setActiveTab(activeTab === "enhance" ? "none" : "enhance");
        if (e.key === "n")
          setActiveTab(
            activeTab === "noise-reduction" ? "none" : "noise-reduction"
          );
        if (e.key === "v")
          setActiveTab(activeTab === "normalize" ? "none" : "normalize");
        if (e.key === "f")
          setActiveTab(activeTab === "effects" ? "none" : "effects");
        if (e.key === "s")
          setActiveTab(activeTab === "subtitles" ? "none" : "subtitles");
        if (e.key === "x")
          setActiveTab(activeTab === "export" ? "none" : "export");

        // Undo/Redo (Cmd/Ctrl + Z/Y)
        if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !e.shiftKey) {
          e.preventDefault();
          audioEditorManager.undo();
        }
        if (
          (e.metaKey || e.ctrlKey) &&
          (e.code === "KeyY" || (e.code === "KeyZ" && e.shiftKey))
        ) {
          e.preventDefault();
          audioEditorManager.redo();
        }

        // Show keyboard shortcuts with "?"
        if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
          e.preventDefault();
          setShowKeyboardShortcuts(true);
        }

        // ESC to close modals or deactivate edit mode
        if (e.code === "Escape") {
          if (showKeyboardShortcuts) {
            setShowKeyboardShortcuts(false);
          } else if (activeTab !== "none") {
            setActiveTab("none");
            audioEditorManager.setEditMode(null);
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      audioEditorManager.startAutoSave();

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        audioEditorManager.stopAutoSave();
      };
    }, [testimonial, audioEditorManager, onClose, activeTab]);

    // Sync editor mode with active tab
    useEffect(() => {
      if (activeTab === "none") {
        audioEditorManager.setEditMode(null);
      } else {
        audioEditorManager.setEditMode(activeTab as AudioEditMode);
      }
    }, [activeTab, audioEditorManager]);

    // Handle saving the edits
    const handleSave = async () => {
      audioEditorManager.setProcessingStatus("Saving changes...");

      try {
        const success = await audioEditorManager.saveEdits();
        if (success) {
          exitEditor(true);
        } else {
          throw new Error("Failed to save edits");
        }
      } catch (error) {
        console.error("Error saving edits:", error);
        showSuccessNotification("Failed to save changes. Please try again.");
        audioEditorManager.setProcessingStatus("");
      }
    };

    // Handle discarding the edits
    const handleDiscard = () => {
      if (audioEditorManager.isDirty) {
        setShowUnsavedChangesModal(true);
      } else {
        audioEditorManager.discardEdits();
        exitEditor(false);
      }
    };

    // Exit the editor with animation
    const exitEditor = (saved: boolean) => {
      setExitingEditor(true);
      setTimeout(() => {
        if (saved && testimonial) {
          onSave(testimonial);
        }
        onClose();
      }, 300);
    };

    // Confirm discard changes
    const confirmDiscard = () => {
      audioEditorManager.discardEdits();
      setShowUnsavedChangesModal(false);
      exitEditor(false);
    };

    // Display success notification
    const showSuccessNotification = (message: string) => {
      setSuccessMessage(message);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    };

    // Handle audio player ready event
    const handleAudioReady = () => {
      setIsAudioReady(true);
    };

    // Loading state
    if (!isInitialized) {
      return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-4 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-medium">
              Loading Audio Editor...
            </p>
          </div>
        </div>
      );
    }

    // Render the editor
    return (
      <motion.div
        className={`fixed inset-0 z-50 flex flex-col ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: exitingEditor ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Processing overlay */}
        <AnimatePresence>
          {audioEditorManager.isProcessing && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {audioEditorManager.processingStatus}
              </h3>

              {audioEditorManager.processingProgress > 0 && (
                <div className="w-64 mt-4">
                  <div className="h-1.5 w-full bg-gray-700 rounded-full ">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${audioEditorManager.processingProgress}%`,
                      }}
                    ></motion.div>
                  </div>
                  <p className="text-center text-sm text-gray-300 mt-2">
                    {Math.round(audioEditorManager.processingProgress)}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div
          className={`px-4 py-3 border-b ${
            isDarkMode
              ? "border-gray-800 bg-gray-900/95 backdrop-blur-md"
              : "border-gray-200 bg-white/95 backdrop-blur-md"
          } shadow-md z-30 flex items-center justify-between`}
        >
          <div className="flex items-center">
            <button
              className={`mr-3 p-2 rounded-lg hover:bg-${isDarkMode ? "gray-800" : "gray-100"} transition-colors`}
              onClick={handleDiscard}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold flex items-center">
              Audio Editor
              {testimonial.customer_profile?.name && (
                <span className="ml-2 text-sm font-normal opacity-70">
                  • {testimonial.customer_profile.name}
                </span>
              )}
            </h1>

            {/* Unsaved changes indicator */}
            {audioEditorManager.isDirty && (
              <div className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Unsaved Changes
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard shortcuts button */}
            <button
              className={`p-2 rounded-lg ${
                isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } transition-colors`}
              onClick={() => setShowKeyboardShortcuts(true)}
              title="Keyboard Shortcuts"
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
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>

            <button
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              } transition-colors`}
              onClick={handleDiscard}
            >
              Cancel
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                audioEditorManager.isDirty
                  ? isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handleSave}
              disabled={!audioEditorManager.isDirty}
            >
              Save Changes
            </motion.button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Audio player section */}
          <div className="p-6">
            <ModernAudioPlayer
              onReady={handleAudioReady}
              showWaveform
              className="max-w-4xl mx-auto"
            />
          </div>

          {/* Editing tabs section */}
          <div className="flex-1 px-6 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as AudioEditMode | "none")
              }
              className="w-full max-w-4xl mx-auto"
            >
              <TabsList
                className={`grid grid-cols-8 mb-6 w-full rounded-lg ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <TabsTrigger
                  value="none"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="trim"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Trim
                </TabsTrigger>
                <TabsTrigger
                  value="enhance"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Enhance
                </TabsTrigger>
                <TabsTrigger
                  value="noise-reduction"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Noise
                </TabsTrigger>
                <TabsTrigger
                  value="normalize"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Volume
                </TabsTrigger>
                <TabsTrigger
                  value="effects"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Effects
                </TabsTrigger>
                <TabsTrigger
                  value="subtitles"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  Subtitles
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:${
                    isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-indigo-500 text-white shadow-sm"
                  }`}
                >
                  Export
                </TabsTrigger>
              </TabsList>

              <div
                className={`w-full h-[calc(100%-3rem)] overflow-auto rounded-lg p-6 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } shadow-md`}
              >
                <TabsContent value="none" className="mt-0">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-4">
                      Edit Your Audio
                    </h3>
                    <p className="text-sm opacity-70 max-w-lg mx-auto mb-8">
                      Select a tab above to edit different aspects of your
                      audio. You can trim, enhance, reduce noise, normalize
                      volume, add effects, and manage subtitles.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      {[
                        {
                          id: "trim",
                          label: "Trim Audio",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          ),
                          description:
                            "Cut unwanted parts at the beginning or end",
                        },
                        {
                          id: "enhance",
                          label: "Enhance Quality",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                              />
                            </svg>
                          ),
                          description: "Improve clarity and tone",
                        },
                        {
                          id: "noise-reduction",
                          label: "Reduce Noise",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 010-7.07m-2.829 9.9a9 9 0 010-12.73"
                              />
                            </svg>
                          ),
                          description: "Remove background noise",
                        },
                        {
                          id: "normalize",
                          label: "Normalize Volume",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 010-7.07m-2.829 9.9a9 9 0 010-12.73"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M19 12l2 2 2-2m-2-2v4"
                              />
                            </svg>
                          ),
                          description: "Balance and adjust volume levels",
                        },
                        {
                          id: "effects",
                          label: "Add Effects",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                              />
                            </svg>
                          ),
                          description: "Apply reverb, EQ, and other effects",
                        },
                        {
                          id: "subtitles",
                          label: "Manage Subtitles",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                          ),
                          description: "Create and edit subtitles/transcripts",
                        },
                      ].map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`p-4 rounded-lg text-left flex flex-col items-center ${
                            isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-50 hover:bg-gray-100"
                          } transition-colors`}
                          onClick={() =>
                            setActiveTab(option.id as AudioEditMode)
                          }
                        >
                          <div
                            className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center ${
                              isDarkMode
                                ? "bg-gray-600 text-indigo-400"
                                : "bg-indigo-100 text-indigo-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <h4 className="font-medium text-sm mb-1">
                            {option.label}
                          </h4>
                          <p className="text-xs opacity-70">
                            {option.description}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trim" className="mt-0 h-full">
                  <AudioTrimPanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="enhance" className="mt-0 h-full">
                  <EnhancePanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="noise-reduction" className="mt-0 h-full">
                  <NoiseReductionPanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="normalize" className="mt-0 h-full">
                  <NormalizePanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="effects" className="mt-0 h-full">
                  <EffectsPanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="subtitles" className="mt-0 h-full">
                  <SubtitlesPanel onSuccess={showSuccessNotification} />
                </TabsContent>

                <TabsContent value="export" className="mt-0 h-full">
                  <ExportPanel />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Success notification toast */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg max-w-md z-50 flex items-center ${
                successMessage.includes("Failed")
                  ? isDarkMode
                    ? "bg-red-900/90 text-red-100"
                    : "bg-red-100 text-red-800"
                  : isDarkMode
                    ? "bg-green-900/90 text-green-100"
                    : "bg-green-100 text-green-800"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-2 ${
                  successMessage.includes("Failed")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {successMessage.includes("Failed") ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unsaved changes modal */}
        <AnimatePresence>
          {showUnsavedChangesModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Unsaved Changes
                </h3>
                <p
                  className={`mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  You have unsaved changes. Are you sure you want to exit
                  without saving?
                </p>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowUnsavedChangesModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDarkMode
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                    onClick={confirmDiscard}
                  >
                    Discard Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard shortcuts modal */}
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
                className={`relative w-full max-w-lg p-6 rounded-lg shadow-xl ${
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
                    className={`p-1.5 rounded-full ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
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

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <h4 className="font-medium text-sm mb-3">Playback</h4>
                    <ul className="space-y-2">
                      {[
                        { key: "Space", description: "Play/Pause" },
                        { key: "←/→", description: "Seek backward/forward" },
                        { key: "J/L", description: "Seek backward/forward" },
                        { key: "K", description: "Play/Pause" },
                      ].map((shortcut, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="opacity-80">
                            {shortcut.description}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono ${
                              isDarkMode ? "bg-gray-800" : "bg-white/80"
                            }`}
                          >
                            {shortcut.key}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <h4 className="font-medium text-sm mb-3">Editing</h4>
                    <ul className="space-y-2">
                      {[
                        { key: "T", description: "Trim mode" },
                        { key: "E", description: "Enhance mode" },
                        { key: "N", description: "Noise reduction" },
                        { key: "F", description: "Effects mode" },
                        { key: "S", description: "Subtitles mode" },
                        { key: "Ctrl+Z", description: "Undo" },
                        { key: "Ctrl+Y", description: "Redo" },
                      ].map((shortcut, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="opacity-80">
                            {shortcut.description}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono ${
                              isDarkMode ? "bg-gray-800" : "bg-white/80"
                            }`}
                          >
                            {shortcut.key}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Press{" "}
                    <kbd
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      ?
                    </kbd>{" "}
                    anytime to show this help
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export default AudioEditor;
