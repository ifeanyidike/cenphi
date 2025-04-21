// // Enum-like type aliases for string unions

export type TestimonialType =
  | "customer"
  | "employee"
  | "partner"
  | "influencer"
  | "expert"
  | "case_study";

export type ContentFormat =
  | "text"
  | "video"
  | "audio"
  | "image"
  | "social_post"
  | "survey"
  | "interview";

export type ContentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "featured"
  | "view_more"
  | "deleted"
  | "scheduled";

export type CollectionMethod =
  | "direct_link"
  | "embed_form"
  | "qr_code"
  | "email_request"
  | "sms_request"
  | "api"
  | "social_import"
  | "interview"
  | "survey"
  | "screen_recording"
  | "event_capture";

export type VerificationType =
  | "email"
  | "phone"
  | "social_login"
  | "order_verification"
  | "employee_verification"
  | "domain_verification";


export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  pinterest?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  reddit?: string;
}

export type StringArray = string[];

// Placeholder for CustomerProfile type (if available)
export type JSONMap = { [key: string]: any };

export interface CustomerProfile {
  id: string; // uuid.UUID represented as a string
  workspace_id: string;
  external_id: string;
  email?: string;
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  avatar_url: string;
  social_profiles: SocialProfiles;
  custom_fields?: JSONMap;
  created_at: Date;
  updated_at: Date;
}

type Sentiment = {
  score: number; // -1 to 1
  label: "positive" | "neutral" | "negative";
  keywords: string[];
  count: number; // Number of sentiment keywords detected
};

// The Testimonial model
export interface Testimonial {
  // Identifiers
  id: string; // uuid.UUID represented as string
  workspace_id: string;

  // Optional relation to the customer profile
  customer_profile_id?: string;
  customer_profile: CustomerProfile;
  sentiment: Sentiment
  
  // Categorization & Status
  testimonial_type: TestimonialType;
  format: ContentFormat;
  status: ContentStatus;
  language?: string;

  // Content
  title?: string;
  summary?: string;
  content?: string;
  transcript?: string;
  media_urls?: StringArray;
  rating: number; // float32 represented as number
  source?: string;
  author?: string;
  // Media Metadata
  media_url?: string;
  media_duration?: number;
  thumbnail_url?: string;
  additional_media?: any; // using 'any' to represent flexible JSON content

  // Contexts
  product_context?: JSONMap;
  purchase_context?: JSONMap;
  experience_context?: JSONMap;

  // Collection & Verification
  collection_method: CollectionMethod;
  verification_method?: VerificationType;
  verification_data?: JSONMap;
  verification_status: string;
  verified_at?: Date |string;
  authenticity_score?: number;
  source_data?: JSONMap;

  // Publishing
  published: boolean;
  is_featured?: boolean;
  published_at?: Date |string;
  scheduled_publish_at?: Date |string;

  // Organization
  tags?: StringArray;
  categories?: StringArray;
  custom_fields?: JSONMap;

