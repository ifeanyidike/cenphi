// // Base enum types (you already have these)
// export type TestimonialType =
//   | "customer"
//   | "employee"
//   | "partner"
//   | "influencer"
//   | "expert"
//   | "case_study";

import { JSONArray, JSONObject } from "./helper";

// export type ContentFormat =
//   | "text"
//   | "video"
//   | "audio"
//   | "image"
//   | "social_post"
//   | "survey"
//   | "interview";

// export type ContentStatus =
//   | "pending_review"
//   | "requested"
//   | "approved"
//   | "rejected"
//   | "archived"
//   | "featured"
//   | "scheduled"
//   | "all";

// export type CollectionMethod =
//   | "direct_link"
//   | "embed_form"
//   | "qr_code"
//   | "email_request"
//   | "sms_request"
//   | "api"
//   | "social_import"
//   | "interview"
//   | "survey"
//   | "screen_recording"
//   | "event_capture";

// export type VerificationType =
//   | "email"
//   | "phone"
//   | "social_login"
//   | "order_verification"
//   | "employee_verification"
//   | "domain_verification";

// export type Sentiment =
//   | "very_negative"
//   | "negative"
//   | "neutral"
//   | "positive"
//   | "very_positive";

// export type AIServiceCategory =
//   | "analysis"
//   | "enhancement"
//   | "generation"
//   | "optimization"
//   | "verification"
//   | "segmentation"
//   | "recommendation";

// export type AnalysisAspect =
//   // Content Analysis
//   | "sentiment"
//   | "emotion"
//   | "tone"
//   | "language_pattern"
//   | "story_structure"
//   | "key_moments"
//   // Visual/Audio Analysis
//   | "facial_expression"
//   | "body_language"
//   | "voice_pattern"
//   | "background_analysis"
//   // Business Intelligence
//   | "competitor_mention"
//   | "product_mention"
//   | "feature_request"
//   | "pain_point"
//   | "buying_pattern"
//   | "decision_driver"
//   // Credibility
//   | "authenticity"
//   | "consistency"
//   | "fact_check"
//   | "social_verification";

// // Helper types
// export type StringArray = string[];
// export type JSONMap = { [key: string]: any };
// export type JSONBArray = JSONMap[];

// // Customer Profile
// export interface CustomerProfile {
//   id: string;
//   workspace_id: string;
//   external_id?: string;
//   email?: string;
//   name?: string;
//   title?: string;
//   company?: string;
//   industry?: string;
//   location?: string;
//   avatar_url?: string;
//   social_profiles?: JSONMap;
//   custom_fields?: JSONMap;
//   created_at: Date;
//   updated_at: Date;
// }

// // Story Analysis
// export interface StoryAnalysis {
//   id: string;
//   testimonial_id: string;

//   // Journey Mapping
//   customer_journey_points?: JSONBArray;
//   decision_points?: JSONBArray;
//   emotional_waypoints?: JSONBArray;

//   // Business Intelligence
//   product_mentions?: JSONBArray;
//   feature_requests?: JSONBArray;
//   pain_points?: JSONBArray;
//   competitor_mentions?: JSONBArray;

//   // Content Analysis
//   sentiment?: Sentiment;
//   sentiment_score?: number;
//   emotion_analysis?: JSONMap;
//   tone_analysis?: JSONMap;
//   language_quality_score?: number;

//   // Narrative Analysis
//   story_arc_type?: string;
//   story_elements?: JSONMap;
//   narrative_strength_score?: number;
//   storytelling_metrics?: JSONMap;
//   key_moments?: JSONBArray;

//   // Visual/Audio Analysis
//   facial_expression_analysis?: JSONMap;
//   voice_tone_analysis?: JSONMap;
//   body_language_analysis?: JSONMap;
//   video_quality_score?: number;
//   audio_quality_score?: number;

//   // Business Value Analysis
//   business_value_score?: number;
//   persuasiveness_score?: number;
//   relevance_score?: number;
//   uniqueness_score?: number;
//   feature_mentions?: JSONBArray;

