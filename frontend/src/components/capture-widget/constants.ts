// src/components/capture-widget/constants.ts
import { TestimonialWidgetConfig } from "./types";

// Simplified essential icons for the widget
export const Icons = {
  video: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>`,
  text: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  record: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
};

// Simplified default window configuration for the widget
export const DEFAULT_WINDOW_CONFIG: Partial<TestimonialWidgetConfig> = {
  apiBaseUrl:
    (window.testimonialWidgetConfig as any)?.apiBaseUrl ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:8081/api",
  campaignId: (window.testimonialWidgetConfig as any)?.campaignId,
  primaryColor:
    (window.testimonialWidgetConfig as any)?.primaryColor || "#4F46E5",
  secondaryColor:
    (window.testimonialWidgetConfig as any)?.secondaryColor || "#8B5CF6",
  buttonText:
    (window.testimonialWidgetConfig as any)?.buttonText || "Share Your Story",
  companyName: (window.testimonialWidgetConfig as any)?.companyName || "Cenphi",
  companyLogo: (window.testimonialWidgetConfig as any)?.companyLogo || null,
  position: (window.testimonialWidgetConfig as any)?.position || "bottom-right",
  maxDuration: (window.testimonialWidgetConfig as any)?.maxDuration || 120,
  darkMode: (window.testimonialWidgetConfig as any)?.darkMode || false,
  brandMode: (window.testimonialWidgetConfig as any)?.brandMode || "gradient",
  dialogScale: (window.testimonialWidgetConfig as any)?.dialogScale || 1,
  roundedCorners:
    (window.testimonialWidgetConfig as any)?.roundedCorners || "rounded",
  question:
    (window.testimonialWidgetConfig as any)?.question ||
    "What has your experience been like with our product?",
};

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 1024 * 1024 * 250, // 250MB (with compression support)
  acceptedFormats: ["video/mp4", "video/webm", "video/quicktime", "video/avi"],
  supportedFormats: [
    { mime: "video/mp4", ext: "MP4", description: "Most common format" },
    { mime: "video/webm", ext: "WebM", description: "Web optimized" },
    { mime: "video/quicktime", ext: "MOV", description: "Apple format" },
    { mime: "video/avi", ext: "AVI", description: "Windows format" },
  ],
};
