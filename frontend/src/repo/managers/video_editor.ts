import { makeAutoObservable, runInAction } from "mobx";
import { videoProcessor } from "../../services/VideoProcessor";
import { aspectRatioHandler } from "../../services/aspect-ratio-handler";
import { WaveformManager } from "../../services/WaveformManager";
import { Testimonial } from "@/types/testimonial";
import { formatTimecode } from "@/utils/general";

export type VideoEditMode =
  | "crop"
  | "trim"
  | "transform"
  | "subtitles"
  | "filters"
  | "export"
  | "history";

export type AspectRatio =
  | "original"
  | "16:9"
  | "4:3"
  | "1:1"
  | "9:16"
  | "custom";

export type VideoFilter =
  | "none"
  | "grayscale"
  | "sepia"
  | "brightness"
  | "contrast"
  | "saturation";

export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  position: "top" | "middle" | "bottom";
  style: {
    fontFamily: string;
    fontSize: number;
    color: string;
    fontWeight: number;
    backgroundColor: string;
    opacity: number;
  };
}

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: "bookmark" | "subtitle" | "chapter";
  label: string;
}

export interface VideoTransform {
  rotate: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface VideoCrop {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  width: number; // percentage of original width (0-100)
  height: number; // percentage of original height (0-100)
}

export interface VideoTrim {
  startTime: number;
  endTime: number;
}

export class VideoEditorManager {
  // Original testimonial reference
  originalTestimonial: Testimonial | null = null;

  // Processed video URL (result of editing)
  processedVideoUrl: string | null = null;

  // Video state
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 1;
  playbackRate: number = 1;
  isMuted: boolean = false;

  // Video dimensions
  videoWidth: number = 0;
  videoHeight: number = 0;

  // Edit state
  isEditing: boolean = false;
  isDirty: boolean = false;
  editHistory: any[] = [];
  historyIndex: number = -1;
  activeEditMode: VideoEditMode | null = null;

  // Processing state
  isProcessing: boolean = false;
  processingStatus: string = "";
  processingProgress: number = 0;

  // Video modifications
  aspectRatio: AspectRatio = "original";
  customAspectRatio: { width: number; height: number } = {
    width: 16,
    height: 9,
  };
  crop: VideoCrop = { x: 0, y: 0, width: 100, height: 100 };
  trim: VideoTrim = { startTime: 0, endTime: 0 };
  transform: VideoTransform = {
    rotate: 0,
    flipHorizontal: false,
    flipVertical: false,
  };
  videoFilters: Record<VideoFilter, number> = {
    none: 0,
    grayscale: 0,
    sepia: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  };

  // Subtitles
  subtitles: Subtitle[] = [];
  showSubtitles: boolean = true;
  activeSubtitleId: string | null = null;

  // Timeline
  timelineSegments: VideoSegment[] = [];
  timelineMarkers: TimelineMarker[] = [];
  timelineZoom: number = 1;
  timelinePosition: number = 0;

  // Export settings
  exportFormat: "mp4" | "webm" | "gif" = "mp4";
  exportQuality: "low" | "medium" | "high" = "high";

  // Playback ready state
  isPlaybackReady: boolean = false;
  waveformManager: WaveformManager;

  private previewMode: boolean = true; // Default to preview mode
  private processingPromises: Map<string, Promise<string>> = new Map();
  private processingResults: Map<string, string> = new Map();
  private pendingChanges: Set<string> = new Set();
  private backgroundProcesses: Map<string, any> = new Map();

  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: number | null = null;
  private autoSaveIntervalTime: number = 30000; // 30 seconds
  private lastAutoSaveTime: number = 0;
  private shouldShowAutoSaveRecovery = true;

  constructor() {
    makeAutoObservable(this);
    this.waveformManager = new WaveformManager();
  }

  // This contains fixes to be applied to videoEditorStore.ts

  // Add these properties to the VideoEditorStore class:
  /**
   * Canvas-specific properties
   */
  private canvasInitialized: boolean = false;
  private previewQuality: "low" | "balanced" | "high" = "balanced";
  private cacheFrames: boolean = false;

  // Add these methods to the VideoEditorStore class:

  /**
   * Set preview quality for the canvas renderer
   */
  setPreviewQuality = (quality: "low" | "balanced" | "high"): void => {
    this.previewQuality = quality;

    // Update the canvas coordinator if available
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.setQuality(quality);
    }
  };

