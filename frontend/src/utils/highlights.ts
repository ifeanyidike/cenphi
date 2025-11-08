// src/utils/highlights.ts
import pako from "pako";

import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Heart,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";

// Available highlight types from backend
export const HIGHLIGHT_TYPES = {
  highlights: {
    // should be general
    label: "General Highlights",
    description: "Most engaging overall moments",
    icon: BookOpen,
    color: "gray",
  },
  problem: {
    label: "Problem/Challenge",
    description: "Customer describing pain points",
    icon: Target,
    color: "red",
  },
  solution: {
    label: "Solution Discovery",
    description: "How they found your solution",
    icon: Lightbulb,
    color: "yellow",
  },
  results: {
    label: "Results & Outcomes",
    description: "Specific outcomes achieved",
    icon: TrendingUp,
    color: "green",
  },
  metrics: {
    label: "Metrics & ROI",
    description: "Numbers, percentages, ROI",
    icon: BarChart3,
    color: "blue",
  },
  recommendation: {
    label: "Recommendations",
    description: "Direct endorsements",
    icon: MessageSquare,
    color: "purple",
  },
  before_after: {
    label: "Before/After",
    description: "Transformation stories",
    icon: ArrowUpDown,
    color: "indigo",
  },
  emotional: {
    label: "Emotional Moments",
    description: "Genuine excitement, relief",
    icon: Heart,
    color: "pink",
  },
} as const;

export type HighlightType = keyof typeof HIGHLIGHT_TYPES;

export function uint8ArrayToBase64(u8: Uint8Array): string {
  const CHUNK = 0x8000; // 32KB
  let i = 0;
  let result = "";
  while (i < u8.length) {
    const chunk = u8.subarray(i, Math.min(i + CHUNK, u8.length));
    result += String.fromCharCode.apply(null, Array.from(chunk));
    i += CHUNK;
  }
  return btoa(result);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeSegmentsToBase64(obj: unknown): string {
  const json = JSON.stringify(obj);
  // pako.gzip accepts string, returns Uint8Array
  const compressed: Uint8Array = pako.gzip(json);
  return uint8ArrayToBase64(compressed);
}

export function decodeSegmentsFromBase64<T = any>(b64: string): T {
  const compressed = base64ToUint8Array(b64);
  // pako.ungzip with { to: "string" } returns string
  const json = pako.ungzip(compressed, { to: "string" });
  return JSON.parse(json) as T;
}