  // Usage Metrics
  view_count: number;
  share_count: number;
  conversion_count: number;
  engagement_metrics?: JSONMap;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface SentimentSummary {
  label: string;
  count: number;
  percentage: number;
}

export interface Filters {
  dateRange: [Date | null, Date | null];
  sentiment: Sentiment;
  testimonialType: string;
  status: string;
  rating: string;
  format: string;
}

// A single unified constants file for all testimonial-related options

// Define constant objects for each category
// export const TESTIMONIAL_CONSTANTS = {
//   // Types of testimonials
//   TESTIMONIAL_TYPES: [
//     "customer",
//     "employee",
//     "partner",
//     "influencer",
//     "expert",
//     "case_study"
//   ] as const,

//   // Content formats
//   CONTENT_FORMATS: [
//     "text",
//     "video",
//     "audio",
//     "image",
//     "social_post",
//     "survey",
//     "interview"
//   ] as const,

//   // Content statuses
//   CONTENT_STATUSES: [
//     "pending_review",
//     "approved",
//     "rejected",
//     "archived",
//     "featured",
//     "view_more",
//     "deleted",
//     "scheduled"
//   ] as const,

//   // Collection methods
//   COLLECTION_METHODS: [
//     "direct_link",
//     "embed_form",
//     "qr_code",
//     "email_request",
//     "sms_request",
//     "api",
//     "social_import",
//     "interview",
//     "survey",
//     "screen_recording",
//     "event_capture"
//   ] as const,

//   // Verification types
//   VERIFICATION_TYPES: [
//     "email",
//     "phone",
//     "social_login",
//     "order_verification",
//     "employee_verification",
//     "domain_verification"
//   ] as const,
  
//   // Social platforms
//   SOCIAL_PLATFORMS: [
//     "linkedin",
//     "twitter",
//     "facebook",
//     "instagram",
//     "pinterest",
//     "tiktok",
//     "youtube"
//   ] as const,
  
//   // Sentiment labels
//   SENTIMENT_LABELS: [
//     "positive",
//     "neutral",
//     "negative"
//   ] as const
// };

// // Type definitions derived from the constants
// export type TestimonialType = typeof TESTIMONIAL_CONSTANTS.TESTIMONIAL_TYPES[number];
// export type ContentFormat = typeof TESTIMONIAL_CONSTANTS.CONTENT_FORMATS[number];
// export type ContentStatus = typeof TESTIMONIAL_CONSTANTS.CONTENT_STATUSES[number];
// export type CollectionMethod = typeof TESTIMONIAL_CONSTANTS.COLLECTION_METHODS[number];
// export type VerificationType = typeof TESTIMONIAL_CONSTANTS.VERIFICATION_TYPES[number];
// export type SocialPlatform = typeof TESTIMONIAL_CONSTANTS.SOCIAL_PLATFORMS[number];
// export type SentimentLabel = typeof TESTIMONIAL_CONSTANTS.SENTIMENT_LABELS[number];

// // Helper types
// export type StringArray = string[];
// export type JSONMap = Record<string, unknown>;
// export type SocialProfiles = Partial<Record<SocialPlatform, string>>;

// export interface Sentiment {
//   score: number; // -1 to 1
//   label: SentimentLabel;
//   keywords: string[];
//   count: number; // Number of sentiment keywords detected
// }

// export interface CustomerProfile {
//   id: string;
//   // workspace_id: string;
//   external_id: string;
//   email: string;
//   name: string;
//   title: string;
//   company: string;
//   industry: string;
//   location: string;
//   avatar_url: string;
//   social_profiles: SocialProfiles;
//   custom_fields: JSONMap;
//   created_at: Date;
//   updated_at: Date;
// }

// // The Testimonial model
// export interface Testimonial {
//   // Identifiers
//   id: string;
//   workspace_id: string;

//   // Optional relation to the customer profile
//   customer_profile?: CustomerProfile;
//   sentiment: Sentiment
  
//   // Categorization & Status
//   testimonial_type: TestimonialType;
//   format: ContentFormat;
//   status: ContentStatus;
//   language?: string;

//   // Content
//   title?: string;
//   summary?: string;
//   content?: string;
//   transcript?: string;
//   media_urls?: StringArray;
//   rating?: number;

//   // Media Metadata
//   media_url?: string;
//   media_duration?: number;
//   thumbnail_url?: string;
//   additional_media?: JSONMap;

//   // Contexts
//   product_context?: JSONMap;
//   purchase_context?: JSONMap;
//   experience_context?: JSONMap;

//   // Collection & Verification
//   collection_method: CollectionMethod;
//   verification_method: VerificationType;
//   verification_data: JSONMap;
//   verification_status: string;
//   verified_at?: Date;
//   authenticity_score?: number;
//   source_data?: JSONMap;

//   // Publishing
//   published: boolean;
//   is_featured?: boolean;
//   published_at?: Date;
//   scheduled_publish_at?: Date;

//   // Organization
//   tags?: StringArray;
//   categories?: StringArray;
//   custom_fields?: JSONMap;

//   // Usage Metrics
//   view_count: number;
//   share_count: number;
//   conversion_count: number;
//   engagement_metrics?: JSONMap;

//   // Timestamps
//   created_at: Date;
//   updated_at: Date;
// }

// export interface SentimentSummary {
//   label: SentimentLabel;
//   count: number;
//   percentage: number;
// }

// export interface TestimonialFilters {
//   dateRange?: { from?: Date; to?: Date };
//   sentiment?: 'positive' | 'negative' | 'neutral' | '';
//   testimonialType?: string;
//   status?: 'published' | 'pending' | 'rejected' | '';
//   rating?: number | '';
//   format?: 'text' | 'video' | 'audio' | '';
// }