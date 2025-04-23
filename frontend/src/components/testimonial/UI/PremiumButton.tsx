// components/UI/PremiumButton.tsx

import React, {
  ButtonHTMLAttributes,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  HTMLMotionProps,
} from "framer-motion";

export interface PremiumButtonProps
  extends ButtonHTMLAttributes<HTMLMotionProps<"button">> {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "gradient"
    | "glass"
    | "outline"
    | "ghost"
    | "link"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  withRipple?: boolean;
  withShine?: boolean;
  withHoverScale?: boolean;
  withPressEffect?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  trailingIcon?: React.ReactNode;
  isLoading?: boolean;
  isFullWidth?: boolean;
  notification?: number | null;
  isDarkMode?: boolean;
  noBorder?: boolean;
  glowOnHover?: boolean;
  tooltip?: string;
  customClass?: string;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  rounded = "md",
  withRipple = true,
  withShine = false,
  withHoverScale = true,
  withPressEffect = true,
  icon,
  iconPosition = "left",
  trailingIcon,
  isLoading = false,
  isFullWidth = false,
  notification = null,
  isDarkMode = false,
  noBorder = false,
  glowOnHover = false,
  tooltip,
  customClass = "",
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) => {
  const [isRippling, setIsRippling] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Motion values for hover effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hoverScale = withHoverScale ? 1.02 : 1;
  const pressScale = withPressEffect ? 0.97 : 1;

  // Spring animation for smoother transitions
  const scaleSpring = useSpring(1, {
    damping: 25,
    stiffness: 300,
  });

  // Mouse position for shine effect
  const shineX = useTransform(mouseX, [0, 100], ["0%", "100%"]);
  const shineY = useTransform(mouseY, [0, 100], ["0%", "100%"]);

  // Handle ripple effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!withRipple || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipplePosition({ x, y });
    setIsRippling(true);

    // Remove ripple after animation
    setTimeout(() => {
      setIsRippling(false);
    }, 800);
  };

  // Track mouse position for shine effect
  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mouseX.set(x);
    mouseY.set(y);
  };

  // Update scale spring based on hover and press states
  useEffect(() => {
    if (disabled) {
      scaleSpring.set(1);
      return;
    }

    if (isPressed) {
      scaleSpring.set(pressScale);
    } else if (isHovered) {
      scaleSpring.set(hoverScale);
    } else {
      scaleSpring.set(1);
    }
  }, [isHovered, isPressed, disabled, scaleSpring, hoverScale, pressScale]);

  // Show tooltip after a short delay on hover
  useEffect(() => {
    let timeout: number;

    if (isHovered && tooltip) {
      timeout = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    } else {
      setShowTooltip(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isHovered, tooltip]);

  // Base styles
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-colors duration-300 overflow-hidden focus:outline-none focus:ring-offset-2 focus:ring-2";

  // Rounded corner variations
  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  // Size variations for button
  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-lg",
  };

  // Gap between icon and text based on size
  const gapStyles = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-2.5",
    xl: "gap-3",
  };

  // Icon size variations
  const iconSizeStyles = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  // Variant styles with dark mode support
  const variantStyles = {
    primary: isDarkMode
      ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ring-blue-500/50"
      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ring-blue-500/50",
    secondary: isDarkMode
      ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white ring-purple-500/50"
      : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white ring-purple-500/50",
    accent: isDarkMode
      ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white ring-amber-500/50"
      : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white ring-amber-500/50",
    gradient: isDarkMode
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white ring-blue-500/50"
      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white ring-blue-500/50",
    glass: isDarkMode
      ? "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white ring-white/30"
      : "bg-white/70 backdrop-blur-md border border-slate-200/50 hover:bg-white/90 text-slate-700 ring-slate-200",
    outline: isDarkMode
      ? "bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 active:bg-slate-700 ring-slate-500/50"
      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 ring-slate-200/50",
    ghost: isDarkMode
      ? "bg-transparent hover:bg-slate-800 text-slate-300 active:bg-slate-700 ring-slate-500/50"
      : "bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 ring-slate-200/50",
    link: isDarkMode
      ? "bg-transparent text-blue-400 hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-300 p-0 h-auto ring-0"
      : "bg-transparent text-blue-600 hover:text-blue-500 underline decoration-2 underline-offset-2 hover:decoration-blue-500 p-0 h-auto ring-0",
    danger: isDarkMode
      ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white ring-red-500/50"
      : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white ring-red-500/50",
    success: isDarkMode
      ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white ring-emerald-500/50"
      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white ring-emerald-500/50",
  };

  // Disabled styles
  const disabledStyles = disabled
    ? isDarkMode
      ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-300 border-slate-600 pointer-events-none"
      : "opacity-50 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-200 pointer-events-none"
    : "";

  // Width styles
  const widthStyles = isFullWidth ? "w-full" : "";

  // Border styles
  const borderStyles = noBorder ? "border-none" : "";

  // Glow effect on hover
  const glowStyles =
    glowOnHover && !disabled
      ? isDarkMode
        ? "hover:shadow-lg hover:shadow-blue-500/20"
        : "hover:shadow-lg hover:shadow-blue-500/20"
      : "";

  // Construct the final className
  const buttonClasses = `
    ${baseStyles}
    ${roundedStyles[rounded]} 
    ${sizeStyles[size]} 
    ${gapStyles[size]}
    ${variantStyles[variant]} 
    ${disabledStyles}
    ${widthStyles}
    ${borderStyles}
    ${glowStyles}
    ${customClass}
  `;

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      className={buttonClasses}
      style={{ scale: scaleSpring }}
      disabled={disabled || isLoading}
      onClick={(e) => {
        handleRipple(e);
        //@ts-expect-error the incompatibility is immaterial
        if (onClick) onClick(e);
      }}
      //@ts-expect-error the incompatibility is immaterial
      onMouseEnter={() => setIsHovered(true)}
      //@ts-expect-error the incompatibility is immaterial
      onMouseLeave={() => setIsHovered(false)}
      //@ts-expect-error the incompatibility is immaterial
      onMouseDown={() => setIsPressed(true)}
      //@ts-expect-error the incompatibility is immaterial
      onMouseUp={() => setIsPressed(false)}
      //@ts-expect-error the incompatibility is immaterial
      onMouseMove={withShine ? handleMouseMove : undefined}
      {...rest}
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit z-10">
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
        </div>
      )}

      {/* Button content */}
      <span
        className={`flex items-center justify-center relative z-2 ${isLoading ? "invisible" : ""}`}
      >
        {icon && iconPosition === "left" && (
          <span className={`${iconSizeStyles[size]} flex-shrink-0`}>
            {icon}
          </span>
        )}

        <span>{children}</span>

        {(icon && iconPosition === "right") || trailingIcon ? (
          <span className={`${iconSizeStyles[size]} flex-shrink-0`}>
            {iconPosition === "right" ? icon : trailingIcon}
          </span>
        ) : null}

        {/* Notification badge */}
        {notification !== null && notification > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] px-1">
            {notification > 99 ? "99+" : notification}
          </span>
        )}
      </span>

      {/* Shine effect */}
      {withShine && isHovered && !disabled && variant !== "link" && (
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
            maskImage: "radial-gradient(white, black)",
          }}
        >
          <motion.div
            className="absolute w-20 h-20 bg-white/20 blur-md rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              left: shineX,
              top: shineY,
              opacity: variant === "glass" ? 0.25 : 0.15,
            }}
          />
        </motion.div>
      )}

      {/* Ripple effect */}
      {isRippling && !disabled && (
        <span
          className="absolute bg-white/20 rounded-full animate-ripple"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            transformOrigin: "center",
          }}
        />
      )}

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded bg-slate-800 text-white whitespace-nowrap shadow-lg z-50 ${
              isDarkMode ? "bg-slate-700" : "bg-slate-800"
            }`}
          >
            {tooltip}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-800" />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Global styles for the component */}
      <style>{`
        @keyframes ripple {
          from {
            width: 0px;
            height: 0px;
            opacity: 0.5;
          }
          to {
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 800ms ease-out;
        }
      `}</style>
    </motion.button>
  );
};

export default PremiumButton;
