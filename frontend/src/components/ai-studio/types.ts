// components/ai-studio/types.ts
export interface ProcessingJob {
  id: string;
  serviceId: string;
  testimonialId?: string;
  testimonialIds?: string[];
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

export type Segment = {
  id: string;
  keyPhrase?: string;
  startTime: number;
  endTime: number;
  theme: string;
  estimatedViralPotential: number;
  text: string;
  customerInfo: any;
};
