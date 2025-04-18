import {
  WidgetCustomization,
  IncentiveConfig,
  DisplayRules,
  EnhancedTriggerOption,
  BusinessEventType,
  BrandGuide,
  FormatOption,
} from "@/types/setup";

export interface TestimonialWidgetConfig {
  customization: WidgetCustomization;
  formats: FormatOption[];
  incentives: IncentiveConfig;
  displayRules: DisplayRules;
  triggers: EnhancedTriggerOption<BusinessEventType>[];
  device?: "desktop" | "mobile" | "tablet";
  defaultOpen?: boolean;
  previewMode?: boolean;
  onClose?: () => void;
  brandData: BrandGuide;
}

// Global declarations for the widget
declare global {
  interface Window {
    initTestimonialWidget: (config: TestimonialWidgetConfig) => void;
    testimonialWidgetConfig?: TestimonialWidgetConfig;
  }
}
