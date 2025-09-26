import { Testimonial } from "@/types/testimonial";

// utils/platform-utils.ts
export const PLATFORM_ASPECT_RATIOS = {
  instagram_reel: "9:16",
  instagram_feed: "1:1",
  instagram_story: "9:16",
  facebook_post: "16:9",
  tiktok: "9:16",
  youtube_short: "9:16",
  youtube_standard: "16:9",
  linkedin_video: "16:9",
  twitter_video: "16:9",
  whatsapp: "16:9",
} as const;

export const getPlatformAspectRatio = (platform: string): string => {
  const normalizedPlatform = platform.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return (
    PLATFORM_ASPECT_RATIOS[
      normalizedPlatform as keyof typeof PLATFORM_ASPECT_RATIOS
    ] || "9:16"
  ); // Default to instagram_reel
};

export const getOptimalResolution = (
  aspectRatio: string
): { width: number; height: number } => {
  switch (aspectRatio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "16:9":
    default:
      return { width: 1920, height: 1080 };
  }
};

export enum CollectionMethod {
  dashboard_import = "Dashboard import",
}

export const collection_method_map = (
  method: Testimonial["collection_method"]
) => {
  if (method === "dashboard_import") return "Import";
  else if (method === "drive_import") return "Drive";
  else if (method === "email") return "Email";
  else if (method === "form") return "Form";
  return "Widget";
};
