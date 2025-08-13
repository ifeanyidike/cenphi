// src/components/capture-widget/ui/Icon.tsx
import React from "react";
import { Icons } from "../constants";

interface IconProps {
  name: keyof typeof Icons;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  width = 24,
  height = 24,
  className = "",
  color,
}) => {
  // Get the icon SVG string
  const iconSvg = Icons[name] || "";

  // Create a wrapper for the SVG with proper styling
  return (
    <span
      className={`tw-icon ${className}`}
      style={{
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
      dangerouslySetInnerHTML={{
        __html: iconSvg
          // Ensure stroke color inherits from parent
          .replace(/stroke="currentColor"/g, 'stroke="currentColor"')
          // Ensure fill is none to allow color inheritance
          .replace(/fill="none"/g, 'fill="none"'),
      }}
    />
  );
};

export default Icon;
