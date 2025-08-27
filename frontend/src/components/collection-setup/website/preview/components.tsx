import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Style configuration interface
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

// Button component
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  currentStyle: StyleConfig;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  currentStyle,
  onClick,
  disabled = false,
  isLoading = false,
  className,
}) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    currentStyle.buttonClasses,
    className
  );

  const variantClasses = {
    primary: cn(
      "text-white shadow-sm",
      currentStyle.stylePreset === "gradient"
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        : `bg-[${currentStyle.primaryColor}] hover:bg-[${currentStyle.primaryColor}]/90`
    ),
    secondary: cn(
      currentStyle.stylePreset === "gradient"
        ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
        : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
    ),
    outline: cn(
      "border",
      currentStyle.stylePreset === "gradient"
        ? "border-white/20 text-white hover:bg-white/10"
        : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
    ),
    ghost: cn(
      currentStyle.stylePreset === "gradient"
        ? "text-white hover:bg-white/10"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    ),
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size])}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={
        variant === "primary" && currentStyle.stylePreset !== "gradient"
          ? {
              backgroundColor: currentStyle.primaryColor,
              color: "white",
            }
          : {}
      }
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {!isLoading && icon}
      {children}
    </button>
  );
};

// Card component
interface CardProps {
  children: React.ReactNode;
  currentStyle: StyleConfig;
  className?: string;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  currentStyle,
  className,
  elevated = false,
}) => {
  return (
    <div
      className={cn(
        "border rounded-lg",
        elevated ? currentStyle.elevatedSurfaceColor : currentStyle.surfaceColor,
        currentStyle.borderColor,
        currentStyle.boxShadow,
        className
      )}
    >
      {children}
    </div>
  );
};

// Input component
interface InputProps {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentStyle: StyleConfig;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  currentStyle,
  className,
}) => {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        "w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        currentStyle.inputClasses,
        currentStyle.stylePreset === "gradient"
          ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-white/50"
          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400",
        className
      )}
      style={
        currentStyle.stylePreset !== "gradient"
          ? {
              backgroundColor: currentStyle.inputBackgroundColor,
            }
          : {}
      }
    />
  );
};

// InputField component
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  description?: string;
  currentStyle: StyleConfig;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  description,
  currentStyle,
}) => {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className={cn("text-sm font-medium", currentStyle.textColor)}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {description && (
          <span className={cn("ml-1 text-xs", currentStyle.mutedTextColor)}>
            ({description})
          </span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        currentStyle={currentStyle}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Progress component
interface ProgressProps {
  value: number;
  className?: string;
  currentStyle: StyleConfig;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className,
  currentStyle,
}) => {
  return (
    <div
      className={cn(
        "w-full bg-gray-200 rounded-full h-2 overflow-hidden",
        currentStyle.stylePreset === "gradient" && "bg-white/20",
        className
      )}
    >
      <motion.div
        className="h-full rounded-full transition-all duration-300"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        style={{
          backgroundColor:
            currentStyle.stylePreset === "gradient"
              ? "white"
              : currentStyle.primaryColor,
        }}
      />
    </div>
  );
};

// ProgressIndicator component
interface ProgressIndicatorProps {
  currentStyle: StyleConfig;
  step: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStyle,
  step,
}) => {
  const steps = ["open", "forms", "recording", "review", "complete"];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="px-4 py-2">
      <Progress value={progress} currentStyle={currentStyle} />
    </div>
  );
};

// TextareaWithCounter component
interface TextareaWithCounterProps {
  currentStyle: StyleConfig;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  minLength?: number;
  rows?: number;
}

export const TextareaWithCounter: React.FC<TextareaWithCounterProps> = ({
  currentStyle,
  isTyping,
  setIsTyping,
  value,
  onChange,
  placeholder,
  minLength = 0,
  rows = 4,
}) => {
  return (
    <div className="space-y-2">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e);
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1000);
        }}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 border rounded-md resize-none transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
          currentStyle.inputClasses,
          currentStyle.stylePreset === "gradient"
            ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-white/50"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400",
          isTyping && "ring-2 ring-blue-500"
        )}
        style={
          currentStyle.stylePreset !== "gradient"
            ? {
                backgroundColor: currentStyle.inputBackgroundColor,
              }
            : {}
        }
      />
      {minLength > 0 && (
        <div
          className={cn(
            "text-xs text-right",
            value.length >= minLength
              ? "text-green-600"
              : currentStyle.mutedTextColor
          )}
        >
          {value.length}/{minLength} characters
        </div>
      )}
    </div>
  );
};

// Animation variants
export const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export const widgetVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};
