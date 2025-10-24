// src/components/capture-widget/types/index.ts

// Simplified configuration for the widget
export interface TestimonialWidgetConfig {
  apiBaseUrl: string;
  campaignId: string;
  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  companyName: string;
  companyLogo: string | null;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  maxDuration: number;
  darkMode: boolean;
  brandMode: "gradient" | "solid" | "minimal";
  dialogScale: number;
  roundedCorners: "sharp" | "rounded" | "pill";
  question: string;
}

// Simplified default configuration
export const defaultConfig: TestimonialWidgetConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE || "http://localhost:8081/api",
  campaignId: "",
  primaryColor: "#4F46E5",
  secondaryColor: "#8B5CF6",
  buttonText: "Share Your Story",
  companyName: "Cenphi",
  companyLogo: null,
  position: "bottom-right",
  maxDuration: 120,
  darkMode: false,
  brandMode: "gradient",
  dialogScale: 1,
  roundedCorners: "rounded",
  question: "What has your experience been like with our product?",
};

// Simplified author information type
export interface AuthorInfo {
  name: string;
  email: string;
  company: string;
  position: string;
  consent: boolean;
}

// Media types including voice AI
export type MediaType = "video" | "text" | "voice";

// Simplified capture state
export interface CaptureState {
  mode: "selection" | "video" | "text" | "voice";
  isRecording: boolean;
  recordedBlob: Blob | null;
  textContent: string;
  authorInfo: AuthorInfo;
  isSubmitting: boolean;
  error: string | null;
}

// Recording status
export type RecordingStatus =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "completed"
  | "error";

// Upload progress
export interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  estimatedTimeLeft: number;
}

export enum TestimonialStep {
  Info = 0,
  Method = 1,
  MediaOption = 2,
  Record = 3,
  Text = 4,
  Review = 5,
  ThankYou = 6,
}
