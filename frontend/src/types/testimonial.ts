// Database schema TypeScript types
// Generated from PostgreSQL schema

// Enum types
export type ContentType = "video" | "text" | "voice";
export type ContentStatus =
  | "draft"
  | "processing"
  | "approved"
  | "published"
  | "failed";
export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type SocialPlatform = "linkedin";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";
export type OAuthStatus = "connected" | "expired" | "revoked" | "error";
export type CollectionMethod =
  | "widget"
  | "form"
  | "email"
  | "dashboard_import"
  | "drive_import"
  | "voice_call";

// Base types for common fields
export interface BaseEntity {
  id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Users table
export interface User extends BaseEntity {
  firebase_uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  settings: Record<string, any>;
  last_active_at?: string;
}

// Workspaces table
export interface Workspace extends BaseEntity {
  name: string;
  industry?: string;
  website_url?: string;
  plan: string;
  settings: Record<string, any>;
  brand_context: Record<string, any>;
  total_testimonials: number;
}

// Team Members table
export interface TeamMember extends BaseEntity {
  workspace_id: string;
  user_id: string;
  role: string;
  permissions: Record<string, any>;
}

// Testimonials table
export interface Testimonial extends BaseEntity {
  workspace_id: string;

  // Author information
  author_name?: string;
  author_email?: string;
  author_company?: string;
  author_title?: string;
  author_avatar_url?: string;

  // Content
  type: ContentType;
  status: ContentStatus;
  format?: string;
  content?: string;
  media_url?: string;
  audio_url?: string; // For voice testimonials
  transcript_segments: Array<any>;

  // Collection metadata
  sentiment_score: number;
  collection_method: CollectionMethod;
  rating?: number; // 1-5
  metadata: Record<string, any>;

  conversion_count: number;

  // Processing
  processing_status: JobStatus;
  processing_metadata: Record<string, any>;

  tags: string[];
  artifacts: TestimonialArtifact[];
}

// Testimonial Artifacts table

export type ProcessingType =
  | "sentiment_analysis"
  | "highlight_extraction"
  | "enhancement"
  | "clipping"
  | "story_mode_generation"
  | "best_story_moments"
  | "video_platform_optimization"
  | "text_platform_optization"
  | "content_generation"
  | "text_polishing"
  | "translation"
  | "viral_analysis"
  | "custom_pipeline"
  | "data_analysis"
  | "talk_to_data"
  | "narration";
export interface TestimonialArtifact extends BaseEntity {
  testimonial_id: string;
  workspace_id: string;

  // Processing identification
  processing_type: ProcessingType;
  result_category: string;

  // Content storage
  text_content?: string;
  data: Record<string, any>;
  asset_url?: string;

  // Context and metadata
  content_type?: string;
  platform?: string;
  format?: string;

  // User interaction
  is_user_saved: boolean;
  is_streamed: boolean;
  source_id: string;

  // Processing metadata
  processing_metadata: Record<string, any>;
}

// Social Accounts table
export interface SocialAccount extends BaseEntity {
  workspace_id: string;
  user_id: string;
  platform: SocialPlatform;

  // OAuth credentials
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;

  // Platform identification
  platform_user_id: string;
  platform_username?: string;
  platform_email?: string;
  account_name?: string;
  account_type?: string;

  // Essential metadata
  platform_data: Record<string, any>;
  permissions?: string[];

  // Status and error tracking
  status: OAuthStatus;
  last_error?: string;
  last_sync_at?: string;
}

// Social Posts table
export interface SocialPost extends BaseEntity {
  workspace_id: string;
  testimonial_id?: string;
  social_account_id: string;

  // Content with media support
  content: string;
  post_type: string;
  media_urls?: string[];
  hashtags?: string[];

  // Platform posting data
  platform: SocialPlatform;
  platform_post_id?: string;
  platform_url?: string;

  // Scheduling and status
  status: PostStatus;
  scheduled_at?: string;
  published_at?: string;

  // Basic metrics
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;

  // Platform-specific metadata
  platform_data: Record<string, any>;

  // Error handling and retry logic
  error_details?: Record<string, any>;
  retry_count: number;
  max_retries: number;

  // Performance tracking
  last_metrics_sync?: string;
}

// Jobs table
export interface Job extends BaseEntity {
  job_type: string;

  // Specific foreign keys
  testimonial_id?: string;
  social_post_id?: string;
  workspace_id?: string;

  // Job execution
  status: JobStatus;
  priority: number;
  scheduled_at: string;

  // Job data
  payload: Record<string, any>;
  result: Record<string, any>;

  // Error handling
  error_message?: string;
  retry_count: number;
  max_retries: number;
}

// Email Requests table
export interface EmailRequest extends BaseEntity {
  workspace_id: string;

  // Recipient information
  contact_name: string;
  contact_email: string;
  company_name?: string;

  // Email content
  subject: string;
  custom_message?: string;
  template_name: string;

  // Collection URL
  collection_url: string;

  // Tracking
  tracking_token: string;
  status: string;

  // Timestamps
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  responded_at?: string;

  // Provider data
  provider_message_id?: string;
  provider_response: Record<string, any>;
}

// Email Logs table
export interface EmailLog {
  id: string;
  email_request_id: string;

  // Provider details
  provider: string;
  provider_message_id?: string;

  // Simple status tracking
  status: string;
  event_type?: string;

  // Error handling
  error_message?: string;

  created_at: string;
}

// Email Templates table
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: any[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Google Drive Accounts table
export interface GoogleDriveAccount extends BaseEntity {
  workspace_id: string;
  user_id: string;

  // OAuth tokens
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: string;

  // Account info
  account_email?: string;
  account_name?: string;

  // Status
  status: string;
  last_error?: string;
}

// Utility types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common request/response types
export interface CreateTestimonialRequest {
  workspace_id: string;
  author_name?: string;
  author_email?: string;
  author_company?: string;
  author_title?: string;
  content?: string;
  type: ContentType;
  rating?: number;
  collection_method: CollectionMethod;
  tags?: string[];
}

export interface PostMetrics {
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}

export interface CreateSocialPostRequest {
  workspace_id: string;
  testimonial_id?: string;
  social_account_id: string;
  content: string;
  post_type: string;
  media_urls?: string[];
  hashtags?: string[];
  scheduled_at?: string;
}

// Form validation types
export interface TestimonialFormData {
  author_name: string;
  author_email: string;
  author_company?: string;
  author_title?: string;
  content: string;
  rating?: number;
  tags?: string[];
}

export interface WorkspaceFormData {
  name: string;
  industry?: string;
  website_url?: string;
  plan: string;
}

// Filter and search types
export interface TestimonialFilters {
  status?: ContentStatus[];
  type?: ContentType[];
  rating?: number[];
  collection_method?: CollectionMethod[];
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface SocialPostFilters {
  status?: PostStatus[];
  platform?: SocialPlatform[];
  date_from?: string;
  date_to?: string;
}
