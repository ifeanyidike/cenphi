import { FormatOption } from "./general";

export type CustomSettings = {
  enabled: boolean;
  formats: FormatOption[];
  customDomain: string;
  companyName: string;
  subdomain: string;
  useCustomDomain: boolean;
  pageTitle: string;
  pageDescription: string;
  analytics: any;
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: number;
    showLogo: boolean;
    logo?: string;
    heroType: "simple" | "gradient" | "image" | "video" | "carousel";
    heroImage: string;
    heroVideo?: string;
    carouselImages?: string[];
    customCss?: string;
    customJs?: string;
    customHtml?: string;
    testimonialsLayout?: string;
    benefitsCount?: number;
    sectionSpacing?: number;
    contentWidth?: number;
    stickyHeader?: boolean;
    mobileNav?: string;
    mobileStackOrder?: string;
    mobileSpacing?: number;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
      ogTags?: boolean;
      twitterCards?: boolean;
      structuredData?: boolean;
    };
    layout: {
      sections?: any;
      type?: string;
      formPosition?: string;
      order?: number[];
      splitRatio?: number;
    };
  };
  customForm?: {
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
      validation?: string;
    }>;
    incentivesEnabled: boolean;
    layout: "vertical" | "horizontal" | "grid";
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    enableRatings?: boolean;
    ratingQuestion?: string;
    minRating?: number;
    ratingLabels?: string[];
    instructions?: string;
    mainQuestion?: string;
    guidedQuestions?: string[];
    guidedMode?: boolean;
    consentRequired?: boolean;
    consentText?: string;
    showPrivacyNotice?: boolean;
    privacyPolicyUrl?: string;
  };
  authentication?: {
    required: boolean;
    method: "email" | "social" | "sso" | "none";
    providers?: string[];
    restrictDomains?: string[];
  };
  customScripts?: string[];
  customTracking?: Record<string, any>;
};