//   // Brand Alignment
//   brand_alignment_score?: number;
//   brand_voice_consistency?: number;
//   value_proposition_match?: JSONMap;

//   // Audience Analysis
//   target_audience_relevance?: JSONMap;
//   demographic_insights?: JSONMap;
//   psychographic_insights?: JSONMap;

//   // Credibility Analysis
//   authenticity_indicators?: JSONBArray;
//   credibility_score?: number;
//   authenticity_score?: number;
//   consistency_score?: number;

//   // Processing Metadata
//   analysis_version?: string;
//   updated_at?: Date;
//   created_at: Date;
// }

// // DNA Profile
// export interface TestimonialDNAProfile {
//   id: string;
//   testimonial_id: string;

//   // Core Scores
//   authenticity_score?: number;
//   emotional_coherence_score?: number;
//   narrative_strength_score?: number;
//   brand_alignment_score?: number;
//   impact_potential_score?: number;
//   credibility_score?: number;

//   // Detailed Analysis
//   linguistic_patterns?: JSONMap;
//   emotional_patterns?: JSONMap;
//   narrative_elements?: JSONMap;
//   credibility_factors?: JSONMap;
//   key_themes?: StringArray;

//   // Verification
//   verification_sources?: JSONBArray;
//   verification_score?: number;

//   // Metadata
//   generation_version?: string;
//   last_updated_at?: Date;
//   created_at: Date;
// }

// // AI Processing Job
// export interface AIProcessingJob {
//   id: string;
//   testimonial_id: string;
//   service_category: AIServiceCategory;
//   status: string;
//   priority?: number;
//   processing_details?: JSONMap;
//   started_at?: Date;
//   completed_at?: Date;
//   error_details?: JSONMap;
//   created_at: Date;
// }

// // AI Generated Content
// export interface AIGeneratedContent {
//   id: string;
//   testimonial_id: string;
//   job_id: string;

//   // Content Details
//   content_type?: string;
//   original_content_ref?: string;
//   generated_content_ref?: string;
//   generation_prompt?: string;
//   generation_parameters?: JSONMap;

//   // Quality Control
//   quality_score?: number;
//   validation_status?: string;

//   created_at: Date;
// }

// // Competitor Mention
// export interface CompetitorMention {
//   id: string;
//   testimonial_id: string;
//   competitor_name: string;
//   context?: string;
//   sentiment?: Sentiment;
//   sentiment_score?: number;
//   comparison_type?: string;
//   ai_confidence_score?: number;
//   created_at: Date;
// }

// // The Complete Testimonial model with all associated data
// export interface Testimonial {
//   // Identifiers
//   id: string;
//   workspace_id: string;

//   // Optional relation to the customer profile
//   customer_profile_id?: string;
//   customer_profile?: CustomerProfile;

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
//   extracted_text?: string;
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
//   verification_method?: VerificationType;
//   verification_data?: JSONMap;
//   verification_status: string;
//   verified_at?: Date;
//   authenticity_score?: number;
//   source_data?: JSONMap;

//   // Publishing
//   published: boolean;
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
//   engagement_metrics: JSONMap;

//   // Timestamps
//   created_at: Date;
//   updated_at: Date;

//   story_analyses?: StoryAnalysis[];
//   dna_profiles?: TestimonialDNAProfile[];
//   processing_jobs?: AIProcessingJob[];
//   generated_contents?: AIGeneratedContent[];
//   competitor_mentions?: CompetitorMention[];
// }
// export enum AnalysisType {
//   SENTIMENT = "sentiment",
//   KEY_INSIGHTS = "keyInsights",
//   TRANSCRIPT = "transcript",
//   ENGAGEMENT = "engagement",
//   EMOTIONS = "emotions",
//   KEYWORDS = "keywords",
//   TOPIC_MODELING = "topicModeling",
//   COMPARATIVE = "comparative",
// }

// export enum EnhancementType {
//   TEXT_IMPROVEMENT = "textImprovement",
//   VIDEO_EDITING = "videoEditing",
//   AUDIO_ENHANCEMENT = "audioEnhancement",
//   IMAGE_ENHANCEMENT = "imageEnhancement",
//   GRAMMAR_CORRECTION = "grammarCorrection",
//   TRANSLATION = "translation",
// }

