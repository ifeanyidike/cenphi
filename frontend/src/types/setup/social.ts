export type DiscoveryMode = "auto" | "manual" | "keyword" | "sentiment" | "ai";
export type SentimentType = "positive" | "negative" | "neutral" | "all";
export type SocialPlatformName = "twitter" | "facebook" | "linkedin" | "instagram" | "youtube" | "tiktok";
export type TestimonialSource = "mentions" | "comments" | "posts" | "tags" | "dms";

// Platform-related types
export interface PlatformAccount {
  id: string;
  name: string;
  username: string;
  type: "personal" | "business" | "creator";
  followers: number;
  verified: boolean;
}

export interface PlatformColors {
  instagram: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
  twitter: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
  facebook: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
  linkedin: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
  tiktok: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
  youtube: {
    bg: string;
    text: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    hoverFrom: string;
    hoverTo: string;
    lightBg: string;
  };
}

export interface PlatformDevUrls {
  instagram: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  youtube: string;
}

export interface PlatformIcons {
  instagram: React.ComponentType<any>;
  twitter: React.ComponentType<any>;
  facebook: React.ComponentType<any>;
  linkedin: React.ComponentType<any>;
  tiktok: React.ComponentType<any>;
  youtube: React.ComponentType<any>;
}

export interface PlatformNames {
  instagram: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  youtube: string;
}

export interface PlatformPermission {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: React.ComponentType<any>;
}

export interface PlatformPermissions {
  instagram: PlatformPermission[];
  twitter: PlatformPermission[];
  facebook: PlatformPermission[];
  linkedin: PlatformPermission[];
  youtube: PlatformPermission[];
  tiktok: PlatformPermission[];
}

export interface SocialSettings {
  enabled: boolean;
  platforms: {
    twitter: boolean;
    facebook: boolean;
    linkedin: boolean;
    instagram: boolean;
  };
  triggers: {
    positiveSentiment: boolean;
    engagement: boolean;
    mention: boolean;
  };
  templates: {
    request: string;
    thankYou: string;
    followup: string;
  };
  settings: {
    autoReply: boolean;
    requireApproval: boolean;
    characterLimit: number;
  };
  approvalWorkflow?: DiscoveryMode;
  permissionMessage?: string;
}
