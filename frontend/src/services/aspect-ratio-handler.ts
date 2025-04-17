import { makeAutoObservable } from "mobx";
import { AspectRatio } from "../repo/managers/video_editor";

/**
 * Enhanced AspectRatioHandler - A utility class to handle aspect ratio changes for canvas rendering
 * Resolves issues with aspect ratio changes in the canvas-based video implementation
 */
export class AspectRatioHandler {
  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Calculates dimensions and positioning for a video within a container
   * taking into account the selected aspect ratio
   *
   * @param containerWidth - The width of the container
   * @param containerHeight - The height of the container
   * @param videoWidth - The original width of the video
   * @param videoHeight - The original height of the video
   * @param aspectRatio - The target aspect ratio setting
   * @param customRatio - Custom ratio values if aspectRatio is "custom"
   * @returns Dimensions and positioning for the video in the container
   */
  calculateDisplayDimensions(
    containerWidth: number,
    containerHeight: number,
    videoWidth: number,
    videoHeight: number,
    aspectRatio: AspectRatio,
    customRatio?: { width: number; height: number }
  ): {
    width: number;
    height: number;
    left: number;
    top: number;
    scale: number;
  } {
    // Calculate the original aspect ratio of the video
    const originalAspectRatio = videoWidth / videoHeight;

    // Determine the target aspect ratio based on settings
    let targetAspectRatio: number;

    switch (aspectRatio) {
      case "16:9":
        targetAspectRatio = 16 / 9;
        break;
      case "4:3":
        targetAspectRatio = 4 / 3;
        break;
      case "1:1":
        targetAspectRatio = 1;
        break;
      case "9:16":
        targetAspectRatio = 9 / 16;
        break;
      case "custom":
        if (customRatio) {
          targetAspectRatio = customRatio.width / customRatio.height;
        } else {
          targetAspectRatio = originalAspectRatio;
        }
        break;
      case "original":
      default:
        targetAspectRatio = originalAspectRatio;
        break;
    }

    // Calculate the dimensions that fit in the container
    let width = containerWidth;
    let height = containerWidth / targetAspectRatio;

    // If too tall, constrain by height instead
    if (height > containerHeight) {
      height = containerHeight;
      width = containerHeight * targetAspectRatio;
    }

    // Calculate position to center the video
    const left = (containerWidth - width) / 2;
    const top = (containerHeight - height) / 2;

    // Calculate scale factor for rendering video content
    // This is important for the canvas rendering system
    const scale = width / videoWidth;

    return {
      width: Math.round(width),
      height: Math.round(height),
      left: Math.round(left),
      top: Math.round(top),
      scale,
    };
  }

