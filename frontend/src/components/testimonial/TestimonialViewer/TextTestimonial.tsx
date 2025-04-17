// components/TestimonialViewer/TextTestimonial.tsx
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Badge from "../UI/Badge";
import Button from "../UI/Button";
import { Testimonial } from "@/types/testimonial";

interface TextTestimonialProps {
  testimonial: Testimonial;
}

const TextTestimonial: React.FC<TextTestimonialProps> = observer(
  ({ testimonial }) => {
    const { uiManager, textEditorManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Set the current testimonial in the store when the component mounts or testimonial changes
    useEffect(() => {
      textEditorManager.setTestimonial(testimonial);
    }, [testimonial.id]);

    // Focus the textarea when entering edit mode
    useEffect(() => {
      if (textEditorManager.isEditing && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [textEditorManager.isEditing]);

    if (testimonial.format !== "text") {
      return <div>Invalid testimonial type</div>;
    }

    // Get values from the store
    const {
      isEditing,
      editedText,
      fontSize,
      fontFamily,
      alignment,
      lineHeight,
      letterSpacing,
      textColor,
      backgroundColor,
      showFormatting,
      showWordAnalysis,
      highlightedWords,
      canUndo,
      canRedo,
    } = textEditorManager;

    // Calculate text stats
    const wordCount = testimonial.content?.trim().split(/\s+/).length || 0;
    const charCount = testimonial.content?.length || 0;
    const sentenceCount = testimonial.content
      ?.split(/[.!?]+/)
      .filter(Boolean).length;
    const avgWordLength = Math.round((charCount / wordCount) * 10) / 10;

    // Word frequency analysis
    const getWordFrequency = (text: string) => {
      const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
      const wordMap: Record<string, number> = {};

      words.forEach((word) => {
        // Skip small words
        if (word.length <= 2) return;

        // Skip common words
        if (
          [
            "the",
            "and",
            "for",
            "with",
            "was",
            "that",
            "this",
            "are",
            "from",
          ].includes(word)
        )
          return;

        wordMap[word] = (wordMap[word] || 0) + 1;
      });

      return Object.entries(wordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    };

    const topWords = getWordFrequency(testimonial.content || "");

    // Handle editing
    const handleEditToggle = () => {
      if (isEditing) {
        // Apply changes directly to the testimonial
        textEditorManager.applyChanges();
      } else {
        textEditorManager.startEditing();
      }
    };

    // Resize textarea as content changes
    const resizeTextarea = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      textEditorManager.updateEditedText(e.target.value);
      resizeTextarea();
    };

    // Highlight text function
    const highlightText = (text: string, wordsToHighlight: string[]) => {
      if (wordsToHighlight.length === 0) return text;

      const regex = new RegExp(`\\b(${wordsToHighlight.join("|")})\\b`, "gi");
      return text.replace(
        regex,
        (match) =>
          `<mark class="${isDarkMode ? "bg-indigo-700/70 text-white" : "bg-indigo-100 text-indigo-900"} px-0.5 rounded">${match}</mark>`
      );
    };

    const displayText =
      highlightedWords.length > 0
        ? { __html: highlightText(testimonial.content || "", highlightedWords) }
        : undefined;

    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    };

    const panelVariants = {
      hidden: { opacity: 0, height: 0, marginTop: 0 },
      visible: { opacity: 1, height: "auto", marginTop: 16 },
    };

    // Custom text color based on dark mode and textColor setting
    const textColorStyle = textColor
      ? { color: textColor }
      : { color: isDarkMode ? "white" : "rgb(15, 23, 42)" };

    const backgroundColorStyle = backgroundColor ? { backgroundColor } : {};

    // Content style objects
    const contentStyle = {
      fontSize: `${fontSize}rem`,
      fontFamily,
      textAlign: alignment,
      lineHeight,
      letterSpacing: `${letterSpacing}em`,
      ...textColorStyle,
      ...backgroundColorStyle,
    };

    // Color picker options
    const colorOptions = [
      { label: "Default", value: "" },
      { label: "Gray", value: isDarkMode ? "#94a3b8" : "#475569" },
      { label: "Red", value: isDarkMode ? "#f87171" : "#b91c1c" },
      { label: "Orange", value: isDarkMode ? "#fb923c" : "#c2410c" },
      { label: "Amber", value: isDarkMode ? "#fbbf24" : "#b45309" },
      { label: "Green", value: isDarkMode ? "#4ade80" : "#15803d" },
      { label: "Teal", value: isDarkMode ? "#2dd4bf" : "#0d9488" },
      { label: "Blue", value: isDarkMode ? "#60a5fa" : "#1d4ed8" },
      { label: "Indigo", value: isDarkMode ? "#818cf8" : "#4338ca" },
      { label: "Purple", value: isDarkMode ? "#a78bfa" : "#6d28d9" },
      { label: "Pink", value: isDarkMode ? "#f472b6" : "#be185d" },
    ];

    // Background color options
    const bgColorOptions = [
      { label: "None", value: "" },
      { label: "Light", value: isDarkMode ? "#1e293b" : "#f8fafc" },
      { label: "Highlight", value: isDarkMode ? "#312e81" : "#e0e7ff" },
      { label: "Subtle", value: isDarkMode ? "#334155" : "#f1f5f9" },
    ];

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`rounded-xl overflow-hidden shadow-lg ${
          isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        }`}
      >
        {/* Header with actions */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isDarkMode ? "border-slate-700" : "border-slate-100"
          }`}
        >
          <div className="flex items-center">
            <div className="flex items-center space-x-1.5">
              <Badge
                variant="solid"
                color="secondary"
                shape="pill"
                icon={
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Testimonial
              </Badge>

              {testimonial.customer_profile && (
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  by {testimonial.customer_profile.name}
                </span>
              )}
            </div>

            <div className="hidden sm:flex ml-4 items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {wordCount} words
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {charCount} chars
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={showWordAnalysis ? "primary" : "outline"}
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              }
              onClick={textEditorManager.toggleWordAnalysis}
              disabled={isEditing}
              className={
                !showWordAnalysis && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              <span className="hidden sm:inline">Analysis</span>
            </Button>

            <Button
              variant={showFormatting ? "primary" : "outline"}
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              }
              onClick={textEditorManager.toggleFormatting}
              disabled={isEditing}
              className={
                !showFormatting && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              <span className="hidden sm:inline">Format</span>
            </Button>

            <Button
              variant={isEditing ? "accent" : "outline"}
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d={
                      isEditing
                        ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        : "M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                    }
                  />
                </svg>
              }
              onClick={handleEditToggle}
              className={
                !isEditing && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="p-6">
          {/* Editing UI */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex justify-end mb-1">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Edit Mode
                  </span>
                  <button
                    onClick={textEditorManager.undo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded ${
                      canUndo
                        ? isDarkMode
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    title="Undo"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={textEditorManager.redo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded ${
                      canRedo
                        ? isDarkMode
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    title="Redo"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className={`relative rounded-lg ${
                  isDarkMode ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={handleTextChange}
                  className={`w-full p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px] transition-all ${
                    isDarkMode
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "bg-slate-50 text-slate-800 border border-slate-200"
                  }`}
                  placeholder="Enter testimonial text..."
                  style={contentStyle}
                  onFocus={resizeTextarea}
                />
              </div>

              {/* Quick formatting tools while editing */}
              <div
                className={`flex flex-wrap items-center p-3 rounded-lg border gap-3 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Font size */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      textEditorManager.updateFontSize(fontSize - 0.1)
                    }
                    className={`p-1 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  >
                    <svg
                      className="w-4 h-4"
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
                  <span
                    className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {fontSize.toFixed(1)}
                  </span>
                  <button
                    onClick={() =>
                      textEditorManager.updateFontSize(fontSize + 0.1)
                    }
                    className={`p-1 rounded ${isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex rounded-md overflow-hidden">
                  {[
                    {
                      value: "left",
                      icon: (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ),
                    },
                    {
                      value: "center",
                      icon: (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM5 15a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ),
                    },
                    {
                      value: "right",
                      icon: (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ),
                    },
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() =>
                        textEditorManager.updateAlignment(align.value as any)
                      }
                      className={`p-2 ${
                        alignment === align.value
                          ? isDarkMode
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-500 text-white"
                          : isDarkMode
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {align.icon}
                    </button>
                  ))}
                </div>

                {/* Font family */}
                <select
                  value={fontFamily}
                  onChange={(e) =>
                    textEditorManager.updateFontFamily(e.target.value)
                  }
                  className={`text-xs px-2 py-1.5 rounded border ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-200"
                      : "bg-white border-slate-300 text-slate-700"
                  }`}
                >
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>

                {/* Action buttons */}
                <div className="ml-auto flex space-x-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => textEditorManager.cancelEditing()}
                    className={
                      isDarkMode ? "border-slate-700 text-slate-300" : ""
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleEditToggle}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Text display */
            <motion.div
              variants={itemVariants}
              className={`relative rounded-lg overflow-hidden ${
                backgroundColor
                  ? ""
                  : isDarkMode
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg"
                    : "bg-white border border-slate-200 shadow-md"
              }`}
            >
              <div className="relative p-6">
                {/* Quote icon */}
                <div className="text-3xl absolute -top-2 -left-1 opacity-20">
                  <svg
                    className={`w-10 h-10 ${isDarkMode ? "text-indigo-500" : "text-indigo-400"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Text content */}
                <div className="pl-7 relative z-10">
                  <div
                    className={`prose max-w-none ${isDarkMode ? "prose-invert" : ""}`}
                    style={contentStyle as React.CSSProperties}
                    dangerouslySetInnerHTML={displayText}
                  >
                    {!displayText && testimonial.content}
                  </div>

                  {/* Author information if available */}
                  {testimonial.customer_profile && (
                    <div className="mt-6 flex items-center">
                      {testimonial.customer_profile.avatar_url ? (
                        <img
                          src={testimonial.customer_profile.avatar_url}
                          alt={testimonial.customer_profile.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center ${
                            isDarkMode ? "bg-indigo-700" : "bg-indigo-100"
                          }`}
                        >
                          <span
                            className={
                              isDarkMode ? "text-white" : "text-indigo-700"
                            }
                          >
                            {testimonial.customer_profile?.name?.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {testimonial.customer_profile.name}
                        </p>
                        {(testimonial.customer_profile.title ||
                          testimonial.customer_profile.company) && (
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {testimonial.customer_profile.title}
                            {testimonial.customer_profile.title &&
                              testimonial.customer_profile.company &&
                              ", "}
                            {testimonial.customer_profile.company}
                          </p>
                        )}
                      </div>

                      {testimonial.rating && (
                        <div className="ml-auto flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < testimonial.rating!
                                  ? "text-yellow-400"
                                  : isDarkMode
                                    ? "text-slate-700"
                                    : "text-slate-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Format panel */}
              <AnimatePresence>
                {showFormatting && (
                  <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`p-4 border-t ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-wrap gap-6">
                      {/* Left column */}
                      <div className="space-y-4 flex-1 min-w-[250px]">
                        {/* Font properties section */}
                        <div>
                          <h3
                            className={`text-sm font-medium mb-3 ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Typography
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Font size control */}
                            <div>
                              <label
                                className={`block text-xs mb-1 ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                Font Size
                              </label>
                              <div className="flex items-center">
                                <button
                                  onClick={() =>
                                    textEditorManager.updateFontSize(
                                      Math.max(0.75, fontSize - 0.1)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
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
                                <div
                                  className={`mx-2 text-sm min-w-[36px] text-center ${
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {fontSize.toFixed(1)}
                                </div>
                                <button
                                  onClick={() =>
                                    textEditorManager.updateFontSize(
                                      Math.min(2.5, fontSize + 0.1)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Line height control */}
                            <div>
                              <label
                                className={`block text-xs mb-1 ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                Line Height
                              </label>
                              <div className="flex items-center">
                                <button
                                  onClick={() =>
                                    textEditorManager.updateLineHeight(
                                      Math.max(1, lineHeight - 0.1)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
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
                                <div
                                  className={`mx-2 text-sm min-w-[36px] text-center ${
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {lineHeight.toFixed(1)}
                                </div>
                                <button
                                  onClick={() =>
                                    textEditorManager.updateLineHeight(
                                      Math.min(3, lineHeight + 0.1)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Font family selection */}
                            <div>
                              <label
                                className={`block text-xs mb-1 ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                Font Family
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  { name: "serif", label: "Serif" },
                                  { name: "sans-serif", label: "Sans" },
                                  { name: "monospace", label: "Mono" },
                                  { name: "cursive", label: "Cursive" },
                                ].map((font) => (
                                  <button
                                    key={font.name}
                                    onClick={() =>
                                      textEditorManager.updateFontFamily(
                                        font.name
                                      )
                                    }
                                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                      fontFamily === font.name
                                        ? isDarkMode
                                          ? "bg-indigo-600 text-white"
                                          : "bg-indigo-100 text-indigo-800"
                                        : isDarkMode
                                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                    }`}
                                    style={{ fontFamily: font.name }}
                                  >
                                    {font.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Letter spacing control */}
                            <div>
                              <label
                                className={`block text-xs mb-1 ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                Letter Spacing
                              </label>
                              <div className="flex items-center">
                                <button
                                  onClick={() =>
                                    textEditorManager.updateLetterSpacing(
                                      Math.max(-0.05, letterSpacing - 0.01)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
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
                                <div
                                  className={`mx-2 text-sm min-w-[36px] text-center ${
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {letterSpacing.toFixed(2)}
                                </div>
                                <button
                                  onClick={() =>
                                    textEditorManager.updateLetterSpacing(
                                      Math.min(0.1, letterSpacing + 0.01)
                                    )
                                  }
                                  className={`p-1 rounded ${
                                    isDarkMode
                                      ? "hover:bg-slate-700 text-slate-400"
                                      : "hover:bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Alignment section */}
                        <div>
                          <label
                            className={`block text-xs mb-1 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Text Alignment
                          </label>
                          <div className="flex bg-slate-700 rounded overflow-hidden">
                            {[
                              {
                                value: "left",
                                icon: (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ),
                              },
                              {
                                value: "center",
                                icon: (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM5 15a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ),
                              },
                              {
                                value: "right",
                                icon: (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ),
                              },
                              {
                                value: "justify",
                                icon: (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ),
                              },
                            ].map((align) => (
                              <button
                                key={align.value}
                                onClick={() =>
                                  textEditorManager.updateAlignment(
                                    align.value as any
                                  )
                                }
                                className={`p-2 ${
                                  alignment === align.value
                                    ? isDarkMode
                                      ? "bg-indigo-600 text-white"
                                      : "bg-indigo-500 text-white"
                                    : isDarkMode
                                      ? "text-slate-300 hover:bg-slate-600"
                                      : "text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                {align.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="space-y-4 flex-1 min-w-[250px]">
                        {/* Colors section */}
                        <div>
                          <h3
                            className={`text-sm font-medium mb-3 ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Colors
                          </h3>

                          {/* Text color selection */}
                          <div className="mb-4">
                            <label
                              className={`block text-xs mb-1 ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Text Color
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {colorOptions.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() =>
                                    textEditorManager.updateTextColor(
                                      color.value
                                    )
                                  }
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    textColor === color.value
                                      ? "ring-2 ring-offset-2 ring-indigo-500"
                                      : ""
                                  } ${
                                    color.value === ""
                                      ? isDarkMode
                                        ? "bg-white text-slate-900"
                                        : "bg-slate-800 text-white"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor:
                                      color.value ||
                                      (isDarkMode ? "#fff" : "#1e293b"),
                                  }}
                                  title={color.label}
                                >
                                  {color.value === "" && (
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Background color selection */}
                          <div>
                            <label
                              className={`block text-xs mb-1 ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Background Color
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {bgColorOptions.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() =>
                                    textEditorManager.updateBackgroundColor(
                                      color.value
                                    )
                                  }
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    backgroundColor === color.value
                                      ? "ring-2 ring-offset-2 ring-indigo-500"
                                      : ""
                                  } ${
                                    color.value === ""
                                      ? isDarkMode
                                        ? "bg-white text-slate-900"
                                        : "bg-slate-800 text-white"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor:
                                      color.value ||
                                      (isDarkMode ? "#fff" : "#1e293b"),
                                  }}
                                  title={color.label}
                                >
                                  {color.value === "" && (
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={textEditorManager.resetFormatting}
                            className={`w-full ${isDarkMode ? "border-slate-700 text-slate-300" : ""}`}
                          >
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Reset to Default
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Word analysis panel */}
              <AnimatePresence>
                {showWordAnalysis && (
                  <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`p-4 border-t ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Text Analysis
                      </h3>
                      <Badge
                        variant="soft"
                        color="info"
                        size="xs"
                        icon={
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        }
                      >
                        Click words to highlight
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Text statistics */}
                      <div>
                        <h4
                          className={`text-xs font-medium mb-2 uppercase tracking-wider ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Text Statistics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Words", value: wordCount },
                            { label: "Characters", value: charCount },
                            { label: "Sentences", value: sentenceCount },
                            {
                              label: "Avg Word Length",
                              value: `${avgWordLength} chars`,
                            },
                          ].map((stat, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg ${
                                isDarkMode
                                  ? "bg-slate-700"
                                  : "bg-white border border-slate-200"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {stat.label}
                              </p>
                              <p
                                className={`text-lg font-semibold ${
                                  isDarkMode ? "text-white" : "text-slate-800"
                                }`}
                              >
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key words */}
                      <div>
                        <h4
                          className={`text-xs font-medium mb-2 uppercase tracking-wider ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Key Words
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {topWords.map(([word, count], index) => (
                            <button
                              key={index}
                              onClick={() =>
                                textEditorManager.highlightWord(word)
                              }
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center transition-colors ${
                                highlightedWords.includes(word)
                                  ? isDarkMode
                                    ? "bg-indigo-600 text-white"
                                    : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : isDarkMode
                                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {word}
                              <span
                                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                                  highlightedWords.includes(word)
                                    ? isDarkMode
                                      ? "bg-indigo-700 text-indigo-200"
                                      : "bg-indigo-200 text-indigo-800"
                                    : isDarkMode
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-4 pt-4 border-t ${
                        isDarkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={textEditorManager.clearHighlights}
                            className={
                              isDarkMode
                                ? "border-slate-700 text-slate-300"
                                : ""
                            }
                          >
                            Clear Highlights
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              textEditorManager.highlightAllWords(
                                topWords.map((w) => w[0])
                              )
                            }
                            className={
                              isDarkMode
                                ? "border-slate-700 text-slate-300"
                                : ""
                            }
                          >
                            Highlight All
                          </Button>
                        </div>

                        <Button
                          variant="primary"
                          size="xs"
                          icon={
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                            </svg>
                          }
                        >
                          Export Analysis
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 flex justify-between items-center border-t ${
            isDarkMode
              ? "border-slate-800 bg-slate-900"
              : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Badge
              variant="soft"
              color="success"
              size="xs"
              shape="pill"
              icon={
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Sentiment: Positive
            </Badge>

            <Badge
              variant="soft"
              color="info"
              size="xs"
              shape="pill"
              icon={
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Readability: High
            </Badge>

            {testimonial.created_at && (
              <span
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {new Date(testimonial.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              }
              className={
                isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path
                    fillRule="evenodd"
                    d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              className={
                isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Print
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
);

export default TextTestimonial;
