// src/components/capture-widget/TestimonialButton.tsx
import React from "react";
import { useTestimonial } from "./contexts/TestimonialContext";
import Icon from "./ui/Icon";
import { useThemeVariables } from "./hooks/useThemeVariables";

const TestimonialButton: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { config } = state;
  const { getBrandBackground } = useThemeVariables();

  const handleClick = () => {
    dispatch({ type: "OPEN_MODAL" });
  };

  // Determine button class based on brand mode
  const buttonClass = `tw-widget tw-button ${config.position} ${config.brandMode === "minimal" ? "minimal" : ""}`;

  // Get background styles based on brand mode
  const buttonStyles = getBrandBackground();

  return (
    <button className={buttonClass} onClick={handleClick} style={buttonStyles}>
      <span className="tw-button-icon">
        <Icon name="messageSquare" width={24} height={24} />
      </span>
      <span>{config.buttonText}</span>
    </button>
  );
};

export default TestimonialButton;
