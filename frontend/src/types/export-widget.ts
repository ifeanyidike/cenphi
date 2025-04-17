// Widget Types
export type WidgetTheme =
  | "default"
  | "minimal"
  | "modern"
  | "elegant"
  | "vibrant"
  | "premium"
  | "dark"
  | "light"
  | "social";

export type WidgetAnimationType =
  | "fade"
  | "slide"
  | "zoom"
  | "flip"
  | "bounce"
  | "none";

export type WidgetRoundedType =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

export type WidgetShadowType = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

export type WidgetWidthType = "auto" | "sm" | "md" | "lg" | "xl" | "full";

export type WidgetPositionType =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WidgetFontStyleType =
  | "modern"
  | "serif"
  | "mono"
  | "playful"
  | "elegant"
  | "bold";

export interface WidgetCustomizations {
  theme: WidgetTheme;
  darkMode: boolean;
  rounded: WidgetRoundedType;
  showAvatar: boolean;
  showRating: boolean;
  showCompany: boolean;
  animation: WidgetAnimationType;
  position: WidgetPositionType;
  autoRotate: boolean;
  highlightColor: string;
  fontStyle: WidgetFontStyleType;
  width: WidgetWidthType;
  border: boolean;
  shadow: WidgetShadowType;
  layout?: "compact" | "standard" | "expanded";
  textAlign?: "left" | "center" | "right";
}

export interface WidgetTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  thumbnail?: string;
  previewImage?: string;
  bestFor: string[];
  premium: boolean;
  popularityScore?: number;
  defaultCustomizations: WidgetCustomizations;
}

export interface WidgetUsageStats {
  views: number;
  clicks: number;
  conversions: number;
  lastUpdated: string;
  conversionRate?: number;
  avgEngagementTime?: number;
}

export interface WidgetSettings {
  id: string;
  name: string;
  type: string;
  testimonialId: string;
  customizations: WidgetCustomizations;
  usageStats: WidgetUsageStats;
  embedLocations: string[];
  created?: string;
  lastModified?: string;
  version?: number;
}
