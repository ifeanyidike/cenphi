// Enum-like union types for various testimonial properties
export type TestimonialType = "text" | "image" | "audio" | "video";
export type ContentStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived"
  | "featured";
export type CollectionMethod =
  | "direct_link"
  | "embed_form"
  | "qr_code"
  | "email_request"
  | "sms_request"
  | "api"
  | "social_import";
export type VerificationType =
  | "email"
  | "phone"
  | "social_login"
  | "order_verification"
  | "employee_verification"
  | "domain_verification";

// Optional date range interface for additional filters (if needed)
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

// Main Testimonial interface
export interface Testimonial {
  // Primary identifiers
  id: string;
  workspace_id: string;

  // Core status fields
  type: TestimonialType;
  status: ContentStatus;

  // Content details
  content?: string;
  media_urls?: string[];
  rating?: number | null;
  language?: string;

  // Customer information
  customer_name?: string;
  customer_email?: string | null;
  customer_title?: string;
  customer_company?: string;
  customer_location?: string;
  customer_avatar_url?: string;
  customer_metadata?: Record<string, any>;

  // Collection & verification
  collection_method: CollectionMethod;
  verification_method?: VerificationType;
  verification_data?: Record<string, any>;
  verified_at?: Date | string | null;
  source_data?: Record<string, any>;

  // Organizational categorization
  tags?: string[];
  categories?: string[];
  custom_fields?: Record<string, any>;

  // Usage metrics
  view_count: number;
  share_count: number;
  conversion_count: number;
  engagement_metrics?: Record<string, any>;

  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;
}
