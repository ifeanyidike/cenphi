// src/components/capture-widget/TestimonialModal.tsx
import React, { useEffect } from "react";
import { useTestimonial } from "./contexts/TestimonialContext";
import { useThemeVariables } from "./hooks/useThemeVariables";
import Icon from "./ui/Icon";
import InfoStep from "./steps/InfoStep";
import MethodStep from "./steps/MethodStep";
import MediaOptionStep from "./steps/MediaOptionStep";
import RecordStep from "./steps/RecordStep";
import TextStep from "./steps/TextStep";
import ReviewStep from "./steps/ReviewStep";
import ThankYouStep from "./steps/ThankYouStep";
import { TestimonialStep } from "./types";

const TestimonialModal: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { currentStep, isModalOpen, config } = state;
  const { getBrandBackground } = useThemeVariables();

  // Handle close when ESC key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleClose = () => {
    dispatch({ type: "CLOSE_MODAL" });

    // Reset state after modal is closed
    setTimeout(() => {
      dispatch({ type: "RESET_STATE" });
    }, 300);
  };

  // Render the current step component
  const renderStepContent = () => {
    switch (currentStep) {
      case TestimonialStep.Info:
        return <InfoStep />;
      case TestimonialStep.Method:
        return <MethodStep />;
      case TestimonialStep.MediaOption:
        return <MediaOptionStep />;
      case TestimonialStep.Record:
        return <RecordStep />;
      case TestimonialStep.Text:
        return <TextStep />;
      case TestimonialStep.Review:
        return <ReviewStep />;
      case TestimonialStep.ThankYou:
        return <ThankYouStep />;
      default:
        return <InfoStep />;
    }
  };

  // Determine header class based on brand mode
  const headerClass = `tw-header ${config.brandMode === "minimal" ? "minimal" : ""}`;

  // Get background styles based on brand mode
  const headerStyles = getBrandBackground();

  const logoInitials = config.companyName.substring(0, 2).toUpperCase();

  return (
    <div
      className={`tw-widget tw-container ${config.position} ${isModalOpen ? "active" : ""}`}
    >
      <div className="tw-modal">
        <div className={headerClass} style={headerStyles}>
          <div className="tw-header-content">
            <div className="tw-logo">
              {config.companyLogo ? (
                <img src={config.companyLogo} alt={config.companyName} />
              ) : (
                logoInitials
              )}
            </div>
            <h2>Share Your Experience</h2>
          </div>
          <button className="tw-close" onClick={handleClose} aria-label="Close">
            <Icon name="close" width={24} height={24} />
          </button>
        </div>

        <div className="tw-content">{renderStepContent()}</div>
      </div>
    </div>
  );
};

export default TestimonialModal;
