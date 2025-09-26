// src/components/capture-widget/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import SimpleTestimonialWidget from "./SimpleTestimonialWidget";
import { TestimonialWidgetConfig } from "./types";

// Export simplified main component
export default SimpleTestimonialWidget;

// Export types
export type { TestimonialWidgetConfig };

// Define a global window interface for configuration
declare global {
  interface Window {
    testimonialWidgetConfig?: Partial<TestimonialWidgetConfig>;
  }
}

// Create a namespace for the widget to avoid conflicts
const WIDGET_NAMESPACE = "TestimonialWidget";

// Auto-initialize if window.testimonialWidgetConfig exists
if (typeof document !== "undefined") {
  // Make sure we don't initialize twice
  if (!(window as any)[WIDGET_NAMESPACE + "_initialized"]) {
    (window as any)[WIDGET_NAMESPACE + "_initialized"] = true;

    // Setup the initialization function
    const initialize = () => {
      if (window.testimonialWidgetConfig) {
        // Check if the container already exists
        let container = document.getElementById("cenphi-widget-root");

        // Create container if it doesn't exist
        if (!container) {
          container = document.createElement("div");
          container.id = "cenphi-widget-root";
          document.body.appendChild(container);
        }

        // Initialize simplified widget with the global config
        try {
          const root = createRoot(container);
          root.render(
            <React.StrictMode>
              <SimpleTestimonialWidget config={window.testimonialWidgetConfig} />
            </React.StrictMode>
          );
          console.log("Testimonial widget initialized successfully");
        } catch (error) {
          console.error("Failed to initialize testimonial widget:", error);
        }
      }
    };

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize);
    } else {
      // DOM already loaded, initialize now
      initialize();
    }
  }
}
