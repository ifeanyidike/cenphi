import { cn } from "@/lib/utils";
import { StyleConfig, WidgetStep } from "./shared";
import { Dispatch, SetStateAction } from "react";
import { motion, Variants } from "framer-motion";

// Widget state types

export const InputField = ({
  id,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  required = false,
  description,
  error,
  currentStyle,
}: {
  id: string;
  type?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  description?: string;
  error?: string;
  currentStyle: StyleConfig;
}) => (
  <div className="space-y-2">
    <label
      className={cn(
        "text-sm flex items-center gap-1 font-medium",
        currentStyle.mutedTextColor
      )}
      htmlFor={id}
    >
      {label} {required && <span className="text-red-500">*</span>}
      {description && (
        <span className={cn("text-xs", currentStyle.mutedTextColor)}>
          ({description})
        </span>
      )}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full px-4 py-3 transition-all",
          error
            ? "ring-2 ring-red-500 border-red-300"
            : currentStyle.inputClasses,
          currentStyle.inputBackgroundColor,
          currentStyle.inputRadius,
          currentStyle.stylePreset === "glassmorphism"
            ? "backdrop-blur-sm"
            : "",
          currentStyle.stylePreset === "gradient"
            ? "bg-white/10 border-white/20 placeholder-white/50 text-white"
            : "",
          "focus:ring-2 focus:ring-primary/20 focus:outline-none"
        )}
        style={{
          boxShadow:
            currentStyle.stylePreset === "neumorphic"
              ? "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.5)"
              : undefined,
        }}
        required={required}
        aria-invalid={!!error}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1 ml-1 absolute -bottom-5">
          {error}
        </p>
      )}
    </div>
  </div>
);

// Custom textarea with character count and enhanced styling
export const TextareaWithCounter = ({
  value,
  onChange,
  placeholder,
  minLength = 0,
  rows = 5,
  currentStyle,
  isTyping,
  setIsTyping,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  minLength?: number;
  rows?: number;
  currentStyle: StyleConfig;
  isTyping: boolean;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
}) => (
  <div className="space-y-1">
    <div className="relative">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e);
          setIsTyping(true);
          clearTimeout((window as any).typingTimeout);
          (window as any).typingTimeout = setTimeout(
            () => setIsTyping(false),
            1000
          );
        }}
        rows={rows}
        className={cn(
          "w-full px-4 py-3 resize-none transition-all",
          currentStyle.inputClasses,
          currentStyle.inputBackgroundColor,
          currentStyle.inputRadius,
          currentStyle.stylePreset === "glassmorphism"
            ? "backdrop-blur-sm"
            : "",
          currentStyle.stylePreset === "gradient"
            ? "bg-white/10 border-white/20 placeholder-white/50 text-white"
            : "",
          "focus:ring-2 focus:ring-primary/20 focus:outline-none"
        )}
        style={{
          boxShadow:
            currentStyle.stylePreset === "neumorphic"
              ? "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.5)"
              : undefined,
        }}
      />

      {/* Typing indicator */}
      {isTyping && (
        <div
          className={cn(
            "absolute bottom-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            currentStyle.stylePreset === "gradient"
              ? "bg-white/20"
              : "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <div className="flex space-x-1">
            <div
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{
                animationDelay: "0ms",
                backgroundColor: currentStyle.primaryColor,
              }}
            ></div>
            <div
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{
                animationDelay: "150ms",
                backgroundColor: currentStyle.primaryColor,
              }}
            ></div>
            <div
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{
                animationDelay: "300ms",
                backgroundColor: currentStyle.primaryColor,
              }}
            ></div>
          </div>
          <span>typing</span>
        </div>
      )}
    </div>

    <div className="flex justify-between items-center mt-2">
      {minLength > 0 && (
        <div
          className={cn(
            "text-xs",
            value.length < minLength
              ? "text-amber-500"
              : currentStyle.mutedTextColor
          )}
        >
          {value.length < minLength
            ? `${minLength - value.length} more characters needed`
            : "Minimum length met"}
        </div>
      )}

      <div
        className={cn(
          "text-xs px-2 py-0.5 rounded-full transition-all",
          value.length < minLength
            ? currentStyle.stylePreset === "gradient"
              ? "bg-white/20"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
            : currentStyle.stylePreset === "gradient"
              ? "bg-white/20"
              : "bg-gray-100 dark:bg-gray-800"
        )}
      >
        {value.length} / {minLength > 0 ? minLength : "recommended 100"}{" "}
        characters
      </div>
    </div>
  </div>
);

