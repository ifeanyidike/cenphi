// src/components/collection-setup/website/WebsitePreview.tsx
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { CollectionSettings, WebsiteAppearance } from "@/types/setup";
import {
  ArrowRight,
  MessageCircle,
  PlayCircle,
  Camera,
  Mic,
  FileText,
  Star,
  CheckCircle2,
  X,
  Maximize2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WebsitePreviewProps {
  settings?: CollectionSettings["website"];
  widget: boolean;
  appearance: WebsiteAppearance;
  previewDevice?: "desktop" | "mobile";
}

// Widget animation variants
const widgetVariants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const buttonVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Content for preview placeholders
const dummyPrompts = [
  "What did you like most about our product?",
  "How has our service improved your business?",
  "Would you recommend us to others? Why?",
  "Describe your experience with our customer support.",
];

// Sample testimonial formats
const testimonialFormats = [
  {
    icon: <Camera className="h-5 w-5" />,
    label: "Take a Photo",
    color: "bg-amber-100 text-amber-600",
    value: "image",
  },
  {
    icon: <Mic className="h-5 w-5" />,
    label: "Record Audio",
    color: "bg-blue-100 text-blue-600",
    value: "audio",
  },
  {
    icon: <PlayCircle className="h-5 w-5" />,
    label: "Record Video",
    color: "bg-indigo-100 text-indigo-600",
    value: "video",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Write Text",
    color: "bg-emerald-100 text-emerald-600",
    value: "text",
  },
];

const WebsitePreview: React.FC<WebsitePreviewProps> = ({
  //   settings?: CollectionSettings["website"];
  //   appearance?: WebsiteAppearance;
  //   widget?: boolean;
  settings,
  widget,
  appearance,
  previewDevice = "desktop",
}) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  appearance = appearance || settings?.appearance;

  // Calculate opacity from appearance settings
  const opacity = (appearance.opacity || 100) / 100;

  // Border radius from appearance settings with fallback
  const borderRadius = appearance.borderRadius ?? 8;

  // Determine theme based on appearance settings
  const isDarkTheme = appearance.theme === "dark";

  // Reset widget state
  const resetWidget = () => {
    setIsWidgetOpen(false);
    setCurrentStep(0);
    setSelectedFormat(null);
    setRating(0);
  };

  // Toggle widget open/closed
  const toggleWidget = () => {
    setIsWidgetOpen(!isWidgetOpen);
    if (!isWidgetOpen) {
      setCurrentStep(0);
      setSelectedFormat(null);
      setRating(0);
    }
  };

  // Next step in the flow
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show success and close
      setTimeout(() => {
        resetWidget();
      }, 2000);
    }
  };

  // Previous step in the flow
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      resetWidget();
    }
  };

  // Widget position from appearance settings
  const getWidgetPosition = () => {
    switch (appearance.position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  // Widget button style
  const getWidgetButtonStyle = () => {
    return {
      backgroundColor: appearance.accentColor,
      borderRadius: `${borderRadius}px`,
      opacity: opacity,
      fontFamily: appearance.fontFamily || "system-ui, sans-serif",
    };
  };

  // Widget container style
  const getWidgetContainerStyle = () => {
    return {
      borderRadius: `${borderRadius}px`,
      opacity: opacity,
      fontFamily: appearance.fontFamily || "system-ui, sans-serif",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    };
  };

  // Only render the button when widget is collapsed
  const renderWidgetButton = () => {
    return (
      <motion.button
        className={cn(
          "p-4 text-white shadow-lg flex items-center gap-2",
          isDarkTheme ? "text-white" : "text-white"
        )}
        style={getWidgetButtonStyle()}
        onClick={toggleWidget}
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
      >
        <MessageCircle className="h-5 w-5" />
        {previewDevice === "desktop" && (
          <span className="font-medium whitespace-nowrap">Share Feedback</span>
        )}
      </motion.button>
    );
  };

  // Render widget content based on current step
  const renderWidgetContent = () => {
    // Step 0: Format selection
    if (currentStep === 0) {
      return (
        <div className="p-6 space-y-4">
          <h3
            className={cn(
              "text-lg font-semibold",
              isDarkTheme ? "text-white" : "text-gray-900"
            )}
          >
            {appearance.customTitle || "Share Your Experience"}
          </h3>

          <p
            className={cn(
              "text-sm",
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            )}
          >
            {appearance.description ||
              "We'd love to hear about your experience with our product"}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3">
            {testimonialFormats.map((format) => (
              <motion.div
                key={format.value}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedFormat === format.value
                    ? "border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700"
                    : `border-gray-200 ${
                        isDarkTheme
                          ? "hover:border-gray-600"
                          : "hover:border-gray-300"
                      }`,
                  isDarkTheme ? "dark:border-gray-700" : ""
                )}
                onClick={() => setSelectedFormat(format.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ borderRadius: `${borderRadius - 2}px` }}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn("p-2 rounded-full", format.color)}>
                    {format.icon}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isDarkTheme ? "text-gray-200" : "text-gray-700"
                    )}
                  >
                    {format.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-3 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetWidget}
              className={
                isDarkTheme
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={!selectedFormat}
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                backgroundColor: appearance.accentColor,
                opacity: selectedFormat ? 1 : 0.7,
              }}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // Step 1: Rating
    if (currentStep === 1) {
      return (
        <div className="p-6 space-y-4">
          <h3
            className={cn(
              "text-lg font-semibold",
              isDarkTheme ? "text-white" : "text-gray-900"
            )}
          >
            Rate Your Experience
          </h3>

          <p
            className={cn(
              "text-sm",
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            )}
          >
            How would you rate your overall experience?
          </p>

          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    star <= rating
                      ? "text-yellow-400"
                      : isDarkTheme
                        ? "text-gray-600"
                        : "text-gray-300"
                  )}
                  onClick={() => setRating(star)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    className="h-8 w-8"
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className={
                isDarkTheme
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <Button
              size="sm"
              disabled={rating === 0}
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                backgroundColor: appearance.accentColor,
                opacity: rating > 0 ? 1 : 0.7,
              }}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Answer question (based on selected format)
    if (currentStep === 2) {
      return (
        <div className="p-6 space-y-4">
          <h3
            className={cn(
              "text-lg font-semibold",
              isDarkTheme ? "text-white" : "text-gray-900"
            )}
          >
            {dummyPrompts[0]}
          </h3>

          <div className="py-2">
            {selectedFormat === "text" ? (
              <div
                className={cn(
                  "border rounded-lg p-3 min-h-24",
                  isDarkTheme
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                )}
                style={{ borderRadius: `${borderRadius - 2}px` }}
              >
                <p
                  className={cn(
                    "text-sm text-left italic",
                    isDarkTheme ? "text-gray-400" : "text-gray-400"
                  )}
                >
                  Type your response here...
                </p>
              </div>
            ) : selectedFormat === "video" ? (
              <div
                className={cn(
                  "border rounded-lg p-6 flex flex-col items-center justify-center min-h-32",
                  isDarkTheme
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                )}
                style={{ borderRadius: `${borderRadius - 2}px` }}
              >
                <PlayCircle
                  className={cn(
                    "h-12 w-12 mb-3",
                    isDarkTheme ? "text-gray-200" : "text-gray-600"
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDarkTheme ? "text-gray-300" : "text-gray-500"
                  )}
                >
                  Click to record video
                </p>
              </div>
            ) : selectedFormat === "audio" ? (
              <div
                className={cn(
                  "border rounded-lg p-6 flex flex-col items-center justify-center min-h-32",
                  isDarkTheme
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                )}
                style={{ borderRadius: `${borderRadius - 2}px` }}
              >
                <Mic
                  className={cn(
                    "h-12 w-12 mb-3",
                    isDarkTheme ? "text-gray-200" : "text-gray-600"
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDarkTheme ? "text-gray-300" : "text-gray-500"
                  )}
                >
                  Click to record audio
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "border rounded-lg p-6 flex flex-col items-center justify-center min-h-32",
                  isDarkTheme
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                )}
                style={{ borderRadius: `${borderRadius - 2}px` }}
              >
                <Camera
                  className={cn(
                    "h-12 w-12 mb-3",
                    isDarkTheme ? "text-gray-200" : "text-gray-600"
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDarkTheme ? "text-gray-300" : "text-gray-500"
                  )}
                >
                  Click to take a photo
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className={
                isDarkTheme
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <Button
              size="sm"
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                backgroundColor: appearance.accentColor,
              }}
            >
              Submit
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // Step 3: Thank you
    if (currentStep === 3) {
      return (
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center mb-3">
            <div
              className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center",
                "bg-green-100 text-green-600"
              )}
            >
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>

          <h3
            className={cn(
              "text-lg font-semibold",
              isDarkTheme ? "text-white" : "text-gray-900"
            )}
          >
            Thank You!
          </h3>

          <p
            className={cn(
              "text-sm",
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            )}
          >
            Your feedback has been submitted successfully.
          </p>

          <div className="pt-3">
            <Button
              size="sm"
              onClick={resetWidget}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                backgroundColor: appearance.accentColor,
              }}
            >
              Close
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Main render function
  return (
    <div className={previewDevice === "mobile" ? "max-w-xs mx-auto" : "w-full"}>
      <div
        className={cn(
          "relative min-h-60 overflow-hidden rounded-lg",
          isDarkTheme ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        {/* Sample website content for context */}
        {!widget && (
          <div className="absolute inset-0 p-4">
            <div
              className={cn(
                "h-6 w-2/3 rounded",
                isDarkTheme ? "bg-gray-800" : "bg-gray-200"
              )}
            />
            <div className="flex mt-4 space-x-4">
              <div
                className={cn(
                  "h-20 w-20 rounded",
                  isDarkTheme ? "bg-gray-800" : "bg-gray-200"
                )}
              />
              <div className="flex-1 space-y-2">
                <div
                  className={cn(
                    "h-4 w-full rounded",
                    isDarkTheme ? "bg-gray-800" : "bg-gray-200"
                  )}
                />
                <div
                  className={cn(
                    "h-4 w-5/6 rounded",
                    isDarkTheme ? "bg-gray-800" : "bg-gray-200"
                  )}
                />
                <div
                  className={cn(
                    "h-4 w-4/6 rounded",
                    isDarkTheme ? "bg-gray-800" : "bg-gray-200"
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Widget button or expanded widget */}
        <div
          className={cn(
            "absolute",
            getWidgetPosition(),
            previewDevice === "mobile" ? "max-w-[280px]" : "max-w-[360px]"
          )}
        >
          <AnimatePresence mode="wait">
            {isWidgetOpen ? (
              // Expanded widget
              <motion.div
                key="expanded"
                variants={widgetVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  "shadow-xl overflow-hidden w-full",
                  isDarkTheme
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-900"
                )}
                style={getWidgetContainerStyle()}
              >
                {/* Header with controls */}
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-2 border-b",
                    isDarkTheme ? "border-gray-800" : "border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {appearance.logo && appearance.logoUrl && (
                      <img
                        src={appearance.logoUrl}
                        alt="Logo"
                        className="h-6 w-auto"
                      />
                    )}

                    {appearance.logo && !appearance.logoUrl && (
                      <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    )}

                    <span
                      className={cn(
                        "text-xs font-medium",
                        isDarkTheme ? "text-gray-300" : "text-gray-500"
                      )}
                    >
                      {currentStep === 3
                        ? "Feedback Submitted"
                        : "Step " + (currentStep + 1) + " of 3"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-0",
                        isDarkTheme
                          ? "text-gray-400 hover:text-gray-300"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                      onClick={resetWidget}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-0",
                        isDarkTheme
                          ? "text-gray-400 hover:text-gray-300"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content area */}
                {renderWidgetContent()}

                {/* Footer (if using "powered by") */}
                {appearance.poweredBy && (
                  <div
                    className={cn(
                      "px-4 py-2 text-center text-xs border-t",
                      isDarkTheme
                        ? "text-gray-500 border-gray-800"
                        : "text-gray-400 border-gray-100"
                    )}
                  >
                    Powered by{" "}
                    <span className="font-medium">Testimonial Widget</span>
                  </div>
                )}
              </motion.div>
            ) : (
              // Collapsed button
              <motion.div
                key="collapsed"
                variants={widgetVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {renderWidgetButton()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default observer(WebsitePreview);
