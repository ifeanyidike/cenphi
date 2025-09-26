// types/onboarding.ts

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

export interface UserIntent {
  id: string;
  type: "marketing" | "sales" | "product" | "agency";
  selected?: boolean;
}

export interface TestimonialUpload {
  id: string;
  type: "video" | "audio" | "text";
  file?: File;
  url?: string;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
}

export interface ProcessingStatus {
  step: "uploading" | "transcribing" | "extracting" | "rendering";
  progress: number;
  message: string;
  estimatedTimeRemaining: number;
  completed: boolean;
  error?: string;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  confidence?: number;
  editable?: boolean;
}

export interface TestimonialHighlight {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  category:
    | "impact"
    | "emotion"
    | "result"
    | "recommendation"
    | "feature"
    | "problem";
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  editable?: boolean;
}

export interface GeneratedClip {
  id: string;
  url: string;
  duration: number;
  format: "mp4" | "webm";
  resolution: string;
  size: number;
  thumbnail: string;
  highlights: string[];
  createdAt: string;
}

export interface BrandContext {
  id: string;
  workspaceId: string;
  name?: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  industry?: string;
  description?: string;
  website?: string;
  socialMedia?: {
    [platform: string]: string;
  };
  extractedAt: string;
  status: "extracting" | "completed" | "error";
  confidence: number;
}

export interface WorkspaceSetup {
  id: string;
  name: string;
  websiteUrl?: string;
  brandContext?: Partial<BrandContext>;
  createdAt: string;
}

export interface TeamMemberSetup {
  id: string;
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  userIntent?: UserIntent;
  uploadedTestimonial?: TestimonialUpload;
  processingStatus?: ProcessingStatus;
  processedResults?: {
    videoUrl: string;
    transcript: TranscriptSegment[];
    highlights: TestimonialHighlight[];
    clips: GeneratedClip[];
  };
  brandContext?: BrandContext;
  workspace?: WorkspaceSetup;
}

export interface OnboardingAPI {
  setup: (data: {
    workspace: Partial<WorkspaceSetup>;
    teamMember: Partial<TeamMemberSetup>;
  }) => Promise<{ workspaceId: string; teamMemberId: string }>;

  uploadTestimonial: (
    file: File,
    workspaceId: string
  ) => Promise<TestimonialUpload>;

  importTestimonial: (
    url: string,
    workspaceId: string
  ) => Promise<TestimonialUpload>;

  startDemo: (workspaceId: string) => Promise<TestimonialUpload>;

  getProcessingStatus: (testimonialId: string) => Promise<ProcessingStatus>;

  getProcessedResults: (testimonialId: string) => Promise<{
    videoUrl: string;
    transcript: TranscriptSegment[];
    highlights: TestimonialHighlight[];
    clips: GeneratedClip[];
  }>;

  saveTestimonial: (
    testimonialId: string,
    options: {
      publish: boolean;
      libraryOnly: boolean;
    }
  ) => Promise<{ saved: boolean; publishUrl?: string }>;

  extractBrandContext: (
    websiteUrl: string,
    workspaceId: string
  ) => Promise<BrandContext>;

  getBrandContext: (workspaceId: string) => Promise<BrandContext | null>;
}

export interface SSEProcessingEvent {
  type: "progress" | "completed" | "error";
  data: {
    step?: string;
    progress?: number;
    message?: string;
    testimonialId?: string;
    results?: any;
    error?: string;
  };
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface OnboardingConfig {
  maxFileSize: number;
  supportedFormats: string[];
  processingTimeout: number;
  allowedDomains: string[];
  features: {
    backgroundBrandExtraction: boolean;
    realTimeProcessing: boolean;
    autoClipGeneration: boolean;
    aiHighlights: boolean;
  };
}

// Event handlers
export interface OnboardingEventHandlers {
  onStepChange: (step: number) => void;
  onIntentSelect: (intent: UserIntent) => void;
  onFileUpload: (file: File) => void;
  onUrlImport: (url: string) => void;
  onDemoStart: () => void;
  onProcessingStart: (testimonialId: string) => void;
  onProcessingUpdate: (status: ProcessingStatus) => void;
  onProcessingComplete: (results: any) => void;
  onError: (error: string) => void;
  onSave: (options: { publish: boolean }) => void;
  onComplete: () => void;
}

// Store interfaces
export interface OnboardingStore {
  progress: OnboardingProgress;
  config: OnboardingConfig;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setIntent: (intent: UserIntent) => void;
  uploadFile: (file: File) => Promise<void>;
  importUrl: (url: string) => Promise<void>;
  startDemo: () => Promise<void>;
  saveResults: (options: { publish: boolean }) => Promise<void>;
  reset: () => void;

  // Getters
  getCurrentStep: () => OnboardingStep;
  getProgress: () => number;
  canProceed: () => boolean;
}
