import { LucideIcon } from "lucide-react";
import { FormatOption } from "./general";

// Discovery modes
export type DiscoveryMode = "auto" | "manual" | "keyword" | "sentiment" | "ai";
// Source types for testimonials
export type TestimonialSource =
  | "mentions"
  | "comments"
  | "posts"
  | "tags"
  | "dms";

// Sentiment types
export type SentimentType = "positive" | "neutral" | "negative" | "all";
// Status types
export type TestimonialStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "requested"
  | "all";

export interface PlatformAccount {
  id: string;
  name: string;
  username: string;
  type: "personal" | "business" | "creator";
  image?: string;
  followers?: number;
  verified?: boolean;
}

export interface PlatformPermission {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: LucideIcon;
}

export type PlatformPermissions = {
  [key in SocialPlatformName]: PlatformPermission[];
};

// export interface PlatformStatsType {
//   lastSync: Date | null;
// }

// export interface PlatformStats {
//   [key: string]: PlatformStatsType;
// }

export interface ConnectingState {
  platform: SocialPlatformName | null;
  step: number;
  isLoading: boolean;
  error: string | null;
  selectedAccount: PlatformAccount | null;
  selectedPermissions?: string[];
  customAccount: {
    name: string;
    username: string;
    type: "personal" | "business" | "creator";
  };
  isCustomAccount: boolean;
}

export interface AccountManagementState {
  platform: SocialPlatformName | null;
  isOpen: boolean;
}

export interface PlatformSettingsType {
  platform: ExtendedSocialPlatform;
  contentSources: {
    mentions: boolean;
    comments: boolean;
    directMessages: boolean;
    posts: boolean;
    hashtags: boolean;
  };
  frequencyInHours: number;
  syncOnStart: boolean;
}

export interface PlatformColor {
  bg: string;
  text: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
  hoverFrom: string;
  hoverTo: string;
  lightBg: string;
}

export type PlatformColors = {
  [key in SocialPlatformName]: PlatformColor;
};

export type PlatformIcons = {
  [key in SocialPlatformName]: React.ElementType;
};

export type PlatformNames = {
  [key in SocialPlatformName]: string;
};

export type PlatformDevUrls = {
  [key in SocialPlatformName]: string;
};

export interface ExtendedSocialPlatform extends SocialPlatform {
  accounts: PlatformAccount[];
  activeAccountId?: string;
}
export type CampaignType =
  | "hashtag"
  | "mention"
  | "comment"
  | "ugc"
  | "contest";
export type SocialPlatformName =
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "youtube";

// Social platform settings
export interface SocialPlatform {
  name: SocialPlatformName;
  enabled: boolean;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  authToken?: string;
  refreshToken?: string;
  scope?: string[];
  lastSyncDate?: Date | null;
  settings?: {
    autoPost?: boolean;
    autoReply?: boolean;
    notifyOnMention?: boolean;
    filterNegative?: boolean;
  };
  accounts: PlatformAccount[];
  activeAccountId?: string;
}

// Hashtag campaign configuration
export interface SocialCampaign {
  id: string;
  name: string;
  workspace_id: string;
  type: CampaignType;
  identifier: string;
  status: "active" | "scheduled" | "completed" | "draft" | "paused";
  start_date: string;
  end_date: string;
  platforms: Array<SocialPlatformName>;
  target: number;
  collected: number;
  icon: "star" | "sparkles" | "badge" | "trophy" | "heart";
  description?: string;
  incentive?: string;
  rules?: string;
  budget?: number;
  team?: string[];
  report_frequency?: "daily" | "weekly" | "monthly";
  report_recipients?: string[];
  keywords?: string[];
  blacklist?: string[];
  sentiment_analysis?: boolean;
  ai_categorization?: boolean;
}

export type SocialSettings = {
  enabled: boolean;
  platforms: SocialPlatform[];
  formats: FormatOption[];
  hashtag: string;
  mention: string;
  autoImport: boolean;
  autoRequest: boolean;
  approvalWorkflow: DiscoveryMode;
  filtering: {
    negativeSentiment: boolean;
    competitorMentions: boolean;
    inappropriate: boolean;
    spamDetection?: boolean;
    minimumFollowers?: number;
    accountAge?: number;
    languageFilter?: string[];
    wordBlacklist?: string[];
  };
  permissionMessage: string;
  sendPermissionAuto: boolean;
  trackResponseStatus: boolean;
  autoExpire: boolean;
  sendFollowUp: boolean;
  campaigns: SocialCampaign[];
  monitoring?: {
    frequency: "realtime" | "hourly" | "daily" | "weekly";
    keywords: string[];
    competitors: string[];
    alertThreshold: "all" | "high_priority" | "critical";
    reportSchedule?: string;
  };
  engagement?: {
    autoLike: boolean;
    autoReply: boolean;
    replyTemplates: string[];
    engagementRules: {
      onlyPositive: boolean;
      minimumFollowers: number;
      excludeCompetitors: boolean;
    };
  };
};
