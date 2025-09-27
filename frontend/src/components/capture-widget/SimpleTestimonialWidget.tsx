// SimpleTestimonialWidget.tsx - Simplified main widget component
import React, { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import SimpleCaptureModal from "./SimpleCaptureModal";
import { TestimonialWidgetConfig } from "./types";

interface SimpleTestimonialWidgetProps {
  config: Partial<TestimonialWidgetConfig>;
}

const SimpleTestimonialWidget: React.FC<SimpleTestimonialWidgetProps> = ({
  config,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Configuration with defaults
  const widgetConfig = {
    primaryColor: "#4F46E5",
    secondaryColor: "#8B5CF6",
    buttonText: "Share Your Story",
    position: "bottom-right" as const,
    darkMode: false,
    brandMode: "gradient" as const,
    dialogScale: 1,
    roundedCorners: "rounded" as const,
    ...config,
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user preference
    localStorage.setItem(
      `testimonial-widget-dismissed-${config.campaignId}`,
      "true"
    );
  };

  // Check if widget was previously dismissed
  useEffect(() => {
    if (config.campaignId) {
      const wasDismissed = localStorage.getItem(
        `testimonial-widget-dismissed-${config.campaignId}`
      );
      if (wasDismissed === "true") {
        setIsVisible(false);
      }
    }
  }, [config.campaignId]);

  if (!isVisible) return null;

  return (
    <div className="tw-widget">
      {/* Widget Button */}
      <button
        onClick={handleOpenModal}
        className={`tw-button ${widgetConfig.position} ${widgetConfig.brandMode === "minimal" ? "minimal" : ""}`}
        style={{
          background:
            widgetConfig.brandMode === "gradient"
              ? `linear-gradient(135deg, ${widgetConfig.primaryColor}, ${widgetConfig.secondaryColor})`
              : widgetConfig.brandMode === "solid"
                ? widgetConfig.primaryColor
                : widgetConfig.darkMode
                  ? "#1F2937"
                  : "#FFFFFF",
          color:
            widgetConfig.brandMode === "minimal"
              ? widgetConfig.darkMode
                ? "#FFFFFF"
                : "#1F2937"
              : "#FFFFFF",
          border:
            widgetConfig.brandMode === "minimal"
              ? `2px solid ${widgetConfig.primaryColor}`
              : "none",
          transform: `scale(${widgetConfig.dialogScale})`,
          borderRadius:
            widgetConfig.roundedCorners === "pill"
              ? "9999px"
              : widgetConfig.roundedCorners === "sharp"
                ? "4px"
                : "16px",
        }}
      >
        <div className="tw-button-icon">
          {config.companyLogo ? (
            <img
              src={config.companyLogo}
              alt="Company"
              style={{ width: "20px", height: "20px", objectFit: "contain" }}
            />
          ) : (
            <MessageSquare style={{ width: "20px", height: "20px" }} />
          )}
        </div>
        <span>{widgetConfig.buttonText}</span>
      </button>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="tw-button-dismiss"
        style={{
          position: "fixed",
          [widgetConfig.position.includes("right") ? "right" : "left"]:
            widgetConfig.position.includes("right") ? "20px" : "20px",
          [widgetConfig.position.includes("bottom") ? "bottom" : "top"]:
            widgetConfig.position.includes("bottom") ? "80px" : "80px",
          width: "24px",
          height: "24px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          zIndex: "999998",
          transform: `scale(${widgetConfig.dialogScale})`,
        }}
        title="Dismiss"
      >
        <X style={{ width: "12px", height: "12px" }} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className={`tw-container ${widgetConfig.position} active`}>
          <div className="tw-modal">
            <SimpleCaptureModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              config={widgetConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTestimonialWidget;
