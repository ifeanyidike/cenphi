import React, { useEffect, useState } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import { TestimonialStep } from "../types";

// Browser compatibility check component
const BrowserCompatibilityCheck: React.FC = () => {
  const { dispatch } = useTestimonial();
  const [incompatibility, setIncompatibility] = useState<string | null>(null);

  useEffect(() => {
    // Check browser compatibility
    const checkBrowserCompatibility = () => {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIncompatibility(
          "Your browser doesn't support media recording (getUserMedia). Please use a modern browser like Chrome, Firefox, or Safari."
        );
        return false;
      }

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        setIncompatibility(
          "Your browser doesn't support MediaRecorder. Please use a modern browser like Chrome, Firefox, or Safari."
        );
        return false;
      }

      // Test for secure context (mediaDevices only works in secure contexts)
      if (!window.isSecureContext) {
        setIncompatibility(
          "Media recording requires a secure connection (HTTPS). Please access this page via HTTPS."
        );
        return false;
      }

      return true;
    };

    const isCompatible = checkBrowserCompatibility();

    if (!isCompatible) {
      // We'll show the incompatibility message in the UI
      console.error("Browser compatibility issue:", incompatibility);
    }
  }, [dispatch]);

  if (incompatibility) {
    return (
      <div className="tw-browser-incompatibility">
        <div className="tw-icon-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Browser Compatibility Issue</h3>
        <p>{incompatibility}</p>
        <Button
          variant="secondary"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: TestimonialStep.Method })
          }
        >
          Go Back
        </Button>
      </div>
    );
  }

  return null;
};

export default BrowserCompatibilityCheck;
