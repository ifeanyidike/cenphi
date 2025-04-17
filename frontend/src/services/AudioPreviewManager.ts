import {
  AudioEnhancement,
  AudioEffect,
  NoiseReduction,
  AudioTrim,
} from "../repo/managers/audio_editor";

import { audioProcessor } from "./AudioProcessor";

/**
 * Class to handle efficient preview generation for audio effects
 * This separates preview logic from the main store to improve performance
 */
export class AudioPreviewManager {
  private audioElement: HTMLAudioElement | null = null;
  private isProcessing: boolean = false;
  private previewUrls: Map<string, string> = new Map();

  // Debounce timers
  private previewDebounceTimers: Map<string, number> = new Map();
  private debounceDelay: number = 300; // ms

  // Callbacks
  private onPreviewStartCallback: (() => void) | null = null;
  private onPreviewReadyCallback: ((url: string) => void) | null = null;
  private onPreviewErrorCallback: ((error: any) => void) | null = null;

  constructor() {
    // Create an audio element for playback
    this.audioElement = new Audio();
    this.setupAudioElement();
  }

  /**
   * Set up the audio element for preview playback
   */
  private setupAudioElement() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener("error", (e) => {
      console.error("Audio preview playback error:", e);
      if (this.onPreviewErrorCallback) {
        this.onPreviewErrorCallback(e);
      }
    });

    this.audioElement.addEventListener("canplaythrough", () => {
      // Preview is loaded and ready to play
      if (
        this.onPreviewReadyCallback &&
        this.audioElement &&
        this.audioElement.src
      ) {
        this.onPreviewReadyCallback(this.audioElement.src);
      }
    });
  }

  /**
   * Set callbacks for preview events
   */
  setCallbacks(
    onStart: () => void,
    onReady: (url: string) => void,
    onError: (error: any) => void
  ) {
    this.onPreviewStartCallback = onStart;
    this.onPreviewReadyCallback = onReady;
    this.onPreviewErrorCallback = onError;
  }

  /**
   * Generate a preview for a specific effect with debounce
   */
  previewEffect = (
    sourceUrl: string,
    effectType: string,
    options: any,
    currentTime: number
  ): void => {
    // Cancel existing debounce timer for this effect type
    if (this.previewDebounceTimers.has(effectType)) {
      window.clearTimeout(this.previewDebounceTimers.get(effectType));
    }

    // Set new debounce timer
    const timerId = window.setTimeout(() => {
      this.generatePreview(sourceUrl, effectType, options, currentTime);
    }, this.debounceDelay);

    this.previewDebounceTimers.set(effectType, timerId);
  };

  /**
   * Play the current preview
   */
  playPreview(): void {
    if (this.audioElement && this.audioElement.src) {
      this.audioElement.play().catch((error) => {
        console.error("Error playing preview:", error);
      });
    }
  }

  /**
   * Pause the current preview
   */
  pausePreview(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  /**
   * Set the current time for the preview playback
   */
  setPreviewTime(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  /**
   * Get the duration of the current preview
   */
  getPreviewDuration(): number {
    return this.audioElement ? this.audioElement.duration : 0;
  }

  /**
   * Generate a preview for an enhancement effect
   */
  previewEnhancement(
    sourceUrl: string,
    enhancement: AudioEnhancement,
    currentTime: number
  ): void {
    this.previewEffect(sourceUrl, "enhance", enhancement, currentTime);
  }

  /**
   * Generate a preview for noise reduction
   */
  previewNoiseReduction(
    sourceUrl: string,
    noiseReduction: NoiseReduction,
    currentTime: number
  ): void {
    this.previewEffect(
      sourceUrl,
      "noise-reduction",
      noiseReduction,
      currentTime
    );
  }

  /**
   * Generate a preview for volume normalization
   */
  previewVolumeNormalize(
    sourceUrl: string,
    level: number,
    currentTime: number
  ): void {
    this.previewEffect(sourceUrl, "normalize", { level }, currentTime);
  }

  /**
   * Generate a preview for audio effects
   */
  previewAudioEffects(
    sourceUrl: string,
    effects: Record<AudioEffect, number>,
    currentTime: number
  ): void {
    this.previewEffect(sourceUrl, "effects", effects, currentTime);
  }

  /**
   * Generate a preview for trim
   * (This just sets the audio element's time since no processing is needed)
   */
  previewTrim(sourceUrl: string, trim: AudioTrim): void {
    if (this.audioElement) {
      // For trim, we just need to set the start time
      this.audioElement.src = sourceUrl;
      this.audioElement.currentTime = Math.max(trim.startTime, 0);
    }
  }

  /**
   * Preview all effects combined
   */
  previewAll(
    sourceUrl: string,
    options: {
      trim: AudioTrim;
      enhancement: AudioEnhancement;
      noiseReduction: NoiseReduction;
      volumeNormalize: number;
      effects: Record<AudioEffect, number>;
    },
    currentTime: number
  ): void {
    this.previewEffect(sourceUrl, "all", options, currentTime);
  }

  /**
   * Generate a preview using the audio processor
   */
  private async generatePreview(
    sourceUrl: string,
    effectType: string,
    options: any,
    currentTime: number
  ): Promise<void> {
    if (this.isProcessing) {
      // Don't start another preview if one is in progress
      return;
    }

    this.isProcessing = true;

    // Notify preview started
    if (this.onPreviewStartCallback) {
      this.onPreviewStartCallback();
    }

    try {
      // Add current time to options for proper preview segment
      const previewOptions = {
        ...options,
        currentTime,
      };

      // Generate the preview
      const previewUrl = await audioProcessor.createPreview(
        sourceUrl,
        effectType,
        previewOptions
      );

      // Store the preview URL
      this.previewUrls.set(effectType, previewUrl);

      // Set as current audio source
      if (this.audioElement) {
        this.audioElement.src = previewUrl;

        // Automatically play the preview after a short delay
        // (allows the UI to update first)
        setTimeout(() => {
          if (this.audioElement) {
            this.audioElement.play().catch((e) => {
              console.warn("Auto-play of preview failed:", e);
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error(`Error generating ${effectType} preview:`, error);
      if (this.onPreviewErrorCallback) {
        this.onPreviewErrorCallback(error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clean up resources when the preview manager is no longer needed
   */
  cleanup(): void {
    // Clear all debounce timers
    this.previewDebounceTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    this.previewDebounceTimers.clear();

    // Release all preview URLs
    this.previewUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.previewUrls.clear();

    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
  }
}
