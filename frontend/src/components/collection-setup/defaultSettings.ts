// src/components/collection-setup/defaultSettings.ts
import { CollectionSettings } from "@/types/setup";

// Define SocialPlatformName type locally since it's not exported from setup types
type SocialPlatformName = "instagram" | "twitter" | "facebook" | "linkedin" | "tiktok" | "youtube";

export const defaultChatMessageTemplates: {
  id: string;
  name: string;
  message: string;
  default: boolean;
}[] = [
  {
    id: "default",
    name: "Default",
    message:
      "Would you like to share your experience with us? It will only take a minute and helps us improve our service.",
    default: true,
  },
  {
    id: "friendly",
    name: "Friendly",
    message:
      "Hey there! We'd love to hear about your experience today. Would you mind sharing a quick testimonial?",
    default: false,
  },
  {
    id: "professional",
    name: "Professional",
    message:
      "Thank you for using our chat service. We value your feedback and would appreciate if you could share a brief testimonial about your experience.",
    default: false,
  },
  {
    id: "incentive",
    name: "With Incentive",
    message:
      "Would you like to share your experience with us? Your feedback is valuable and as a thank you, we'll send you a 10% discount code for your next purchase.",
    default: false,
  },
  {
    id: "brief",
    name: "Brief",
    message: "Quick feedback? Your thoughts help us improve.",
    default: false,
  },
];

/**
 * Default settings for the testimonial collection configuration
 */
