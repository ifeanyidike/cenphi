// components/ai-studio/Constants.tsx
import { AI_SERVICES } from "./definitions";
import { VoiceOption } from "./types";

// export const categories = [
//   { id: "all", label: "All Services" },
//   { id: "video", label: "Video" },
//   { id: "audio", label: "Audio" },
//   { id: "content", label: "Content" },
//   { id: "optimization", label: "Optimization" },
// ];

export const categories = [
  { id: "all", label: "All", count: AI_SERVICES.length },
  {
    id: "video",
    label: "Video",
    count: AI_SERVICES.filter((s) => s.category === "video").length,
  },
  {
    id: "audio",
    label: "Audio",
    count: AI_SERVICES.filter((s) => s.category === "audio").length,
  },
  {
    id: "content",
    label: "Content",
    count: AI_SERVICES.filter((s) => s.category === "content").length,
  },
  {
    id: "optimization",
    label: "Optimization",
    count: AI_SERVICES.filter((s) => s.category === "optimization").length,
  },
];

// Configuration Data
export const backgroundMusicOptions = [
  { id: "ambient-corporate", name: "Ambient Corporate" },
  { id: "upbeat-modern", name: "Upbeat Modern" },
  { id: "inspiring-piano", name: "Inspiring Piano" },
  { id: "tech-minimal", name: "Tech Minimal" },
  { id: "emotional-strings", name: "Emotional Strings" },
];

export const platforms = [
  { id: "instagram_reel", name: "Instagram Reel", aspect: "9:16", icon: "📱" },
  { id: "instagram_feed", name: "Instagram Feed", aspect: "1:1", icon: "📷" },
  { id: "facebook_post", name: "Facebook Post", aspect: "16:9", icon: "📘" },
  { id: "tiktok", name: "TikTok", aspect: "9:16", icon: "🎵" },
  { id: "youtube_short", name: "YouTube Short", aspect: "9:16", icon: "📺" },
  { id: "linkedin_video", name: "LinkedIn Video", aspect: "16:9", icon: "💼" },
  { id: "twitter_video", name: "Twitter Video", aspect: "16:9", icon: "🐦" },
];

export const voices = {
  elevenlabs: [
    {
      id: "rachel",
      name: "Rachel",
      accent: "American",
      gender: "female",
      description: "Calm and professional",
    },
    {
      id: "drew",
      name: "Drew",
      accent: "American",
      gender: "male",
      description: "Confident and clear",
    },
    {
      id: "clyde",
      name: "Clyde",
      accent: "American",
      gender: "male",
      description: "Warm and friendly",
    },
    {
      id: "paul",
      name: "Paul",
      accent: "American",
      gender: "male",
      description: "Authoritative and strong",
    },
    {
      id: "domi",
      name: "Domi",
      accent: "American",
      gender: "female",
      description: "Young and vibrant",
    },
  ] as VoiceOption[],
  openai: [
    {
      id: "alloy",
      name: "Alloy",
      accent: "American",
      gender: "neutral",
      description: "Balanced and versatile",
    },
    {
      id: "echo",
      name: "Echo",
      accent: "American",
      gender: "male",
      description: "Clear and resonant",
    },
    {
      id: "fable",
      name: "Fable",
      accent: "British",
      gender: "female",
      description: "Expressive and engaging",
    },
    {
      id: "nova",
      name: "Nova",
      accent: "American",
      gender: "female",
      description: "Bright and energetic",
    },
    {
      id: "shimmer",
      name: "Shimmer",
      accent: "American",
      gender: "female",
      description: "Soft and soothing",
    },
  ] as VoiceOption[],
};
