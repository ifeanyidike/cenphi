// src/components/capture-widget/TestimonialWidget.tsx
import React, { useEffect } from "react";
import { TestimonialProvider } from "./contexts/TestimonialContext";
import TestimonialButton from "./TestimonialButton";
import TestimonialModal from "./TestimonialModal";
import { DEFAULT_WINDOW_CONFIG } from "./constants";
import { TestimonialWidgetConfig } from "./types";

interface TestimonialWidgetProps {
  config?: Partial<TestimonialWidgetConfig>;
}

const TestimonialWidget: React.FC<TestimonialWidgetProps> = ({
  config = DEFAULT_WINDOW_CONFIG,
}) => {
  // Validate configuration
  useEffect(() => {
    if (!config.campaignId) {
      console.error("Testimonial Widget Error: campaignId is required");
    }
  }, [config]);

  if (!config.campaignId) {
    return null;
  }

  return (
    <TestimonialProvider config={config}>
      <div id="capture-widget-root" className="testimonial-widget-container">
        <TestimonialButton />
        <TestimonialModal />
      </div>
    </TestimonialProvider>
  );
};

export default TestimonialWidget;
