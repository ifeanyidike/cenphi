// src/components/collection-setup/defaultSettings.ts
import { CollectionSettings, SocialPlatformName } from "@/types/setup";

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
      { type: "audio", enabled: true },
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
    formats: [
      { type: "video", enabled: true },
      { type: "audio", enabled: false },
      { type: "text", enabled: true },
      { type: "image", enabled: false },
    ],
    signatureTemplate: "minimal",
    senderType: "company",
    triggers: [],
    templates: [
      {
        id: "template-1",
        name: "Simple Template",
        thumbnail: "/email-templates/standard.jpg",
        description: "",
        active: true,
        subject: "We'd love your feedback on your recent purchase",
        content:
          "Hello {{customerName}},\n\nThank you for choosing our product. We'd love to hear about your experience.\n\nClick the button below to share your thoughts.\n\n{{buttonLink}}\n\nYour feedback helps us improve and helps others make informed decisions.\n\nThank you,\n{{companyName}}",
      },
      {
        id: "template-2",
        name: "Follow-Up Template",
        thumbnail: "/email-templates/minimalist.jpg",
        description: "",
        active: false,
        subject: "Quick feedback request",
        content:
          "Hi {{customerName}},\n\nHow was your experience with {{productName}}?\n\n{{buttonLink}}\n\nThanks,\n{{companyName}}",
      },
      {
        id: "template-3",
        name: "Media-Rich Template",
        thumbnail: "/email-templates/minimalist.jpg",
        description: "",
        active: false,
        subject: "Quick feedback request",
        content:
          "Hi {{customerName}},\n\nHow was your experience with {{productName}}?\n\n{{buttonLink}}\n\nThanks,\n{{companyName}}",
      },
      {
        id: "template-4",
        name: "Incentive Template",
        description: "",
        thumbnail: "/email-templates/minimalist.jpg",
        active: false,
        subject: "Quick feedback request",
        content:
          "Hi {{customerName}},\n\nHow was your experience with {{productName}}?\n\n{{buttonLink}}\n\nThanks,\n{{companyName}}",
      },
    ],
    senderName: "Customer Success Team",
    senderEmail: "feedback@company.com",
    replyToEmail: "support@company.com",
    schedule: {
      followUpEnabled: true,
      followUpDelay: 3,
      followUpDelayUnit: "days",
      maxFollowUps: 2,
    },
  },
  chat: {
    enabled: false,
    formats: [
      { type: "video", enabled: false },
      { type: "audio", enabled: false },
      { type: "text", enabled: true },
      { type: "image", enabled: false },
    ],
    messageTemplate: defaultChatMessageTemplates[0],
    triggers: [],
    connectedPlatforms: {
      intercom: false,
      zendesk: false,
      crisp: false,
      drift: false,
    },
    promptMessage:
      "How would you rate your experience with our support team today?",
    timeout: "30",
    allowAgentTrigger: true,
  },
  social: {
    enabled: false,
    platforms: [
      { name: "instagram", enabled: true, connected: false, accounts: [] },
      { name: "twitter", enabled: true, connected: false, accounts: [] },
      { name: "facebook", enabled: false, connected: false, accounts: [] },
    ],
    formats: [
      { type: "video", enabled: true },
      { type: "audio", enabled: false },
      { type: "text", enabled: true },
      { type: "image", enabled: true },
    ],
    hashtag: "#lovethistool",
    mention: "@ourcompany",
    autoImport: true,
    autoRequest: false,
    approvalWorkflow: "manual",
    filtering: {
      negativeSentiment: true,
      competitorMentions: true,
      inappropriate: true,
    },
    permissionMessage:
      "Hi {{username}}, we love your post about our product! Would you allow us to feature it on our website?",
    sendPermissionAuto: true,
    trackResponseStatus: true,
    autoExpire: true,
    sendFollowUp: false,
    campaigns: [
      // {
      //   id: "campaign-1",
      //   name: "Product Launch Campaign",
      //   hashtag: "#newproductlaunch",
      //   status: "active",
      //   startDate: "2023-10-01",
      //   endDate: "2023-11-01",
      //   platforms: ["instagram", "twitter"],
      //   target: 100,
      //   collected: 37,
      //   icon: "star",
      // },
    ],
  },
  custom: {
    enabled: false,
    formats: [
      { type: "video", enabled: true },
      { type: "audio", enabled: true },
      { type: "text", enabled: true },
      { type: "image", enabled: true },
    ],
    customDomain: "",
    subdomain: "feedback",
    useCustomDomain: false,
    pageTitle: "Share Your Feedback",
    pageDescription: "Tell us about your experience with our product",
    themeSettings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#6366F1",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      fontFamily: "Inter, sans-serif",
      borderRadius: 8,
      showLogo: true,
      heroType: "gradient",
      heroImage: "",
      layout: {},
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