// export enum ConversionType {
//   VIDEO_TO_TEXT = "videoToText",
//   AUDIO_TO_TEXT = "audioToText",
//   IMAGE_TO_TEXT = "imageToText",
//   TEXT_TO_AUDIO = "textToAudio",
//   TEXT_TO_IMAGE = "textToImage",
//   TEXT_TO_VIDEO = "textToVideo",
// }

// export enum SharingPlatform {
//   WEBSITE = "website",
//   FACEBOOK = "facebook",
//   TWITTER = "twitter",
//   INSTAGRAM = "instagram",
//   LINKEDIN = "linkedin",
//   EMAIL = "email",
//   EMBED = "embed",
//   DOWNLOAD = "download",
// }

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
  | "scheduled"
  | "requested"
  | "all";

export type CollectionMethod =
  | "website"
  | "email"
  | "chat"
  | "social"
  | "custom"
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

export type Sentiment =
  | "very_negative"
  | "negative"
  | "neutral"
  | "positive"
  | "very_positive";

export type AIServiceCategory =
  | "analysis"
  | "enhancement"
  | "generation"
  | "optimization"
  | "verification"
  | "segmentation"
  | "recommendation";

export type AnalysisType =
  | "sentiment"
  | "narrative"
  | "authenticity"
  | "audience"
  | "business_value"
  | "credibility"
  | "competitor"
  | "key_insights"
  | "topic_modelling"
  | "comparative"
  | "transcript"
  | "engagement"
  | "story";

export type TestimonialStyle =
  | "minimal"
  | "card"
  | "quote"
  | "bubble"
  | "highlight"
  | "modern"
  | "classic";

export type TestimonialLayout = "grid" | "carousel" | "masonry" | "list";

export type TestimonialShape = "rounded" | "square" | "circle";

// Filter for testimonial queries
export interface TestimonialFilter {
  types?: TestimonialType[];
  statuses?: ContentStatus[];
  minRating?: number;
  maxRating?: number;
  tags?: string[];
  categories?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  searchQuery?: string;
  collectionMethods?: CollectionMethod[];
}

// Customer Profile
export interface CustomerProfile {
  id: string;
  workspace_id: string;
  external_id?: string;
  email?: string;
  name?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  avatar_url?: string;
  social_profiles?: JSONObject;
  custom_fields?: JSONObject;
  created_at?: Date;
  updated_at?: Date;
}

// Testimonial Analysis
export interface TestimonialAnalysis {
  id: string;
  testimonial_id: string;
  analysis_type: AnalysisType;

  // Core metrics - all optional as they depend on analysis type
  sentiment_score?: number;
  authenticity_score?: number;
  emotional_score?: number;
  narrative_score?: number;
  business_value_score?: number;
  credibility_score?: number;

  // Detailed data
  analysis_data: JSONObject;
  extracted_insights?: JSONArray;

  // Metadata
  analysis_version?: string;
  created_at: Date;
  updated_at?: Date;
}

// Competitor Mention
export interface CompetitorMention {
  id: string;
  testimonial_id: string;
  competitor_name: string;
  context?: string;
  sentiment?: Sentiment;
  sentiment_score?: number;
  comparison_type?: string;
  ai_confidence_score?: number;
  created_at: Date;
}

// AI Processing Job
export interface AIJob {
  id: string;
  testimonial_id: string;
  job_type: AIServiceCategory;
  status: string;
  priority: number;

  // Input parameters
  input_parameters: JSONObject;

  // Processing metadata
  started_at?: Date;
  completed_at?: Date;
  error_details?: JSONObject;

  // Result data
  output_data?: JSONObject;
  output_reference_id?: string;

  created_at: Date;
  updated_at: Date;
}

// The Complete Testimonial model with all associated data
export interface Testimonial {
  // Identifiers
  id: string;
  workspace_id: string;

  // Customer relationship
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
  media_urls?: string[];
  rating?: number;

