import {
  WidgetCustomization,
  TestimonialFormat,
  IncentiveConfig,
  DisplayRules,
  EnhancedTriggerOption,
} from "../types/testimonial-types"; // Adjust path to your existing types

export interface TestimonialWidgetConfig {
  customization: WidgetCustomization;
  formats: TestimonialFormat[];
  incentives: IncentiveConfig;
  displayRules: DisplayRules;
  triggers: EnhancedTriggerOption[];
  device?: "desktop" | "mobile" | "tablet";
  defaultOpen?: boolean;
  previewMode?: boolean;
  onClose?: () => void;
}

// Global declarations for the widget
declare global {
  interface Window {
    initTestimonialWidget: (config: TestimonialWidgetConfig) => void;
    testimonialWidgetConfig?: TestimonialWidgetConfig;
  }
}
