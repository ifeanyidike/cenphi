import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Laptop,
  Smartphone,
  Tablet,
  MessageSquare,
  FileText,
  Code,
  RefreshCw,
  Check,
  Copy,
  ArrowLeft,
  Sun,
  Moon,
  Palette,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import components
import TestimonialWidget from "./TestimonialWidget";
import TestimonialForm from "./TestimonialForm";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { observer } from "mobx-react-lite";

// Types
import {
  WidgetCustomization,
  FormatOption,
  IncentiveConfig,
  DisplayRules,
  EnhancedTriggerOption,
  BusinessEventType,
  BrandData,
  TestimonialSubmission,
} from "@/types/setup";

type PreviewDevice = "desktop" | "tablet" | "mobile";
type PreviewMode = "widget" | "form";
type ThemeMode = "light" | "dark";

interface TestimonialPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: PreviewMode;
  customization?: WidgetCustomization;
  formats?: FormatOption[];
  incentives?: IncentiveConfig;
  displayRules?: DisplayRules;
  triggers?: EnhancedTriggerOption<BusinessEventType>[];
  brandData?: BrandData;
  onUpdateSettings?: (key: string, value: any) => void;
}

const TestimonialPreview: React.FC<TestimonialPreviewProps> = observer(
  ({
    isOpen,
    onClose,
    initialMode = "widget",
    customization,
    formats,
    incentives,
    displayRules,
    triggers,
    brandData,
    onUpdateSettings,
  }) => {
    // State
    const [device, setDevice] = useState<PreviewDevice>("desktop");
    const [previewMode, setPreviewMode] = useState<PreviewMode>(initialMode);
    const [themeMode, setThemeMode] = useState<ThemeMode>("light");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [codeView, setCodeView] = useState<boolean>(false);
    const [codeCopied, setCodeCopied] = useState<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(false);

    // Use stores if props not provided
    const settingsStore = testimonialSettingsStore;
    const brandStore = brandGuideStore;

    // Use props or fallback to store data
    const widgetCustomization =
      customization || settingsStore.settings.website.customization;
    const widgetFormats = formats || settingsStore.settings.website.formats;
    const widgetIncentives =
      incentives || settingsStore.settings.website.incentives;
    const widgetDisplayRules =
      displayRules || settingsStore.settings.website.displayRules;
    const widgetTriggers = triggers || settingsStore.settings.website.triggers;
    const brandSettings = brandData || brandStore.brandData;

    // Apply theme to preview container
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }

      return () => {
        document.body.style.overflow = "auto";
      };
    }, [isOpen]);

    // Reset state when opening
    useEffect(() => {
      if (isOpen) {
        setPreviewMode(initialMode);
        setCodeView(false);
        setShowControls(false);
      }
    }, [isOpen, initialMode]);

    // Handle refresh preview
    const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
    };

    // Generate integration code
    const generateIntegrationCode = (): string => {
      if (previewMode === "widget") {
        return `<!-- Testimonial Widget Integration -->
<script src="https://cdn.testimonialhub.com/widget.js?id=${brandSettings.id}" async></script>

<!-- Optional: Custom Configuration -->
<script>
  window.testimonialWidgetConfig = {
    primaryColor: "${brandSettings.colors.primary || ""}",
    position: "${widgetCustomization?.position || "bottom-right"}",
    theme: "${widgetCustomization?.theme || "light"}",
    // Additional settings applied from dashboard
  };
</script>`;
      } else {
        return `<!-- Testimonial Form Integration -->
<div id="testimonial-form"></div>

<script src="https://cdn.testimonialhub.com/form.js?id=${brandSettings.id}" async></script>

<!-- Optional: Custom Configuration -->
<script>
  window.testimonialFormConfig = {
    primaryColor: "${brandSettings.colors.primary || ""}",
    theme: "${widgetCustomization?.theme || "light"}",
    // Additional settings applied from dashboard
  };
</script>`;
      }
    };

    // Copy integration code
    const handleCopyCode = () => {
      navigator.clipboard.writeText(generateIntegrationCode());
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    };

    // Handle testimonial submission
    const handleTestimonialSubmit = async (
      submission: TestimonialSubmission
    ): Promise<void> => {
      console.log("Testimonial submitted:", submission);

      // Simulate API call delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1500);
      });
    };

    // Animation variants
    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
    };

    const contentVariants = {
      hidden: { y: "100%" },
      visible: {
        y: 0,
        transition: { type: "spring", damping: 30, stiffness: 300 },
      },
      exit: { y: "100%", transition: { duration: 0.3 } },
    };

    const controlsVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
    };

    // Get device dimensions for preview
    const getDeviceStyles = () => {
      switch (device) {
        case "mobile":
          return { maxWidth: "375px", height: "667px" };
        case "tablet":
          return { maxWidth: "768px", height: "1024px" };
        case "desktop":
        default:
          return { maxWidth: "100%", height: "100%" };
      }
    };

    // Render placeholder website content
    const renderDummyContent = () => (
      <div className="w-full h-full flex flex-col">
        {/* Header skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex gap-4">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );

    // Render preview components
    const renderPreview = () => {
      const deviceStyles = getDeviceStyles();

      if (codeView) {
        return (
          <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium">
                {previewMode === "widget"
                  ? "Widget Integration"
                  : "Form Integration"}
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 overflow-auto text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 h-96">
              {generateIntegrationCode()}
            </pre>
          </div>
        );
      }

      return (
        <div
          className="preview-container relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mx-auto shadow-xl"
          style={deviceStyles}
        >
          {previewMode === "widget" ? (
            <div className="relative w-full h-full">
              {/* Dummy website content */}
              {renderDummyContent()}

              {/* "Demo Website" watermark */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="transform rotate-45 text-gray-200 dark:text-gray-700 text-6xl font-bold whitespace-nowrap opacity-20">
                  DEMO WEBSITE
                </div>
              </div>

              {/* Widget component */}
              <TestimonialWidget
                customization={widgetCustomization}
                brandData={brandSettings}
                formats={widgetFormats}
                incentives={widgetIncentives}
                displayRules={widgetDisplayRules}
                triggers={widgetTriggers}
                device={device}
                defaultOpen={false}
                previewMode={true}
              />
            </div>
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
              <TestimonialForm
                customization={widgetCustomization}
                brandData={brandSettings}
                formats={widgetFormats}
                incentives={widgetIncentives}
                onSubmit={handleTestimonialSubmit}
                className="w-full max-w-xl mx-auto"
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 z-50 bg-black/50 flex flex-col"
          >
            {/* Controls bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <h2 className="text-lg font-medium">
                  {previewMode === "widget" ? "Widget Preview" : "Form Preview"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Device switcher */}
                <div className="hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    className={cn(
                      "p-2",
                      device === "desktop"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setDevice("desktop")}
                  >
                    <Laptop className="h-5 w-5" />
                  </button>
                  <button
                    className={cn(
                      "p-2",
                      device === "tablet"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setDevice("tablet")}
                  >
                    <Tablet className="h-5 w-5" />
                  </button>
                  <button
                    className={cn(
                      "p-2",
                      device === "mobile"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setDevice("mobile")}
                  >
                    <Smartphone className="h-5 w-5" />
                  </button>
                </div>

                {/* Theme toggle */}
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() =>
                    setThemeMode(themeMode === "light" ? "dark" : "light")
                  }
                >
                  {themeMode === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </button>

                {/* Mode switcher */}
                <div className="hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    className={cn(
                      "p-2 flex items-center gap-1",
                      previewMode === "widget"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setPreviewMode("widget")}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="hidden lg:inline text-sm">Widget</span>
                  </button>
                  <button
                    className={cn(
                      "p-2 flex items-center gap-1",
                      previewMode === "form"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setPreviewMode("form")}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="hidden lg:inline text-sm">Form</span>
                  </button>
                </div>

                {/* Code view toggle */}
                <button
                  className={cn(
                    "p-2 rounded-lg flex items-center gap-1",
                    codeView
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setCodeView(!codeView)}
                >
                  <Code className="h-5 w-5" />
                  <span className="hidden lg:inline text-sm">
                    {codeView ? "View Preview" : "View Code"}
                  </span>
                </button>

                {/* Refresh button */}
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-5 w-5", isRefreshing && "animate-spin")}
                  />
                </button>

                {/* Settings toggle */}
                <button
                  className={cn(
                    "p-2 rounded-lg",
                    showControls
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setShowControls(!showControls)}
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Close button */}
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile device selector */}
            <div className="sm:hidden flex justify-center py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm",
                    device === "desktop"
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setDevice("desktop")}
                >
                  Desktop
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm",
                    device === "tablet"
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setDevice("tablet")}
                >
                  Tablet
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm",
                    device === "mobile"
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setDevice("mobile")}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Main content container */}
            <motion.div
              variants={contentVariants}
              className={cn(
                "flex-1 overflow-auto p-4",
                themeMode === "dark" ? "bg-gray-900" : "bg-gray-50"
              )}
            >
              <div className="container mx-auto h-full max-w-6xl flex gap-4">
                {/* Settings panel (collapsible) */}
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      variants={controlsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="hidden lg:block w-72 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full overflow-auto shadow-sm"
                    >
                      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-medium">Settings</h3>
                      </div>

                      <div className="p-4 space-y-6">
                        {/* Appearance settings */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-gray-500" />
                            <h4 className="text-sm font-medium">Appearance</h4>
                          </div>

                          {/* Primary color */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              Primary Color
                            </label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                                style={{
                                  backgroundColor: brandSettings.colors.primary,
                                }}
                              ></div>
                              <input
                                type="text"
                                value={brandSettings.colors.primary}
                                onChange={(e) => {
                                  if (onUpdateSettings) {
                                    brandStore.updateBrandData(["colors"], {
                                      colors: {
                                        ...brandSettings.colors,
                                        primary: e.target.value,
                                      },
                                    });
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                              />
                            </div>
                          </div>

                          {/* Style preset */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              Style Preset
                            </label>
                            <select
                              value={
                                widgetCustomization?.stylePreset || "minimal"
                              }
                              onChange={(e) => {
                                if (onUpdateSettings) {
                                  onUpdateSettings("customization", {
                                    ...widgetCustomization,
                                    stylePreset: e.target.value,
                                  });
                                }
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                            >
                              <option value="minimal">Minimal</option>
                              <option value="rounded">Rounded</option>
                              <option value="gradient">Gradient</option>
                              <option value="glassmorphism">
                                Glassmorphism
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Widget settings */}
                        {previewMode === "widget" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              <h4 className="text-sm font-medium">
                                Widget Settings
                              </h4>
                            </div>

                            {/* Position */}
                            <div className="space-y-1.5">
                              <label className="text-xs text-gray-500 dark:text-gray-400">
                                Position
                              </label>
                              <select
                                value={
                                  widgetCustomization?.position ||
                                  "bottom-right"
                                }
                                onChange={(e) => {
                                  if (onUpdateSettings) {
                                    onUpdateSettings("customization", {
                                      ...widgetCustomization,
                                      position: e.target.value,
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                              >
                                <option value="bottom-right">
                                  Bottom Right
                                </option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="top-left">Top Left</option>
                              </select>
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                              <label className="text-xs text-gray-500 dark:text-gray-400">
                                Widget Title
                              </label>
                              <input
                                type="text"
                                value={
                                  widgetCustomization?.widgetTitle ||
                                  "Share Your Feedback"
                                }
                                onChange={(e) => {
                                  if (onUpdateSettings) {
                                    onUpdateSettings("customization", {
                                      ...widgetCustomization,
                                      widgetTitle: e.target.value,
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview container */}
                <div className="flex-1 flex items-center justify-center">
                  {renderPreview()}
                </div>
              </div>
            </motion.div>

            {/* Mobile controls panel */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  variants={controlsVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="lg:hidden fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-t-xl shadow-xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Quick Settings</h3>
                    <button
                      onClick={() => setShowControls(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Primary color */}
                    <div className="space-y-1.5">
                      <label className="text-sm">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                          style={{
                            backgroundColor: brandSettings.colors.primary,
                          }}
                        ></div>
                        <input
                          type="text"
                          value={brandSettings.colors.primary}
                          onChange={(e) => {
                            if (onUpdateSettings) {
                              brandStore.updateBrandData(["colors"], {
                                colors: {
                                  ...brandSettings.colors,
                                  primary: e.target.value,
                                },
                              });
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    {/* Style preset */}
                    <div className="space-y-1.5">
                      <label className="text-sm">Style Preset</label>
                      <select
                        value={widgetCustomization?.stylePreset || "minimal"}
                        onChange={(e) => {
                          if (onUpdateSettings) {
                            onUpdateSettings("customization", {
                              ...widgetCustomization,
                              stylePreset: e.target.value,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="rounded">Rounded</option>
                        <option value="gradient">Gradient</option>
                        <option value="glassmorphism">Glassmorphism</option>
                      </select>
                    </div>

                    {/* Widget position (if widget mode) */}
                    {previewMode === "widget" && (
                      <div className="space-y-1.5">
                        <label className="text-sm">Position</label>
                        <select
                          value={
                            widgetCustomization?.position || "bottom-right"
                          }
                          onChange={(e) => {
                            if (onUpdateSettings) {
                              onUpdateSettings("customization", {
                                ...widgetCustomization,
                                position: e.target.value,
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default TestimonialPreview;