  // Media Metadata
  media_url?: string;
  media_duration?: number;
  thumbnail_url?: string;
  additional_media?: JSONArray;
  custom_formatting?: JSONObject;

  // Contexts
  product_context?: JSONObject;
  purchase_context?: JSONObject;
  experience_context?: JSONObject;

  // Collection & Verification
  collection_method?: CollectionMethod;
  trigger_source?: string;
  trigger_data?: JSONObject;
  verification_method?: VerificationType;
  verification_data?: JSONObject;
  verification_status: string;
  verified_at?: Date;
  authenticity_score?: number;
  source_data?: JSONObject;

  // Publishing
  published: boolean;
  published_at?: Date;
  scheduled_publish_at?: Date;

  // Organization
  tags?: string[];
  categories?: string[];
  custom_fields?: JSONObject;

  // Usage Metrics
  view_count: number;
  share_count: number;
  conversion_count: number;
  engagement_metrics: JSONObject;

  // Timestamps
  created_at: Date;
  updated_at: Date;

  // Associated Data (retrieved in FetchByID)
  analyses?: TestimonialAnalysis[];
  competitor_mentions?: CompetitorMention[];
  ai_jobs?: AIJob[];
}

export enum ConversionType {
  VIDEO_TO_TEXT = "videoToText",
  AUDIO_TO_TEXT = "audioToText",
  IMAGE_TO_TEXT = "imageToText",
  TEXT_TO_AUDIO = "textToAudio",
  TEXT_TO_IMAGE = "textToImage",
  TEXT_TO_VIDEO = "textToVideo",
}

export enum EnhancementType {
  TEXT_IMPROVEMENT = "textImprovement",
  VIDEO_EDITING = "videoEditing",
  AUDIO_ENHANCEMENT = "audioEnhancement",
  IMAGE_ENHANCEMENT = "imageEnhancement",
  GRAMMAR_CORRECTION = "grammarCorrection",
  TRANSLATION = "translation",
}

export enum SharingPlatform {
  WEBSITE = "website",
  FACEBOOK = "facebook",
  TWITTER = "twitter",
  INSTAGRAM = "instagram",
  LINKEDIN = "linkedin",
  EMAIL = "email",
  EMBED = "embed",
  DOWNLOAD = "download",
}

export type EditingMode =
  | "trim"
  | "crop"
  | "filter"
  | "text"
  | "draw"
  | "audio"
  | "speed";
export type EditorTab = "timeline" | "edit" | "subtitles" | "analytics";

// Timeline segments
export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  color: string;
}

// Subtitles
export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  enabled: boolean;
  subtitles: Subtitle[];
}

// Video filters
export type FilterType =
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue-rotate"
  | "blur"
  | "sepia"
  | "grayscale"
  | "invert";

export interface VideoFilter {
  id: string;
  type: FilterType;
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

// Video effects
export type EffectType =
  | "fade-in"
  | "fade-out"
  | "zoom-in"
  | "zoom-out"
  | "slide-left"
  | "slide-right";

export interface VideoEffect {
  id: string;
  type: EffectType;
  startTime: number;
  duration: number;
  intensity: number;
}

// Text overlays
export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  position: {
    x: number;
    y: number;
  };
  opacity: number;
}

// Audio adjustments
export interface AudioAdjustment {
  id: string;
  type: "volume" | "fadeIn" | "fadeOut" | "normalization";
  startTime: number;
  endTime: number;
  value: number;
}

// Export options
export interface ExportOptions {
  format: "mp4" | "webm" | "gif";
  quality: "low" | "medium" | "high";
  resolution: "480p" | "720p" | "1080p";
  fps: number;
  includeSubtitles: boolean;
  includeWatermark: boolean;
}

// AI-generated suggestions
export interface AIEditSuggestion {
  id: string;
  type: "keyframe" | "cut" | "highlight" | "filter";
  confidence: number;
  description: string;
  parameters: Record<string, any>;
}

// Smart object tracking
export interface TrackedObject {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  keyframes: {
    time: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
}