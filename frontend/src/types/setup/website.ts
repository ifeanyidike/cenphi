import { BusinessEventType, FormatOption } from "./general";
import { EnhancedTriggerOption } from "./triggers";

export type WebsiteSettings = {
  enabled: boolean;
  formats: FormatOption[];
  triggers: EnhancedTriggerOption<BusinessEventType>[];
  appearance: WebsiteAppearance;
  integrationCode: string;
  behavior?: WidgetBehavior;
  debug?: DebugSettings;
  customization?: WidgetCustomization;
  displayRules?: DisplayRules;
  incentives?: IncentiveConfig;
  analytics?: {
    enableTracking: boolean;
    googleAnalytics: boolean;
    googleTagManager?: boolean;
    facebookPixel: boolean;
    customEvents: boolean;
    hubspot?: boolean;
    segment?: boolean;
    mixpanel?: boolean;
    amplitude?: boolean;
    intercom?: boolean;
  };
  advanced?: {
    cookieConsent: boolean;
    dataRetention: number;
    includeIpAddress: boolean;
    gdprCompliant: boolean;
    ccpaCompliant?: boolean;
    customDomains: string[];
    rateLimit?: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number;
      timeUnit: "minute" | "hour" | "day";
    };
    caching?: {
      enabled: boolean;
      ttl: number;
    };
    performance?: {
      lazyLoad: boolean;
      preload: boolean;
      asyncLoading: boolean;
      compressionLevel: "none" | "low" | "medium" | "high";
    };
    javascript?: {
      enabled?: boolean;
      code: string;
    };
    security?: {
      contentSecurityPolicy: boolean;
      xssProtection: boolean;
      frameDenial: boolean;
      ssl: boolean;
      enableCaptcha?: boolean;
      moderationEnabled?: boolean;
      profanityFilter?: boolean;
      maxSubmissionsPerUser?: number;
      ratelimit?: number;
      allowedDomains?: string[];
    };
    localization?: {
      enabled: boolean;
      languages: string[];
      autoDetect: boolean;
      defaultLanguage?: string;
      customTranslations?: Record<string, Record<string, string>>;
      detectBrowserLanguage?: boolean;
      supportedLanguages: string[];
      translations: Record<string, any>;
    };
    privacy?: {
      requireConsent?: boolean;
      consentText?: string;
      dataRetentionPeriod?: number;
      allowAnonymous?: boolean;
      collectIpAddress?: boolean;
      termsUrl?: string;
      privacyUrl?: string;
    };
  };
  notifications?: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    endpoints?: string[];
    notifyOn: {
      newTestimonial: boolean;
      negativeRating: boolean;
      specificKeywords: boolean;
    };
    emails?: string[];
    slackChannel?: string;
  };
};

// Website appearance configuration
export interface WebsiteAppearance {
  theme: "light" | "dark" | "auto";
  accentColor: string;
  secondaryColor?: string;
  logo: boolean;
  logoUrl?: string;
  logoPosition?: "left" | "center" | "right";
  logoSize?: "small" | "medium" | "large";
  customTitle: string;
  description?: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetType: "floating" | "embedded" | "popup" | "inline" | "sidebar";
  customCSS: string;
  fontFamily: string;
  textSize?: "sm" | "md" | "lg";
  borderRadius?: number;
  opacity?: number;
  shadowLevel?: number;
  animations?: boolean;
  poweredBy?: boolean;
  customButtons?: Array<{
    label: string;
    action: string;
    style: "primary" | "secondary" | "outline" | "text";
    icon?: string;
  }>;
  modalSize?: "small" | "medium" | "large" | "fullscreen";
  overlayOpacity?: number;
  containerPadding?: number;
  responsiveBreakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  colorScheme?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

// Widget behavior settings
export interface WidgetBehavior {
  delay: number; // Seconds to wait before showing widget
  autoOpen: boolean; // Automatically open widget
  pageViewThreshold: number; // Minimum page views before showing
  timeOnSiteThreshold: number; // Seconds on site before showing
  exitIntent: boolean; // Show on exit intent
  scrollDepth: number; // Percentage scrolled before showing
  showOnMobile: boolean; // Whether to show on mobile devices
  minTimeBetweenPrompts: number; // Days between prompts
  closeAfterSubmission: boolean; // Close widget after submission
  collectDeviceInfo: boolean; // Collect device information
  collectLocationData: boolean; // Collect approximate location
  preventMultipleSubmissions: boolean; // Prevent multiple submissions from same user
  sessionTimeout: number; // Session timeout in minutes
  useLocalStorage: boolean; // Use localStorage for persistence
  useSessionStorage: boolean; // Use sessionStorage for session data
  useCookies: boolean; // Use cookies for tracking state
}

export interface DebugSettings {
  testMode: boolean; // Enable test mode
  forceShow: boolean; // Always show widget
  testVariant: string; // Test variant (default, v1, v2, v3)
  logEvents: boolean; // Log events to console
  disableAnalytics: boolean; // Disable analytics in test mode
  mockData: boolean; // Use mock data
  latencySimulation: number; // Simulate API latency
  errorSimulation: boolean; // Simulate errors
  debugToConsole: boolean; // Output debug info to console
}

// Display rules for widget
export interface DisplayRules {
  excludedPages?: string[]; // Pages where widget should never show
  includedPages?: string[]; // Pages where widget can show (if empty, all non-excluded are allowed)
  minTimeOnPage?: number; // Minimum time in seconds before showing
  minTimeOnSite?: number; // Minimum time in seconds on site before showing
  maxPromptFrequency?: number; // Maximum times to show per session/day
  minScrollDepth?: number; // Minimum scroll percentage before showing
  showOnExit?: boolean; // Show on exit intent
  mobileEnabled?: boolean; // Whether to show on mobile devices
  tabletEnabled?: boolean; // Whether to show on tablets
}
export interface IncentiveConfig {
  enabled: boolean;
  type: "discount" | "gift" | "credit" | "feature" | "other";
  value: string; // Value of the incentive
  expiryDays?: number; // Expiry days for the incentive
  showRequirements?: boolean;
  minimumQualification?: {
    testimonialType?: string[]; // Types of testimonials required
    minimumRating?: number; // Minimum rating required
    minimumLength?: number; // Minimum length of testimonial
  };
  code?: string;
}

export interface WidgetCustomization {
  primaryColor: string;
  logo?: string;
  companyName: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetTitle?: string;
  widgetDescription?: string;
  thankYouMessage?: string;
  questions?: string[];
  customCSS?: string;
  theme?: "light" | "dark" | "auto";
  stylePreset?:
    | "minimal"
    | "rounded"
    | "gradient"
    | "glassmorphism"
    | "neumorphic";
  mobileEnabled?: boolean;
  tabletEnabled?: boolean;
  analyticsEnabled?: boolean;
  moderationEnabled?: boolean;
  fields?: string[];
  requiredFields?: string[];
  requireConsent?: boolean;
  consentText?: string;
  privacyPolicyUrl?: string;
  showDataProtection?: boolean;
  dataProtectionText?: string;
  analyticsIntegrations?: string[];
  trackingEvents?: string[];
  gaTrackingId?: string;
  fbPixelId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}