  /**
   * Enable or disable frame caching for better performance
   */
  setCacheFrames = (enabled: boolean): void => {
    this.cacheFrames = enabled;

    // Update the canvas coordinator if available
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.setFrameCaching(enabled);
    }
  };

  /**
   * Initialize the canvas renderer
   */
  initializeCanvas = (
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): void => {
    // Check if the canvas coordinator is available
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.initialize(videoElement, canvasElement);
      window.canvasCoordinator.setQuality(this.previewQuality);
      window.canvasCoordinator.setFrameCaching(this.cacheFrames);
      this.canvasInitialized = true;

      // Start rendering if video is playing
      if (this.isPlaying) {
        window.canvasCoordinator.startRendering();
      }
    }
  };

  /**
   * Start canvas rendering
   */
  startCanvasRendering = (): void => {
    if (
      this.canvasInitialized &&
      typeof window !== "undefined" &&
      window.canvasCoordinator
    ) {
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Stop canvas rendering
   */
  stopCanvasRendering = (): void => {
    if (
      this.canvasInitialized &&
      typeof window !== "undefined" &&
      window.canvasCoordinator
    ) {
      window.canvasCoordinator.stopRendering();
    }
  };

  /**
   * Capture the current frame from canvas
   */
  captureCurrentFrame = (): string | null => {
    if (
      this.canvasInitialized &&
      typeof window !== "undefined" &&
      window.canvasCoordinator
    ) {
      return window.canvasCoordinator.captureFrame();
    }
    return null;
  };

  /**
   * Render a specific frame at the given time
   */
  renderFrameAtTime = (time: number): Promise<string | null> => {
    if (
      this.canvasInitialized &&
      typeof window !== "undefined" &&
      window.canvasCoordinator
    ) {
      return window.canvasCoordinator.renderFrameAtTime(time);
    }
    return Promise.resolve(null);
  };

  // Initialization
  initEditor = async (testimonial: Testimonial) => {
    if (testimonial.format !== "video") {
      console.error("Cannot edit non-video testimonial");
      return;
    }

    this.originalTestimonial = testimonial;
    this.duration = testimonial.media_duration!;
    this.trim = { startTime: 0, endTime: this.duration };
    this.resetEdits();
    this.generateInitialTimeline();

    // Initialize video processor
    try {
      await videoProcessor.load();
    } catch (error) {
      console.error("Failed to load video processor:", error);
    }

    // Generate waveform for the video
    const videoUrl = testimonial.media_url;
    if (videoUrl) {
      this.waveformManager.generateWaveform(videoUrl);
    }

    // Auto-generate segments if transcript is available
    if (testimonial.transcript) {
      this.generateSegmentsFromTranscript(testimonial.transcript);
    }

    this.isPlaybackReady = true;

    this.addToHistory();
    console.log("Added initial history state");
  };

  resetEdits = () => {
    this.aspectRatio = "original";
    this.crop = { x: 0, y: 0, width: 100, height: 100 };
    this.transform = { rotate: 0, flipHorizontal: false, flipVertical: false };
    this.videoFilters = {
      none: 0,
      grayscale: 0,
      sepia: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
    };
    this.processedVideoUrl = null;
    this.isDirty = false;
    this.editHistory = [];
    this.historyIndex = -1;
  };

  // Calculate the original video aspect ratio
  get originalAspectRatio(): number {
    if (this.videoWidth === 0 || this.videoHeight === 0) {
      return 16 / 9; // Default fallback
    }
    return this.videoWidth / this.videoHeight;
  }

  // Timeline management
  generateInitialTimeline = () => {
    // Create initial segments based on video duration
    const segmentCount = Math.min(5, Math.ceil(this.duration / 30));
    const segmentDuration = this.duration / segmentCount;

    this.timelineSegments = Array.from({ length: segmentCount }).map(
      (_, index) => ({
        id: `segment-${index}`,
        startTime: index * segmentDuration,
        endTime: (index + 1) * segmentDuration,
        label: `Segment ${index + 1}`,
      })
    );

    // Add markers for each 10 seconds
    this.timelineMarkers = Array.from({
      length: Math.floor(this.duration / 10),
    }).map((_, index) => ({
      id: `marker-${index}`,
      time: (index + 1) * 10,
      type: "bookmark",
      label: `${(index + 1) * 10}s`,
    }));
  };

  generateSegmentsFromTranscript = (transcript: string) => {
    // Simple algorithm to split transcript into segments
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const segmentSize = Math.ceil(sentenceCount / 5); // Create ~5 segments

    const segments: VideoSegment[] = [];
    for (let i = 0; i < sentenceCount; i += segmentSize) {
      const segmentSentences = sentences.slice(i, i + segmentSize);
      const startPercent = i / sentenceCount;
      const endPercent = Math.min((i + segmentSize) / sentenceCount, 1);

      segments.push({
        id: `segment-${i}`,
        startTime: startPercent * this.duration,
        endTime: endPercent * this.duration,
        label: segmentSentences[0].substring(0, 20) + "...",
      });
    }

    this.timelineSegments = segments;
  };

  // Modify the following methods to integrate with canvas:

  // Update the play method
  play = (): void => {
    if (this.currentTime >= this.duration) this.currentTime = 0;
    this.isPlaying = true;
    console.log("time", this.currentTime, this.duration);

    // Start canvas rendering if initialized
    this.startCanvasRendering();
  };

  // Update the pause method
  pause = (): void => {
    this.isPlaying = false;

    // Stop canvas rendering if initialized
    // No need to stop rendering, just stop video playback
    // We keep rendering to show the current frame with filters/transforms
  };

  // Update the seek method
  // seek = (time: number): void => {
  //   this.currentTime = Math.max(0, Math.min(time, this.duration));

  //   this.waveformManager.seekTo(this.currentTime);
  //   // Force a canvas update to reflect the new time
  //   if (
  //     this.canvasInitialized &&
  //     typeof window !== "undefined" &&
  //     window.canvasCoordinator
  //   ) {
  //     // Clear transform cache to ensure we render the new frame
  //     window.canvasCoordinator.clearTransformCache();
  //   }
  // };

  // Update the setCrop method
  // setCrop = (crop: Partial<VideoCrop>): void => {
  //   this.crop = { ...this.crop, ...crop };

  //   // If we're using a fixed aspect ratio and the crop is manually changed,
  //   // we may need to correct it to maintain the aspect ratio
  //   if (this.aspectRatio !== "original") {
  //     this.adjustCropForAspectRatio();
  //   }

  //   this.isDirty = true;
  //   this.addToHistory();

  //   // Clear transform cache to ensure we render with the new crop
  //   if (
  //     this.canvasInitialized &&
  //     typeof window !== "undefined" &&
  //     window.canvasCoordinator
  //   ) {
  //     window.canvasCoordinator.clearTransformCache();
  //   }
  // };

  // // Update the setTransform method
  // setTransform = (transform: Partial<VideoTransform>): void => {
  //   this.transform = { ...this.transform, ...transform };
  //   this.isDirty = true;
  //   this.addToHistory();

  //   // Clear transform cache to ensure we render with the new transform
  //   if (
  //     this.canvasInitialized &&
  //     typeof window !== "undefined" &&
  //     window.canvasCoordinator
  //   ) {
  //     window.canvasCoordinator.clearTransformCache();
  //   }
  // };

  // // Update the setFilter method
  // setFilter = (filter: VideoFilter, value: number): void => {
  //   this.videoFilters[filter] = value;
  //   this.isDirty = true;
  //   this.addToHistory();

  //   // Clear transform cache to ensure we render with the new filters
  //   if (
  //     this.canvasInitialized &&
  //     typeof window !== "undefined" &&
  //     window.canvasCoordinator
  //   ) {
  //     window.canvasCoordinator.clearTransformCache();
  //   }
  // };

  // Video playback controls
  togglePlay = () => {
    this.isPlaying = !this.isPlaying;
  };

  // pause = () => {
  //   this.isPlaying = false;
  // };

  // play = () => {
  //   this.isPlaying = true;
  // };

  // seek = (time: number) => {
  //   this.currentTime = Math.max(0, Math.min(time, this.duration));
  // };

  setVolume = (volume: number) => {
    this.volume = Math.max(0, Math.min(volume, 1));
  };

  setPlaybackRate = (rate: number) => {
    this.playbackRate = rate;
  };

  toggleMute = () => {
    this.isMuted = !this.isMuted;
  };

  setVideoSize = (width: number, height: number) => {
    this.videoWidth = width;
    this.videoHeight = height;
  };

  // Editing modes
  setEditMode = (mode: VideoEditMode | null) => {
    this.activeEditMode = mode;
  };

  // Edit operations with enhanced aspect ratio handling
  // setAspectRatio = (ratio: AspectRatio) => {
  //   const previousRatio = this.aspectRatio;
  //   this.aspectRatio = ratio;

  //   // Calculate the new crop based on the aspect ratio change
  //   if (ratio !== "original") {
  //     // Always use the original video dimensions for reference
  //     // This ensures we maintain maximum video size and only crop when necessary
  //     const newCrop = aspectRatioHandler.changeAspectRatio(
  //       { x: 0, y: 0, width: 100, height: 100 }, // Start with full frame
  //       ratio,
  //       this.originalAspectRatio
  //     );

  //     this.crop = newCrop;
  //   } else {
  //     // Reset to full frame for original aspect ratio
  //     this.crop = { x: 0, y: 0, width: 100, height: 100 };
  //   }

  //   this.isDirty = true;
  //   this.addToHistory();
  // };

  setCustomAspectRatio = (width: number, height: number) => {
    this.customAspectRatio = { width, height };
    this.aspectRatio = "custom";

    // Update crop for the new custom aspect ratio
    // const targetRatio = width / height;

    // Use our aspect ratio handler to intelligently update the crop
    const newCrop = aspectRatioHandler.changeAspectRatio(
      this.crop,
      "custom", // We'll handle the custom ratio in the handler
      this.originalAspectRatio
    );

    this.crop = newCrop;
    this.isDirty = true;
    this.addToHistory();
  };

  // setCrop = (crop: Partial<VideoCrop>) => {
  //   this.crop = { ...this.crop, ...crop };

  //   // If we're using a fixed aspect ratio and the crop is manually changed,
  //   // we may need to correct it to maintain the aspect ratio
  //   if (this.aspectRatio !== "original") {
  //     this.adjustCropForAspectRatio();
  //   }

  //   this.isDirty = true;
  //   this.addToHistory();
  // };

  // Helper method to adjust crop to maintain selected aspect ratio
  adjustCropForAspectRatio = () => {
    if (this.aspectRatio === "original") return;

    let targetRatio: number;
    switch (this.aspectRatio) {
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
        targetRatio =
          this.customAspectRatio.width / this.customAspectRatio.height;
        break;
      default:
        return;
    }

    // Calculate current crop ratio
    const currentRatio =
      (this.crop.width / this.crop.height) * this.originalAspectRatio;

    // If the ratio is significantly different, adjust the crop
    if (Math.abs(currentRatio - targetRatio) > 0.01) {
      const newCrop = aspectRatioHandler.changeAspectRatio(
        this.crop,
        this.aspectRatio,
        this.originalAspectRatio
      );

      this.crop = newCrop;
    }
  };

  updateDurationAfterTrim(): void {
    if (this.trim.startTime >= 0 && this.trim.endTime > this.trim.startTime) {
      // Calculate the new duration based on trim points
      const newDuration = this.trim.endTime - this.trim.startTime;
      console.log(
        `Setting new duration after trim: ${newDuration.toFixed(2)}s`
      );

      // Update the duration
      this.duration = newDuration;

      // Reset the trim points to cover the entire new duration
      this.trim = { startTime: 0, endTime: newDuration };

      // Reset current time to the beginning of the trimmed video
      this.currentTime = 0;

      // Add to history to track this change
      this.addToHistory();

      // If we have a processed URL and an original URL, notify waveform manager
      if (this.processedVideoUrl && this.originalTestimonial?.content) {
        this.waveformManager.handleVideoTrimmed(
          this.originalTestimonial.content,
          this.processedVideoUrl
        );
      }
    } else {
      console.error("Invalid trim points for updating duration:", this.trim);
    }
  }

  // Then modify the setTrim method to properly handle when a processed video is being used
  // setTrim = (trim: Partial<VideoTrim>): void => {
  //   // If we have a processed video (e.g., already trimmed), then we need to
  //   // adjust how we handle the trim points in relation to the current duration
  //   if (this.processedVideoUrl) {
  //     if (trim.startTime !== undefined) {
  //       trim.startTime = Math.max(
  //         0,
  //         Math.min(trim.startTime, this.duration - 0.1)
  //       );
  //     }
  //     if (trim.endTime !== undefined) {
  //       trim.endTime = Math.max(
  //         (trim.startTime || this.trim.startTime) + 0.1,
  //         Math.min(trim.endTime, this.duration)
  //       );
  //     }
  //   }

  //   this.trim = { ...this.trim, ...trim };
  //   this.isDirty = true;
  //   this.addToHistory();

  //   this.waveformManager.updateTrimRegion(
  //     this.trim.startTime,
  //     this.trim.endTime
  //   );
  // };

  // Processing status
  setProcessingStatus = (status: string) => {
    this.processingStatus = status;
    this.isProcessing = status !== "";
  };

  setProcessingProgress = (progress: number) => {
    this.processingProgress = progress;
  };

  // Subtitle operations

  get activeSubtitle() {
    return this.subtitles.find((s) => s.id === this.activeSubtitleId);
  }
  addSubtitle = (startTime: number, endTime: number, text: string) => {
    const newSubtitle: Subtitle = {
      id: `subtitle-${crypto.randomUUID()}`,
      startTime,
      endTime,
      text,
      position: "bottom",
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#FFFFFF",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        opacity: 1,
        fontWeight: 400,
      },
    };

    this.subtitles.push(newSubtitle);
    this.activeSubtitleId = newSubtitle.id;
    this.isDirty = true;
    this.addToHistory();

    // Add marker to timeline
    this.addTimelineMarker({
      id: `marker-subtitle-${newSubtitle.id}`,
      time: startTime,
      type: "subtitle",
      label: text.substring(0, 20) + (text.length > 20 ? "..." : ""),
    });

    return newSubtitle;
  };

  updateSubtitle = (id: string, updates: Partial<Subtitle>) => {
    const index = this.subtitles.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.subtitles[index] = { ...this.subtitles[index], ...updates };
      this.isDirty = true;
      this.addToHistory();

      // Update timeline marker
      const markerIndex = this.timelineMarkers.findIndex(
        (m) => m.id === `marker-subtitle-${id}`
      );
      if (markerIndex !== -1 && updates.text) {
        this.timelineMarkers[markerIndex].label =
          updates.text.substring(0, 20) +
          (updates.text.length > 20 ? "..." : "");
      }
      if (markerIndex !== -1 && updates.startTime !== undefined) {
        this.timelineMarkers[markerIndex].time = updates.startTime;
      }
    }
  };

  updateAllSubtitles = (updates: Partial<Subtitle>) => {
    this.subtitles.forEach((subtitle) => {
      this.updateSubtitle(subtitle.id, updates);
    });
  };

  deleteSubtitle = (id: string) => {
    const index = this.subtitles.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.subtitles.splice(index, 1);

      if (this.activeSubtitleId === id) {
        this.activeSubtitleId =
          this.subtitles.length > 0 ? this.subtitles[0].id : null;
      }

      this.isDirty = true;
      this.addToHistory();

      // Remove timeline marker
      const markerIndex = this.timelineMarkers.findIndex(
        (m) => m.id === `marker-subtitle-${id}`
      );
      if (markerIndex !== -1) {
        this.timelineMarkers.splice(markerIndex, 1);
      }
    }
  };

  toggleSubtitles = () => {
    this.showSubtitles = !this.showSubtitles;
  };

  setActiveSubtitle = (id: string | null) => {
    this.activeSubtitleId = id;
  };

  // Timeline operations
  addTimelineMarker = (marker: TimelineMarker) => {
    this.timelineMarkers.push(marker);
  };

  deleteTimelineMarker = (id: string) => {
    const index = this.timelineMarkers.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.timelineMarkers.splice(index, 1);
    }
  };

  setTimelineZoom = (zoom: number) => {
    this.timelineZoom = Math.max(0.1, Math.min(zoom, 5));
    this.waveformManager.setZoom(this.timelineZoom);
  };

  setTimelinePosition = (position: number) => {
    this.timelinePosition = Math.max(0, Math.min(position, this.duration));
  };

  // History management
  // addToHistory = () => {
  //   // If we're not at the end of the history, truncate
  //   if (this.historyIndex < this.editHistory.length - 1) {
  //     this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
  //   }

  //   // Add current state to history
  //   this.editHistory.push({
  //     aspectRatio: this.aspectRatio,
  //     customAspectRatio: { ...this.customAspectRatio },
  //     crop: { ...this.crop },
  //     trim: { ...this.trim },
  //     transform: { ...this.transform },
  //     videoFilters: { ...this.videoFilters },
  //     subtitles: this.subtitles.map((s) => ({ ...s })),
  //   });

  //   this.historyIndex = this.editHistory.length - 1;
  // };

  // Auto-save method
  private autoSave = () => {
    if (!this.autoSaveEnabled || !this.isDirty) return;

    const now = Date.now();
    // Only auto-save if it's been at least 5 seconds since the last save
    if (now - this.lastAutoSaveTime < 5000) return;

    this.lastAutoSaveTime = now;

    try {
      // Save current state to localStorage
      const saveData = {
        version: 1, // Version for future compatibility
        timestamp: now,
        projectId: this.originalTestimonial?.id || "unknown",
        state: {
          aspectRatio: this.aspectRatio,
          customAspectRatio: this.customAspectRatio,
          crop: this.crop,
          trim: this.trim,
          transform: this.transform,
          videoFilters: this.videoFilters,
          subtitles: this.subtitles,
          activeEditMode: this.activeEditMode,
        },
      };

      localStorage.setItem(
        "cenphi_videoeditor_autoSave",
        JSON.stringify(saveData)
      );
      console.log(
        "Auto-saved editor state at",
        new Date(now).toLocaleTimeString()
      );
    } catch (error) {
      console.error("Failed to auto-save editor state:", error);
      // Disable auto-save if we encounter an error to prevent repeated failures
      this.autoSaveEnabled = false;
    }
  };

  checkAutoSave = (): { projectId: string; timestamp: number } | null => {
    if (!this.shouldShowAutoSaveRecovery) {
      return null;
    }

    try {
      // Try both possible storage keys
      const savedData = localStorage.getItem("cenphi_videoeditor_autoSave");

      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      // Check if this is for the current project
      if (
        !this.originalTestimonial ||
        parsedData.projectId !== this.originalTestimonial.id
      ) {
        return null;
      }

      // Don't show recovery if the data is too old (over 24 hours)
      const now = Date.now();
      if (now - parsedData.timestamp > 24 * 60 * 60 * 1000) {
        this.clearAutoSave();
        return null;
      }

      // Return just enough info for the UI to show a meaningful prompt
      return {
        projectId: parsedData.projectId,
        timestamp: parsedData.timestamp,
      };
    } catch (error) {
      console.error("Failed to check auto-saved state:", error);
      // If we encounter an error, clear the saved data to avoid showing the prompt again
      this.clearAutoSave();
      return null;
    }
  };

  // Start auto-save interval
  startAutoSave = () => {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      if (this.isDirty) {
        this.autoSave();
      }
    }, this.autoSaveIntervalTime);
  };

  // Stop auto-save interval
  stopAutoSave = () => {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  };

  // Check for auto-save data
  loadAutoSave = (): boolean => {
    try {
      // Try both possible storage keys
      let savedData = localStorage.getItem("cenphi_videoeditor_autoSave");
      if (!savedData) {
        savedData = localStorage.getItem("videoEditor_autoSave");
      }

      if (!savedData) return false;

      const parsedData = JSON.parse(savedData);

      // Additional validation
      if (!parsedData.state || !parsedData.projectId) {
        console.error("Invalid auto-save data structure");
        this.clearAutoSave();
        return false;
      }

      // Check if this is for the current project
      if (
        !this.originalTestimonial ||
        parsedData.projectId !== this.originalTestimonial.id
      ) {
        return false;
      }

      console.log("Loading auto-saved state:", parsedData);

      // Apply the saved state
      runInAction(() => {
        this.aspectRatio = parsedData.state.aspectRatio;
        this.customAspectRatio = parsedData.state.customAspectRatio;
        this.crop = parsedData.state.crop;
        this.trim = parsedData.state.trim;
        this.transform = parsedData.state.transform;

        // Handle video filters carefully
        if (parsedData.state.videoFilters) {
          Object.keys(parsedData.state.videoFilters).forEach((key) => {
            if (key in this.videoFilters) {
              this.videoFilters[key as VideoFilter] =
                parsedData.state.videoFilters[key];
            }
          });
        }

        // Handle subtitles
        if (Array.isArray(parsedData.state.subtitles)) {
          this.subtitles = parsedData.state.subtitles;
        }

        this.activeEditMode = parsedData.state.activeEditMode;

        // Mark as dirty to enable save button
        this.isDirty = true;
      });

      // Clear the auto-save data after successful loading
      this.clearAutoSave();

      // Force canvas update
      this.forceCompleteCanvasRefresh();

      console.log(
        "Loaded auto-saved state from",
        new Date(parsedData.timestamp).toLocaleString()
      );

      // Add the recovered state to history
      this.addToHistory();

      return true;
    } catch (error) {
      console.error("Failed to load auto-saved state:", error);
      // Clear the auto-save data to prevent further errors
      this.clearAutoSave();
      return false;
    }
  };

  // Clear auto-save data
  disableAutoSave = () => {
    this.autoSaveEnabled = false;
    this.shouldShowAutoSaveRecovery = false;
    this.stopAutoSave();
    this.clearAutoSave();
    console.log("Auto-save disabled and cleared");
  };

  // Clear the auto-save with improved cleanup
  clearAutoSave = () => {
    try {
      localStorage.removeItem("cenphi_videoeditor_autoSave");
      console.log("Auto-save data cleared from localStorage");
    } catch (error) {
      console.error("Error clearing auto-save:", error);
    }
  };

  addToHistory = () => {
    // If we're not at the end of the history, truncate
    if (this.historyIndex < this.editHistory.length - 1) {
      this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
    }

    // Add current state to history with timestamp and action type
    this.editHistory.push({
      timestamp: Date.now(),
      actionType: this.activeEditMode || "unknown",
      aspectRatio: this.aspectRatio,
      customAspectRatio: { ...this.customAspectRatio },
      crop: { ...this.crop },
      trim: { ...this.trim },
      transform: { ...this.transform },
      videoFilters: { ...this.videoFilters },
      subtitles: this.subtitles.map((s) => ({ ...s })),
      activeEditMode: this.activeEditMode,
      showSubtitles: this.showSubtitles,
      timelineZoom: this.timelineZoom,
      // Add these missing properties:
      pendingChanges: Array.from(this.pendingChanges),
      processedVideoUrl: this.processedVideoUrl,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
    });

    this.historyIndex = this.editHistory.length - 1;

    // Trigger auto-save
    this.autoSave();

    // Debug output
    console.log(
      `Added history state ${this.historyIndex}, type: ${this.activeEditMode || "unknown"}`
    );
  };

  // undo = () => {
  //   if (this.historyIndex > 0) {
  //     this.historyIndex--;
  //     this.applyHistoryState(this.editHistory[this.historyIndex]);
  //   }
  // };

  undo = () => {
    console.log(
      `Attempting undo: current index=${this.historyIndex}, history length=${this.editHistory.length}`
    );

    if (this.historyIndex > 0) {
      try {
        // First stop any ongoing processes
        this.stopCanvasRendering();

        // Decrement the history index
        this.historyIndex--;
        const stateToApply = this.editHistory[this.historyIndex];

        if (!stateToApply) {
          console.error("Invalid history state at index", this.historyIndex);
          this.historyIndex++; // Roll back the index change
          return false;
        }

        console.log(`Undoing to history state ${this.historyIndex}`);
        this.applyHistoryState(stateToApply);

        return true;
      } catch (error) {
        console.error("Error during undo operation:", error);
        // Try to recover
        this.historyIndex = Math.min(
          this.historyIndex + 1,
          this.editHistory.length - 1
        );
        return false;
      }
    } else {
      console.log("Cannot undo: at first history state");
      return false;
    }
  };

  // redo = () => {
  //   if (this.historyIndex < this.editHistory.length - 1) {
  //     this.historyIndex++;
  //     this.applyHistoryState(this.editHistory[this.historyIndex]);
  //   }
  // };

  redo = () => {
    console.log(
      `Attempting redo: current index=${this.historyIndex}, history length=${this.editHistory.length}`
    );

    if (this.historyIndex < this.editHistory.length - 1) {
      try {
        // First stop any ongoing processes
        this.stopCanvasRendering();

        // Increment the history index
        this.historyIndex++;
        const stateToApply = this.editHistory[this.historyIndex];

        if (!stateToApply) {
          console.error("Invalid history state at index", this.historyIndex);
          this.historyIndex--; // Roll back the index change
          return false;
        }

        console.log(`Redoing to history state ${this.historyIndex}`);
        this.applyHistoryState(stateToApply);

        return true;
      } catch (error) {
        console.error("Error during redo operation:", error);
        // Try to recover
        this.historyIndex = Math.max(this.historyIndex - 1, 0);
        return false;
      }
    } else {
      console.log("Cannot redo: at latest history state");
      return false;
    }
  };

  logHistoryState = () => {
    console.log(
      `History state: index=${this.historyIndex}, length=${this.editHistory.length}`
    );
    if (this.editHistory.length > 0) {
      console.log("Current state:", this.editHistory[this.historyIndex]);
    }
  };

  // private applyHistoryState = (state: any) => {
  //   this.aspectRatio = state.aspectRatio;
  //   this.customAspectRatio = { ...state.customAspectRatio };
  //   this.crop = { ...state.crop };
  //   this.trim = { ...state.trim };
  //   this.transform = { ...state.transform };
  //   this.videoFilters = { ...state.videoFilters };
  //   this.subtitles = state.subtitles.map((s: Subtitle) => ({ ...s }));
  // };

  private applyHistoryState = (state: any) => {
    console.log("Applying history state:", state);

    // IMPORTANT: Stop and restart canvas rendering to ensure clean state
    this.stopCanvasRendering();

    // Pause playback during history navigation
    if (this.isPlaying) {
      this.pause();
    }

    // Basic state properties - Use runInAction for entire state update
    runInAction(() => {
      this.aspectRatio = state.aspectRatio;
      this.customAspectRatio = { ...state.customAspectRatio };
      this.crop = { ...state.crop };
      this.trim = { ...state.trim };
      this.transform = { ...state.transform };

      // Handle video filters carefully
      Object.keys(state.videoFilters).forEach((key) => {
        this.videoFilters[key as VideoFilter] = state.videoFilters[key];
      });

      // Clone subtitles array
      this.subtitles = state.subtitles.map((s: Subtitle) => ({ ...s }));

      // Apply additional states
      if (state.activeEditMode !== undefined)
        this.activeEditMode = state.activeEditMode;
      if (state.showSubtitles !== undefined)
        this.showSubtitles = state.showSubtitles;
      if (state.timelineZoom !== undefined)
        this.timelineZoom = state.timelineZoom;

      // Restore pendingChanges
      if (state.pendingChanges) {
        this.pendingChanges = new Set(state.pendingChanges);
      } else {
        this.pendingChanges = new Set();
      }

      // Restore processed URL if available
      if (state.processedVideoUrl !== undefined) {
        this.processedVideoUrl = state.processedVideoUrl;
      }

      // Restore current time
      if (state.currentTime !== undefined) {
        this.currentTime = state.currentTime;
      }

      // Mark as dirty since we've changed state
      this.isDirty = true;
    });

    // CRITICAL: Force complete canvas refresh with delay
    setTimeout(() => {
      this.forceCompleteCanvasRefresh();
    }, 100);
  };

  forceCompleteCanvasRefresh = () => {
    console.log("Forcing complete canvas refresh");

    if (typeof window !== "undefined" && window.canvasCoordinator) {
      // First stop rendering
      window.canvasCoordinator.stopRendering();

      // Clear all caches
      window.canvasCoordinator.clearTransformCache();

      // Start rendering again
      window.canvasCoordinator.startRendering();

      // Force an immediate frame render
      window.canvasCoordinator.drawVideoFrame();

      // Update waveform display
      this.waveformManager.updateTrimRegion(
        this.trim.startTime,
        this.trim.endTime
      );

      // Force another frame render after a delay
      setTimeout(() => {
        if (window.canvasCoordinator) {
          window.canvasCoordinator.drawVideoFrame();
          console.log("Forced second frame render");
        }
      }, 200);
    }
  };

  // private updateCanvasForHistoryChange = () => {
  //   if (typeof window !== "undefined" && window.canvasCoordinator) {
  //     // Clear any cached transforms to ensure fresh render
  //     window.canvasCoordinator.clearTransformCache();

  //     // Start rendering with the new state
  //     window.canvasCoordinator.startRendering();

  //     // Update waveform if in trim mode
  //     if (this.activeEditMode === "trim") {
  //       this.waveformManager.updateTrimRegion(
  //         this.trim.startTime,
  //         this.trim.endTime
  //       );
  //     }
  //   }
  // };

  // private updateCanvasForHistoryChange = () => {
  //   console.log("Updating canvas after history change");

  //   if (typeof window !== "undefined" && window.canvasCoordinator) {
  //     // Clear any cached transforms to ensure fresh render
  //     window.canvasCoordinator.clearTransformCache();

  //     // Start rendering with the new state
  //     window.canvasCoordinator.startRendering();

  //     // Force a specific render frame to ensure the update
  //     setTimeout(() => {
  //       if (window.canvasCoordinator) {
  //         window.canvasCoordinator.drawVideoFrame();
  //       }
  //     }, 50);

  //     // Update waveform if trim is applied
  //     this.waveformManager.updateTrimRegion(
  //       this.trim.startTime,
  //       this.trim.endTime
  //     );
  //   }
  // };

  // Export operations
  setExportFormat = (format: "mp4" | "webm" | "gif") => {
    this.exportFormat = format;
  };

  setExportQuality = (quality: "low" | "medium" | "high") => {
    this.exportQuality = quality;
  };

  // Process and prepare for export
  prepareExport = async (): Promise<string | null> => {
    if (!this.originalTestimonial) return null;

    this.setProcessingStatus("Preparing export...");

    try {
      // Process all edits into final video
      const result = await videoProcessor.processCompletely(
        this.originalTestimonial.media_url!,
        {
          trim: this.trim,
          crop: this.crop,
          transform: this.transform,
          filters: this.videoFilters,
          aspectRatio: this.aspectRatio,
          customRatio: this.customAspectRatio,
          subtitles: this.showSubtitles ? this.subtitles : [],
          originalWidth: this.videoWidth,
          originalHeight: this.videoHeight,
        }
      );

      this.processedVideoUrl = result;
      return result;
    } catch (error) {
      console.error("Error preparing export:", error);
      return null;
    } finally {
      this.setProcessingStatus("");
    }
  };

  // Save operations
  saveEdits = async () => {
    // In a real application, this would interact with an API
    // to process the video according to the edits
    try {
      this.setProcessingStatus("Saving edits...");

      // Process all edits into final video
      const processedUrl = await this.prepareExport();

      if (!processedUrl || !this.originalTestimonial) {
        return false;
      }

      // Update the original testimonial
      runInAction(() => {
        if (
          this.originalTestimonial &&
          this.originalTestimonial.format === "video"
        ) {
          // Update URL to the processed video
          (this.originalTestimonial.content as any).url = processedUrl;

          // Update transcript if subtitles were modified
          if (this.subtitles.length > 0) {
            const transcript = this.subtitles
              .sort((a, b) => a.startTime - b.startTime)
              .map(
                (s) =>
                  `[${formatTimecode(s.startTime)} - ${formatTimecode(s.endTime)}] ${s.text}`
              )
              .join("\n");

            this.originalTestimonial.transcript = transcript;
          }

          // Update duration if trimmed
          if (this.trim.startTime > 0 || this.trim.endTime < this.duration) {
            this.originalTestimonial.media_duration =
              this.trim.endTime - this.trim.startTime;
          }
        }
      });

      this.isDirty = false;
      this.setProcessingStatus("");
      return true;
    } catch (error) {
      console.error("Error saving edits:", error);
      this.setProcessingStatus("");
      return false;
    }
  };

  togglePreviewMode = (enabled: boolean): void => {
    this.previewMode = enabled;

    // Clear transform cache when toggling modes to ensure canvas is updated
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Check if a specific edit type has pending changes
   */
  hasPendingChanges = (editType: string): boolean => {
    return this.pendingChanges.has(editType);
  };

  /**
   * Apply the crop instantly using canvas rendering, no FFmpeg processing
   */
  setCrop = (crop: Partial<VideoCrop>): void => {
    this.crop = { ...this.crop, ...crop };

    if (this.aspectRatio !== "original") {
      this.adjustCropForAspectRatio();
    }

    // Mark crop as having pending changes
    this.pendingChanges.add("crop");
    this.isDirty = true;
    this.addToHistory();

    // Force canvas to update with new crop (instantaneous)
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Apply transform instantly using canvas rendering, no FFmpeg processing
   */
  setTransform = (transform: Partial<VideoTransform>): void => {
    this.transform = { ...this.transform, ...transform };
    this.pendingChanges.add("transform");
    this.isDirty = true;
    this.addToHistory();

    // Apply transform instantly via canvas
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Apply filters instantly using canvas rendering, no FFmpeg processing
   */
  setFilter = (filter: VideoFilter, value: number): void => {
    this.videoFilters[filter] = value;
    this.pendingChanges.add("filters");
    this.isDirty = true;
    this.addToHistory();

    // Apply filter instantly via canvas
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Handle trim without immediate processing
   * Just update the trim region and use seeking to show preview
   */
  setTrim = (trim: Partial<VideoTrim>): void => {
    // Update trim state
    this.trim = { ...this.trim, ...trim };
    this.pendingChanges.add("trim");
    this.isDirty = true;
    this.addToHistory();

    // Update waveform to show trim region
    this.waveformManager.updateTrimRegion(
      this.trim.startTime,
      this.trim.endTime
    );

    // No FFmpeg processing at this stage
  };

  /**
   * Apply aspect ratio change instantly using canvas
   */
  setAspectRatio = (ratio: AspectRatio) => {
    this.aspectRatio = ratio;

    // Calculate the new crop based on the aspect ratio change
    if (ratio !== "original") {
      // Always use the original video dimensions for reference
      const newCrop = aspectRatioHandler.changeAspectRatio(
        { x: 0, y: 0, width: 100, height: 100 }, // Start with full frame
        ratio,
        this.originalAspectRatio
      );

      this.crop = newCrop;
    } else {
      // Reset to full frame for original aspect ratio
      this.crop = { x: 0, y: 0, width: 100, height: 100 };
    }

    this.pendingChanges.add("aspectRatio");
    this.isDirty = true;
    this.addToHistory();

    // Apply aspect ratio change instantly via canvas
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
      window.canvasCoordinator.startRendering();
    }
  };

  /**
   * Apply an edit with FFmpeg processing in the background
   * This can be called when the user explicitly wants to apply an edit
   */
  applyEdit = async (
    editType:
      | "crop"
      | "transform"
      | "filters"
      | "trim"
      | "aspectRatio"
      | "all"
      | "subtitles"
  ): Promise<string | null> => {
    if (editType === "all" || editType === "subtitles") return "";
    if (!this.originalTestimonial) return null;

    // If we already have a result for this edit, return it immediately
    if (this.processingResults.has(editType)) {
      return this.processingResults.get(editType)!;
    }

    // If this edit is already being processed, wait for it
    if (this.processingPromises.has(editType)) {
      return this.processingPromises.get(editType)!;
    }

    // Start processing
    this.setProcessingStatus(`Processing ${editType}...`);

    // Create a new promise for this edit
    const processingPromise = this._processEdit(editType);
    this.processingPromises.set(editType, processingPromise);

    try {
      const result = await processingPromise;

      // Store the result
      this.processingResults.set(editType, result);

      // Clear pending changes for this edit type
      this.pendingChanges.delete(editType);

      return result;
    } catch (error) {
      console.error(`Error processing ${editType}:`, error);
      return null;
    } finally {
      this.processingPromises.delete(editType);
      this.setProcessingStatus("");
    }
  };

  /**
   * Private method to actually process an edit with FFmpeg
   */
  private _processEdit = async (
    editType: "crop" | "transform" | "filters" | "trim" | "aspectRatio"
  ): Promise<string> => {
    const sourceUrl = this.originalTestimonial!.media_url!;

    switch (editType) {
      case "crop":
        return await videoProcessor.cropVideo(
          sourceUrl,
          this.crop,
          this.videoWidth,
          this.videoHeight
        );

      case "transform":
        return await videoProcessor.transformVideo(sourceUrl, this.transform);

      case "filters":
        return await videoProcessor.applyFilters(sourceUrl, this.videoFilters);

      case "trim": {
        // Special handling for trim to update duration
        //@ts-nocheck
        const result = await videoProcessor.trimVideo(
          sourceUrl,
          this.trim.startTime,
          this.trim.endTime
        );

        // Update video properties after trim
        this.processedVideoUrl = result;
        this.currentTime = 0;

        // Update duration to match trimmed length
        //@ts-nocheck
        const newDuration = this.trim.endTime - this.trim.startTime;
        this.duration = newDuration;

        // Reset trim points
        this.trim = { startTime: 0, endTime: newDuration };

        return result;
      }

      case "aspectRatio":
        return await videoProcessor.cropVideo(
          sourceUrl,
          this.crop,
          this.videoWidth,
          this.videoHeight
        );

      default:
        throw new Error(`Unknown edit type: ${editType}`);
    }
  };

  // Enhanced version with optimized canvas rendering
  previewEdit = async (
    type:
      | "crop"
      | "transform"
      | "filters"
      | "trim"
      | "aspectRatio"
      | "subtitles"
      | "all"
  ): Promise<string | null> => {
    if (!this.originalTestimonial) return null;

    // If in preview mode, just update the canvas and return null
    // This makes the operation instantaneous
    if (this.previewMode && type !== "all") {
      if (typeof window !== "undefined" && window.canvasCoordinator) {
        window.canvasCoordinator.clearTransformCache();
        window.canvasCoordinator.startRendering();

        // For trim preview, also seek to the appropriate time
        if (type === "trim") {
          this.seek(this.trim.startTime);
        }
      }

      // Don't do FFmpeg processing in preview mode
      return null;
    }

    // If not in preview mode, do the actual processing
    return this.applyEdit(type);
  };

  /**
   * Optimized seek function to show trim preview instantly
   */
  seek = (time: number): void => {
    // Adjust the time based on current trim settings in preview mode
    let adjustedTime = time;
    if (this.previewMode && this.pendingChanges.has("trim")) {
      // If seeking outside of trim bounds, clamp to trim region
      if (time < this.trim.startTime) {
        adjustedTime = this.trim.startTime;
      } else if (time > this.trim.endTime) {
        adjustedTime = this.trim.endTime;
      }
    }

    this.currentTime = Math.max(0, Math.min(adjustedTime, this.duration));

    // Update waveform if available
    this.waveformManager.seekTo(this.currentTime);

    // Update canvas rendering
    if (typeof window !== "undefined" && window.canvasCoordinator) {
      window.canvasCoordinator.clearTransformCache();
    }
  };

  /**
   * Process all pending changes at once (efficient batch operation)
   */
  applyAllPendingChanges = async (): Promise<string | null> => {
    if (this.pendingChanges.size === 0) return null;

    this.setProcessingStatus("Processing all changes...");

    try {
      // Process all edits in a single FFmpeg operation for efficiency
      const result = await videoProcessor.processCompletely(
        this.originalTestimonial!.media_url!,
        {
          trim: this.trim,
          crop: this.crop,
          transform: this.transform,
          filters: this.videoFilters,
          aspectRatio: this.aspectRatio,
          customRatio: this.customAspectRatio,
          subtitles: this.showSubtitles ? this.subtitles : [],
          originalWidth: this.videoWidth,
          originalHeight: this.videoHeight,
        }
      );

      // Update processed URL
      this.processedVideoUrl = result;

      // Clear all pending changes
      this.pendingChanges.clear();

      return result;
    } catch (error) {
      console.error("Error applying all changes:", error);
      return null;
    } finally {
      this.setProcessingStatus("");
    }
  };

  processEditInBackground = (editType: string): Promise<string> => {
    // Create a unique ID for this background process
    const processId = `${editType}-${Date.now()}`;

    // Add to active background processes list
    this.backgroundProcesses.set(processId, {
      type: editType,
      status: "pending",
      progress: 0,
    });

    // Start the process
    //@ts-expect-error assume edit types is compatible
    const processPromise = this._processEdit(editType)
      .then((result) => {
        // Update status when complete
        this.backgroundProcesses.set(processId, {
          type: editType,
          status: "complete",
          progress: 100,
          result,
        });
        return result;
      })
      .catch((error) => {
        // Update status on error
        this.backgroundProcesses.set(processId, {
          type: editType,
          status: "error",
          progress: 0,
          error: error.message,
        });
        throw error;
      });

    return processPromise;
  };

  discardEdits = () => {
    this.resetEdits();
    this.processedVideoUrl = null;
    return true;
  };

  cleanup() {
    // Destroy WaveSurfer instance
    this.waveformManager.destroyWaveSurfer();

    // Any other cleanup you need to do
  }
}
