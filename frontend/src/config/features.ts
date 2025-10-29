// Feature flags configuration
export const FEATURES = {
  VOICE_AI_TESTIMONIALS: import.meta.env.VITE_ENABLE_VOICE_AI === "true",
  VOICE_AI_PREMIUM_ONLY: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] || false;
};

// Voice AI configuration
export const VOICE_AI_CONFIG = {
  VAPI_PUBLIC_KEY: import.meta.env.VITE_VAPI_PUBLIC_KEY || "",
  VAPI_ASSISTANT_ID: import.meta.env.VITE_VAPI_ASSISTANT_ID || "",
  MAX_CALL_DURATION: 300, // 5 minutes
  DEFAULT_QUESTIONS: [
    "What specific problem did our product/service solve for you?",
    "How has our solution impacted your business or daily routine?",
    "What would you tell someone considering our product/service?",
    "What made you choose us over other alternatives?",
    "Is there anything specific you'd want to highlight about your experience?",
  ],
  CALL_SCHEDULING: {
    MIN_ADVANCE_HOURS: 1,
    MAX_ADVANCE_DAYS: 30,
    BUSINESS_HOURS_START: 9,
    BUSINESS_HOURS_END: 18,
    TIMEZONE: "America/New_York",
  },
} as const;