export const defaultSettings: CollectionSettings = {
  website: {
    enabled: true,
    formats: [
      { type: "video", enabled: true },
      { type: "text", enabled: true },
      { type: "image", enabled: false },
    ],
    triggers: [
      // {
      //   type: "purchase",
      //   delay: "3",
      //   delayUnit: "days",
      //   enabled: true,
      //   userSegment: [],
      // },
      // {
      //   type: "support",
      //   delay: "1",
      //   delayUnit: "days",
      //   enabled: false,
      //   userSegment: [],
      // },
    ],
    appearance: {
      theme: "light",
      accentColor: "#3B82F6",
      logo: true,
      logoUrl: "",
      customTitle: "Share Your Experience",
      description: "We'd love to hear your thoughts about our product",
      position: "bottom-right",
      widgetType: "floating",
      customCSS: "",
      fontFamily: "Inter, system-ui, sans-serif",
      textSize: "md",
      borderRadius: 8,
      opacity: 100,
      shadowLevel: 2,
      animations: true,
      poweredBy: true,
    },
    integrationCode: `<!-- Testimonial Widget Integration -->
<script src="https://cdn.yourtestimonials.com/widget.js?id=YOUR_WIDGET_ID" async></script>`,
    analytics: {
      enableTracking: true,
      googleAnalytics: false,
      facebookPixel: false,
      customEvents: false,
    },
    advanced: {
      cookieConsent: true,
      dataRetention: 90,
      includeIpAddress: false,
      gdprCompliant: true,
      customDomains: [],
      localization: {
        enabled: false,
        languages: ["en"],
        autoDetect: true,
        supportedLanguages: ["en"],
        translations: {},
        customTranslations: {},
        defaultLanguage: "en",
        detectBrowserLanguage: true,
      },
      privacy: {},
    },
  },
  email: {
    enabled: false,
    sender: {
      name: "Customer Success Team",
      email: "feedback@company.com",
    },
    signature: {
      text: "Best regards,\n{{companyName}} Team",
      includeCompanyLogo: true,
      includeSocialLinks: true,
      template: "minimal",
    },
    templates: {
      request: "Hi {{customerName}},\n\nThank you for choosing our product. We'd love to hear about your experience.\n\nClick the button below to share your thoughts.\n\n{{buttonLink}}\n\nYour feedback helps us improve and helps others make informed decisions.\n\nThank you,\n{{companyName}}",
      thankYou: "Thank you for your feedback, {{customerName}}! We appreciate your input and look forward to serving you better.",
      followup: "Hi {{customerName}},\n\nWe noticed you haven't shared your feedback yet. Would you mind taking a moment to tell us about your experience?\n\n{{buttonLink}}\n\nThanks,\n{{companyName}}",
    },
    settings: {
      delay: 3,
      autoSend: true,
      requireReply: false,
    },
  },
  chat: {
    enabled: false,
    platforms: {
      intercom: false,
      zendesk: false,
      drift: false,
      crisp: false,
      tawkto: false,
    },
    triggers: {
      sentiment: false,
      purchase: false,
      chat_end: false,
      support_resolved: false,
      duration: false,
    },
    formats: [
      { type: "video", enabled: false },
      { type: "text", enabled: true },
      { type: "image", enabled: false },
    ],
    templates: {
      request: "Would you like to share your experience with us? It will only take a minute and helps us improve our service.",
      thankYou: "Thank you for your feedback! We appreciate you taking the time to share your experience.",
      followup: "Hi there! We'd love to hear about your experience today. Would you mind sharing a quick testimonial?",
    },
    settings: {
      delay: 30,
      autoTrigger: true,
      requireRating: false,
      minRating: 3,
    },
  },
  social: {
    enabled: false,
    platforms: {
      twitter: true,
      facebook: false,
      linkedin: false,
      instagram: true,
    },
    triggers: {
      positiveSentiment: true,
      engagement: false,
      mention: true,
    },
    templates: {
      request: "Hi {{username}}, we love your post about our product! Would you allow us to feature it on our website?",
      thankYou: "Thank you {{username}} for allowing us to feature your amazing feedback!",
      followup: "Hi {{username}}, just following up on our request to feature your post. Let us know if you have any questions!",
    },
    settings: {
      autoReply: true,
      requireApproval: true,
      characterLimit: 280,
    },
  },
  custom: {
    enabled: false,
    formats: [
      { type: "video", enabled: true },
      { type: "text", enabled: true },
      { type: "image", enabled: true },
    ],
    pageTitle: "Share Your Feedback",
    headline: "Share Your Feedback",
    formIntro: "Tell us about your experience with our product",
    ctaButton: "Submit Feedback",
    successTitle: "Thank You!",
    successMessage: "Your feedback has been submitted successfully.",
    customDomain: "",
    customSlug: "feedback",
    settings: {
      showRating: true,
      requireRating: false,
      showCompany: true,
      requireCompany: false,
      showEmail: true,
      requireEmail: true,
    },
  },
  "google-drive": {
    enabled: false,
    formats: [
      { type: "video", enabled: true },
      { type: "document", enabled: true },
      { type: "image", enabled: true },
    ],
    connection: {
      isConnected: false,
      accountEmail: undefined,
      lastSync: undefined,
      syncInterval: 30,
      autoSync: false,
    },
    folders: {
      selectedFolders: [],
      includeSubfolders: true,
      fileTypes: ["video", "document", "image"],
      maxFileSize: 100,
    },
    processing: {
      autoProcess: true,
      extractMetadata: true,
      generateTranscripts: true,
      createThumbnails: true,
    },
    notifications: {
      onNewFile: true,
      onProcessingComplete: true,
      onError: true,
    },
  },
  linkedin: {
    enabled: false,
    formats: [
      { type: "text", enabled: true },
      { type: "video", enabled: false },
      { type: "image", enabled: false },
    ],
    connection: {
      isConnected: false,
      accountId: undefined,
      accountName: undefined,
      lastSync: undefined,
      syncInterval: 60,
      autoSync: false,
    },
    collection: {
      includeRecommendations: true,
      includeEndorsements: true,
      includePosts: false,
      includeComments: false,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
      keywords: [],
      excludeKeywords: [],
    },
    processing: {
      autoProcess: true,
      extractSentiment: true,
      generateSummaries: true,
      identifyKeyPhrases: true,
    },
    notifications: {
      onNewRecommendation: true,
      onNewEndorsement: true,
      onProcessingComplete: true,
      onError: true,
    },
  },
};

export const socialPlatforms: Record<
  SocialPlatformName,
  {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
  }
> = {
  instagram: {
    name: "Instagram",
    icon: "Instagram",
    color: "text-pink-500",
    bgColor: "bg-pink-100",
  },
  twitter: {
    name: "Twitter",
    icon: "Twitter",
    color: "text-blue-400",
    bgColor: "bg-blue-100",
  },
  facebook: {
    name: "Facebook",
    icon: "Facebook",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "Linkedin",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  tiktok: {
    name: "TikTok",
    icon: "Tiktok",
    color: "text-black",
    bgColor: "bg-gray-100",
  },
  youtube: {
    name: "YouTube",
    icon: "Youtube",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};
