// components/UI/Button.tsx

import React, { ButtonHTMLAttributes } from "react";
import { HTMLMotionProps, motion } from "framer-motion";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLMotionProps<"button">> {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "ghost"
    | "link"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  isFullWidth?: boolean;
  hasShadow?: boolean;
  shape?: "rounded" | "pill" | "square";
  animation?: "bounce" | "pulse" | "scale" | "none";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  isFullWidth = false,
  hasShadow = false,
  shape = "rounded",
  animation = "scale",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 relative overflow-hidden";

  // Shape variations
  const shapeStyles = {
    rounded: "rounded-md",
    pill: "rounded-full",
    square: "rounded-none",
  };

  // Size variations
  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs gap-1.5",
    sm: "px-3 py-1.5 text-sm gap-2",
    md: "px-4 py-2 text-sm gap-2.5",
    lg: "px-5 py-2.5 text-base gap-3",
    xl: "px-6 py-3 text-lg gap-3.5",
  };

  // Icon size variations
  const iconSizeStyles = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  // Variant styles
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1",
    secondary:
      "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 active:from-purple-800 active:to-fuchsia-800 focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-1",
    accent:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-1",
    outline:
      "border-2 border-slate-300 bg-white bg-opacity-80 backdrop-blur-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1",
    link: "bg-transparent underline underline-offset-4 decoration-2 decoration-blue-500/30 text-blue-600 hover:decoration-blue-500/70 active:text-blue-800 focus:ring-0",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-1",
    success:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1",
  };

  // Animation variants
  const buttonAnimation = {
    bounce: {
      whileTap: { y: [0, -5, 0] },
      transition: { duration: 0.2 },
    },
    pulse: {
      whileTap: { scale: [1, 0.97, 1.03, 1] },
      transition: { duration: 0.3 },
    },
    scale: {
      whileTap: { scale: 0.97 },
      transition: { duration: 0.1 },
    },
    none: {},
  };

  // Shadow styles
  const shadowStyles = hasShadow
    ? variant !== "ghost" && variant !== "link"
      ? "shadow-md hover:shadow-lg active:shadow-sm"
      : ""
    : "";

  // Width styles
  const widthStyles = isFullWidth ? "w-full" : "";

  // Disabled styles
  const disabledStyles =
    disabled || isLoading
      ? "opacity-60 cursor-not-allowed pointer-events-none"
      : "";

  // Construct final className
  const buttonClasses = `
    ${baseStyles}
    ${shapeStyles[shape]} 
    ${sizeStyles[size]} 
    ${variantStyles[variant]} 
    ${shadowStyles}
    ${widthStyles}
    ${disabledStyles}
    ${className}
  `;

  // Get the right animation values based on animation type
  const animationProps = animation !== "none" ? buttonAnimation[animation] : {};

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      //@ts-expect-error the incompatibility is immaterial
      onClick={onClick}
      whileHover={{ translateY: -2 }}
      {...animationProps}
      {...rest}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg
            className={`animate-spin ${iconSizeStyles[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      <span className={`flex items-center ${isLoading ? "invisible" : ""}`}>
        {icon && iconPosition === "left" && (
          <span className={`${iconSizeStyles[size]}`}>{icon}</span>
        )}

        <span>{children}</span>

        {icon && iconPosition === "right" && (
          <span className={`${iconSizeStyles[size]}`}>{icon}</span>
        )}
      </span>

      {variant !== "ghost" && variant !== "link" && variant !== "outline" && (
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.button>
  );
};

export default Button;
