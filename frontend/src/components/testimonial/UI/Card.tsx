// components/UI/Card.tsx

import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: "default" | "bordered" | "elevated" | "glass" | "gradient";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "danger";
  isHoverable?: boolean;
  isCompact?: boolean;
  isInteractive?: boolean;
  isFullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  footer,
  headerAction,
  variant = "default",
  color = "default",
  isHoverable = false,
  isCompact = false,
  isInteractive = false,
  isFullWidth = true,
  onClick,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
}) => {
  // Base styles
  const baseStyles = "overflow-hidden transition-all duration-300";

  // Variant styles
  const variantStyles = {
    default: "bg-white border border-slate-200",
    bordered: "bg-white border-2 border-slate-200",
    elevated: "bg-white border border-slate-100 shadow-lg",
    glass: "bg-white/80 backdrop-blur-lg border border-white/20",
    gradient: "bg-gradient-to-br border border-slate-200",
  };

  // Color styles (applied to different variants)
  const colorStyles = {
    default: {
      default: "",
      bordered: "border-slate-200",
      elevated: "shadow-slate-200/20",
      glass: "bg-white/80 border-white/20",
      gradient: "from-slate-50 to-slate-100",
    },
    primary: {
      default: "bg-blue-50 border-blue-200",
      bordered: "border-blue-300",
      elevated: "shadow-blue-500/10",
      glass: "bg-blue-50/80 border-blue-100/30",
      gradient: "from-blue-50 to-indigo-100",
    },
    secondary: {
      default: "bg-purple-50 border-purple-200",
      bordered: "border-purple-300",
      elevated: "shadow-purple-500/10",
      glass: "bg-purple-50/80 border-purple-100/30",
      gradient: "from-purple-50 to-fuchsia-100",
    },
    accent: {
      default: "bg-amber-50 border-amber-200",
      bordered: "border-amber-300",
      elevated: "shadow-amber-500/10",
      glass: "bg-amber-50/80 border-amber-100/30",
      gradient: "from-amber-50 to-orange-100",
    },
    info: {
      default: "bg-sky-50 border-sky-200",
      bordered: "border-sky-300",
      elevated: "shadow-sky-500/10",
      glass: "bg-sky-50/80 border-sky-100/30",
      gradient: "from-sky-50 to-cyan-100",
    },
    success: {
      default: "bg-emerald-50 border-emerald-200",
      bordered: "border-emerald-300",
      elevated: "shadow-emerald-500/10",
      glass: "bg-emerald-50/80 border-emerald-100/30",
      gradient: "from-emerald-50 to-teal-100",
    },
    warning: {
      default: "bg-yellow-50 border-yellow-200",
      bordered: "border-yellow-300",
      elevated: "shadow-yellow-500/10",
      glass: "bg-yellow-50/80 border-yellow-100/30",
      gradient: "from-yellow-50 to-amber-100",
    },
    danger: {
      default: "bg-red-50 border-red-200",
      bordered: "border-red-300",
      elevated: "shadow-red-500/10",
      glass: "bg-red-50/80 border-red-100/30",
      gradient: "from-red-50 to-rose-100",
    },
  };

  // Hover styles
  const hoverStyles = isHoverable
    ? variant === "elevated"
      ? "hover:shadow-xl hover:-translate-y-1"
      : "hover:shadow-md hover:-translate-y-0.5"
    : "";

  // Interaction styles
  const interactionStyles = isInteractive
    ? "cursor-pointer active:scale-[0.98] active:shadow-inner"
    : "";

  // Width styles
  const widthStyles = isFullWidth ? "w-full" : "";

  // Padding styles
  const paddingStyles = isCompact ? "rounded-lg" : "rounded-xl";

  // Construct header, body, and footer styles
  const headerStyles = `flex items-center justify-between ${
    isCompact ? "px-4 py-3" : "px-6 py-4"
  } ${headerClassName}`;

  const bodyStyles = `${
    isCompact ? "px-4 pb-4 pt-0" : "px-6 pb-6 pt-0"
  } ${bodyClassName}`;

  const footerStyles = `${
    isCompact ? "px-4 py-3" : "px-6 py-4"
  } bg-slate-50 border-t border-slate-200 ${footerClassName}`;

  // Combine all styles
  const cardStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${colorStyles[color][variant]}
    ${paddingStyles}
    ${hoverStyles}
    ${interactionStyles}
    ${widthStyles}
    ${className}
  `;

  return (
    <motion.div
      className={cardStyles}
      onClick={onClick}
      whileHover={
        isHoverable
          ? {
              y: -5,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }
          : {}
      }
      whileTap={isInteractive ? { scale: 0.985 } : {}}
      transition={{ duration: 0.2 }}
    >
      {(title || subtitle || icon || headerAction) && (
        <div className={headerStyles}>
          <div className="flex items-center gap-3">
            {icon && <div className="text-slate-700">{icon}</div>}
            <div>
              {title && (
                <h3 className="font-semibold text-slate-800">{title}</h3>
              )}
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className={bodyStyles}>{children}</div>

      {footer && <div className={footerStyles}>{footer}</div>}
    </motion.div>
  );
};

export default Card;
