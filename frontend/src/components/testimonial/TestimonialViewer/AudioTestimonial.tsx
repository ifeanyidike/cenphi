import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import AudioPlayer from "../audioEditor/AudioPlayer";
import AudioEditor from "../audioEditor/AudioEditor";
import { Testimonial } from "@/types/testimonial";

interface AudioEditorIntegrationProps {
  testimonial: Testimonial;
}

/**
 * AudioEditorIntegration component acts as the main entry point for handling audio testimonials.
 * It shows either a compact player or full editor based on user interaction.
 */
const AudioEditorIntegration: React.FC<AudioEditorIntegrationProps> = observer(
  ({ testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State
    const [showEditor, setShowEditor] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    // Verify the testimonial is of audio type
    if (testimonial.format !== "audio") {
      return (
        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-800"}`}
        >
          Invalid testimonial format: Expected 'audio' but received '
          {testimonial.format}'
        </div>
      );
    }

    // Handle opening the editor
    const openEditor = () => {
      setShowEditor(true);
      // Optional: pause audio if it's playing
      if (workspaceHub.audioEditorManager?.isPlaying) {
        workspaceHub.audioEditorManager.pause();
      }
    };

    // Handle closing the editor
    const closeEditor = () => {
      setShowEditor(false);
    };

    // Handle saving edits
    const handleSaveAudioEdit = (updatedTestimonial: Testimonial) => {
      console.log("Audio edit saved:", updatedTestimonial.id);
      // Here you would typically update your state or call an API
      // to persist the changes to the testimonial
    };

    // If editor is open, render the full editor
    if (showEditor) {
      return (
        <AudioEditor
          testimonial={testimonial}
          onClose={closeEditor}
          onSave={handleSaveAudioEdit}
        />
      );
    }

    // Otherwise render the compact player
    return (
      <div
        className={`max-w-3xl mx-auto my-4 space-y-4 ${audioError ? "opacity-80" : ""}`}
      >
        {/* Audio info header */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-sm`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" />
              </svg>
            </div>

            <div>
              <h3 className="font-medium">
                {testimonial.customer_profile?.name || "Audio Testimonial"}
              </h3>
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {testimonial.customer_profile?.title}
                {testimonial.customer_profile?.title &&
                  testimonial.customer_profile?.company &&
                  ", "}
                {testimonial.customer_profile?.company}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {testimonial.custom_fields?.verified && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode
                    ? "bg-green-900/30 text-green-400"
                    : "bg-green-100 text-green-800"
                }`}
              >
                Verified
              </span>
            )}

            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
              onClick={openEditor}
            >
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Audio
              </span>
            </button>
          </div>
        </div>

        {/* Modern Audio Player */}
        <AudioPlayer
          showWaveform
          onEditClick={openEditor}
          onReady={() => {
            /* You can handle player-ready events here */
          }}
        />

        {/* Transcript section (if available) */}
        {testimonial.transcript && (
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Transcript</h4>
              <button
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                onClick={openEditor}
              >
                Edit Transcript
              </button>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <p
                className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {testimonial.transcript}
              </p>
            </div>
          </div>
        )}

        {/* Error message if any */}
        <AnimatePresence>
          {audioError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg ${
                isDarkMode
                  ? "bg-red-900/20 text-red-300"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex">
                <svg
                  className="w-5 h-5 mr-3 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium">Error playing audio</p>
                  <p className="mt-1 text-sm opacity-90">{audioError}</p>
                  <button
                    onClick={() => setAudioError(null)}
                    className={`mt-2 text-xs px-2 py-1 rounded ${
                      isDarkMode
                        ? "bg-red-800 hover:bg-red-700 text-white"
                        : "bg-red-100 hover:bg-red-200 text-red-800"
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export default AudioEditorIntegration;
