// types.ts
export type TestimonialType = "video" | "audio" | "text";

export interface GuidedPrompt {
  id: string;
  question: string;
  description: string;
  category: string;
}

export interface AIFeedbackData {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  summary: string;
  suggestions?: string[];
  keywords?: string[];
  contentWarnings?: string[];
}

export interface TestimonialState {
  type: TestimonialType | null;
  currentPromptIndex: number;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  feedback: AIFeedbackData | null;
}

// export interface TestimonialState {
//   type: TestimonialType | null;
//   currentPromptIndex: number;
//   isRecording: boolean;
//   isPaused: boolean;
//   duration: number;
//   feedback: string | null;
// }

// constants/prompts.ts

export interface GuidedPrompt {
  id: string;
  question: string;
  description: string;
  placeholder?: string;
  minLength?: number;
  suggestedDuration?: number; // in seconds, for video/audio
}

export const PROMPT_TIPS = {
  video: [
    "Speak naturally as if talking to a friend",
    "Feel free to pause and restart if needed",
    "Include specific examples when possible",
    "Natural lighting and clear audio help convey your message",
  ],
  audio: [
    "Find a quiet space for recording",
    "Speak clearly and at a natural pace",
    "Use specific examples to illustrate your points",
    "Take your time - you can always pause or restart",
  ],
  text: [
    "Be specific and use examples",
    "Break your response into paragraphs for readability",
    "Include numbers or metrics if relevant",
    "Write naturally as if explaining to a colleague",
  ],
};

export const TESTIMONIAL_CATEGORIES = [
  "Product Experience",
  "Customer Service",
  "Implementation",
  "Results & ROI",
  "Technical Support",
  "Training & Onboarding",
] as const;

export type TestimonialCategory = (typeof TESTIMONIAL_CATEGORIES)[number];