  /**
   * Calculates crop parameters when changing aspect ratio
   * This applies intelligent cropping instead of stretching
   *
   * @param currentCrop - The current crop settings
   * @param newAspectRatio - The new aspect ratio to apply
   * @param originalAspectRatio - The original video's aspect ratio
   * @returns Updated crop settings
   */
  changeAspectRatio(
    currentCrop: { x: number; y: number; width: number; height: number },
    newAspectRatio: AspectRatio,
    originalAspectRatio: number,
    customRatio?: { width: number; height: number }
  ): { x: number; y: number; width: number; height: number } {
    // If returning to original, use full frame
    console.log("current crop", currentCrop);
    if (newAspectRatio === "original") {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    // Convert aspect ratio string to a numeric value
    let targetRatio: number;
    switch (newAspectRatio) {
      case "16:9":
        targetRatio = 16 / 9;
        break;
      case "4:3":
        targetRatio = 4 / 3;
        break;
      case "1:1":
        targetRatio = 1;
        break;
      case "9:16":
        targetRatio = 9 / 16;
        break;
      case "custom":
        targetRatio = customRatio
          ? customRatio.width / customRatio.height
          : 16 / 9; // Default fallback
        break;
      default:
        targetRatio = originalAspectRatio;
    }

    // Calculate if we need to crop horizontally or vertically based on the original video
    if (targetRatio > originalAspectRatio) {
      // Target is WIDER than original - need to crop TOP and BOTTOM
      const newHeight = 100 * (originalAspectRatio / targetRatio);
      const yOffset = (100 - newHeight) / 2;

      return {
        x: 0, // Keep full width
        y: yOffset, // Center vertically
        width: 100, // Full width
        height: newHeight, // Reduced height to match target ratio
      };
    } else if (targetRatio < originalAspectRatio) {
      // Target is TALLER than original - need to crop LEFT and RIGHT
      const newWidth = 100 * (targetRatio / originalAspectRatio);
      const xOffset = (100 - newWidth) / 2;

      return {
        x: xOffset, // Center horizontally
        y: 0, // Keep full height
        width: newWidth, // Reduced width to match target ratio
        height: 100, // Full height
      };
    }

    // If ratios match exactly, return full frame
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  /**
   * Preserves the center of the current crop when switching aspect ratios
   *
   * @param originalAspectRatio - The original video's aspect ratio
   * @param currentCrop - The current crop settings
   * @param newAspectRatio - The new aspect ratio setting
   * @param customRatio - Custom ratio values if newAspectRatio is "custom"
   * @returns Updated crop settings
   */
  preserveCurrentCrop(
    originalAspectRatio: number,
    currentCrop: { x: number; y: number; width: number; height: number },
    newAspectRatio: AspectRatio,
    customRatio?: { width: number; height: number }
  ): { x: number; y: number; width: number; height: number } {
    // If returning to original, use full frame
    if (newAspectRatio === "original") {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    // Convert aspect ratio string to a numeric value
    let targetRatio: number;
    switch (newAspectRatio) {
      case "16:9":
        targetRatio = 16 / 9;
        break;
      case "4:3":
        targetRatio = 4 / 3;
        break;
      case "1:1":
        targetRatio = 1;
        break;
      case "9:16":
        targetRatio = 9 / 16;
        break;
      case "custom":
        targetRatio = customRatio
          ? customRatio.width / customRatio.height
          : 16 / 9;
        break;
      default:
        targetRatio = originalAspectRatio;
    }

    // Calculate center point of current crop
    const centerX = currentCrop.x + currentCrop.width / 2;
    const centerY = currentCrop.y + currentCrop.height / 2;

    // Calculate current effective aspect ratio
    const currentCropRatio =
      (currentCrop.width / currentCrop.height) * originalAspectRatio;

    // Create a new crop object
    let newCrop = { ...currentCrop };

    if (targetRatio > currentCropRatio) {
      // Target is wider - maintain height and adjust width
      const newWidth = (currentCrop.height * targetRatio) / originalAspectRatio;
      const newX = centerX - newWidth / 2;

      newCrop = {
        x: Math.max(0, Math.min(newX, 100 - newWidth)),
        y: currentCrop.y,
        width: Math.min(newWidth, 100),
        height: currentCrop.height,
      };
    } else if (targetRatio < currentCropRatio) {
      // Target is taller - maintain width and adjust height
      const newHeight = (currentCrop.width * originalAspectRatio) / targetRatio;
      const newY = centerY - newHeight / 2;

      newCrop = {
        x: currentCrop.x,
        y: Math.max(0, Math.min(newY, 100 - newHeight)),
        width: currentCrop.width,
        height: Math.min(newHeight, 100),
      };
    }

    // Ensure values stay within bounds
    newCrop.x = Math.max(0, Math.min(newCrop.x, 100 - newCrop.width));
    newCrop.y = Math.max(0, Math.min(newCrop.y, 100 - newCrop.height));
    newCrop.width = Math.min(newCrop.width, 100 - newCrop.x);
    newCrop.height = Math.min(newCrop.height, 100 - newCrop.y);

    return newCrop;
  }

  /**
   * Calculates crop parameters needed for preserving the selected portion
   * of the video when rendering to the canvas
   *
   * @param sourceCrop - The crop settings in percentage (0-100)
   * @param sourceWidth - The original video width in pixels
   * @param sourceHeight - The original video height in pixels
   * @param canvasWidth - The display canvas width in pixels
   * @param canvasHeight - The display canvas height in pixels
   * @returns Canvas drawing parameters for the crop
   */
  calculateCanvasCropParameters(
    sourceCrop: { x: number; y: number; width: number; height: number },
    sourceWidth: number,
    sourceHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): {
    sx: number;
    sy: number;
    sWidth: number;
    sHeight: number;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  } {
    // Convert percentage crop values to pixel values
    const sx = Math.floor((sourceCrop.x / 100) * sourceWidth);
    const sy = Math.floor((sourceCrop.y / 100) * sourceHeight);
    const sWidth = Math.floor((sourceCrop.width / 100) * sourceWidth);
    const sHeight = Math.floor((sourceCrop.height / 100) * sourceHeight);

    // Calculate display dimensions that fit within the canvas while maintaining aspect ratio
    const sourceAspect = sWidth / sHeight;

    let dWidth = canvasWidth;
    let dHeight = canvasWidth / sourceAspect;

    if (dHeight > canvasHeight) {
      dHeight = canvasHeight;
      dWidth = canvasHeight * sourceAspect;
    }

    // Center the image in the canvas
    const dx = (canvasWidth - dWidth) / 2;
    const dy = (canvasHeight - dHeight) / 2;

    return {
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      dWidth,
      dHeight,
    };
  }
}

export const aspectRatioHandler = new AspectRatioHandler();
