// components/ai-studio/types.ts

import { LucideIcon } from "lucide-react";

export interface SourceInfo {
  type:
    | "testimonial"
    | "artifact"
    | "clip"
    | "clips"
    | "best_story_moments"
    | "no_source";
  from?: string;
  data: any;
  raw_data?: any;
  appliedServices?: ServiceType[];
  parentTestimonialId?: string;
}

export type ServiceType =
  | "enhancement"
  | "story_mode"
  | "clipping"
  | "platform_optimizer"
  | "noise_removal"
  | "content_generation"
  | "text_polishing"
  | "translation"
  | "narration";

export type HighlightType =
  | "general"
  | "emotional"
  | "thematic"
  | "before_after"
  | "recommendation"
  | "metrics"
  | "results"
  | "solution"
  | "problem";

export interface ProcessingJob {
  id: string;
  serviceId: string;
  service: ServiceType;
  testimonialId?: string;
  testimonialIds?: string[];
  workspaceId: string;
  status:
    | "queued"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "streaming";
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  isStreaming?: boolean;
  config?: any;
  metadata?: Record<string, any>;
  sourceInfo: SourceInfo;
  dependsOn?: string[]; // Job IDs this job depends on
  canRetry?: boolean;
}

export interface ServicePreset {
  id: string;
  name: string;
  config: any;
  createdAt: Date;
}

export interface StreamingResult {
  content: string;
  isComplete: boolean;
  isStreaming: boolean;
  type: "markdown" | "text" | "json";
}

export interface VoiceOption {
  id: string;
  name: string;
  accent: string;
  gender: "male" | "female" | "neutral";
  description: string;
}

export type Word = {
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence: number;
};

export type Segment = {
  id: string;
  text: string;
  theme: string;
  start_time: number;
  end_time: number;
  words: Word[];
};

export type MediaEnhancementConfig = {
  quality: string;
  remove_noise: boolean;
  color_correction: boolean;
  custom_enhancements: string[];
  audio_enhancement?: boolean;
} & BrandingConfig &
  MusicConfig;

export type StoryModeConfig = {
  storyStyle: string;
  segments: Record<string, Segment[]>[];
} & BrandingConfig &
  MusicConfig;

export type PlatformOptimizerConfig = {
  target_platform: string;
  enable_captions: boolean;
  auto_resize: boolean;
  optimize_audio: boolean;
  optimization_quality: string;
  enable_audio_normalization: boolean;
  remove_noise: boolean;
  enable_media_enhancement: boolean;
} & BrandingConfig &
  MusicConfig;

export type SmartClippingConfig = {
  clip_duration: string;
  highlight_type: string;
  segments: Record<string, Segment[]>[];
  max_clips: number;
} & BrandingConfig &
  MusicConfig;

export type NoiseRemovalConfig = {
  level: "low" | "medium" | "high";
};

export type NarrationConfig = {
  voice_provider?: string;
  voice_id: string;
  preferred_provider: string;
  gender: "male" | "female" | "neutral";
  style: string;
  language: string;
  optimize_speech: boolean;
  output_format: string;
  speed?: string;
} & MusicConfig;

export type BrandingConfig = {
  add_branding: boolean;
  logo_url?: string;
  include_logo: boolean;
  include_watermark: boolean;
  logo_position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  watermark_position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  watermark_text?: string;
};

export type MusicConfig = {
  add_background_music: boolean;
  background_music: string;
  music_volume?: "low" | "medium" | "high";
  custom_music_url?: string;
};

export type ContentConfig = {
  content_type?: string;
  prompt: string | null;
};

export type TextPolishingConfig = {
  preserve_authenticity?: boolean;
  target_style?: string;
  prompt?: string | null;
};

export type TextTranslationConfig = {
  target_lang?: string;
  prompt?: string | null;
};

// Union of all possible configs
export type DefaultSettings =
  | MediaEnhancementConfig
  | StoryModeConfig
  | PlatformOptimizerConfig
  | SmartClippingConfig
  | NoiseRemovalConfig
  | NarrationConfig
  | MusicConfig
  | BrandingConfig
  | ContentConfig
  | TextPolishingConfig
  | undefined;

// Main type
export type AIService = {
  id: ServiceType;
  title: string;
  description: string;
  icon: LucideIcon;
  category: "video" | "audio" | "content";
  estimatedTime: string;
  // complexity: "Beginner" | "Intermediate" | "Advanced";
  business_impact: string;
  features: string[];
  gradient: string;
  shouldQueue: boolean;
  complexity_score: number;
  supportsStreaming: boolean;
  endpoint: string;
  hasCustomConfig: boolean;
  defaultSettings?: DefaultSettings;
  isStreamlined?: boolean;
  streamlinedType?:
    | "content_selection"
    | "style_selection"
    | "language_selection";
};

export type Preset = {
  id: string;
  name: string;
  config: DefaultSettings;
  createdAt: Date;
};

export interface VoiceOption {
  id: string;
  name: string;
  provider: "elevenlabs" | "openai";
  gender: "male" | "female" | "neutral";
  accent: string;
  description: string;
  previewUrl?: string;
  category: "professional" | "casual" | "energetic" | "calm";
}

export interface SSEEvent {
  type: string;
  data: any;
  event?: string;
  id?: string;
  retry?: number;
}

export interface JobStatusUpdate {
  job_id: string;
  service_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
  metadata?: any;
}

export interface StreamChunk {
  type: "chunk" | "complete" | "error";
  content: string;
  content_type?: "text" | "markdown" | "json";
  job_id?: string;
  service_id?: string;
}

export interface BackgroundMusicTrack {
  id: string;
  name: string;
  genre:
    | "corporate"
    | "upbeat"
    | "calm"
    | "energetic"
    | "dramatic"
    | "emotional";
  url: string;
  previewUrl: string;
  filename: string;
  description: string;
  duration: string;
  mood: string;
  bpm: number;
}

export interface ServiceLineageResult {
  applied_services: string[];
  available_services: string[];
  blocked_services: string[];
  last_processed_at: string;
  service_tree: ServiceNode[];
}

export interface ServiceNode {
  id: string;
  processing_type: string;
  created_at: string;
  asset_url?: string;
  text_content?: string;
  children: ServiceNode[];
}
