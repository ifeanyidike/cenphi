// Enum-like type aliases for string unions

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
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived"
  | "featured"
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

// Helper types

export type StringArray = string[];

// Placeholder for CustomerProfile type (if available)
export type JSONMap = { [key: string]: any };

export interface CustomerProfile {
  id: string; // uuid.UUID represented as a string
  workspace_id: string;
  external_id?: string;
  email?: string;
  name?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  avatar_url?: string;
  social_profiles?: JSONMap;
  custom_fields?: JSONMap;
  created_at: Date;
  updated_at: Date;
}

// The Testimonial model
export interface Testimonial {
  // Identifiers
  id: string; // uuid.UUID represented as string
  workspace_id: string;

  // Optional relation to the customer profile
  customer_profile_id?: string;
  customer_profile?: CustomerProfile;

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
  rating?: number; // float32 represented as number

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
  verified_at?: Date;
  authenticity_score?: number;
  source_data?: JSONMap;

  // Publishing
  published: boolean;
  published_at?: Date;
  scheduled_publish_at?: Date;

  // Organization
  tags?: StringArray;
  categories?: StringArray;
  custom_fields?: JSONMap;

  // Usage Metrics
  view_count: number;
  share_count: number;
  conversion_count: number;
  engagement_metrics: JSONMap;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}
