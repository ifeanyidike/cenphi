// components/ai-studio/Constants.tsx
import { VoiceOption } from "@/types/ai-service";

// Configuration Data
// constants/backgroundMusicOptions.ts
export const backgroundMusicOptions = [
  {
    id: "corporate",
    name: "Corporate Success",
    genre: "corporate",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    previewUrl:
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    filename: "corporate_background.mp3",
    description: "Corporate Success - Pixabay",
    duration: "2:27",
    mood: "Professional & Confident",
    bpm: 120,
  },
  {
    id: "upbeat",
    name: "Inspiring Energy",
    genre: "upbeat",
    url: "https://cdn.pixabay.com/download/audio/2025/07/08/audio_805ea6ff82.mp3",
    previewUrl:
      "https://cdn.pixabay.com/download/audio/2025/07/08/audio_805ea6ff82.mp3",
    filename: "upbeat_background.mp3",
    description: "Inspiring Energy - Pixabay",
    duration: "3:01",
    mood: "Energetic & Motivating",
    bpm: 130,
  },
  {
    id: "calm",
    name: "Peaceful Ambient",
    genre: "calm",
    url: "https://cdn.pixabay.com/download/audio/2025/07/10/audio_873bdee113.mp3",
    previewUrl:
      "https://cdn.pixabay.com/download/audio/2025/07/10/audio_873bdee113.mp3",
    filename: "calm_background.mp3",
    description: "Peaceful Ambient - Pixabay",
    duration: "2:36",
    mood: "Relaxing & Thoughtful",
    bpm: 80,
  },
  {
    id: "professional",
    name: "Business Innovation",
    genre: "corporate", // Using corporate genre for similar styling
    url: "https://cdn.pixabay.com/download/audio/2025/07/01/audio_b4ba06b5f2.mp3",
    previewUrl:
      "https://cdn.pixabay.com/download/audio/2025/07/01/audio_b4ba06b5f2.mp3",
    filename: "professional_background.mp3",
    description: "Business Innovation - Pixabay",
    duration: "0:37",
    mood: "Innovative & Strategic",
    bpm: 110,
  },
  {
    id: "social",
    name: "Modern Social",
    genre: "upbeat", // Using upbeat genre for similar styling
    url: "https://cdn.pixabay.com/download/audio/2025/05/12/audio_6383868169.mp3",
    previewUrl:
      "https://cdn.pixabay.com/download/audio/2025/05/12/audio_6383868169.mp3",
    filename: "social_background.mp3",
    description: "Modern Social - Pixabay",
    duration: "1:49",
    mood: "Social & Engaging",
    bpm: 125,
  },
];

// Type definition for TypeScript usage

export const platforms = [
  { id: "instagram_reels", name: "Instagram Reel", aspect: "9:16", icon: "📱" },
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
