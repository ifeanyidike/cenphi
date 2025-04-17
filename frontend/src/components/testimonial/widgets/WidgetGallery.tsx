import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import { BrowserPreview } from "./WidgetPreview";
import { Testimonial } from "@/types/testimonial";

interface WidgetGalleryProps {
  onClose: () => void;
  testimonial: Testimonial | null;
}

const WidgetGallery: React.FC<WidgetGalleryProps> = observer(
  ({ onClose, testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [customizations, setCustomizations] = useState({
      theme: "default",
      darkMode: false,
      rounded: "lg",
      showAvatar: true,
      showRating: true,
      showCompany: true,
      animation: "fade",
      position: "center",
      autoRotate: false,
      highlightColor: "#4f46e5",
      fontStyle: "modern",
      width: "full",
      border: true,
      shadow: "md",
    });

    // Widget templates
    const widgets = [
      {
        id: "minimal-card",
        name: "Minimal Card",
        description: "Clean, simple card layout focused on content",
        thumbnail: "minimal-card-thumbnail.jpg",
        bestFor: ["Websites", "Blog Posts", "Sidebars"],
        premium: false,
      },
      {
        id: "spotlight",
        name: "Spotlight",
        description: "Showcase a featured testimonial with elegant focus",
        thumbnail: "spotlight-thumbnail.jpg",
        bestFor: ["Landing Pages", "Feature Sections", "Hero Areas"],
        premium: true,
      },
      {
        id: "carousel",
        name: "Carousel",
        description: "Smoothly transition between multiple testimonials",
        thumbnail: "carousel-thumbnail.jpg",
        bestFor: ["Multiple Testimonials", "Space-Saving", "Homepage"],
        premium: true,
      },
      {
        id: "social-media",
        name: "Social Media Card",
        description: "Styled like a social media post for familiarity",
        thumbnail: "social-media-thumbnail.jpg",
        bestFor: ["Embedding", "Social Proof", "Content Marketing"],
        premium: false,
      },
      {
        id: "video-player",
        name: "Video Player",
        description: "Beautiful video testimonial player with custom controls",
        thumbnail: "video-player-thumbnail.jpg",
        bestFor: ["Video Testimonials", "Product Pages", "Case Studies"],
        premium: true,
      },
      {
        id: "quote-block",
        name: "Quote Block",
        description: "Classic, elegant quote design for text testimonials",
        thumbnail: "quote-block-thumbnail.jpg",
        bestFor: ["Text Testimonials", "Press Mentions", "Formal Sites"],
        premium: false,
      },
      {
        id: "grid-mosaic",
        name: "Grid Mosaic",
        description: "Visually appealing grid layout for multiple testimonials",
        thumbnail: "grid-mosaic-thumbnail.jpg",
        bestFor: ["Testimonial Pages", "Case Study Pages", "Social Proof"],
        premium: true,
      },
      {
        id: "floating-bubble",
        name: "Floating Bubble",
        description: "Non-intrusive bubble that appears on scroll",
        thumbnail: "floating-bubble-thumbnail.jpg",
        bestFor: ["Subtle Promotion", "Long Pages", "Checkout Flows"],
        premium: true,
      },
    ];

    // Animation variants
    const drawerVariants = {
      hidden: { x: "100%", opacity: 0 },
      visible: {
        x: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          staggerChildren: 0.04,
          delayChildren: 0.2,
        },
      },
      exit: {
        x: "100%",
        opacity: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 40,
          staggerChildren: 0.03,
          staggerDirection: -1,
        },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: 20, opacity: 0 },
    };

    const gridVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          staggerChildren: 0.03,
          staggerDirection: -1,
        },
      },
    };

    const cardVariants = {
      hidden: { scale: 0.9, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      hover: {
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    };

    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    };

    const handleCustomizationChange = (
      key: keyof typeof customizations,
      value: any
    ) => {
      setCustomizations({
        ...customizations,
        [key]: value,
      });
    };

    const handleWidgetSelect = (widgetId: string) => {
      setSelectedWidget(widgetId);
      setIsCustomizing(true);
    };

    const handleBack = () => {
      if (isCustomizing) {
        setIsCustomizing(false);
      } else if (selectedWidget) {
        setSelectedWidget(null);
      } else {
        onClose();
      }
    };

    // Generate embed code based on customizations
    const generateEmbedCode = () => {
      return `<div 
  class="testimonial-widget"
  data-widget-type="${selectedWidget}"
  data-testimonial-id="${testimonial?.id || "testimonial-id"}"
  data-theme="${customizations.theme}"
  data-dark-mode="${customizations.darkMode}"
  data-rounded="${customizations.rounded}"
  data-show-avatar="${customizations.showAvatar}"
  data-show-rating="${customizations.showRating}"
  data-show-company="${customizations.showCompany}"
  data-animation="${customizations.animation}"
  data-position="${customizations.position}"
  data-auto-rotate="${customizations.autoRotate}"
  data-highlight-color="${customizations.highlightColor}"
  data-font-style="${customizations.fontStyle}"
  data-width="${customizations.width}"
  data-border="${customizations.border}"
  data-shadow="${customizations.shadow}"
>
</div>
<script src="https://cdn.yourdomain.com/testimonial-widgets.js"></script>`;
    };

    const handleCopyCode = () => {
      navigator.clipboard.writeText(generateEmbedCode());
      // Show a toast or some UI feedback (not implemented in this code)
    };

    return (
      <>
        {/* Backdrop overlay */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />

        {/* Drawer panel */}
        <motion.div
          className={`fixed top-0 right-0 bottom-0 w-full md:w-[650px] z-50 shadow-2xl ${
            isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
          }`}
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <motion.div
            className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? "border-slate-800" : "border-slate-200"
            }`}
            variants={itemVariants}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-2 text-white">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Widget Gallery</h2>
                {isCustomizing && selectedWidget && (
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Customizing:{" "}
                    {widgets.find((w) => w.id === selectedWidget)?.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-opacity-10 transition-colors ${
                isDarkMode ? "hover:bg-white" : "hover:bg-slate-100"
              }`}
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>

          {/* Body content */}
          <div className="overflow-y-auto h-[calc(100%-73px)]">
            <AnimatePresence mode="wait">
              {!selectedWidget ? (
                // Widget gallery grid
                <motion.div
                  key="gallery"
                  className="p-6"
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div variants={itemVariants}>
                    <h3
                      className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Choose a Widget Template
                    </h3>
                    <p
                      className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Select a widget style to showcase your testimonial on your
                      website or marketing materials.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    {widgets.map((widget) => (
                      <motion.div
                        key={widget.id}
                        variants={cardVariants}
                        whileHover="hover"
                        className={`cursor-pointer rounded-xl overflow-hidden ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-750"
                            : "bg-white border border-slate-200 hover:border-slate-300"
                        } transition-all duration-300 shadow-sm hover:shadow-md`}
                        onClick={() => setSelectedWidget(widget.id)}
                      >
                        <div className="relative h-36 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <div
                            className={`absolute inset-0 flex items-center justify-center font-medium text-white ${
                              isDarkMode ? "bg-slate-900/10" : "bg-white/10"
                            }`}
                          >
                            {/* This would be a thumbnail image in a real implementation */}
                            <div className="text-center">
                              <span className="text-4xl">
                                {widget.id === "minimal-card" && "📇"}
                                {widget.id === "spotlight" && "🔦"}
                                {widget.id === "carousel" && "🎠"}
                                {widget.id === "social-media" && "📱"}
                                {widget.id === "video-player" && "🎬"}
                                {widget.id === "quote-block" && "💬"}
                                {widget.id === "grid-mosaic" && "🧩"}
                                {widget.id === "floating-bubble" && "💭"}
                              </span>
                            </div>
                          </div>
                          {widget.premium && (
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant="soft"
                                color="warning"
                                size="xs"
                                shape="pill"
                                icon={
                                  <span className="text-yellow-600">⭐</span>
                                }
                              >
                                Premium
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h4
                            className={`font-medium mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            {widget.name}
                          </h4>
                          <p
                            className={`text-xs mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                          >
                            {widget.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {widget.bestFor.map((tag, i) => (
                              <Badge
                                key={i}
                                variant={isDarkMode ? "soft" : "outline"}
                                size="xs"
                                shape="rounded"
                                className="text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : isCustomizing ? (
                // Customization panel
                <motion.div
                  key="customize"
                  className="p-6"
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left column: Customization options */}
                    <div className="lg:col-span-5 space-y-6">
                      <motion.div variants={itemVariants}>
                        <h3
                          className={`text-lg font-medium mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Customize Your Widget
                        </h3>

                        {/* Theme */}
                        <div className="mb-4">
                          <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Theme
                          </label>
                          <select
                            value={customizations.theme}
                            onChange={(e) =>
                              handleCustomizationChange("theme", e.target.value)
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          >
                            <option value="default">Default</option>
                            <option value="modern">Modern</option>
                            <option value="classic">Classic</option>
                            <option value="minimal">Minimal</option>
                            <option value="vibrant">Vibrant</option>
                            <option value="elegant">Elegant</option>
                          </select>
                        </div>

                        {/* Color */}
                        <div className="mb-4">
                          <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Highlight Color
                          </label>
                          <div className="flex gap-3">
                            {[
                              "#4f46e5",
                              "#06b6d4",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                            ].map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full ${
                                  customizations.highlightColor === color
                                    ? "ring-2 ring-offset-2 ring-white"
                                    : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  handleCustomizationChange(
                                    "highlightColor",
                                    color
                                  )
                                }
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                            <input
                              type="color"
                              value={customizations.highlightColor}
                              onChange={(e) =>
                                handleCustomizationChange(
                                  "highlightColor",
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Rounded corners */}
                        <div className="mb-4">
                          <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Corner Radius
                          </label>
                          <div className="flex gap-2">
                            {[
                              { value: "none", label: "None" },
                              { value: "sm", label: "Small" },
                              { value: "md", label: "Medium" },
                              { value: "lg", label: "Large" },
                              { value: "full", label: "Full" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                className={`px-3 py-1 text-xs rounded-full ${
                                  customizations.rounded === option.value
                                    ? isDarkMode
                                      ? "bg-indigo-600 text-white"
                                      : "bg-indigo-600 text-white"
                                    : isDarkMode
                                      ? "bg-slate-800 text-slate-300 border border-slate-700"
                                      : "bg-white text-slate-700 border border-slate-300"
                                }`}
                                onClick={() =>
                                  handleCustomizationChange(
                                    "rounded",
                                    option.value
                                  )
                                }
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              Show Avatar
                            </label>
                            <button
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                customizations.showAvatar
                                  ? "bg-indigo-600"
                                  : isDarkMode
                                    ? "bg-slate-700"
                                    : "bg-slate-300"
                              }`}
                              onClick={() =>
                                handleCustomizationChange(
                                  "showAvatar",
                                  !customizations.showAvatar
                                )
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                  customizations.showAvatar
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label
                              className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              Show Rating
                            </label>
                            <button
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                customizations.showRating
                                  ? "bg-indigo-600"
                                  : isDarkMode
                                    ? "bg-slate-700"
                                    : "bg-slate-300"
                              }`}
                              onClick={() =>
                                handleCustomizationChange(
                                  "showRating",
                                  !customizations.showRating
                                )
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                  customizations.showRating
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label
                              className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              Show Company
                            </label>
                            <button
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                customizations.showCompany
                                  ? "bg-indigo-600"
                                  : isDarkMode
                                    ? "bg-slate-700"
                                    : "bg-slate-300"
                              }`}
                              onClick={() =>
                                handleCustomizationChange(
                                  "showCompany",
                                  !customizations.showCompany
                                )
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                  customizations.showCompany
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label
                              className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              Dark Mode
                            </label>
                            <button
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                customizations.darkMode
                                  ? "bg-indigo-600"
                                  : isDarkMode
                                    ? "bg-slate-700"
                                    : "bg-slate-300"
                              }`}
                              onClick={() =>
                                handleCustomizationChange(
                                  "darkMode",
                                  !customizations.darkMode
                                )
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                  customizations.darkMode
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Animation */}
                        <div className="mb-4">
                          <label
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Animation
                          </label>
                          <select
                            value={customizations.animation}
                            onChange={(e) =>
                              handleCustomizationChange(
                                "animation",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          >
                            <option value="fade">Fade</option>
                            <option value="slide">Slide</option>
                            <option value="zoom">Zoom</option>
                            <option value="flip">Flip</option>
                            <option value="none">None</option>
                          </select>
                        </div>

                        {/* More advanced options accordion (collapsed by default) */}
                        <div
                          className={`mt-6 rounded-lg border ${
                            isDarkMode ? "border-slate-700" : "border-slate-200"
                          }`}
                        >
                          <button
                            className={`w-full p-4 text-left flex justify-between items-center ${
                              isDarkMode
                                ? "hover:bg-slate-800/50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                            >
                              Advanced Options
                            </span>
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {/* Advanced options would be here */}
                        </div>
                      </motion.div>
                    </div>

                    {/* Right column: Preview and code */}
                    <div className="lg:col-span-7 space-y-6">
                      <motion.div variants={itemVariants} className="space-y-6">
                        {/* Browser preview */}
                        <div
                          className={`rounded-lg overflow-hidden shadow-lg ${
                            isDarkMode
                              ? "bg-slate-800 ring-1 ring-white/5"
                              : "bg-white ring-1 ring-black/5"
                          }`}
                        >
                          <div
                            className={`py-2 px-4 flex items-center gap-2 border-b ${
                              isDarkMode
                                ? "bg-slate-900 border-slate-700"
                                : "bg-slate-100 border-slate-200"
                            }`}
                          >
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div
                              className={`text-xs flex-1 text-center ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              yourwebsite.com
                            </div>
                          </div>

                          <div
                            className={`p-4 ${customizations.darkMode ? "bg-slate-900" : "bg-white"}`}
                          >
                            <BrowserPreview
                              widgetType={selectedWidget || "minimal-card"}
                              testimonial={testimonial}
                              customizations={customizations}
                            />
                          </div>
                        </div>

                        {/* Embed code */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4
                              className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              Widget Embed Code
                            </h4>
                            <button
                              onClick={handleCopyCode}
                              className={`text-xs font-medium px-3 py-1 rounded-full ${
                                isDarkMode
                                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              Copy Code
                            </button>
                          </div>

                          <div
                            className={`p-3 rounded-lg font-mono text-xs overflow-x-auto ${
                              isDarkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <pre className="whitespace-pre-wrap">
                              {generateEmbedCode()}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Widget detail view
                <motion.div
                  key="detail"
                  className="p-6"
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Widget detail content would go here */}
                  <motion.div variants={itemVariants}>
                    <h3
                      className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {widgets.find((w) => w.id === selectedWidget)?.name}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {
                        widgets.find((w) => w.id === selectedWidget)
                          ?.description
                      }
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 p-6 border-t ${
              isDarkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            } flex justify-between items-center`}
            variants={itemVariants}
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              icon={
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
              }
            >
              {isCustomizing ? "Back to Gallery" : "Back"}
            </Button>

            <Button
              variant={selectedWidget ? "primary" : "outline"}
              disabled={!selectedWidget}
              onClick={() =>
                isCustomizing
                  ? handleCopyCode()
                  : handleWidgetSelect(selectedWidget!)
              }
              icon={
                isCustomizing ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )
              }
            >
              {isCustomizing ? "Copy Widget Code" : "Customize Widget"}
            </Button>
          </motion.div>
        </motion.div>
      </>
    );
  }
);

export default WidgetGallery;
