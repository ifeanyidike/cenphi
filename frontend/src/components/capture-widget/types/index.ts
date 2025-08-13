// src/components/capture-widget/types/index.ts

// Configuration for the widget
export interface TestimonialWidgetConfig {
  apiBaseUrl: string;
  websocketBaseUrl: string;
  campaignId: string;
  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  companyName: string;
  companyLogo: string | null;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showTranscription: boolean;
  maxDuration: number;
  darkMode: boolean;
  chunkInterval: number;
  showAIHints: boolean;
  brandMode: "gradient" | "solid" | "minimal";
  dialogScale: number;
  roundedCorners: "sharp" | "rounded" | "pill";
}

// Default configuration
export const defaultConfig: TestimonialWidgetConfig = {
  // apiBaseUrl: "https://cenphi.io",
  // websocketBaseUrl: "wss://cenphi.io",
  apiBaseUrl: import.meta.env.VITE_API_BASE || "http://localhost:3300",
  websocketBaseUrl: import.meta.env.VITE_WS_BASE || "ws://localhost:3300",
  campaignId: "",
  primaryColor: "#4F46E5",
  secondaryColor: "#8B5CF6",
  buttonText: "Share Your Story",
  companyName: "Cenphi",
  companyLogo: null,
  position: "bottom-right",
  showTranscription: true,
  maxDuration: 60,
  darkMode: false,
  chunkInterval: 250,
  showAIHints: true,
  brandMode: "gradient",
  dialogScale: 1,
  roundedCorners: "rounded",
};

// Author information type
export interface AuthorInfo {
  name: string;
  email: string;
  company: string;
  position: string;
  consent: boolean;
  title?: string;
  description?: string;
  mediaType?: MediaType;
}

// Media types supported by the widget
export type MediaType = "video" | "audio" | "text";

// Camera orientation options
export type CameraOrientation = "portrait" | "landscape";

// Steps in the widget flow
export enum TestimonialStep {
  Info = 0,
  Method = 1,
  MediaOption = 2,
  Record = 3,
  Text = 4,
  Review = 5,
  ThankYou = 6,
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Transcription response
export interface TranscriptionResponse {
  text: string;
}

// Question suggestion response
export interface QuestionSuggestionResponse {
  questions: string[];
}

// WebSocket connection status
export type ConnectionStatus = "connected" | "connecting" | "disconnected";
