// components/UI/Badge.tsx

import React from "react";
import { motion } from "framer-motion";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "solid" | "soft" | "outline" | "dot";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "info";
  size?: "xs" | "sm" | "md" | "lg";
  shape?: "rounded" | "pill";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isAnimated?: boolean;
  isPulsing?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "soft",
  color = "default",
  size = "sm",
  shape = "rounded",
  icon,
  iconPosition = "left",
  isAnimated = false,
  isPulsing = false,
  className = "",
  onClick,
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium whitespace-nowrap";

  // Size variations
  const sizeStyles = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-sm",
  };

  // Icon size variations
  const iconSizeStyles = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Shape variations
  const shapeStyles = {
    rounded: "rounded",
    pill: "rounded-full",
  };

  // Variant & color combinations
  const variantColorStyles = {
    solid: {
      default: "bg-slate-600 text-white",
      primary: "bg-blue-600 text-white",
      secondary: "bg-purple-600 text-white",
      accent: "bg-amber-600 text-white",
      success: "bg-emerald-600 text-white",
      warning: "bg-yellow-600 text-white",
      danger: "bg-red-600 text-white",
      info: "bg-sky-600 text-white",
    },
    soft: {
      default: "bg-slate-100 text-slate-800",
      primary: "bg-blue-100 text-blue-800",
      secondary: "bg-purple-100 text-purple-800",
      accent: "bg-amber-100 text-amber-800",
      success: "bg-emerald-100 text-emerald-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-sky-100 text-sky-800",
    },
    outline: {
      default: "bg-transparent border border-slate-300 text-slate-700",
      primary: "bg-transparent border border-blue-300 text-blue-700",
      secondary: "bg-transparent border border-purple-300 text-purple-700",
      accent: "bg-transparent border border-amber-300 text-amber-700",
      success: "bg-transparent border border-emerald-300 text-emerald-700",
      warning: "bg-transparent border border-yellow-300 text-yellow-700",
      danger: "bg-transparent border border-red-300 text-red-700",
      info: "bg-transparent border border-sky-300 text-sky-700",
    },
    dot: {
      default: "pl-2 flex items-center gap-1.5 text-slate-700",
      primary: "pl-2 flex items-center gap-1.5 text-blue-700",
      secondary: "pl-2 flex items-center gap-1.5 text-purple-700",
      accent: "pl-2 flex items-center gap-1.5 text-amber-700",
      success: "pl-2 flex items-center gap-1.5 text-emerald-700",
      warning: "pl-2 flex items-center gap-1.5 text-yellow-700",
      danger: "pl-2 flex items-center gap-1.5 text-red-700",
      info: "pl-2 flex items-center gap-1.5 text-sky-700",
    },
  };

  // Dot colors for the dot variant
  const dotColors = {
    default: "bg-slate-500",
    primary: "bg-blue-500",
    secondary: "bg-purple-500",
    accent: "bg-amber-500",
    success: "bg-emerald-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-sky-500",
  };

  // Animation styles for pulsing effect
  const pulsingAnimation = isPulsing ? "animate-pulse" : "";

  // Combine all styles
  const badgeStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${shapeStyles[shape]}
    ${variantColorStyles[variant][color]}
    ${pulsingAnimation}
    ${className}
    ${onClick ? "cursor-pointer hover:opacity-90 active:opacity-100" : ""}
  `;

  // Animation variants
  const animationVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  };

  const renderContent = () => (
    <>
      {variant === "dot" && (
        <span
          className={`${dotColors[color]} h-2 w-2 rounded-full ${isPulsing ? "animate-pulse" : ""}`}
        />
      )}

      {icon && iconPosition === "left" && (
        <span className={`${iconSizeStyles[size]} mr-1`}>{icon}</span>
      )}

      <span>{children}</span>

      {icon && iconPosition === "right" && (
        <span className={`${iconSizeStyles[size]} ml-1`}>{icon}</span>
      )}
    </>
  );

  // Return animated or non-animated badge
  return isAnimated ? (
    <motion.span
      className={badgeStyles}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={animationVariants}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {renderContent()}
    </motion.span>
  ) : (
    <span className={badgeStyles} onClick={onClick}>
      {renderContent()}
    </span>
  );
};

export default Badge;
