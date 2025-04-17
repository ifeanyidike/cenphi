import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  X,
  ChevronLeft,
  Star,
  MessageSquare,
  Video,
  Mic,
  Camera,
  Info,
  Gift,
  AlertCircle,
  ArrowRight,
  Upload,
  Lock,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import media recording components
import VideoRecorder from "@/components/collection/VideoRecorder";
import AudioRecorder from "@/components/collection/AudioRecorder";
import ImageUploader from "@/components/collection/ImageUploader";

// Types
import {
  WidgetCustomization,
  TestimonialFormat,
  FormatOption,
  IncentiveConfig,
  DisplayRules,
  EnhancedTriggerOption,
  BusinessEventType,
  BrandData,
} from "@/types/setup";

import { observer } from "mobx-react-lite";
import {
  Button,
  buttonVariants,
  Card,
  InputField,
  ProgressIndicator,
  slideUpVariants,
  TextareaWithCounter,
  widgetVariants,
} from "./components";
import { PreviewDevice, WidgetStep } from "./shared";

// Style configurations interface
interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  isDarkTheme: boolean;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  backgroundColor: string;
  inputBackgroundColor: string;
  stylePreset: string;
  widgetClasses: string;
  buttonClasses: string;
  inputClasses: string;
  boxShadow: string;
  surfaceColor: string;
  elevatedSurfaceColor: string;
  accentColor: string;
  cardRadius: string;
  buttonRadius: string;
  inputRadius: string;
}

interface TestimonialWidgetProps {
  customization: WidgetCustomization | undefined;
  formats: FormatOption[];
  incentives: IncentiveConfig | undefined;
  displayRules: DisplayRules | undefined;
  triggers: EnhancedTriggerOption<BusinessEventType>[];
  device?: PreviewDevice;
  defaultOpen?: boolean;
  previewMode?: boolean;
  onClose?: () => void;
  customerData?: Record<string, string>;
  brandData: BrandData;
}

