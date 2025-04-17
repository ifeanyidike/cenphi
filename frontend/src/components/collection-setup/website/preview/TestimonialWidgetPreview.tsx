import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  ChevronRight,
  Video,
  Mic,
  Image as ImageIcon,
  FileText,
  MessageCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types
import {
  WidgetCustomization,
  DisplayRules,
  IncentiveConfig,
  FormatOption,
} from "@/types/setup";

interface TestimonialWidgetPreviewProps {
  customization: WidgetCustomization;
  displayRules?: DisplayRules;
  incentives?: IncentiveConfig;
  formats?: FormatOption[];
  device?: "desktop" | "mobile" | "tablet";
  className?: string;
  onVideoClick?: () => void;
  onAudioClick?: () => void;
}

// Animation variants
const widgetVariants = {
  collapsed: {
    scale: 0.9,
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  expanded: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

// Step types
type WidgetStep =
  | "initial"
  | "format-selection"
  | "text-entry"
  | "rating"
  | "contact-info"
  | "thank-you";

const TestimonialWidgetPreview: React.FC<TestimonialWidgetPreviewProps> = ({
  customization,
  formats = [
    { type: "text", enabled: true },
    { type: "video", enabled: true },
    { type: "audio", enabled: true },
    { type: "image", enabled: false },
  ],
  incentives,
  device = "desktop",
  className,
  onVideoClick,
  onAudioClick,
}) => {
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<WidgetStep>("initial");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Testimonial content
  const [testimonialText, setTestimonialText] = useState("");

  // Handle close widget
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("initial");
      setSelectedFormat(null);
      setRating(0);
      setTestimonialText("");
    }, 300);
  };

  // Reset and open widget
  const handleOpen = () => {
    setStep("initial");
    setSelectedFormat(null);
    setRating(0);
    setTestimonialText("");
    setIsOpen(true);
  };

  // Handle format selection
  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);

    if (format === "text") {
      setStep("text-entry");
    } else if (format === "video" && onVideoClick) {
      onVideoClick();
    } else if (format === "audio" && onAudioClick) {
      onAudioClick();
    } else {
      setStep("text-entry");
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === "initial") {
      setStep("format-selection");
    } else if (step === "text-entry") {
      setStep("rating");
    } else if (step === "rating") {
      setStep("contact-info");
    } else if (step === "contact-info") {
      setStep("thank-you");
    }
  };

  // Get enabled formats
  const enabledFormats = formats.filter((f) => f.enabled);

  // Different widget content based on step
  const renderWidgetContent = () => {
    switch (step) {
      case "initial":
        return (
          <div className="text-center px-4 py-6">
            <h3 className="text-lg font-semibold mb-3">
              {customization.widgetTitle || "Share Your Experience"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {customization.widgetDescription ||
                "We'd love to hear what you think about our product!"}
            </p>
            <Button
              className="w-full"
              style={{ backgroundColor: customization.primaryColor }}
              onClick={() => setStep("format-selection")}
            >
              Share Feedback
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "format-selection":
        return (
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold mb-3">Choose Feedback Type</h3>
            <p className="text-sm text-gray-500 mb-4">
              How would you like to share your experience?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {enabledFormats.map((format) => {
                const FormatIcon =
                  format.type === "video"
                    ? Video
                    : format.type === "audio"
                      ? Mic
                      : format.type === "image"
                        ? ImageIcon
                        : FileText;

                return (
                  <div
                    key={format.type}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:border-gray-300",
                      selectedFormat === format.type &&
                        "border-primary bg-primary/5"
                    )}
                    onClick={() => handleFormatSelect(format.type)}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div
                        className={cn(
                          "p-2 rounded-full",
                          selectedFormat === format.type
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        <FormatIcon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {format.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "text-entry":
        return (
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold mb-3">
              Tell Us Your Experience
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              What did you like most about our product or service?
            </p>
            <div className="space-y-4">
              <Textarea
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                placeholder="Share your experience here..."
                rows={5}
                className="resize-none"
              />
              <Button
                className="w-full"
                style={{ backgroundColor: customization.primaryColor }}
                onClick={handleNextStep}
                disabled={testimonialText.length < 10}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold mb-3">Rate Your Experience</h3>
            <p className="text-sm text-gray-500 mb-4">
              How would you rate your overall experience?
            </p>
            <div className="flex justify-center mb-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1 focus:outline-none transition-transform"
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              style={{ backgroundColor: customization.primaryColor }}
              onClick={handleNextStep}
              disabled={rating === 0}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "contact-info":
        return (
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold mb-3">Your Information</h3>
            <p className="text-sm text-gray-500 mb-4">
              Let us know who you are (this will display with your testimonial)
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
                <p className="text-xs text-gray-500">
                  Your email will not be displayed publicly
                </p>
              </div>
              <Button
                className="w-full"
                style={{ backgroundColor: customization.primaryColor }}
                onClick={handleNextStep}
                disabled={!name}
              >
                Submit Testimonial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "thank-you":
        return (
          <div className="px-4 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Thank You!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {customization.thankYouMessage ||
                "Your feedback has been submitted successfully. We appreciate your time!"}
            </p>
            {incentives?.enabled && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-amber-800 mb-1">Your Reward</h4>
                <p className="text-sm text-amber-700">
                  {incentives.value || "10% off your next purchase"}
                </p>
                {incentives.code && (
                  <div className="mt-2 flex items-center justify-between bg-white rounded border border-amber-200 p-2">
                    <span className="font-mono text-amber-900">
                      {incentives.code}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine position based on widget settings
  const getPositionClasses = () => {
    switch (customization.position) {
      case "bottom-right":
        return "bottom-6 right-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "top-left":
        return "top-6 left-6";
      default:
        return "bottom-6 right-6";
    }
  };

  // Adjust widget size based on device
  const getWidgetSize = () => {
    switch (device) {
      case "mobile":
        return "w-full max-w-[320px]";
      case "tablet":
        return "w-full max-w-[380px]";
      case "desktop":
      default:
        return "w-full max-w-[400px]";
    }
  };

  // Apply theme
  const isDarkTheme = customization.theme === "dark";

  return (
    <div className={cn("relative w-full h-full min-h-[300px]", className)}>
      {/* Widget Button (visible when widget is closed) */}
      {!isOpen && (
        <div className={cn("absolute z-10", getPositionClasses())}>
          <motion.button
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
              isDarkTheme ? "text-white" : "text-white"
            )}
            style={{ backgroundColor: customization.primaryColor }}
            onClick={handleOpen}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <MessageCircle className="h-5 w-5" />
            {device !== "mobile" && (
              <span className="font-medium">Share Feedback</span>
            )}
          </motion.button>
        </div>
      )}

      {/* Widget Container (visible when widget is open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              "absolute z-20 shadow-xl rounded-lg overflow-hidden",
              getPositionClasses(),
              getWidgetSize(),
              isDarkTheme
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-900 border border-gray-200"
            )}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            variants={widgetVariants}
          >
            {/* Widget Header */}
            <div
              className={cn(
                "flex items-center justify-between p-3 border-b",
                isDarkTheme ? "border-gray-700" : "border-gray-200"
              )}
            >
              <div className="flex items-center gap-2">
                {customization.logo && (
                  <div className="h-6 w-6 rounded overflow-hidden">
                    {customization.logo !== "placeholder" ? (
                      <img
                        src={customization.logo}
                        alt={customization.companyName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs font-bold">
                        {customization.companyName
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {customization.companyName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    isDarkTheme
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-500"
                  )}
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Widget Content */}
            <div className="max-h-[80vh] overflow-y-auto">
              {renderWidgetContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestimonialWidgetPreview;
