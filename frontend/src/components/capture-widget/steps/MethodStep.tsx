// src/components/capture-widget/steps/MethodStep.tsx
import React from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { TestimonialStep, MediaType } from "../types";
import { generateQRCode } from "../utils/formatting";
import { useThemeVariables } from "../hooks/useThemeVariables";

const MethodStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { config } = state;
  const { getBrandBackground } = useThemeVariables();

  // Generate QR code for continuing on mobile
  const continueUrl = `${config.apiBaseUrl}/continue-testimonial?campaign=${config.campaignId}`;
  const qrCodeUrl = generateQRCode(continueUrl);

  const handleMethodSelect = (mediaType: MediaType) => {
    dispatch({ type: "SET_MEDIA_TYPE", payload: mediaType });

    if (mediaType === "text") {
      dispatch({ type: "SET_STEP", payload: TestimonialStep.Text });
    } else {
      dispatch({ type: "SET_STEP", payload: TestimonialStep.MediaOption });
    }
  };

  // Get method icon style based on brand mode
  const methodIconClass = `tw-method-icon ${config.brandMode === "minimal" ? "minimal" : ""}`;

  return (
    <div className="tw-step">
      <h3
        className="tw-label"
        style={{ fontSize: "19px", marginBottom: "20px", fontWeight: 600 }}
      >
        How would you like to share your experience?
      </h3>

      <div className="tw-methods">
        <div className="tw-method" onClick={() => handleMethodSelect("video")}>
          <div className={methodIconClass} style={getBrandBackground()}>
            <Icon name="camera" />
          </div>
          <div className="tw-method-title">Video</div>
          <div className="tw-method-desc">
            Record or upload a video testimonial
          </div>
        </div>

        {/* Audio method removed */}

        <div className="tw-method" onClick={() => handleMethodSelect("text")}>
          <div className={methodIconClass} style={getBrandBackground()}>
            <Icon name="text" />
          </div>
          <div className="tw-method-title">Text</div>
          <div className="tw-method-desc">Write a text testimonial</div>
        </div>
      </div>

      <div className="tw-qr-container">
        <div className="tw-qr-title">
          <Icon name="smartphone" width={20} height={20} />
          <span>Continue on Mobile</span>
        </div>
        <div className="tw-qr-code">
          <img src={qrCodeUrl} alt="QR Code" width="160" height="160" />
        </div>
        <div className="tw-qr-desc">
          Scan this QR code with your phone's camera to continue this process on
          your mobile device.
        </div>
      </div>

      <div className="tw-footer">
        <Button
          variant="secondary"
          leftIcon="chevronLeft"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: TestimonialStep.Info })
          }
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default MethodStep;
