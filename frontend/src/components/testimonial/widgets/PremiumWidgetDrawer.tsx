// WidgetDrawer.tsx

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WidgetCustomization,
  WidgetProps,
  SpotlightWidget,
  CarouselWidget,
  MinimalCardWidget,
  VideoPlayerWidget,
} from "./widget-components";
import WidgetStudio from "./WidgetStudio";
import { Testimonial } from "@/types/testimonial";
import { TestimonialFormat } from "@/types/setup";

// Interfaces and Types
export interface WidgetSettings {
  id: string;
  name: string;
  type: string;
  testimonialId: string;
  customizations: WidgetCustomization;
  usageStats: {
    views: number;
    clicks: number;
    conversions: number;
    lastUpdated: string;
    conversionRate?: number;
    avgEngagementTime?: number;
  };
  embedLocations: string[];
  created?: string;
  lastModified?: string;
  version?: number;
}

export interface WidgetTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  image?: string;
  premium: boolean;
  bestFor: string[];
  compatibleWith: Array<"text" | "video" | "audio" | "image">;
  defaultCustomizations: Partial<WidgetCustomization>;
  component: React.FC<WidgetProps>;
}

interface WidgetDrawerProps {
  testimonial: Testimonial;
  onClose: () => void;
  isDarkMode?: boolean;
}

// Sample widgets history - in a real app, this would come from your state management or API
const sampleWidgetHistory: WidgetSettings[] = [
  {
    id: "widget-1",
    name: "Homepage Spotlight",
    type: "spotlight",
    testimonialId: "testimonial-1",
    customizations: {
      theme: "premium",
      darkMode: false,
      rounded: "xl",
      showAvatar: true,
      showRating: true,
      showCompany: true,
      animation: "fade",
      position: "center",
      autoRotate: false,
      highlightColor: "#6366f1",
      fontStyle: "modern",
      width: "full",
      border: true,
      shadow: "xl",
      textAlign: "left",
    },
    usageStats: {
      views: 14253,
      clicks: 2342,
      conversions: 568,
      lastUpdated: new Date().toISOString(),
      conversionRate: 24.2,
      avgEngagementTime: 42,
    },
    embedLocations: ["homepage", "about-us"],
    created: "2025-03-15T12:34:56Z",
    lastModified: "2025-04-05T09:12:34Z",
    version: 3,
  },
  {
    id: "widget-2",
    name: "Product Page Carousel",
    type: "carousel",
    testimonialId: "testimonial-1",
    customizations: {
      theme: "modern",
      darkMode: false,
      rounded: "lg",
      showAvatar: true,
      showRating: true,
      showCompany: true,
      animation: "slide",
      position: "center",
      autoRotate: true,
      highlightColor: "#10b981",
      fontStyle: "modern",
      width: "full",
      border: true,
      shadow: "md",
      textAlign: "center",
    },
    usageStats: {
      views: 9872,
      clicks: 1654,
      conversions: 387,
      lastUpdated: new Date().toISOString(),
      conversionRate: 23.4,
      avgEngagementTime: 67,
    },
    embedLocations: ["product-page", "pricing-page"],
    created: "2025-03-18T15:24:36Z",
    lastModified: "2025-04-03T11:22:14Z",
    version: 2,
  },
];

/**
 * Widget Drawer - Main container for the widget creation and management experience
 */