// Enhanced modern button with animations
export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  icon,
  size = "md",
  currentStyle,
  isLoading = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "text";
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  currentStyle: StyleConfig;
  isLoading?: boolean;
}) => {
  // Button sizes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  // Button variants
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return cn(
          "text-white",
          currentStyle.stylePreset === "gradient"
            ? "bg-white/20 hover:bg-white/30 active:bg-white/40"
            : "hover:opacity-90 active:opacity-100"
        );
      case "secondary":
        return cn(
          currentStyle.stylePreset === "gradient"
            ? "bg-white/10 hover:bg-white/20 text-white active:bg-white/30"
            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-600"
        );
      case "outline":
        return cn(
          "bg-transparent border",
          currentStyle.stylePreset === "gradient"
            ? "border-white/30 text-white hover:bg-white/10 active:bg-white/20"
            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-800"
        );
      case "ghost":
        return cn(
          "bg-transparent",
          currentStyle.stylePreset === "gradient"
            ? "text-white hover:bg-white/10 active:bg-white/20"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
        );
      case "text":
        return cn(
          "bg-transparent px-2",
          currentStyle.stylePreset === "gradient"
            ? "text-white hover:underline"
            : "text-primary hover:underline"
        );
      default:
        return "";
    }
  };

  const buttonStyle =
    variant === "primary" && currentStyle.stylePreset !== "gradient"
      ? {
          backgroundColor: disabled ? "#9CA3AF" : currentStyle.primaryColor,
        }
      : {};

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative flex items-center justify-center gap-2 font-medium transition-all",
        sizeClasses[size],
        getVariantClasses(),
        currentStyle.buttonClasses,
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={buttonStyle}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-full">
          <div
            className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor:
                variant === "primary"
                  ? "rgba(255,255,255,0.5)"
                  : currentStyle.primaryColor,
              borderTopColor: "transparent",
            }}
          ></div>
        </div>
      )}
      <div
        className={cn("flex items-center gap-2", isLoading ? "opacity-0" : "")}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    </motion.button>
  );
};

// Custom Card component for consistent styling
export const Card = ({
  children,
  currentStyle,
  className = "",
  elevated = false,
}: {
  children: React.ReactNode;
  currentStyle: StyleConfig;
  className?: string;
  elevated?: boolean;
}) => (
  <div
    className={cn(
      currentStyle.cardRadius,
      elevated ? currentStyle.elevatedSurfaceColor : currentStyle.surfaceColor,
      "overflow-hidden transition-all duration-200",
      elevated && "shadow-md",
      className
    )}
  >
    {children}
  </div>
);

// Divider component
export const Divider = ({
  currentStyle,
  className = "",
}: {
  currentStyle: StyleConfig;
  className?: string;
}) => (
  <div
    className={cn("w-full h-px my-4", currentStyle.borderColor, className)}
  ></div>
);

export const ProgressIndicator = ({
  step,
  currentStyle,
}: {
  step: WidgetStep;
  currentStyle: StyleConfig;
}) => {
  // Don't show for closed state
  if (step === "closed" || step === "opening") return null;

  const steps: WidgetStep[] = [
    "open",
    "forms",
    "recording",
    "review",
    "complete",
  ];
  const currentIndex = steps.indexOf(step);

  // Only render for valid steps
  if (currentIndex === -1) return null;

  return (
    <div className="w-full flex justify-center pt-1 pb-3">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            className={cn(
              "h-2 rounded-full transition-all",
              i <= currentIndex
                ? currentStyle.stylePreset === "gradient"
                  ? "bg-white"
                  : "bg-primary"
                : currentStyle.stylePreset === "gradient"
                  ? "bg-white/20"
                  : "bg-gray-200 dark:bg-gray-700"
            )}
            style={{
              width: i === currentIndex ? "28px" : "10px",
              backgroundColor:
                i <= currentIndex && currentStyle.stylePreset !== "gradient"
                  ? currentStyle.primaryColor
                  : undefined,
            }}
            initial={{ width: i === currentIndex ? "10px" : "10px" }}
            animate={{ width: i === currentIndex ? "28px" : "10px" }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
};

// Animation variants
export const widgetVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: -20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

export const slideUpVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: (custom) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  }),
  exit: {
    y: -10,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  tap: { scale: 0.95 },
  hover: {
    scale: 1.05,
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
};
