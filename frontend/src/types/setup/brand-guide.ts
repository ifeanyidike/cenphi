import { SocialPlatformName } from "./social";

// Define types
export type ColorMode = "light" | "dark";
export type DeviceView = "desktop" | "tablet" | "mobile";
export type TestimonialLayout = "grid" | "carousel" | "masonry" | "list";
export type TestimonialShape = "rounded" | "square" | "circle";
export type CustomPageTemplateType =
  | "pageTitleTemplate"
  | "headlineTemplate"
  | "ctaButtonTemplate"
  | "successTitleTemplate"
  | "successMessageTemplate"
  | "formIntroTemplate";
export type TestimonialStyle =
  | "minimal"
  | "card"
  | "quote"
  | "bubble"
  | "highlight"
  | "modern"
  | "classic";

export interface FontOption {
  value: string;
  label: string;
  category: "sans" | "serif" | "display" | "mono" | "handwritten" | "slab";
  fallback: string;
  description?: string;
}

// export interface BrandData {
//   id: string;
//   name: string;
//   tagline: string;
//   description: string;
//   logo: {
//     main: string | null;
//     alt: string | null;
//     favicon: string | null;
//     darkMode: string | null;
//   };
//   colors: {
//     primary: string;
//     secondary: string;
//     accent: string;
//     success: string;
//     warning: string;
//     error: string;
//     background: string;
//     foreground: string;
//     muted: string;
//     surface: string;
//   };
//   typography: {
//     headingFont: string;
//     bodyFont: string;
//     baseSize: number;
//     ratio: number;
//     weights: {
//       heading: number;
//       body: number;
//     };
//     letterSpacing: number;
//     lineHeight: number;
//   };
//   testimonials: {
//     style: TestimonialStyle;
//     shape: TestimonialShape;
//     layout: TestimonialLayout;
//     showRating: boolean;
//     showAvatar: boolean;
//     showDate: boolean;
//     showCompany: boolean;
//     animation: boolean;
//     shadow: "none" | "sm" | "md" | "lg";
//     border: boolean;
//     ratingStyle: "stars" | "number" | "text";
//   };
//   voice: {
//     tone: string;
//     values: string[];
//     ctas: string[];
//     examples: string[];
//     channels: {
//       // social: Record<"requestTemplate" | "thankYouTemplate", string>;
//       social: {
//         platforms: Record<
//           SocialPlatformName,
//           {
//             requestTemplate: string;
//             thankYouTemplate: string;
//             followupTemplate: string;
//           }
//         >;
//       };
//       custom: Record<
//         CustomPageTemplateType | "customSlug" | "customDomain",
//         string
//       >;

//       website: Record<"requestTemplate" | "thankYouTemplate", string>;
//       chat: Record<"requestTemplate" | "followupTemplate", string>;
//       email: {
//         requestTemplate: string;
//         thankYouTemplate: string;
//         signature: {
//           templateId: string;
//           text: string;
//           includeSocialLinks?: boolean;
//           includeCompanyLogo?: boolean;
//         };
//         sender: {
//           email: string;
//           name: string;
//         };
//       };
//     };
//   };
//   ui: {
//     radius: number;
//     animation: boolean;
//     density: "compact" | "default" | "relaxed";
//     darkMode: boolean;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface BrandGuide {
  id: string;
  workspace_id: string;
  name: string;

  // Brand identity
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    muted: string;
    surface: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
    ratio: number;
    weights: {
      heading: number;
      body: number;
    };
    letterSpacing: number;
    lineHeight: number;
  };

  // Testimonial display settings
  testimonial_style: TestimonialStyle;
  testimonial_shape: TestimonialShape;
  testimonial_layout: TestimonialLayout;

  // Display options
  show_rating: boolean;
  show_avatar: boolean;
  show_date: boolean;
  show_company: boolean;

  // Animation and styling
  animation: boolean;
  shadow: "none" | "sm" | "md" | "lg";
  border: boolean;
  rating_style: "stars" | "number" | "text";

  // Brand voice
  voice: {
    tone: string;
    values: string[];
    ctas: string[];
    examples: string[];
    channels: {
      social: {
        platforms: Record<
          SocialPlatformName,
          {
            requestTemplate: string;
            thankYouTemplate: string;
            followupTemplate: string;
          }
        >;
      };
      custom: Record<string, string>;
      website: Record<"requestTemplate" | "thankYouTemplate", string>;
      chat: Record<"requestTemplate" | "followupTemplate", string>;
      email: {
        requestTemplate: string;
        thankYouTemplate: string;
        signature: {
          templateId: string;
          text: string;
          includeSocialLinks?: boolean;
          includeCompanyLogo?: boolean;
        };
        sender: {
          email: string;
          name: string;
        };
      };
    };
  };

  // UI settings
  ui_settings: {
    radius: number;
    animation: boolean;
    density: "compact" | "default" | "relaxed";
    darkMode: boolean;
  };

  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    muted: string;
    surface: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  testimonials: {
    style: TestimonialStyle;
  };
}