const TestimonialWidget: React.FC<TestimonialWidgetProps> = observer(
  ({
    customization,
    formats,
    incentives,
    displayRules,
    triggers,
    device = "desktop",
    defaultOpen = false,
    previewMode = false,
    onClose,
    customerData = {},
    brandData,
  }) => {
    // Widget state
    const [step, setStep] = useState<WidgetStep>(
      defaultOpen ? "open" : "closed"
    );
    const [selectedFormat, setSelectedFormat] =
      useState<TestimonialFormat | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [testimonialText, setTestimonialText] = useState<string>("");
    const [userName, setUserName] = useState<string>(customerData.name || "");
    const [userEmail, setUserEmail] = useState<string>(
      customerData.email || ""
    );
    const [userCompany, setUserCompany] = useState<string>(
      customerData.company || ""
    );
    const [userFields, setUserFields] = useState<Record<string, string>>({});
    const [consentGiven, setConsentGiven] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [displayConditionMet, setDisplayConditionMet] =
      useState<boolean>(true);
    const [activeQuestion, setActiveQuestion] = useState<number>(0);
    const [mediaRecorded, setMediaRecorded] = useState<boolean>(false);
    const [, setMediaBlob] = useState<Blob | null>(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showAdvancedFields, setShowAdvancedFields] =
      useState<boolean>(false);
    const [isHovering, setIsHovering] = useState<boolean>(false);

    // Additional state for premium experience
    const [showTip, setShowTip] = useState<boolean>(false);
    const [fileUploading, setFileUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [selectedRatingDescription, setSelectedRatingDescription] =
      useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [hoverStar, setHoverStar] = useState<number>(0);
    const [, setIsAnimating] = useState<boolean>(false);

    // Refs for positioning
    const buttonRef = useRef<HTMLButtonElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Determine if consent is required
    const consentRequired = customization?.requireConsent === true;

    // Get enabled formats
    const enabledFormats = formats.filter((format) => format.enabled) || [];

    // Get custom questions from settings
    const questions = customization?.questions || [
      "What did you like most about our product/service?",
      "How has it helped you or your business?",
    ];

    // Rating descriptions for enhanced UX
    const ratingDescriptions = [
      "",
      "Very Dissatisfied",
      "Dissatisfied",
      "Neutral",
      "Satisfied",
      "Very Satisfied",
    ];

    // Store button position
    const [buttonPosition, setButtonPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    });

    // Update button position when needed
    useEffect(() => {
      const updateButtonPosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setButtonPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      };

      updateButtonPosition();
      window.addEventListener("resize", updateButtonPosition);
      window.addEventListener("scroll", updateButtonPosition);

      return () => {
        window.removeEventListener("resize", updateButtonPosition);
        window.removeEventListener("scroll", updateButtonPosition);
      };
    }, [buttonRef.current]);

    // Check display conditions for real implementation
    useEffect(() => {
      if (previewMode) return;

      const checkDisplayConditions = () => {
        // Implementation would check actual page conditions
        const currentPath = window.location.pathname;
        const isExcludedPage = displayRules?.excludedPages?.some((pattern) => {
          const regexPattern = pattern
            .replace(/\*/g, ".*")
            .replace(/\//g, "\\/");
          return new RegExp(`^${regexPattern}$`).test(currentPath);
        });

        if (isExcludedPage) {
          setDisplayConditionMet(false);
          return;
        }

        // Check scroll depth
        const scrollDepth =
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100;
        const meetsScrollDepth =
          scrollDepth >= (displayRules?.minScrollDepth || 0);

        // Device detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isTablet =
          /iPad|Android/.test(navigator.userAgent) &&
          !/Mobile/.test(navigator.userAgent);

        const deviceAllowed =
          (isMobile && displayRules?.mobileEnabled) ||
          (isTablet && displayRules?.tabletEnabled) ||
          (!isMobile && !isTablet);

        setDisplayConditionMet(meetsScrollDepth && deviceAllowed);
      };

      checkDisplayConditions();
      window.addEventListener("scroll", checkDisplayConditions);
      window.addEventListener("resize", checkDisplayConditions);

      return () => {
        window.removeEventListener("scroll", checkDisplayConditions);
        window.removeEventListener("resize", checkDisplayConditions);
      };
    }, [displayRules, previewMode]);

    // Trigger logic
    useEffect(() => {
      if (previewMode || !triggers || !triggers.length) return;

      const activeTrigger = triggers.find((trigger) => trigger.enabled);
      if (!activeTrigger) return;

      const triggerWidget = () => {
        if (!displayConditionMet) return;
        setStep("opening");
        setTimeout(() => setStep("open"), 100);
      };

      if (activeTrigger.businessEvent === ("page_visit" as BusinessEventType)) {
        const delayMs =
          parseInt(activeTrigger.delay) *
          (activeTrigger.delayUnit === "seconds"
            ? 1000
            : activeTrigger.delayUnit === "minutes"
              ? 60000
              : activeTrigger.delayUnit === "hours"
                ? 3600000
                : 86400000);

        const timer = setTimeout(triggerWidget, delayMs);
        return () => clearTimeout(timer);
      }
    }, [triggers, displayConditionMet, previewMode]);

    // Handle opening and closing
    useEffect(() => {
      if (defaultOpen && step === "closed") {
        setStep("opening");
        setTimeout(() => setStep("open"), 100);
      }
    }, [defaultOpen, step]);

    // Clean up media preview URL when component unmounts
    useEffect(() => {
      return () => {
        if (mediaPreviewUrl) {
          URL.revokeObjectURL(mediaPreviewUrl);
        }
      };
    }, [mediaPreviewUrl]);

    // Generate style configuration based on customization
    const styleConfig = useCallback((): StyleConfig => {
      const primaryColor = brandData.colors.primary || "#4361EE";
      const secondaryColor = brandData.colors.secondary || "#3A0CA3";
      const stylePreset = customization?.stylePreset || "modern";
      const isDarkTheme = customization?.theme === "dark";
      const accentColor = "#32CD32"; // Success green

      // Base configuration for modern style
      const baseConfig: StyleConfig = {
        primaryColor,
        secondaryColor,
        isDarkTheme,
        textColor: isDarkTheme ? "text-white" : "text-gray-900",
        mutedTextColor: isDarkTheme ? "text-gray-300" : "text-gray-600",
        borderColor: isDarkTheme ? "border-gray-700" : "border-gray-200",
        backgroundColor: isDarkTheme ? "bg-gray-900" : "bg-white",
        inputBackgroundColor: isDarkTheme ? "bg-gray-800" : "bg-gray-50",
        surfaceColor: isDarkTheme ? "bg-gray-800" : "bg-white",
        elevatedSurfaceColor: isDarkTheme ? "bg-gray-850" : "bg-gray-50",
        accentColor,
        stylePreset,
        widgetClasses: "",
        buttonClasses: "",
        inputClasses: "",
        boxShadow: "shadow-lg",
        cardRadius: "rounded-xl",
        buttonRadius: "rounded-full",
        inputRadius: "rounded-lg",
      };

      // Apply style preset-specific configurations
      switch (stylePreset) {
        case "modern":
          return {
            ...baseConfig,
            widgetClasses: "border border-gray-400 rounded-2xl",
            buttonClasses: "rounded-full",
            inputClasses:
              "border border-gray-200 dark:border-gray-700 rounded-lg",
            boxShadow: "shadow-xl",
          };

        case "glassmorphism":
          return {
            ...baseConfig,
            widgetClasses:
              "rounded-2xl border border-gray-800/60 backdrop-blur-xl",
            buttonClasses: "rounded-full backdrop-blur-md",
            inputClasses: "border border-white/20 rounded-lg backdrop-blur-sm",
            boxShadow: "shadow-2xl",
            backgroundColor: isDarkTheme ? "bg-black/60" : "bg-white/60",
            surfaceColor: isDarkTheme ? "bg-black/40" : "bg-white/40",
            elevatedSurfaceColor: isDarkTheme ? "bg-black/30" : "bg-white/30",
            textColor: isDarkTheme ? "text-white" : "text-gray-900",
            mutedTextColor: isDarkTheme ? "text-gray-300" : "text-gray-600",
            borderColor: "border-white/20",
            inputBackgroundColor: isDarkTheme ? "bg-black/20" : "bg-white/20",
          };

        case "neumorphic":
          return {
            ...baseConfig,
            widgetClasses: "rounded-3xl border border-gray-300",
            buttonClasses: "rounded-full",
            inputClasses: " rounded-xl shadow-inner",
            boxShadow: "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)]",
            backgroundColor: isDarkTheme ? "bg-gray-800" : "bg-gray-50",
            surfaceColor: isDarkTheme ? "bg-gray-850" : "bg-gray-100",
            elevatedSurfaceColor: isDarkTheme ? "bg-gray-900" : "bg-white",
            cardRadius: "rounded-2xl",
          };

        case "gradient":
          return {
            ...baseConfig,
            widgetClasses: "rounded-2xl border border-gray-500",
            buttonClasses: "rounded-full",
            inputClasses: "border-0 rounded-lg",
            boxShadow: "shadow-2xl",
            backgroundColor: `bg-gradient-to-br from-[${primaryColor}] via-[${primaryColor}] to-[${secondaryColor}]`,
            surfaceColor: "bg-white/10",
            elevatedSurfaceColor: "bg-white/20",
            textColor: "text-white",
            mutedTextColor: "text-white/80",
            borderColor: "border-white/10",
            inputBackgroundColor: "bg-white/10",
          };

        default:
          return baseConfig;
      }
    }, [customization, brandData]);

    // Get current style configuration
    const currentStyle = styleConfig();

    // Function to reset widget
    const resetWidget = () => {
      setStep("closed");
      setSelectedFormat(null);
      setRating(0);
      setTestimonialText("");
      setUserName(customerData.name || "");
      setUserEmail(customerData.email || "");
      setUserCompany(customerData.company || "");
      setUserFields({});
      setMediaBlob(null);
      setMediaPreviewUrl(null);
      setActiveQuestion(0);
      setMediaRecorded(false);
      setConsentGiven(false);
      setFormErrors({});
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      if (onClose) onClose();
    };

    // Go back to previous step
    const goBack = () => {
      if (step === "forms") {
        setStep("open");
      } else if (step === "recording") {
        setStep("forms");
      } else if (step === "review") {
        if (selectedFormat === "text" || !selectedFormat) {
          setStep("forms");
        } else {
          setStep("recording");
        }
      }
    };

    // Get position styles for widget
    const getPositionStyles = (): string => {
      switch (customization?.position) {
        case "bottom-right":
          return "bottom-6 right-6";
        case "bottom-left":
          return "bottom-6 left-6";
        case "top-right":
          return "top-24 right-6";
        case "top-left":
          return "top-24 left-6";
        default:
          return "bottom-6 right-6";
      }
    };

    // Handle media recording completion - Fixed to prevent flickering
    const handleMediaRecording = (blob: Blob) => {
      setMediaBlob(blob);
      const url = URL.createObjectURL(blob);
      setMediaPreviewUrl(url);

      // Start upload simulation
      setFileUploading(true);
      let progress = 0;

      // Use a fixed interval approach to prevent flickering
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          clearInterval(interval);
          // Set all states in the correct order to avoid re-render issues
          setFileUploading(false);
          // Small delay to ensure smooth transition
          setTimeout(() => {
            setMediaRecorded(true);
          }, 50);
        } else {
          setUploadProgress(progress);
        }
      }, 100);
    };

    // Validate form
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};

      // Required fields: name and email
      if (!userName.trim()) {
        errors["name"] = "Name is required";
      }

      if (!userEmail.trim()) {
        errors["email"] = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(userEmail)) {
        errors["email"] = "Please enter a valid email address";
      }

      // Check for required custom fields
      if (customization?.requiredFields) {
        customization.requiredFields.forEach((field) => {
          if (field !== "name" && field !== "email") {
            if (!userFields[field]?.trim()) {
              errors[field] =
                `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            }
          }
        });
      }

      // Check consent
      if (consentRequired && !consentGiven) {
        errors["consent"] = "You must give consent to continue";
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
      if (!validateForm()) return;

      setIsSubmitting(true);
      setIsAnimating(true);

      // Collect all form data
      const formData = {
        format: selectedFormat,
        rating,
        testimonialText,
        name: userName,
        email: userEmail,
        company: userCompany,
        ...userFields,
        consentGiven,
        mediaType: selectedFormat !== "text" ? selectedFormat : null,
      };

      console.log("Testimonial data:", formData);

      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setStep("complete");
        setIsAnimating(false);
      }, 1500);
    };

    // Check if eligible for incentive
    const isEligibleForIncentive = (): boolean => {
      if (!incentives?.enabled || !incentives?.minimumQualification)
        return false;

      // Format check
      const formatEligible =
        incentives.minimumQualification.testimonialType?.includes(
          (selectedFormat || "text") as TestimonialFormat
        );
      if (!formatEligible) return false;

      // Rating check
      const ratingEligible =
        rating >= (incentives.minimumQualification.minimumRating || 0);
      if (!ratingEligible) return false;

      // Length check for text
      if (selectedFormat === "text" || !selectedFormat) {
        return (
          testimonialText.length >=
          (incentives.minimumQualification.minimumLength || 0)
        );
      }

      return true;
    };

    // Handle field changes
    const handleFieldChange = (field: string, value: string) => {
      if (field === "name") setUserName(value);
      else if (field === "email") setUserEmail(value);
      else if (field === "company") setUserCompany(value);
      else {
        setUserFields((prev) => ({
          ...prev,
          [field]: value,
        }));
      }

      // Clear error for this field
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

    // Format field label
    const formatFieldLabel = (field: string): string => {
      if (field === "jobTitle") return "Job Title";
      if (field === "purchaseDate") return "Purchase Date";
      if (field === "productUsed") return "Product Used";
      if (field === "socialMedia") return "Social Media";
      if (field === "customerSince") return "Customer Since";

      return field
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Get field type based on name
    const getFieldType = (field: string): string => {
      if (field === "email") return "email";
      if (field === "purchaseDate" || field === "customerSince") return "date";
      if (field === "age") return "number";
      if (field === "website" || field === "socialMedia") return "url";
      return "text";
    };

    // Widget size based on device
    const getWidgetSizeClass = (): string => {
      switch (device) {
        case "mobile":
          return "w-[calc(100%-2rem)] max-w-[360px]";
        case "tablet":
          return "w-[400px]";
        default:
          return "w-[450px]";
      }
    };

    // Calculate popup position
    const getPopupStyle = (): React.CSSProperties => {
      if (previewMode) {
        return {};
      }

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Default position near the button
      const basePosition = {
        position: "fixed" as const,
        visibility:
          step !== "closed"
            ? "visible"
            : ("hidden" as React.CSSProperties["visibility"]),
      };

      // Get the position of the button
      const btnCenter = buttonPosition.left + buttonPosition.width / 2;
      const widgetWidth = device === "mobile" ? 360 : 450;

      // Calculate optimal position based on window dimensions
      let top, left, transformOrigin;

      // First check if widget fits below the button
      if (buttonPosition.top + buttonPosition.height + 500 < windowHeight) {
        // Position below button
        top = buttonPosition.top + buttonPosition.height + 16;
        transformOrigin = "top center";
      } else {
        // Position above button if there's room
        top = buttonPosition.top - 16;
        transformOrigin = "bottom center";
      }

      // Check horizontal positioning
      if (btnCenter - widgetWidth / 2 < 20) {
        // Too close to left edge
        left = 20;
      } else if (btnCenter + widgetWidth / 2 > windowWidth - 20) {
        // Too close to right edge
        left = windowWidth - widgetWidth - 20;
      } else {
        // Center horizontally with button
        left = btnCenter - widgetWidth / 2;
      }

      return {
        ...basePosition,
        top: `${top}px`,
        left: `${left}px`,
        transformOrigin,
      };
    };

    // currentStyle.widgetClasses,
    //               getPositionStyles(),
    //               getWidgetSizeClass(),

    // Render widget button
    const renderWidgetButton = () => (
      <motion.div
        className={`fixed ${getPositionStyles()} z-[9999]`}
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        onMouseEnter={() => {
          setIsHovering(true);
          setTimeout(() => setShowTip(true), 800);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          setShowTip(false);
        }}
      >
        <button
          ref={buttonRef}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-white",
            currentStyle.buttonClasses,
            currentStyle.boxShadow,
            device === "mobile" ? "rounded-full" : "",
            "transform transition-all duration-300 ease-in-out"
          )}
          style={{
            backgroundColor:
              currentStyle.stylePreset === "gradient"
                ? undefined
                : currentStyle.primaryColor,
          }}
          onClick={() => {
            if (previewMode || displayConditionMet) {
              setStep("opening");
              setTimeout(() => setStep("open"), 100);
            }
          }}
          aria-label="Open feedback widget"
        >
          <MessageSquare className="h-5 w-5" />
          {(device !== "mobile" || isHovering) && (
            <motion.span
              className="font-medium whitespace-nowrap"
              initial={{
                width: device === "mobile" ? 0 : "auto",
                opacity: device === "mobile" ? 0 : 1,
              }}
              animate={{
                width: device !== "mobile" || isHovering ? "auto" : 0,
                opacity: device !== "mobile" || isHovering ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {customization?.widgetTitle || "Share Your Feedback"}
            </motion.span>
          )}
        </button>

        {/* Optional tooltip */}
        <AnimatePresence>
          {showTip && (
            <motion.div
              className={cn(
                "absolute bottom-full mb-3 p-3 rounded-xl text-sm text-white",
                currentStyle.boxShadow
              )}
              style={{
                backgroundColor: currentStyle.primaryColor,
                maxWidth: "200px",
              }}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
            >
              <p className="font-medium">We'd love your feedback!</p>
              <p className="text-xs opacity-90 mt-1">
                Share your experience and help us improve
              </p>
              <div
                className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-3 h-3"
                style={{ backgroundColor: currentStyle.primaryColor }}
              ></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );

    // Render each step of the widget
    const renderWidgetContent = () => {
      switch (step) {
        case "opening":
          // Just a transition state
          return null;

        case "open":
          return (
            <div className="z-[999] p-6 space-y-6">
              {/* Header */}
              <motion.div
                className="space-y-3"
                variants={slideUpVariants}
                custom={0}
                initial="hidden"
                animate="visible"
              >
                {brandData?.logo?.main &&
                  brandData.logo.main !== "placeholder" && (
                    <img
                      src={brandData.logo.main}
                      alt={brandData?.name || "Company Logo"}
                      className="h-10 object-contain mb-4"
                    />
                  )}

                <h2
                  className={cn("text-2xl font-bold", currentStyle.textColor)}
                >
                  {customization?.widgetTitle || "Share Your Experience"}
                </h2>

                <p className={cn("text-base", currentStyle.mutedTextColor)}>
                  {customization?.widgetDescription ||
                    "We'd love to hear what you think about our product"}
                </p>
              </motion.div>

              {/* Rating */}
              <motion.div
                className="space-y-5"
                variants={slideUpVariants}
                custom={1}
                initial="hidden"
                animate="visible"
              >
                <h3
                  className={cn(
                    "text-base font-medium",
                    currentStyle.textColor
                  )}
                >
                  How would you rate your experience?
                </h3>

                <div className="flex justify-center py-2">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        className={cn(
                          "transition-all focus:outline-none relative p-1",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/50 hover:text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        )}
                        onClick={() => {
                          setRating(star);
                          setSelectedRatingDescription(
                            ratingDescriptions[star]
                          );
                        }}
                        onMouseEnter={() => {
                          setHoverStar(star);
                          setSelectedRatingDescription(
                            ratingDescriptions[star]
                          );
                        }}
                        onMouseLeave={() => {
                          setHoverStar(0);
                          if (rating > 0) {
                            setSelectedRatingDescription(
                              ratingDescriptions[rating]
                            );
                          } else {
                            setSelectedRatingDescription("");
                          }
                        }}
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className="h-10 w-10"
                          fill={
                            star <= (hoverStar || rating) ? "#FBBF24" : "none"
                          }
                          stroke={
                            star <= (hoverStar || rating)
                              ? "#FBBF24"
                              : "currentColor"
                          }
                          strokeWidth={1.5}
                        />

                        {star <= rating && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  <motion.div
                    className="text-center h-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {Boolean(selectedRatingDescription || hoverStar > 0) && (
                      <span
                        className={cn(
                          "inline-block px-4 py-1.5 rounded-full text-sm font-medium",
                          (hoverStar || rating) <= 2
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : (hoverStar || rating) === 3
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                          currentStyle.stylePreset === "gradient" &&
                            "bg-white/10 text-white"
                        )}
                      >
                        {selectedRatingDescription ||
                          ratingDescriptions[hoverStar]}
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Format selection */}
              <motion.div
                className="space-y-5"
                variants={slideUpVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              >
                <h3
                  className={cn(
                    "text-base font-medium",
                    currentStyle.textColor
                  )}
                >
                  How would you like to share?
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {enabledFormats.map((format) => {
                    let FormatIcon;

                    switch (format.type) {
                      case "text":
                        FormatIcon = MessageSquare;
                        break;
                      case "video":
                        FormatIcon = Video;
                        break;
                      case "audio":
                        FormatIcon = Mic;
                        break;
                      case "image":
                        FormatIcon = Camera;
                        break;
                      default:
                        FormatIcon = MessageSquare;
                    }

                    const isSelected = selectedFormat === format.type;

                    return (
                      <motion.button
                        key={format.type}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : `${currentStyle.borderColor} hover:border-primary/30`,
                          currentStyle.stylePreset === "gradient" &&
                            isSelected &&
                            "bg-white/20 border-white/40",
                          currentStyle.stylePreset === "gradient" &&
                            !isSelected &&
                            "border-white/10 hover:bg-white/10"
                        )}
                        onClick={() =>
                          setSelectedFormat(format.type as TestimonialFormat)
                        }
                        style={
                          isSelected && currentStyle.stylePreset !== "gradient"
                            ? {
                                borderColor: currentStyle.primaryColor,
                                backgroundColor: `${currentStyle.primaryColor}10`,
                              }
                            : {}
                        }
                        aria-pressed={isSelected}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-full",
                            isSelected
                              ? "text-white"
                              : currentStyle.stylePreset === "gradient"
                                ? "bg-white/20 text-white"
                                : currentStyle.isDarkTheme
                                  ? "bg-gray-700 text-gray-400"
                                  : "bg-gray-100 text-gray-500"
                          )}
                          style={{
                            backgroundColor: isSelected
                              ? currentStyle.primaryColor
                              : undefined,
                          }}
                        >
                          <FormatIcon className="h-7 w-7" />
                        </div>

                        <span
                          className={cn(
                            "text-base font-medium",
                            currentStyle.textColor
                          )}
                        >
                          {format.type.charAt(0).toUpperCase() +
                            format.type.slice(1)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Incentive preview */}
              {incentives?.enabled && (
                <motion.div
                  variants={slideUpVariants}
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "py-4 px-5 rounded-xl flex items-start gap-4",
                    currentStyle.stylePreset === "gradient"
                      ? "bg-white/10 border border-white/20"
                      : "border border-primary/20 bg-primary/5"
                  )}
                  style={
                    currentStyle.stylePreset !== "gradient"
                      ? {
                          backgroundColor: `${currentStyle.primaryColor}05`,
                          borderColor: `${currentStyle.primaryColor}20`,
                        }
                      : {}
                  }
                >
                  <div
                    className={cn(
                      "p-2.5 rounded-full text-white flex-shrink-0",
                      currentStyle.stylePreset === "gradient"
                        ? "bg-white/20"
                        : ""
                    )}
                    style={{
                      backgroundColor:
                        currentStyle.stylePreset !== "gradient"
                          ? currentStyle.primaryColor
                          : undefined,
                    }}
                  >
                    <Gift className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <p
                      className={cn(
                        "text-base font-medium",
                        currentStyle.textColor
                      )}
                    >
                      Share and get rewarded!
                    </p>
                    <p className={cn("text-sm", currentStyle.mutedTextColor)}>
                      {incentives.value}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Continue button */}
              <motion.div
                className="flex justify-end pt-4"
                variants={slideUpVariants}
                custom={4}
                initial="hidden"
                animate="visible"
              >
                <Button
                  onClick={() => {
                    if (selectedFormat || rating > 0) {
                      setStep("forms");
                    }
                  }}
                  disabled={!selectedFormat && rating === 0}
                  variant="primary"
                  icon={<ArrowRight className="h-4 w-4" />}
                  currentStyle={currentStyle}
                >
                  Continue
                </Button>
              </motion.div>
            </div>
          );

        case "forms":
          return (
            <div className="p-6 space-y-5">
              {/* Back button and header */}
              <motion.div
                className="space-y-2"
                variants={slideUpVariants}
                custom={0}
                initial="hidden"
                animate="visible"
              >
                <button
                  onClick={goBack}
                  className={cn(
                    "text-sm flex items-center gap-1 hover:opacity-80 mb-2 bg-transparent",
                    currentStyle.mutedTextColor
                  )}
                  type="button"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <h2
                  className={cn("text-2xl font-bold", currentStyle.textColor)}
                >
                  Tell us more
                </h2>

                <p className={cn("text-base", currentStyle.mutedTextColor)}>
                  {selectedFormat !== "text"
                    ? `Record a ${selectedFormat} testimonial`
                    : "Share your thoughts about our product"}
                </p>
              </motion.div>

              {/* Content collector */}
              <motion.div
                className="space-y-5 pt-1"
                variants={slideUpVariants}
                custom={1}
                initial="hidden"
                animate="visible"
              >
                {selectedFormat === "text" || !selectedFormat ? (
                  <Card currentStyle={currentStyle} className="p-1">
                    {/* Text questionnaire */}
                    <div className="relative">
                      <div
                        className={cn(
                          "flex justify-between items-center text-sm font-medium p-3",
                          currentStyle.textColor
                        )}
                      >
                        <span>
                          Question {activeQuestion + 1} of {questions.length}
                        </span>

                        {questions.length > 1 && (
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              currentStyle={currentStyle}
                              disabled={activeQuestion === 0}
                              onClick={() =>
                                setActiveQuestion(
                                  Math.max(0, activeQuestion - 1)
                                )
                              }
                            >
                              Previous
                            </Button>

                            <Button
                              variant="ghost"
                              currentStyle={currentStyle}
                              size="sm"
                              disabled={activeQuestion === questions.length - 1}
                              onClick={() =>
                                setActiveQuestion(
                                  Math.min(
                                    questions.length - 1,
                                    activeQuestion + 1
                                  )
                                )
                              }
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeQuestion}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="px-4 pb-4"
                        >
                          <p
                            className={cn(
                              "text-base mb-3 font-medium",
                              currentStyle.textColor
                            )}
                          >
                            {questions[activeQuestion]}
                          </p>

                          <TextareaWithCounter
                            currentStyle={currentStyle}
                            isTyping={isTyping}
                            setIsTyping={setIsTyping}
                            value={testimonialText}
                            onChange={(e) => setTestimonialText(e.target.value)}
                            placeholder="Share your thoughts here..."
                            minLength={
                              (incentives?.enabled &&
                                incentives.minimumQualification
                                  ?.minimumLength) ||
                              0
                            }
                            rows={5}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </Card>
                ) : (
                  <Card
                    currentStyle={currentStyle}
                    className={cn(
                      "p-8 flex flex-col items-center justify-center space-y-5"
                    )}
                    elevated
                  >
                    {selectedFormat === "video" && (
                      <Video
                        className={cn(
                          "h-12 w-12 mb-2",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/70"
                            : "text-gray-400"
                        )}
                      />
                    )}
                    {selectedFormat === "audio" && (
                      <Mic
                        className={cn(
                          "h-12 w-12 mb-2",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/70"
                            : "text-gray-400"
                        )}
                      />
                    )}
                    {selectedFormat === "image" && (
                      <Camera
                        className={cn(
                          "h-12 w-12 mb-2",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/70"
                            : "text-gray-400"
                        )}
                      />
                    )}

                    <p
                      className={cn(
                        "text-base text-center",
                        currentStyle.mutedTextColor
                      )}
                    >
                      {selectedFormat === "video" &&
                        "Record a video testimonial to share your experience"}
                      {selectedFormat === "audio" &&
                        "Record your voice to share your feedback"}
                      {selectedFormat === "image" &&
                        "Upload a photo to accompany your testimonial"}
                    </p>

                    <Button
                      onClick={() => setStep("recording")}
                      currentStyle={currentStyle}
                      variant="primary"
                      icon={
                        selectedFormat === "video" ? (
                          <Video className="h-4 w-4" />
                        ) : selectedFormat === "audio" ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )
                      }
                    >
                      {selectedFormat === "video" && "Start Recording"}
                      {selectedFormat === "audio" && "Start Recording"}
                      {selectedFormat === "image" && "Upload Photo"}
                    </Button>
                  </Card>
                )}
              </motion.div>

              {/* User information */}
              <motion.div
                className="space-y-5 pt-3"
                variants={slideUpVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              >
                <h3
                  className={cn(
                    "text-base font-medium",
                    currentStyle.textColor
                  )}
                >
                  Your Information
                </h3>

                <Card className="p-4 space-y-4" currentStyle={currentStyle}>
                  {/* Core fields */}
                  <InputField
                    id="name"
                    label="Full Name"
                    placeholder="John Smith"
                    value={userName}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    required={true}
                    error={formErrors.name}
                    currentStyle={currentStyle}
                  />

                  <InputField
                    id="email"
                    type="email"
                    label="Email"
                    placeholder="john@example.com"
                    value={userEmail}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    required={true}
                    error={formErrors.email}
                    currentStyle={currentStyle}
                  />

                  {/* Company field if present */}
                  {customization?.fields?.includes("company") && (
                    <InputField
                      id="company"
                      label="Company"
                      placeholder="Acme Inc."
                      value={userCompany}
                      onChange={(e) =>
                        handleFieldChange("company", e.target.value)
                      }
                      required={
                        customization?.requiredFields?.includes("company") ||
                        false
                      }
                      error={formErrors.company}
                      currentStyle={currentStyle}
                    />
                  )}

                  {/* Required additional fields */}
                  {customization?.fields
                    ?.filter(
                      (field) =>
                        field !== "name" &&
                        field !== "email" &&
                        field !== "company" &&
                        customization?.requiredFields?.includes(field)
                    )
                    .map((field) => (
                      <InputField
                        key={field}
                        id={field}
                        type={getFieldType(field)}
                        label={formatFieldLabel(field)}
                        placeholder={`Enter your ${formatFieldLabel(field).toLowerCase()}`}
                        value={userFields[field] || ""}
                        onChange={(e) =>
                          handleFieldChange(field, e.target.value)
                        }
                        required={true}
                        error={formErrors[field]}
                        currentStyle={currentStyle}
                      />
                    ))}

                  {/* Optional fields (collapsible) */}
                  {(customization?.fields?.filter(
                    (field) =>
                      field !== "name" &&
                      field !== "email" &&
                      field !== "company" &&
                      !customization?.requiredFields?.includes(field)
                  ).length || 0) > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAdvancedFields(!showAdvancedFields)
                        }
                        className={cn(
                          "flex items-center justify-between w-full p-3 text-sm rounded-lg",
                          currentStyle.stylePreset === "gradient"
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800",
                          currentStyle.textColor
                        )}
                      >
                        <span>
                          {showAdvancedFields ? "Hide" : "Show"} Additional
                          Information
                          <span
                            className={cn("ml-1", currentStyle.mutedTextColor)}
                          >
                            (optional)
                          </span>
                        </span>

                        {showAdvancedFields ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showAdvancedFields && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="pt-4 space-y-4 overflow-hidden"
                          >
                            {customization?.fields
                              ?.filter(
                                (field) =>
                                  field !== "name" &&
                                  field !== "email" &&
                                  field !== "company" &&
                                  !customization?.requiredFields?.includes(
                                    field
                                  )
                              )
                              .map((field) => (
                                <InputField
                                  key={field}
                                  id={field}
                                  type={getFieldType(field)}
                                  label={formatFieldLabel(field)}
                                  placeholder={`Enter your ${formatFieldLabel(field).toLowerCase()}`}
                                  value={userFields[field] || ""}
                                  onChange={(e) =>
                                    handleFieldChange(field, e.target.value)
                                  }
                                  required={false}
                                  description="optional"
                                  currentStyle={currentStyle}
                                />
                              ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Consent checkbox */}
              {consentRequired && (
                <motion.div
                  className="space-y-2 mt-4"
                  variants={slideUpVariants}
                  custom={3}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="p-4" currentStyle={currentStyle}>
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1 flex-shrink-0">
                        <input
                          id="consent-checkbox"
                          type="checkbox"
                          className={cn(
                            "h-5 w-5 rounded border-gray-300 cursor-pointer",
                            currentStyle.stylePreset === "gradient"
                              ? "bg-white/10 border-white/30"
                              : ""
                          )}
                          checked={consentGiven}
                          onChange={(e) => {
                            setConsentGiven(e.target.checked);
                            if (e.target.checked && formErrors.consent) {
                              setFormErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.consent;
                                return newErrors;
                              });
                            }
                          }}
                        />
                        {consentGiven && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <CheckCircle
                              className="h-5 w-5 text-primary"
                              style={{ color: currentStyle.primaryColor }}
                            />
                          </motion.div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="consent-checkbox"
                          className={cn("text-base", currentStyle.textColor)}
                        >
                          {customization.consentText ||
                            "I agree to share my testimonial and allow it to be used for marketing purposes."}
                        </label>

                        {customization.privacyPolicyUrl && (
                          <div className="mt-2">
                            <a
                              href={customization.privacyPolicyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "text-sm flex items-center gap-1 hover:underline",
                                currentStyle.stylePreset === "gradient"
                                  ? "text-white/80"
                                  : "text-blue-600 dark:text-blue-400"
                              )}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Privacy Policy
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {formErrors.consent && (
                      <p className="text-xs text-red-500 pl-8 mt-1">
                        {formErrors.consent}
                      </p>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Data protection notice */}
              {customization?.showDataProtection && (
                <motion.div
                  variants={slideUpVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  className="mt-4"
                >
                  <Card
                    className={cn(
                      "p-4 flex items-start gap-3 text-sm",
                      "border border-gray-100 dark:border-gray-800"
                    )}
                    currentStyle={currentStyle}
                  >
                    <Lock
                      className={cn(
                        "h-5 w-5 mt-0.5 flex-shrink-0",
                        currentStyle.stylePreset === "gradient"
                          ? "text-white/70"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    />

                    <div className={currentStyle.mutedTextColor}>
                      {customization?.dataProtectionText ||
                        "Your information is securely handled according to our data protection practices. We do not share your personal information with third parties without your consent."}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Incentive eligibility notice */}
              {incentives?.enabled &&
                (selectedFormat === "text" || !selectedFormat) &&
                incentives.minimumQualification && (
                  <motion.div
                    variants={slideUpVariants}
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    className="mt-4"
                  >
                    <Card
                      className={cn(
                        "flex items-start gap-2 p-3",
                        testimonialText.length >=
                          (incentives.minimumQualification.minimumLength || 0)
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30"
                          : "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30",
                        currentStyle.stylePreset === "gradient" &&
                          "bg-white/10 border-white/20"
                      )}
                      currentStyle={currentStyle}
                    >
                      <Info
                        className={cn(
                          "h-5 w-5 flex-shrink-0 mt-0.5",
                          testimonialText.length >=
                            (incentives.minimumQualification.minimumLength || 0)
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400",
                          currentStyle.stylePreset === "gradient" &&
                            "text-white"
                        )}
                      />

                      <span
                        className={cn(
                          "text-sm",
                          testimonialText.length >=
                            (incentives.minimumQualification.minimumLength || 0)
                            ? "text-green-700 dark:text-green-300"
                            : "text-amber-700 dark:text-amber-300",
                          currentStyle.stylePreset === "gradient" &&
                            "text-white"
                        )}
                      >
                        {testimonialText.length >=
                        (incentives.minimumQualification.minimumLength || 0)
                          ? "Your testimonial meets the minimum length requirement"
                          : `Your testimonial must be at least ${incentives.minimumQualification.minimumLength} characters to qualify for rewards`}
                      </span>
                    </Card>
                  </motion.div>
                )}

              {/* Buttons */}
              <motion.div
                className="flex justify-between pt-5"
                variants={slideUpVariants}
                custom={6}
                initial="hidden"
                animate="visible"
              >
                <Button
                  onClick={goBack}
                  variant="secondary"
                  currentStyle={currentStyle}
                >
                  Back
                </Button>

                <Button
                  onClick={() => {
                    if (validateForm()) {
                      if (selectedFormat === "text" || !selectedFormat) {
                        setStep("review");
                      } else {
                        setStep("recording");
                      }
                    }
                  }}
                  variant="primary"
                  icon={<ArrowRight className="h-4 w-4" />}
                  currentStyle={currentStyle}
                >
                  {selectedFormat === "text" || !selectedFormat
                    ? "Review"
                    : "Next"}
                </Button>
              </motion.div>
            </div>
          );

        case "recording":
          return (
            <div className="p-6 space-y-6">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={goBack}
                className={cn(
                  "text-sm flex items-center gap-1 hover:opacity-80 mb-2 bg-transparent",
                  currentStyle.mutedTextColor
                )}
                type="button"
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2
                  className={cn("text-2xl font-bold", currentStyle.textColor)}
                >
                  {selectedFormat === "video" && "Record Your Video"}
                  {selectedFormat === "audio" && "Record Your Audio"}
                  {selectedFormat === "image" && "Upload Your Photo"}
                </h2>

                <Card
                  className={cn(
                    "p-8 flex flex-col items-center justify-center relative overflow-hidden",
                    "border-2 border-dashed",
                    currentStyle.stylePreset === "gradient"
                      ? "border-white/30"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                  currentStyle={currentStyle}
                >
                  {/* Media recorders */}
                  {selectedFormat === "video" && (
                    <div className="w-full">
                      <VideoRecorder
                        onRecordingComplete={handleMediaRecording}
                        forceMobileView
                        primaryColor={currentStyle.primaryColor}
                      />
                    </div>
                  )}

                  {selectedFormat === "audio" && (
                    <div className="w-full">
                      <AudioRecorder
                        onRecordingComplete={handleMediaRecording}
                        forceMobileView
                        primaryColor={currentStyle.primaryColor}
                      />
                    </div>
                  )}

                  {selectedFormat === "image" && (
                    <div className="w-full">
                      <ImageUploader
                        onImageSelected={handleMediaRecording}
                        primaryColor={currentStyle.primaryColor}
                      />
                    </div>
                  )}

                  {/* Upload progress */}
                  <AnimatePresence>
                    {fileUploading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full mt-5"
                      >
                        <div className="text-base text-center mb-3 font-medium">
                          {uploadProgress < 100
                            ? "Uploading..."
                            : "Processing..."}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
                          <motion.div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${uploadProgress}%`,
                              backgroundColor: currentStyle.primaryColor,
                            }}
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success message after upload */}
                  <AnimatePresence>
                    {mediaRecorded && !fileUploading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-5 flex flex-col items-center"
                      >
                        <motion.div
                          className="p-3 rounded-full bg-green-100 dark:bg-green-900 mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                          }}
                        >
                          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <p
                          className={cn(
                            "text-base font-medium mb-2",
                            currentStyle.textColor
                          )}
                        >
                          {selectedFormat} recorded successfully!
                        </p>
                        <p
                          className={cn(
                            "text-sm mb-5",
                            currentStyle.mutedTextColor
                          )}
                        >
                          You can continue to the next step
                        </p>
                        <Button
                          onClick={() => setStep("review")}
                          variant="primary"
                          currentStyle={currentStyle}
                        >
                          Continue to Review
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                <motion.div
                  className="flex items-center justify-between pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.2 } }}
                >
                  <Button
                    onClick={goBack}
                    variant="secondary"
                    currentStyle={currentStyle}
                  >
                    Back
                  </Button>

                  <div>
                    {/* Privacy notice */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-sm",
                        currentStyle.mutedTextColor
                      )}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Your privacy is protected
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          );

        case "review":
          return (
            <div className="p-6 space-y-5">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={goBack}
                className={cn(
                  "text-sm flex items-center gap-1 hover:opacity-80 mb-2 bg-transparent",
                  currentStyle.mutedTextColor
                )}
                type="button"
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2
                  className={cn("text-2xl font-bold", currentStyle.textColor)}
                >
                  Review your testimonial
                </h2>

                <p className={cn("text-base", currentStyle.mutedTextColor)}>
                  Please review your testimonial before submitting
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              >
                <Card
                  className="p-6 space-y-5"
                  currentStyle={currentStyle}
                  elevated
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg"
                      style={{
                        backgroundColor: currentStyle.primaryColor,
                      }}
                    >
                      {userName ? userName.slice(0, 1).toUpperCase() : "?"}
                    </div>

                    <div className="space-y-3 flex-1">
                      <div>
                        <div
                          className={cn(
                            "font-medium text-lg",
                            currentStyle.textColor
                          )}
                        >
                          {userName || "Anonymous"}
                        </div>

                        {userCompany && (
                          <div
                            className={cn(
                              "text-sm",
                              currentStyle.mutedTextColor
                            )}
                          >
                            {userCompany}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-5 w-5"
                            fill={star <= rating ? "#FBBF24" : "none"}
                            stroke={
                              star <= rating
                                ? "#FBBF24"
                                : currentStyle.stylePreset === "gradient"
                                  ? "white"
                                  : "currentColor"
                            }
                          />
                        ))}
                        <span
                          className={cn(
                            "ml-2 text-sm font-medium",
                            currentStyle.stylePreset === "gradient"
                              ? "text-white/80"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {rating}/5
                        </span>
                      </div>

                      {selectedFormat === "text" || !selectedFormat ? (
                        <p
                          className={cn(
                            "text-base pt-2 whitespace-pre-line border-l-4 pl-4 mt-2",
                            currentStyle.textColor
                          )}
                          style={{ borderColor: currentStyle.primaryColor }}
                        >
                          {testimonialText || "No testimonial text provided."}
                        </p>
                      ) : (
                        <Card
                          className={cn(
                            "mt-3 p-5 flex items-center justify-center",
                            "border",
                            currentStyle.stylePreset === "gradient"
                              ? "bg-white/10 border-white/20 text-white"
                              : "border-gray-200 dark:border-gray-700"
                          )}
                          currentStyle={currentStyle}
                        >
                          {selectedFormat === "video" && mediaPreviewUrl && (
                            <video
                              src={mediaPreviewUrl}
                              controls
                              className="max-h-64 w-full rounded-lg"
                            />
                          )}

                          {selectedFormat === "audio" && mediaPreviewUrl && (
                            <audio
                              src={mediaPreviewUrl}
                              controls
                              className="w-full"
                            />
                          )}

                          {selectedFormat === "image" && mediaPreviewUrl && (
                            <img
                              src={mediaPreviewUrl}
                              alt="Your testimonial"
                              className="max-h-64 rounded-lg object-contain"
                            />
                          )}

                          {!mediaPreviewUrl &&
                            (selectedFormat as TestimonialFormat) !==
                              "text" && (
                              <div className="text-center py-4">
                                {selectedFormat === "video" && (
                                  <Video
                                    className={cn(
                                      "h-8 w-8 mx-auto mb-3",
                                      currentStyle.stylePreset === "gradient"
                                        ? "text-white/70"
                                        : "text-gray-400"
                                    )}
                                  />
                                )}

                                {selectedFormat === "audio" && (
                                  <Mic
                                    className={cn(
                                      "h-8 w-8 mx-auto mb-3",
                                      currentStyle.stylePreset === "gradient"
                                        ? "text-white/70"
                                        : "text-gray-400"
                                    )}
                                  />
                                )}

                                {selectedFormat === "image" && (
                                  <Camera
                                    className={cn(
                                      "h-8 w-8 mx-auto mb-3",
                                      currentStyle.stylePreset === "gradient"
                                        ? "text-white/70"
                                        : "text-gray-400"
                                    )}
                                  />
                                )}

                                <span
                                  className={cn(
                                    "text-base",
                                    currentStyle.stylePreset === "gradient"
                                      ? "text-white/70"
                                      : "text-gray-500 dark:text-gray-400"
                                  )}
                                >
                                  {selectedFormat} preview
                                </span>
                              </div>
                            )}
                        </Card>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Incentive notice if eligible */}
              {incentives?.enabled && isEligibleForIncentive() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                >
                  <Card
                    className={cn(
                      "p-5 flex items-start gap-4 border",
                      currentStyle.stylePreset === "gradient"
                        ? "bg-white/10 border-white/20"
                        : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30"
                    )}
                    currentStyle={currentStyle}
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-full flex-shrink-0",
                        currentStyle.stylePreset === "gradient"
                          ? "bg-white/20 text-white"
                          : "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400"
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <div className="space-y-2">
                      <p
                        className={cn(
                          "text-base font-medium",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white"
                            : "text-green-800 dark:text-green-300"
                        )}
                      >
                        You'll receive your reward:
                      </p>

                      <p
                        className={cn(
                          "text-base",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/90"
                            : "text-green-700 dark:text-green-400"
                        )}
                      >
                        {incentives.value}
                      </p>

                      {incentives.expiryDays && (
                        <p
                          className={cn(
                            "text-sm",
                            currentStyle.stylePreset === "gradient"
                              ? "text-white/80"
                              : "text-green-600 dark:text-green-400"
                          )}
                        >
                          Valid for {incentives.expiryDays} days after
                          submission
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Eligibility warning */}
              {incentives?.enabled && !isEligibleForIncentive() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                >
                  <Card
                    className={cn(
                      "p-5 flex items-start gap-4 border",
                      currentStyle.stylePreset === "gradient"
                        ? "bg-white/10 border-white/20"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30"
                    )}
                    currentStyle={currentStyle}
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-full flex-shrink-0",
                        currentStyle.stylePreset === "gradient"
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      <AlertCircle className="h-5 w-5" />
                    </div>

                    <div className="space-y-2">
                      <p
                        className={cn(
                          "text-base font-medium",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white"
                            : "text-amber-800 dark:text-amber-300"
                        )}
                      >
                        Your testimonial doesn't qualify for rewards yet
                      </p>

                      <ul
                        className={cn(
                          "text-sm list-disc list-inside space-y-1",
                          currentStyle.stylePreset === "gradient"
                            ? "text-white/80"
                            : "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {incentives.minimumQualification &&
                          rating <
                            (incentives.minimumQualification.minimumRating ||
                              0) && (
                            <li>
                              Rating must be at least{" "}
                              {incentives.minimumQualification.minimumRating}{" "}
                              stars
                            </li>
                          )}

                        {(selectedFormat === "text" || !selectedFormat) &&
                          incentives.minimumQualification &&
                          testimonialText.length <
                            (incentives.minimumQualification.minimumLength ||
                              0) && (
                            <li>
                              Text must be at least{" "}
                              {incentives.minimumQualification.minimumLength}{" "}
                              characters
                            </li>
                          )}

                        {incentives.minimumQualification &&
                          selectedFormat &&
                          !incentives.minimumQualification.testimonialType?.includes(
                            selectedFormat
                          ) && (
                            <li>
                              Incentives only apply to{" "}
                              {incentives.minimumQualification.testimonialType?.join(
                                ", "
                              )}{" "}
                              testimonials
                            </li>
                          )}
                      </ul>
                    </div>
                  </Card>
                </motion.div>
              )}

              <motion.div
                className="flex justify-between pt-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              >
                <Button
                  onClick={goBack}
                  variant="secondary"
                  currentStyle={currentStyle}
                >
                  Edit
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  variant="primary"
                  icon={<Send className="h-4 w-4" />}
                  currentStyle={currentStyle}
                >
                  Submit Testimonial
                </Button>
              </motion.div>
            </div>
          );

        case "complete":
          return (
            <div className="p-8 space-y-6 text-center">
              <motion.div
                className="py-8 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    times: [0, 0.6, 1],
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-8",
                    currentStyle.stylePreset === "gradient"
                      ? "bg-white/20"
                      : "bg-primary/10"
                  )}
                  style={
                    currentStyle.stylePreset !== "gradient"
                      ? { backgroundColor: `${currentStyle.primaryColor}15` }
                      : {}
                  }
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle
                      className="h-12 w-12"
                      style={{
                        color:
                          currentStyle.stylePreset === "gradient"
                            ? "white"
                            : currentStyle.primaryColor,
                      }}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-4"
                >
                  <h2
                    className={cn(
                      "text-2xl font-bold mb-3",
                      currentStyle.textColor
                    )}
                  >
                    {customization?.thankYouMessage ||
                      "Thank you for your feedback!"}
                  </h2>

                  <p
                    className={cn(
                      "text-base max-w-xs mx-auto",
                      currentStyle.mutedTextColor
                    )}
                  >
                    We appreciate you taking the time to share your experience
                    with us.
                  </p>
                </motion.div>

                {/* Show incentive details if enabled and eligible */}
                {incentives?.enabled &&
                  incentives?.code &&
                  isEligibleForIncentive() && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="mt-10 pt-8 border-t w-full"
                    >
                      <div className="space-y-5">
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            currentStyle.textColor
                          )}
                        >
                          Your reward is ready!
                        </p>

                        <Card
                          className={cn("p-6 flex flex-col items-center")}
                          currentStyle={currentStyle}
                          elevated
                        >
                          <span
                            className={cn(
                              "text-sm mb-2",
                              currentStyle.mutedTextColor
                            )}
                          >
                            {incentives.type === "discount"
                              ? "Discount code"
                              : "Reward code"}
                          </span>

                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={cn(
                              "font-mono text-xl font-bold tracking-widest py-2 px-6 rounded-lg my-3 cursor-pointer",
                              currentStyle.stylePreset === "gradient"
                                ? "bg-white/20 text-white border border-white/30"
                                : "bg-primary/10 text-primary border border-primary/20"
                            )}
                            style={
                              currentStyle.stylePreset !== "gradient"
                                ? {
                                    backgroundColor: `${currentStyle.primaryColor}15`,
                                    borderColor: `${currentStyle.primaryColor}20`,
                                    color: currentStyle.primaryColor,
                                  }
                                : {}
                            }
                            onClick={() => {
                              navigator.clipboard.writeText(
                                incentives.code || ""
                              );
                              // Could add toast notification for copy feedback
                            }}
                          >
                            {incentives.code}
                          </motion.div>

                          {incentives.expiryDays && (
                            <div
                              className={cn(
                                "mt-2 px-3 py-1.5 text-sm rounded-full",
                                currentStyle.stylePreset === "gradient"
                                  ? "bg-white/20 text-white"
                                  : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              )}
                            >
                              Valid for {incentives.expiryDays} days
                            </div>
                          )}
                        </Card>
                      </div>
                    </motion.div>
                  )}
              </motion.div>

              <motion.div
                className="pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.8 } }}
              >
                <Button
                  onClick={resetWidget}
                  variant={
                    currentStyle.stylePreset === "gradient"
                      ? "outline"
                      : "secondary"
                  }
                  className="px-8 py-2.5"
                  currentStyle={currentStyle}
                >
                  Close
                </Button>
              </motion.div>
            </div>
          );

        default:
          return null;
      }
    };

    // Progress indicator with improved animation

    // If conditions aren't met and not in preview, don't show anything
    if (!previewMode && !displayConditionMet && step !== "closed") {
      return null;
    }

    // Main widget renderer with popup positioning
    return (
      <div
        className={cn("relative z-[9999] ", previewMode ? "max-h-full" : "")}
      >
        <AnimatePresence>
          {(step === "closed" || step === "opening") && renderWidgetButton()}

          {step !== "closed" && step !== "opening" && (
            <>
              <motion.div
                ref={widgetRef}
                className={cn(
                  "z-[9999] fixed",
                  // previewMode ? "static m-auto" : "",

                  currentStyle.widgetClasses,
                  getPositionStyles(),
                  getWidgetSizeClass(),
                  "overflow-hidden",
                  currentStyle.boxShadow
                )}
                style={getPopupStyle()}
                variants={widgetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Widget Header */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 border-b",
                    currentStyle.borderColor
                  )}
                >
                  <div className="flex items-center gap-2">
                    {customization?.companyName && (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          currentStyle.textColor
                        )}
                      >
                        {customization.companyName}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      currentStyle.stylePreset === "gradient"
                        ? "hover:bg-white/10 active:bg-white/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                    )}
                    onClick={resetWidget}
                    aria-label="Close widget"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress indicator */}
                <ProgressIndicator currentStyle={currentStyle} step={step} />

                {/* Widget Content */}
                {renderWidgetContent()}

                {/* Widget Footer */}

                <div
                  className={cn(
                    "px-4 py-3 text-center border-t",
                    currentStyle.borderColor
                  )}
                >
                  <p
                    className={cn(
                      "text-xs",
                      currentStyle.stylePreset === "gradient"
                        ? "text-white/60"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Powered by Cenphi
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export default TestimonialWidget;
