// UI/Tooltip.tsx
import React, { useState, useRef } from "react";

interface TooltipProps {
  children: React.ReactNode;
  title: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  title,
  placement = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const getPositionClasses = () => {
    switch (placement) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 mb-1";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 translate-y-1 mt-1";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 -translate-x-1 mr-1";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 translate-x-1 ml-1";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 mb-1";
    }
  };

  const getArrowClasses = () => {
    switch (placement) {
      case "top":
        return "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-black border-l-transparent border-r-transparent";
      case "bottom":
        return "top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-black border-l-transparent border-r-transparent";
      case "left":
        return "right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-l-black border-t-transparent border-b-transparent";
      case "right":
        return "left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-r-black border-t-transparent border-b-transparent";
      default:
        return "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-black border-l-transparent border-r-transparent";
    }
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      ref={targetRef}
    >
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 whitespace-nowrap px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-80 rounded pointer-events-none ${getPositionClasses()}`}
        >
          {title}
          <div
            className={`absolute w-0 h-0 border-4 border-solid ${getArrowClasses()}`}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
};