const WidgetDrawer: React.FC<WidgetDrawerProps> = ({
  testimonial,
  onClose,
  isDarkMode = false,
}) => {
  // State
  const [view, setView] = useState<"gallery" | "studio" | "preview">("gallery");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [, setSelectedWidgetTemplate] = useState<WidgetTemplate | null>(null);
  const [widgetHistory, setWidgetHistory] = useState<WidgetSettings[]>([]);

  // Predefined widget templates
  const widgetTemplates: WidgetTemplate[] = useMemo(
    () => [
      {
        id: "spotlight",
        type: "spotlight",
        name: "Spotlight Testimonial",
        description:
          "Feature your best testimonial with an elegant spotlight design",
        image:
          "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60",
        premium: true,
        bestFor: ["Landing Pages", "Featured Sections", "Hero Areas"],
        compatibleWith: ["text", "video", "audio", "image"],
        component: SpotlightWidget,
        defaultCustomizations: {
          theme: "premium",
          darkMode: false,
          rounded: "xl",
          showAvatar: true,
          showRating: true,
          showCompany: true,
          animation: "fade",
          highlightColor: "#8b5cf6",
        },
      },
      {
        id: "carousel",
        type: "carousel",
        name: "Testimonial Carousel",
        description: "Showcase multiple testimonials in an elegant carousel",
        image:
          "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60",
        premium: true,
        bestFor: ["Multiple Testimonials", "Homepage", "Social Proof"],
        compatibleWith: ["text", "video", "audio", "image"],
        component: CarouselWidget,
        defaultCustomizations: {
          theme: "modern",
          darkMode: false,
          rounded: "lg",
          showAvatar: true,
          showRating: true,
          showCompany: true,
          animation: "slide",
          autoRotate: true,
          highlightColor: "#10b981",
        },
      },
      {
        id: "minimal-card",
        type: "minimal-card",
        name: "Minimal Card",
        description: "Clean, modern design that fits seamlessly anywhere",
        image:
          "https://images.unsplash.com/photo-1576613109753-27804de2cba8?w=500&auto=format&fit=crop&q=60",
        premium: false,
        bestFor: ["Websites", "Blog Posts", "Sidebars"],
        compatibleWith: ["text", "audio", "image"],
        component: MinimalCardWidget,
        defaultCustomizations: {
          theme: "minimal",
          darkMode: false,
          rounded: "lg",
          showAvatar: true,
          showRating: true,
          showCompany: true,
          animation: "none",
          highlightColor: "#4f46e5",
        },
      },
      {
        id: "video-player",
        type: "video-player",
        name: "Video Player",
        description: "Beautiful video testimonial player with custom controls",
        image:
          "https://images.unsplash.com/photo-1522096823084-2d1aa8411c13?w=500&auto=format&fit=crop&q=60",
        premium: true,
        bestFor: ["Video Testimonials", "Product Pages", "Case Studies"],
        compatibleWith: ["video"],
        component: VideoPlayerWidget,
        defaultCustomizations: {
          theme: "dark",
          darkMode: true,
          rounded: "lg",
          showAvatar: true,
          showRating: true,
          showCompany: true,
          animation: "zoom",
          highlightColor: "#6366f1",
        },
      },
    ],
    []
  );

  // Filter widget templates based on testimonial type
  const compatibleTemplates = useMemo(() => {
    return widgetTemplates.filter((template) =>
      template.compatibleWith.includes(testimonial.format as TestimonialFormat)
    );
  }, [widgetTemplates, testimonial.format]);

  // Load widget history for this testimonial
  useEffect(() => {
    // In a real app, you would fetch this from an API or state management
    const relevantWidgets = sampleWidgetHistory.filter(
      (widget) => widget.testimonialId === testimonial.id
    );
    setWidgetHistory(relevantWidgets);
  }, [testimonial.id]);

  // Handle selecting a widget template
  const handleSelectTemplate = (template: WidgetTemplate) => {
    setSelectedWidgetTemplate(template);
    setView("studio");
  };

  // Handle selecting a saved widget
  const handleSelectSavedWidget = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
    setView("preview");
  };

  // Handle widget save
  const handleSaveWidget = (widgetConfig: {
    type: string;
    name: string;
    customizations: WidgetCustomization;
  }) => {
    // In a real app, you would save this to your backend
    const newWidget: WidgetSettings = {
      id: `widget-${Date.now()}`,
      name: widgetConfig.name,
      type: widgetConfig.type,
      testimonialId: testimonial.id,
      customizations: widgetConfig.customizations,
      usageStats: {
        views: 0,
        clicks: 0,
        conversions: 0,
        lastUpdated: new Date().toISOString(),
      },
      embedLocations: [],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
    };

    // Add to local state
    setWidgetHistory((prev) => [newWidget, ...prev]);

    // Show preview of the new widget
    setSelectedWidgetId(newWidget.id);
    setView("preview");
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

  // Handle back navigation
  const handleBack = () => {
    if (view === "studio" || view === "preview") {
      setView("gallery");
      setSelectedWidgetId(null);
      setSelectedWidgetTemplate(null);
    } else {
      onClose();
    }
  };

  // Render different views
  const renderView = () => {
    switch (view) {
      case "gallery":
        return (
          <WidgetGallery
            testimonial={testimonial}
            compatibleTemplates={compatibleTemplates}
            widgetHistory={widgetHistory}
            onSelectTemplate={handleSelectTemplate}
            onSelectSavedWidget={handleSelectSavedWidget}
            onBack={handleBack}
            isDarkMode={isDarkMode}
          />
        );
      case "studio":
        return (
          <WidgetStudio
            testimonial={testimonial}
            onClose={() => setView("gallery")}
            onSave={handleSaveWidget}
          />
        );
      case "preview":
        return (
          <WidgetPreview
            testimonial={testimonial}
            widgetId={selectedWidgetId!}
            widgetHistory={widgetHistory}
            onBack={handleBack}
            onEdit={() => {
              const widget = widgetHistory.find(
                (w) => w.id === selectedWidgetId
              );
              if (widget) {
                const template = widgetTemplates.find(
                  (t) => t.type === widget.type
                );
                if (template) {
                  setSelectedWidgetTemplate(template);
                  setView("studio");
                }
              }
            }}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return null;
    }
  };

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
          className={`w-full md:w-[700px] h-full overflow-hidden ${
            isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
          } shadow-2xl`}
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {renderView()}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * WidgetGallery - Displays widget templates and previously created widgets
 */
interface WidgetGalleryProps {
  testimonial: Testimonial;
  compatibleTemplates: WidgetTemplate[];
  widgetHistory: WidgetSettings[];
  onSelectTemplate: (template: WidgetTemplate) => void;
  onSelectSavedWidget: (widgetId: string) => void;
  onBack: () => void;
  isDarkMode: boolean;
}

const WidgetGallery: React.FC<WidgetGalleryProps> = ({
  testimonial,
  compatibleTemplates,
  widgetHistory,
  onSelectTemplate,
  onSelectSavedWidget,
  onBack,
  isDarkMode,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<"templates" | "my-widgets">(
    "templates"
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500,
      },
    },
  };

  // Function to render a widget component for preview
  const renderWidgetComponent = (
    type: string,
    customizations: WidgetCustomization
  ) => {
    switch (type) {
      case "spotlight":
        return (
          <SpotlightWidget
            testimonial={testimonial}
            customizations={customizations}
          />
        );
      case "carousel":
        return (
          <CarouselWidget
            testimonial={testimonial}
            customizations={customizations}
          />
        );
      case "minimal-card":
        return (
          <MinimalCardWidget
            testimonial={testimonial}
            customizations={customizations}
          />
        );
      case "video-player":
        return (
          <VideoPlayerWidget
            testimonial={testimonial}
            customizations={customizations}
          />
        );
      default:
        return (
          <MinimalCardWidget
            testimonial={testimonial}
            customizations={customizations}
          />
        );
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className={`p-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2.5">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Widget Gallery</h2>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {testimonial.format === "video"
                  ? "Create video testimonial widgets"
                  : testimonial.format === "audio"
                    ? "Create audio testimonial widgets"
                    : "Create testimonial widgets"}
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
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
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`px-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex -mb-px">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === "templates"
                ? isDarkMode
                  ? "border-indigo-500 text-indigo-400"
                  : "border-indigo-600 text-indigo-600"
                : isDarkMode
                  ? "border-transparent text-slate-400 hover:text-slate-300"
                  : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("templates")}
          >
            Widget Templates
          </button>

          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === "my-widgets"
                ? isDarkMode
                  ? "border-indigo-500 text-indigo-400"
                  : "border-indigo-600 text-indigo-600"
                : isDarkMode
                  ? "border-transparent text-slate-400 hover:text-slate-300"
                  : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("my-widgets")}
          >
            My Widgets {widgetHistory.length > 0 && `(${widgetHistory.length})`}
          </button>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "templates" ? (
            <motion.div
              key="templates"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="p-6"
            >
              <div className="max-w-xl mx-auto">
                <motion.h3
                  variants={itemVariants}
                  className={`text-base font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Recommended Templates for{" "}
                  {testimonial.format.charAt(0).toUpperCase() +
                    testimonial.format.slice(1)}{" "}
                  Testimonials
                </motion.h3>

                <motion.p
                  variants={itemVariants}
                  className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Select a widget template to get started. We've curated these
                  based on your testimonial type.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {compatibleTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    variants={itemVariants}
                    className={`group rounded-xl overflow-hidden border cursor-pointer ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 hover:border-indigo-500/50"
                        : "bg-white border-slate-200 hover:border-indigo-500/50"
                    } shadow-sm hover:shadow-md transition-all duration-300`}
                    onClick={() => onSelectTemplate(template)}
                  >
                    {/* Template Header */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={
                          template.image ||
                          `https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&auto=format&fit=crop&q=60`
                        }
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Overlay content */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-end p-4">
                        <div>
                          <h4 className="text-white text-lg font-medium mb-1">
                            {template.name}
                          </h4>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.premium && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                Premium
                              </span>
                            )}

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                template.type === "spotlight"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                                  : template.type === "carousel"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                    : template.type === "video-player"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                              }`}
                            >
                              {template.type
                                .split("-")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </span>
                          </div>

                          <p className="text-white/80 text-xs line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Template best for */}
                    <div className="p-4">
                      <div className="mb-2">
                        <p
                          className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Best for:
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.bestFor.map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDarkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Template action */}
                    <div
                      className={`p-4 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                    >
                      <button
                        className={`w-full py-2 px-4 rounded-lg font-medium text-sm ${
                          isDarkMode
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        } transition-colors`}
                      >
                        Use This Template
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {compatibleTemplates.length === 0 && (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12"
                >
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">
                    No compatible templates
                  </h3>
                  <p
                    className={`max-w-md mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    We couldn't find any templates compatible with this
                    testimonial type. Please try a different testimonial.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="my-widgets"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="p-6"
            >
              <div className="max-w-xl mx-auto">
                <motion.h3
                  variants={itemVariants}
                  className={`text-base font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  Your Widgets for This Testimonial
                </motion.h3>

                <motion.p
                  variants={itemVariants}
                  className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  Widgets you've previously created for this testimonial.
                </motion.p>
              </div>

              {widgetHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {widgetHistory.map((widget) => (
                    <motion.div
                      key={widget.id}
                      variants={itemVariants}
                      className={`rounded-xl overflow-hidden border ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-slate-200"
                      } shadow-sm hover:shadow-md transition-all duration-300`}
                    >
                      {/* Widget preview */}
                      <div
                        className={`p-4 ${widget.customizations.darkMode ? "bg-slate-900" : "bg-white"}`}
                      >
                        <div className="h-44 overflow-hidden">
                          {renderWidgetComponent(
                            widget.type,
                            widget.customizations
                          )}
                        </div>
                      </div>

                      {/* Widget info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4
                              className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {widget.name}
                            </h4>
                            <p
                              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Created {formatDate(widget.created || "")}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              widget.type === "spotlight"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                                : widget.type === "carousel"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                  : widget.type === "video-player"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                            }`}
                          >
                            {widget.type
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div
                            className={`p-2 rounded ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            <p
                              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Views
                            </p>
                            <p
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {widget.usageStats.views.toLocaleString()}
                            </p>
                          </div>

                          <div
                            className={`p-2 rounded ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            <p
                              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Clicks
                            </p>
                            <p
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {widget.usageStats.clicks.toLocaleString()}
                            </p>
                          </div>

                          <div
                            className={`p-2 rounded ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            <p
                              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Conversions
                            </p>
                            <p
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
                            >
                              {widget.usageStats.conversions.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Widget actions */}
                      <div
                        className={`p-4 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"} flex gap-2`}
                      >
                        <button
                          onClick={() => onSelectSavedWidget(widget.id)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm ${
                            isDarkMode
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          } transition-colors`}
                        >
                          View Widget
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12"
                >
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">
                    No widgets created yet
                  </h3>
                  <p
                    className={`max-w-md mx-auto mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    You haven't created any widgets for this testimonial yet.
                    Start by selecting a template.
                  </p>

                  <button
                    onClick={() => setActiveTab("templates")}
                    className={`py-2 px-4 rounded-lg font-medium text-sm ${
                      isDarkMode
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    } transition-colors`}
                  >
                    Browse Templates
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * WidgetPreview - Displays details of a single widget with embed code and analytics
 */
interface WidgetPreviewProps {
  testimonial: Testimonial;
  widgetId: string;
  widgetHistory: WidgetSettings[];
  onBack: () => void;
  onEdit: () => void;
  isDarkMode: boolean;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  testimonial,
  widgetId,
  widgetHistory,
  onBack,
  onEdit,
  isDarkMode,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "analytics">(
    "preview"
  );
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "dark">(
    "desktop"
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Get widget data
  const widget = widgetHistory.find((w) => w.id === widgetId);

  // Function to render widget component
  const renderWidgetComponent = (
    type: string,
    customizations: WidgetCustomization
  ) => {
    // Apply preview mode settings
    const previewCustomizations = {
      ...customizations,
      darkMode: previewMode === "dark" ? true : customizations.darkMode,
    };

    switch (type) {
      case "spotlight":
        return (
          <SpotlightWidget
            testimonial={testimonial}
            customizations={previewCustomizations}
          />
        );
      case "carousel":
        return (
          <CarouselWidget
            testimonial={testimonial}
            customizations={previewCustomizations}
          />
        );
      case "minimal-card":
        return (
          <MinimalCardWidget
            testimonial={testimonial}
            customizations={previewCustomizations}
          />
        );
      case "video-player":
        return (
          <VideoPlayerWidget
            testimonial={testimonial}
            customizations={previewCustomizations}
          />
        );
      default:
        return (
          <MinimalCardWidget
            testimonial={testimonial}
            customizations={previewCustomizations}
          />
        );
    }
  };

  // Generate embed code
  const generateEmbedCode = (): string => {
    if (!widget) return "";

    return `<div 
  class="testimonial-widget"
  data-widget-type="${widget.type}"
  data-testimonial-id="${testimonial?.id || "testimonial-id"}"
  data-theme="${widget.customizations.theme}"
  data-dark-mode="${widget.customizations.darkMode}"
  data-rounded="${widget.customizations.rounded}"
  data-show-avatar="${widget.customizations.showAvatar}"
  data-show-rating="${widget.customizations.showRating}"
  data-show-company="${widget.customizations.showCompany}"
  data-animation="${widget.customizations.animation}"
  data-position="${widget.customizations.position}"
  data-auto-rotate="${widget.customizations.autoRotate}"
  data-highlight-color="${widget.customizations.highlightColor}"
  data-font-style="${widget.customizations.fontStyle}"
  data-width="${widget.customizations.width}"
  data-border="${widget.customizations.border}"
  data-shadow="${widget.customizations.shadow}"
  data-text-align="${widget.customizations.textAlign}"
>
</div>
<script src="https://cdn.example.com/testimonial-widgets.js"></script>`;
  };

  // Generate React code
  const generateReactCode = (): string => {
    if (!widget) return "";

    const componentName = widget.type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    return `import { ${componentName} } from '@example/testimonial-widgets';

export default function TestimonialSection() {
  return (
    <${componentName}
      testimonialId="${testimonial?.id || "testimonial-id"}"
      theme="${widget.customizations.theme}"
      darkMode={${widget.customizations.darkMode}}
      rounded="${widget.customizations.rounded}"
      showAvatar={${widget.customizations.showAvatar}}
      showRating={${widget.customizations.showRating}}
      showCompany={${widget.customizations.showCompany}}
      animation="${widget.customizations.animation}"
      position="${widget.customizations.position}"
      autoRotate={${widget.customizations.autoRotate || false}}
      highlightColor="${widget.customizations.highlightColor}"
      fontStyle="${widget.customizations.fontStyle}"
      width="${widget.customizations.width}"
      border={${widget.customizations.border}}
      shadow="${widget.customizations.shadow}"
      textAlign="${widget.customizations.textAlign || "left"}"
    />
  );
}`;
  };

  // Handle copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (!widget) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p
            className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            Widget not found
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className={`p-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className={`mr-3 p-2 rounded-lg ${
                isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              } transition-colors`}
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

            <div>
              <h2 className="text-xl font-bold">{widget.name}</h2>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {widget.type
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}{" "}
                Widget
              </p>
            </div>
          </div>

          <button
            onClick={onEdit}
            className={`px-4 py-2 flex items-center gap-2 rounded-lg ${
              isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white transition-colors`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span>Edit Widget</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`px-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex space-x-1 -mb-px">
          {[
            { id: "preview", label: "Preview", icon: "eye" },
            { id: "code", label: "Embed Code", icon: "code" },
            { id: "analytics", label: "Analytics", icon: "chart" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "border-indigo-500 text-indigo-400"
                    : "border-indigo-600 text-indigo-600"
                  : isDarkMode
                    ? "border-transparent text-slate-400 hover:text-slate-300"
                    : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <div className="flex items-center gap-2">
                {tab.icon === "eye" && (
                  <svg
                    className="w-4 h-4"
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
                )}
                {tab.icon === "code" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                )}
                {tab.icon === "chart" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                )}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "preview" && (
          <div className="p-6 space-y-6">
            {/* Preview Controls */}
            <div className="flex justify-end space-x-2">
              <button
                className={`p-2 rounded ${previewMode === "desktop" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewMode("desktop")}
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                className={`p-2 rounded ${previewMode === "mobile" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewMode("mobile")}
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
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                className={`p-2 rounded ${previewMode === "dark" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() =>
                  setPreviewMode(previewMode === "dark" ? "desktop" : "dark")
                }
              >
                {previewMode === "dark" ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
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
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Widget Preview */}
            <div
              className={`${previewMode === "dark" ? "bg-slate-900" : "bg-white"} p-6 rounded-xl border ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
            >
              <div
                className={`${previewMode === "mobile" ? "max-w-xs" : ""} mx-auto transition-all duration-300`}
              >
                {renderWidgetComponent(widget.type, widget.customizations)}
              </div>
            </div>

            {/* Widget Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span
                    className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Created
                  </span>
                </div>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {formatDate(widget.created || "")}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span
                    className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Views
                  </span>
                </div>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {widget.usageStats?.views.toLocaleString() || 0}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span
                    className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Conversions
                  </span>
                </div>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {widget.usageStats?.conversions.toLocaleString() || 0}
                  <span className="text-sm text-emerald-500 ml-2">
                    ({widget.usageStats?.conversionRate || 0}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="p-6 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  HTML Embed Code
                </h3>
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    copied
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                  } rounded-md`}
                  onClick={() => handleCopyCode(generateEmbedCode())}
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
                <pre className="text-xs text-slate-800 dark:text-slate-300 p-4 rounded bg-slate-100 dark:bg-slate-800">
                  {generateEmbedCode()}
                </pre>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  React Component
                </h3>
                <button
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    copied
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                  } rounded-md`}
                  onClick={() => handleCopyCode(generateReactCode())}
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
                <pre className="text-xs text-slate-800 dark:text-slate-300 p-4 rounded bg-slate-100 dark:bg-slate-800">
                  {generateReactCode()}
                </pre>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/30">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                Installation Instructions
              </h3>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-sm text-slate-800 dark:text-slate-300">
                  Copy the embed code above and paste it into your website's
                  HTML where you want the widget to appear.
                </li>
                <li className="text-sm text-slate-800 dark:text-slate-300">
                  Include the script tag to load our testimonial widget library
                  if you haven't done so already.
                </li>
                <li className="text-sm text-slate-800 dark:text-slate-300">
                  The widget will automatically initialize and display your
                  testimonial.
                </li>
                <li className="text-sm text-slate-800 dark:text-slate-300">
                  You can customize the appearance further using additional data
                  attributes or via our JavaScript API.
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="p-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-medium mb-6">Widget Performance</h3>

              {/* Analytics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Total Views
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {widget.usageStats.views.toLocaleString()}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Total Clicks
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {widget.usageStats.clicks.toLocaleString()}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Conversions
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {widget.usageStats.conversions.toLocaleString()}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                >
                  <p
                    className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Conversion Rate
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {widget.usageStats.conversionRate || 0}%
                  </p>
                </div>
              </div>

              {/* Analytics Charts - We'll use placeholders here */}
              <div className="space-y-6">
                <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Views & Engagement Chart
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                  >
                    <h4
                      className={`text-sm font-medium mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Performance Metrics
                    </h4>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Views
                        </span>
                        <span className="text-sm font-medium">
                          {widget.usageStats?.views.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Clicks
                        </span>
                        <span className="text-sm font-medium">
                          {widget.usageStats?.clicks.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Conversions
                        </span>
                        <span className="text-sm font-medium">
                          {widget.usageStats?.conversions.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Conversion Rate
                        </span>
                        <span className="text-sm font-medium">
                          {widget.usageStats?.conversionRate || 0}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Avg. Engagement Time
                        </span>
                        <span className="text-sm font-medium">
                          {widget.usageStats?.avgEngagementTime || 0}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-slate-50"}`}
                  >
                    <h4
                      className={`text-sm font-medium mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Embed Locations
                    </h4>

                    {widget.embedLocations &&
                    widget.embedLocations.length > 0 ? (
                      <div className="space-y-2">
                        {widget.embedLocations.map((location, index) => (
                          <div
                            key={index}
                            className={`flex items-center p-2 rounded ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
                          >
                            <svg
                              className="w-4 h-4 mr-2 text-slate-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs text-white">
                              {location}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No embed locations tracked yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetDrawer;
