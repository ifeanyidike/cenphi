// src/components/capture-widget/ui/Button.tsx
import React, { ButtonHTMLAttributes } from "react";
import Icon from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  leftIcon?: keyof typeof import("../constants").Icons;
  rightIcon?: keyof typeof import("../constants").Icons;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      className={`tw-btn ${variant} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="tw-spinner" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} width={20} height={20} />}
          <span>{children}</span>
          {rightIcon && <Icon name={rightIcon} width={20} height={20} />}
        </>
      )}
    </button>
  );
};

export default Button;
