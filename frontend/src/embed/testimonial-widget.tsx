import { createRoot } from "react-dom/client";
import type { TestimonialWidgetConfig } from "./widget-types";

import "../styles/widget.css"; // widget-specific styles
import TestimonialWidget from "@/components/collection-setup/website/preview/TestimonialWidget";

// Global initialization function
const initWidget = (config: TestimonialWidgetConfig): void => {
  // Create container if it doesn't exist
  let container = document.getElementById("testimonial-widget-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "testimonial-widget-container";
    document.body.appendChild(container);
  }

  // Initialize with React 18's createRoot
  const root = createRoot(container);
  root.render(<TestimonialWidget {...config} />);
};

// Expose the initialization function globally
window.initTestimonialWidget = initWidget;

// Auto-initialize if configuration is present
if (window.testimonialWidgetConfig) {
  initWidget(window.testimonialWidgetConfig);
}

// Export for direct import in projects using npm/yarn
export { initWidget };
export type { TestimonialWidgetConfig };
