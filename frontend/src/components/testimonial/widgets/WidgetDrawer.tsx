// components/WidgetDrawer.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import { Testimonial } from "@/types/testimonial";

interface WidgetDrawerProps {
  onClose: () => void;
  testimonial: Testimonial | null;
}

// Define widget types and options
interface WidgetOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ColorOption {
  id: string;
  label: string;
  value: string;
  textValue: string;
}

const WidgetDrawer: React.FC<WidgetDrawerProps> = observer(
  ({ onClose, testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // Widget state
    const [selectedWidget, setSelectedWidget] = useState<string>("card-3d");
    const [selectedTheme, setSelectedTheme] = useState<string>("modern");
    const [selectedColor, setSelectedColor] = useState<string>("blue");
    const [widgetSettings, setWidgetSettings] = useState({
      showAuthor: true,
      showAvatar: true,
      showCompany: true,
      showRating: true,
      animation: "fade",
      borderRadius: "medium",
      shadow: "medium",
      contentAlignment: "left",
    });

    // Widget options
    const widgetOptions: WidgetOption[] = [
      {
        id: "card-3d",
        label: "3D Card",
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
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        ),
        description:
          "An impressive 3D card with perspective effect that rotates on hover.",
      },
      {
        id: "glass-morphism",
        label: "Glass Card",
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
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ),
        description: "Modern glass morphism effect with blur and transparency.",
      },
      {
        id: "floating-bubbles",
        label: "Bubble Quote",
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
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        ),
        description: "Animated speech bubble with floating particles effect.",
      },
      {
        id: "minimal-quote",
        label: "Minimal Quote",
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
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        ),
        description:
          "Clean, minimalist design with elegant typography and spacing.",
      },
    ];

    // Theme options
    const themeOptions = [
      { id: "modern", label: "Modern" },
      { id: "classic", label: "Classic" },
      { id: "minimalist", label: "Minimalist" },
      { id: "bold", label: "Bold" },
    ];

    // Color palette options
    const colorOptions: ColorOption[] = [
      { id: "blue", label: "Blue", value: "#3b82f6", textValue: "#ffffff" },
      { id: "purple", label: "Purple", value: "#8b5cf6", textValue: "#ffffff" },
      {
        id: "emerald",
        label: "Emerald",
        value: "#10b981",
        textValue: "#ffffff",
      },
      { id: "amber", label: "Amber", value: "#f59e0b", textValue: "#ffffff" },
      { id: "rose", label: "Rose", value: "#f43f5e", textValue: "#ffffff" },
      { id: "slate", label: "Slate", value: "#64748b", textValue: "#ffffff" },
    ];

    // Handle toggle settings
    const toggleSetting = (setting: string) => {
      setWidgetSettings({
        ...widgetSettings,
        [setting]: !widgetSettings[setting as keyof typeof widgetSettings],
      });
    };

    // Handle select setting
    const updateSetting = (setting: string, value: string) => {
      setWidgetSettings({
        ...widgetSettings,
        [setting]: value,
      });
    };

    // Animation variants
    const drawerVariants = {
      hidden: { x: "100%" },
      visible: {
        x: 0,
        transition: {
          type: "spring",
          damping: 30,
          stiffness: 300,
        },
      },
      exit: {
        x: "100%",
        transition: {
          type: "spring",
          damping: 35,
          stiffness: 300,
        },
      },
    };

    // Get current color option
    const currentColor =
      colorOptions.find((color) => color.id === selectedColor) ||
      colorOptions[0];

    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Widget Drawer */}
        <div className="relative flex items-stretch ml-auto">
          <motion.div
            className={`w-96 h-full overflow-y-auto ${
              isDarkMode
                ? "bg-slate-900 text-white border-l border-slate-800"
                : "bg-white text-slate-900 border-l border-slate-200"
            } shadow-2xl`}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                  Widget Studio
                </h2>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Widget Type Selection */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3
                className={`text-base font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                Widget Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {widgetOptions.map((widget) => (
                  <motion.button
                    key={widget.id}
                    onClick={() => setSelectedWidget(widget.id)}
                    className={`p-3 rounded-lg flex flex-col items-center text-center ${
                      selectedWidget === widget.id
                        ? isDarkMode
                          ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                          : "bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-2"
                        : isDarkMode
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`mb-2 ${
                        selectedWidget === widget.id
                          ? isDarkMode
                            ? "text-white"
                            : "text-blue-600"
                          : isDarkMode
                            ? "text-slate-300"
                            : "text-slate-600"
                      }`}
                    >
                      {widget.icon}
                    </div>
                    <span className="text-sm font-medium">{widget.label}</span>
                  </motion.button>
                ))}
              </div>
              <p
                className={`mt-3 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {
                  widgetOptions.find((w) => w.id === selectedWidget)
                    ?.description
                }
              </p>
            </div>

            {/* Theme Selection */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3
                className={`text-base font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                Theme
              </h3>
              <div className="flex space-x-2">
                {themeOptions.map((theme) => (
                  <motion.button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      selectedTheme === theme.id
                        ? isDarkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : isDarkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-700"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {theme.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3
                className={`text-base font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                Color Scheme
              </h3>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((color) => (
                  <motion.button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-10 h-10 rounded-full ${
                      selectedColor === color.id
                        ? "ring-2 ring-offset-2 ring-white"
                        : ""
                    } ${isDarkMode ? "ring-offset-slate-900" : "ring-offset-white"}`}
                    style={{ backgroundColor: color.value }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedColor === color.id && (
                      <svg
                        className="w-5 h-5 mx-auto"
                        fill="currentColor"
                        style={{ color: color.textValue }}
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Widget Settings */}
            <div className="p-4">
              <h3
                className={`text-base font-semibold mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                Widget Settings
              </h3>

              {/* Display Settings */}
              <div className="mb-4">
                <h4
                  className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                >
                  Display
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Show Author
                    </label>
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        widgetSettings.showAuthor
                          ? "bg-blue-600"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-slate-300"
                      }`}
                      onClick={() => toggleSetting("showAuthor")}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          widgetSettings.showAuthor
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Show Avatar
                    </label>
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        widgetSettings.showAvatar
                          ? "bg-blue-600"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-slate-300"
                      }`}
                      onClick={() => toggleSetting("showAvatar")}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          widgetSettings.showAvatar
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Show Company
                    </label>
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        widgetSettings.showCompany
                          ? "bg-blue-600"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-slate-300"
                      }`}
                      onClick={() => toggleSetting("showCompany")}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          widgetSettings.showCompany
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Show Rating
                    </label>
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        widgetSettings.showRating
                          ? "bg-blue-600"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-slate-300"
                      }`}
                      onClick={() => toggleSetting("showRating")}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          widgetSettings.showRating
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Style Settings */}
              <div className="mb-4">
                <h4
                  className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                >
                  Style
                </h4>

                <div className="mb-3">
                  <label
                    className={`block text-sm mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Animation
                  </label>
                  <select
                    value={widgetSettings.animation}
                    onChange={(e) => updateSetting("animation", e.target.value)}
                    className={`w-full p-2 rounded-lg ${
                      isDarkMode
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "bg-slate-100 text-slate-900 border border-slate-300"
                    }`}
                  >
                    <option value="fade">Fade In</option>
                    <option value="slide">Slide Up</option>
                    <option value="zoom">Zoom In</option>
                    <option value="flip">Flip</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label
                    className={`block text-sm mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Border Radius
                  </label>
                  <div className="flex space-x-2">
                    {["none", "small", "medium", "large", "full"].map(
                      (radius) => (
                        <button
                          key={radius}
                          onClick={() => updateSetting("borderRadius", radius)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            widgetSettings.borderRadius === radius
                              ? isDarkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white"
                              : isDarkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {radius.charAt(0).toUpperCase() + radius.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    className={`block text-sm mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Shadow
                  </label>
                  <div className="flex space-x-2">
                    {["none", "small", "medium", "large"].map((shadow) => (
                      <button
                        key={shadow}
                        onClick={() => updateSetting("shadow", shadow)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          widgetSettings.shadow === shadow
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-600 text-white"
                            : isDarkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {shadow.charAt(0).toUpperCase() + shadow.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    className={`block text-sm mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Content Alignment
                  </label>
                  <div className="flex space-x-2">
                    {["left", "center", "right"].map((alignment) => (
                      <button
                        key={alignment}
                        onClick={() =>
                          updateSetting("contentAlignment", alignment)
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          widgetSettings.contentAlignment === alignment
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-600 text-white"
                            : isDarkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {alignment.charAt(0).toUpperCase() + alignment.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <motion.button
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset
                </motion.button>

                <motion.button
                  className={`px-6 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Apply Widget
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Widget Preview Panel */}
          <motion.div
            className={`w-96 h-full overflow-y-auto flex flex-col ${
              isDarkMode
                ? "bg-slate-800 text-white border-l border-r border-slate-800"
                : "bg-slate-50 text-slate-900 border-l border-r border-slate-200"
            } shadow-2xl`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              delay: 0.1,
            }}
          >
            {/* Preview Header */}
            <div
              className={`p-4 border-b ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3 className="text-lg font-semibold">Widget Preview</h3>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Live preview of your widget
              </p>
            </div>

            {/* Preview Body */}
            <div className="flex-1 flex items-center justify-center p-6">
              {/* Card Preview */}
              <div
                className={`transform transition-all duration-300 w-full ${
                  selectedWidget === "card-3d"
                    ? "rotate-y-3 rotate-x-2 hover:rotate-y-0 hover:rotate-x-0"
                    : ""
                } ${
                  widgetSettings.borderRadius === "none"
                    ? "rounded-none"
                    : widgetSettings.borderRadius === "small"
                      ? "rounded-lg"
                      : widgetSettings.borderRadius === "medium"
                        ? "rounded-xl"
                        : widgetSettings.borderRadius === "large"
                          ? "rounded-2xl"
                          : "rounded-3xl"
                } ${
                  widgetSettings.shadow === "none"
                    ? ""
                    : widgetSettings.shadow === "small"
                      ? "shadow-md"
                      : widgetSettings.shadow === "medium"
                        ? "shadow-lg"
                        : "shadow-xl"
                } ${
                  selectedWidget === "glass-morphism"
                    ? "backdrop-blur-lg bg-white/20 dark:bg-slate-900/60 border border-white/30 dark:border-slate-700/50"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                }`}
                style={{
                  background:
                    selectedWidget === "glass-morphism"
                      ? isDarkMode
                        ? `rgba(30, 41, 59, 0.7)`
                        : `rgba(255, 255, 255, 0.7)`
                      : selectedTheme === "gradient"
                        ? `linear-gradient(135deg, ${currentColor.value}10, ${currentColor.value}30)`
                        : isDarkMode
                          ? "#1e293b"
                          : "#ffffff",
                  boxShadow:
                    selectedWidget === "card-3d"
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      : "",
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                  textAlign: widgetSettings.contentAlignment as any,
                }}
              >
                <div className="p-6">
                  {/* Quote Icon */}
                  <div className="mb-4" style={{ color: currentColor.value }}>
                    <svg
                      className="w-10 h-10 opacity-80"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Testimonial Text */}
                  <div className="mb-6">
                    <p
                      className={`text-lg ${isDarkMode ? "text-white" : "text-slate-700"} leading-relaxed`}
                    >
                      {testimonial?.format === "text" ||
                      testimonial?.format === "image"
                        ? testimonial?.content || ""
                        : testimonial?.format === "audio" ||
                            testimonial?.format === "video"
                          ? testimonial.transcript
                          : "The product quality is excellent and the value for money is exceptional. The team went above and beyond to ensure I had everything I needed."}
                    </p>
                  </div>

                  {/* Author Info */}
                  {widgetSettings.showAuthor && (
                    <div
                      className={`flex items-center ${widgetSettings.contentAlignment === "center" ? "justify-center" : widgetSettings.contentAlignment === "right" ? "justify-end" : ""}`}
                    >
                      {widgetSettings.showAvatar &&
                        testimonial?.customer_profile?.avatar_url && (
                          <div className="flex-shrink-0 mr-4">
                            <img
                              src={testimonial.customer_profile?.avatar_url}
                              alt={testimonial.customer_profile?.name}
                              className="w-12 h-12 rounded-full object-cover border-2"
                              style={{ borderColor: currentColor.value }}
                            />
                          </div>
                        )}

                      <div>
                        <div
                          className="font-medium"
                          style={{ color: currentColor.value }}
                        >
                          {testimonial?.customer_profile?.name || "Jane Smith"}
                        </div>

                        {widgetSettings.showCompany &&
                          testimonial?.customer_profile?.title &&
                          testimonial?.customer_profile?.company && (
                            <div
                              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {testimonial.customer_profile?.title},{" "}
                              {testimonial.customer_profile?.company}
                            </div>
                          )}

                        {widgetSettings.showRating && testimonial?.rating && (
                          <div className="flex mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < testimonial.rating! ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            <div
              className={`p-4 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
            >
              <div className="flex justify-between">
                <button
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>Desktop</span>
                  </div>
                </button>

                <button
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Mobile</span>
                  </div>
                </button>

                <button
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                    <span>Widget</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
);

export default WidgetDrawer;
