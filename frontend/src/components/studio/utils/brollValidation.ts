import { BrollConfig } from "../BrollConfigSection";
import { ContextType } from "./brollHelpers";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  shouldAcknowledge?: boolean; // If true, user can proceed on second attempt
}

export interface ValidateBrollConfigOptions {
  brollConfig: BrollConfig;
  testimonialId: string | undefined;
  contextType: ContextType;
  transcriptMissingAcknowledged: boolean;
  brollWarningAcknowledged: boolean;
  videoDuration: number; // Now passed as parameter from lazy-loaded duration
}

export function validateBrollConfig(
  options: ValidateBrollConfigOptions
): ValidationResult {
  const { brollConfig, brollWarningAcknowledged, videoDuration } = options;

  // Validation 1: Auto placement requires clips (AI will place them intelligently)
  if (
    brollConfig.placement_strategy === "auto" &&
    brollConfig.broll_clips.length === 0
  ) {
    return {
      isValid: false,
      errorMessage:
        "No B-roll clips selected.\n\n" +
        "B-roll footage adds visual interest and context to your video. With auto placement, our AI will intelligently position clips at relevant moments based on your content.\n\n" +
        "Click 'Get AI Suggestions' for AI-recommended clips, or 'Browse Library' to search manually.\n\n" +
        "Alternatively, you can disable the B-roll step if you don't want to add supplementary footage.",
    };
  }

  // Validation 2: Even distribution also requires clips
  if (
    brollConfig.placement_strategy === "even" &&
    brollConfig.broll_clips.length === 0
  ) {
    return {
      isValid: false,
      errorMessage:
        "No B-roll clips selected.\n\n" +
        "B-roll footage enhances your video with supplementary visuals. With even distribution, clips will be spread equally throughout your video.\n\n" +
        "Click 'Get AI Suggestions' for AI-recommended clips, or 'Browse Library' to manually select videos and images.\n\n" +
        "You can also disable the B-roll step if you prefer to proceed without supplementary footage.",
    };
  }

  // Validation 3: Warn about excessive B-roll
  if (brollConfig.broll_clips.length > 0) {
    const totalBrollDuration = brollConfig.broll_clips.reduce(
      (sum, clip) => sum + (clip.duration || 0),
      0
    );

    if (totalBrollDuration > videoDuration * 0.4 && !brollWarningAcknowledged) {
      return {
        isValid: false,
        shouldAcknowledge: true,
        errorMessage:
          `⚠️ B-roll Duration Warning\n\n` +
          `You've selected ${totalBrollDuration.toFixed(0)}s of B-roll footage, ` +
          `but your video is estimated to be ~${videoDuration}s long.\n\n` +
          `Too much B-roll may overwhelm your content. ` +
          `We recommend limiting B-roll to 30% of video length.\n\n` +
          `Click "Start Processing" again to continue anyway, or go back to adjust your clips.`,
      };
    }
  }

  return { isValid: true };
}
