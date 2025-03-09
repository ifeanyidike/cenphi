import { GuidedPrompt } from "./types";

// constants.ts
export const GUIDED_PROMPTS: GuidedPrompt[] = [
  {
    id: "initial-attraction",
    category: "Attraction",
    question: "What first caught your eye about our product?",
    description: "Briefly share what made you choose us.",
    placeholder: "I was drawn to...",
    minLength: 30,
    suggestedDuration: 20,
  },
  {
    id: "big-benefit",
    category: "Benefit",
    question: "What's the biggest difference our product has made for you?",
    description: "Tell us in a few words how our solution helped you.",
    placeholder: "The biggest benefit is...",
    minLength: 40,
    suggestedDuration: 30,
  },
  {
    id: "recommendation",
    category: "Recommendation",
    question: "What would you tell someone considering our product?",
    description: "Share your honest recommendation.",
    placeholder: "I'd recommend it because...",
    minLength: 40,
    suggestedDuration: 30,
  },
];

export const MAX_RECORDING_DURATION = 180; // 3 minutes
export const MAX_TEXT_LENGTH = 500;

// // Helper function to get relevant prompts for a category
// export const getPromptsByCategory = (
//   category: TestimonialCategory
// ): GuidedPrompt[] => {
//   // You can customize this to return different prompts based on category
//   return GUIDED_PROMPTS;
// };

// Helper function to get recording duration suggestion based on prompt
export const getSuggestedDuration = (
  prompt: GuidedPrompt,
  type: "video" | "audio"
): number => {
  return prompt.suggestedDuration || (type === "video" ? 45 : 30);
};

// Helper function to get minimum length requirement based on prompt
export const getMinLength = (prompt: GuidedPrompt): number => {
  return prompt.minLength || 50;
};
