// src/components/capture-widget/steps/ThankYouStep.tsx
import React from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { useThemeVariables } from "../hooks/useThemeVariables";

const ThankYouStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { config } = state;
  const { getBrandBackground } = useThemeVariables();

  // Share testimonial with others
  const handleShare = () => {
    try {
      if (navigator.share) {
        navigator
          .share({
            title: "Share your experience",
            text: `I just shared my experience with ${config.companyName}. Share yours too!`,
            url: window.location.href,
          })
          .catch((err) => {
            console.error("Error sharing:", err);
          });
      } else {
        // Fallback for browsers that don't support Web Share API
        alert(
          "Sharing not supported on this browser. Copy this link to share: " +
            window.location.href
        );
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Close the widget
  const handleClose = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  return (
    <div className="tw-step">
      <div className="tw-thankyou">
        <div className="tw-thankyou-icon" style={getBrandBackground()}>
          <Icon name="check" />
        </div>

        <h3 className="tw-thankyou-title">Thank You!</h3>

        <p className="tw-thankyou-message">
          Your testimonial has been submitted successfully. We truly appreciate
          you taking the time to share your experience with us. Your feedback
          helps others learn about our offerings.
        </p>

        <Button
          variant="primary"
          leftIcon="messageSquare"
          onClick={handleShare}
        >
          Share with Friends
        </Button>
      </div>

      <div className="tw-footer">
        <Button variant="primary" onClick={handleClose} fullWidth>
          Close
        </Button>
      </div>
    </div>
  );
};

export default ThankYouStep;
