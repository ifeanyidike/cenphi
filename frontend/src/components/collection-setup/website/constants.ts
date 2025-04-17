import {
  BusinessEventType,
  EnhancedTriggerOption,
  FormatOption,
} from "@/types/setup";
import {
  DisplayRules,
  IncentiveConfig,
  WidgetCustomization,
} from "@/types/setup";

// Default values for reset functionality
export const defaultCustomization: WidgetCustomization = {
  primaryColor: "#4F46E5",
  companyName: "Your Company",
  // companyName: "",
  logo: undefined,
  widgetTitle: "Share Your Experience",
  widgetDescription: "We'd love to hear what you think about our product!",
  thankYouMessage: "Thank you for sharing your feedback with us!",
  position: "bottom-right" as
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left",
  tabletEnabled: true,
  mobileEnabled: true,
  theme: "light" as "light" | "dark" | "auto" | undefined,
  customCSS: "",
  stylePreset: "minimal" as
    | "minimal"
    | "rounded"
    | "gradient"
    | "glassmorphism"
    | undefined,

  questions: [
    "What did you like most about our product?",
    "How has it improved your workflow?",
  ],
  requireConsent: true,
};

export const defaultDisplayRules: DisplayRules = {
  excludedPages: ["/checkout/*", "/account/*", "/login", "/signup"],
  minTimeOnPage: 30,
  minTimeOnSite: 60,
  maxPromptFrequency: 1,
  minScrollDepth: 50,
  showOnExit: false,
  mobileEnabled: true,
  tabletEnabled: true,
};

export const defaultIncentives: IncentiveConfig = {
  enabled: false,
  type: "discount",
  value: "10% off your next purchase",
  expiryDays: 30,
  minimumQualification: {
    testimonialType: ["video"],
    minimumRating: 4,
    minimumLength: 50,
  },
};

// Default trigger - purchase completion
export const defaultTriggers: EnhancedTriggerOption<BusinessEventType>[] = [
  // {
  //   id: "purchase-completed",
  //   name: "Post-Purchase",
  //   description: "Request feedback after a user completes a purchase",
  //   enabled: true,
  //   businessEvent: "purchase_completed",
  //   userSegment: ["all_users"],
  //   delay: "3",
  //   delayUnit: "days",
  //   frequency: "once",
  //   priority: "high",
  // },
];

export const defaultFormats: FormatOption[] = [
  { type: "text", enabled: true },
  { type: "video", enabled: true },
  { type: "audio", enabled: true },
  { type: "image", enabled: false },
];

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
