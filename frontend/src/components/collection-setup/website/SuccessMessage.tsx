import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  X,
  Copy,
  Check,
  Share2,
  Gift,
  Sparkles,
  Star,
  Download,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { BrandGuide, WidgetCustomization } from "@/types/setup";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { brandGuideStore } from "@/stores/brandGuideStore";

interface SuccessMessageProps {
  onClose?: () => void;
}

// Helper function to determine the background style based on stylePreset
const getBackgroundStyle = (
  customization: WidgetCustomization | undefined,
  brandData: BrandGuide
) => {
  const stylePreset = customization?.stylePreset || "minimal";
  const theme = customization?.theme || "light";
  const primaryColor = brandData.colors.primary;

  const isDarkMode =
    theme === "dark" ||
    (theme === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const bgBase = isDarkMode ? "bg-gray-900" : "bg-white";
  const textBase = isDarkMode ? "text-white" : "text-gray-900";

  switch (stylePreset) {
    case "gradient": {
      // Create a gradient from the primary color
      const lighterColor = adjustColorBrightness(primaryColor, 40);
      const darkerColor = adjustColorBrightness(primaryColor, -20);
      return {
        background: `linear-gradient(135deg, ${lighterColor} 0%, ${darkerColor} 100%)`,
        text: "text-white",
        border: "border-none",
        shadow: "shadow-xl",
      };
    }

    case "glassmorphism":
      return {
        background: isDarkMode
          ? "bg-gray-900/80 backdrop-blur-md"
          : "bg-white/80 backdrop-blur-md",
        text: textBase,
        border: isDarkMode
          ? "border border-gray-700/60"
          : "border border-white/60",
        shadow: "shadow-xl",
      };

    case "rounded":
      return {
        background: bgBase,
        text: textBase,
        border: isDarkMode
          ? "border border-gray-700"
          : "border border-gray-200",
        shadow: "shadow-lg",
        rounded: "rounded-2xl",
      };

    case "minimal":
    default:
      return {
        background: bgBase,
        text: textBase,
        border: isDarkMode
          ? "border border-gray-800"
          : "border border-gray-200",
        shadow: "shadow-md",
      };
  }
};

// Utility to adjust color brightness
const adjustColorBrightness = (hex: string, percent: number) => {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const SuccessMessage: React.FC<SuccessMessageProps> = ({ onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const customization = testimonialSettingsStore.settings.website.customization;
  const incentives = testimonialSettingsStore.settings.website.incentives;
  const brandData = brandGuideStore.brandData;

  const style = getBackgroundStyle(customization, brandData);
  // const { primaryColor, thankYouMessage, companyName, logo } = customization;
  const primaryColor = brandData.colors.primary;
  const thankYouMessage = brandData.voice.channels.website?.thankYouTemplate;
  const companyName = brandData.name;
  const logo = brandData.logo.main;

  // Calculate expiry date for incentive if applicable
  useEffect(() => {
    if (incentives?.enabled && incentives?.expiryDays) {
      const date = new Date();
      date.setDate(date.getDate() + (incentives?.expiryDays || 30));
      setExpiryDate(
        date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    }
  }, [incentives]);

  // Trigger confetti effect on component mount if not already triggered
  useEffect(() => {
    if (!confettiTriggered && incentives?.enabled) {
      setConfettiTriggered(true);

      // Delay confetti slightly for better user experience
      const timer = setTimeout(() => {
        if (typeof window !== "undefined") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [confettiTriggered, incentives?.enabled]);

  // Handle copy incentive code to clipboard
  const handleCopyCode = () => {
    if (incentives?.code) {
      navigator.clipboard.writeText(incentives?.code);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Default thank you message if none provided
  const defaultThankYouMessage = "Thank you for sharing your feedback with us!";
  const message = thankYouMessage || defaultThankYouMessage;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cn(
          "p-6 max-w-md w-full mx-auto",
          style.background,
          style.text,
          style.border,
          style.shadow,
          style.rounded || "rounded-lg"
        )}
        style={{
          /* Apply any custom CSS variables based on customization settings */
          ...(customization?.stylePreset === "gradient" && {
            background: style.background,
          }),
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-200/10 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success icon */}
        <motion.div
          className="flex justify-center mb-6"
          variants={itemVariants}
        >
          <div
            className="rounded-full p-3"
            style={{ backgroundColor: `${primaryColor}30` }}
          >
            <div
              className="rounded-full p-3"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Thank you message */}
        <motion.div className="text-center mb-6" variants={itemVariants}>
          <h3 className="text-xl font-semibold mb-2">{message}</h3>

          {/* Company branding */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {logo ? (
              <img
                src={logo}
                alt={companyName}
                className="h-5 w-auto object-contain"
              />
            ) : (
              <div
                className="h-5 w-5 rounded-md flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {companyName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-sm opacity-75">{companyName}</span>
          </div>
        </motion.div>

        {/* Incentive section (if enabled) */}
        {incentives?.enabled && (
          <motion.div
            className={cn(
              "rounded-xl p-4 mb-6 border",
              style.text === "text-white"
                ? "border-white/20 bg-white/10"
                : "border-gray-200 bg-gray-50"
            )}
            variants={itemVariants}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor:
                    style.text === "text-white"
                      ? "rgba(255, 255, 255, 0.2)"
                      : `${primaryColor}20`,
                }}
              >
                {incentives?.type === "discount" ? (
                  <Gift className="h-5 w-5" style={{ color: primaryColor }} />
                ) : incentives?.type === "credit" ? (
                  <Download
                    className="h-5 w-5"
                    style={{ color: primaryColor }}
                  />
                ) : incentives?.type === "feature" ? (
                  <Star className="h-5 w-5" style={{ color: primaryColor }} />
                ) : (
                  <Sparkles
                    className="h-5 w-5"
                    style={{ color: primaryColor }}
                  />
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-base">
                  {incentives?.type === "discount"
                    ? "Your Discount Code"
                    : incentives?.type === "credit"
                      ? "Your Account Credit"
                      : incentives?.type === "feature"
                        ? "Your Feature Access"
                        : "Your Reward"}
                </h4>
                <p className="text-sm opacity-90 mt-1">{incentives?.value}</p>

                {incentives?.expiryDays && expiryDate && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs opacity-75">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Expires on {expiryDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Code display for discount type */}
            {incentives?.type === "discount" && incentives?.code && (
              <div className="mt-4">
                <div
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg font-mono text-base mt-2",
                    style.text === "text-white"
                      ? "bg-white/10"
                      : "bg-white border border-gray-200"
                  )}
                >
                  <span className="font-semibold tracking-wider">
                    {incentives?.code}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8 gap-2"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {isCopied ? "Copied!" : "Copy"}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div className="flex flex-col gap-3" variants={itemVariants}>
          <Button
            className="w-full"
            style={{
              backgroundColor: primaryColor,
              color: "white",
              borderColor: "transparent",
            }}
            onClick={onClose}
          >
            Continue
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              // Share functionality would go here
              // For now, just close
              if (onClose) onClose();
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>Share Your Experience</span>
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessMessage;
