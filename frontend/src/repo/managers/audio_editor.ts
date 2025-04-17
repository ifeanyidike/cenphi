import { makeAutoObservable, runInAction } from "mobx";
import { audioProcessor } from "../../services/AudioProcessor";
import { WaveformManager } from "../../services/WaveformManager";
import { AudioPreviewManager } from "../../services/AudioPreviewManager";
import { Testimonial } from "@/types/testimonial";
import { formatTimecode } from "@/utils/general";

export type AudioEditMode =
  | "trim"
  | "enhance"
  | "noise-reduction"
  | "normalize"
  | "effects"
  | "subtitles"
  | "export"
  | "history";

export type AudioEffect =
  | "none"
  | "reverb"
  | "eq-voice"
  | "boost"
  | "warmth"
  | "clarity";

export interface AudioSubtitle {
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

export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: "bookmark" | "subtitle" | "section";
  label: string;
}

export interface AudioTrim {
  startTime: number;
  endTime: number;
}

export interface AudioEnhancement {
  voiceClarity: number;
  bassTone: number;
  midTone: number;
  trebleTone: number;
  presence: number;
}

export interface NoiseReduction {
  strength: number;
  sensitivity: number;
  preserveVoice: number;
}

export class AudioEditorManager {
  // Original testimonial reference
  originalTestimonial: Testimonial | null = null;

  // Processed audio URL (result of editing)
  processedAudioUrl: string | null = null;

  // Audio state
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  volume: number = 1;
  playbackRate: number = 1;
  isMuted: boolean = false;

  // Edit state
  isEditing: boolean = false;
  isDirty: boolean = false;
  editHistory: any[] = [];
  historyIndex: number = -1;
  activeEditMode: AudioEditMode | null = null;

  // Processing state
  isProcessing: boolean = false;
  processingStatus: string = "";
  processingProgress: number = 0;

  // Preview state
  isPreviewActive: boolean = false;
  previewUrl: string | null = null;

  // Audio modifications
  trim: AudioTrim = { startTime: 0, endTime: 0 };
  enhancement: AudioEnhancement = {
    voiceClarity: 50,
    bassTone: 50,
    midTone: 50,
    trebleTone: 50,
    presence: 50,
  };
  noiseReduction: NoiseReduction = {
    strength: 50,
    sensitivity: 50,
    preserveVoice: 75,
  };
  volumeNormalize: number = 0; // 0-100 representing normalization level
  effects: Record<AudioEffect, number> = {
    none: 0,
    reverb: 0,
    "eq-voice": 0,
    boost: 0,
    warmth: 0,
    clarity: 0,
  };

  // Subtitles
  subtitles: AudioSubtitle[] = [];
  showSubtitles: boolean = true;
  activeSubtitleId: string | null = null;

  // Timeline
  timelineSegments: AudioSegment[] = [];
  timelineMarkers: TimelineMarker[] = [];
  timelineZoom: number = 1;

  // Export settings
  exportFormat: "mp3" | "wav" | "ogg" = "mp3";
  exportQuality: "low" | "medium" | "high" = "high";

  // Playback ready state
  isPlaybackReady: boolean = false;
  waveformManager: WaveformManager;

  // Preview manager for efficient preview handling
  previewManager: AudioPreviewManager;

  // Background processing state
  private processingPromises: Map<string, Promise<string>> = new Map();
  private processingResults: Map<string, string> = new Map();
  private pendingChanges: Set<string> = new Set();
  private autoSaveInterval: number | null = null;
  private autoSaveIntervalTime: number = 30000; // 30 seconds
  private lastAutoSaveTime: number = 0;

  // Browser capability flags
  private browserSupportsAudioWorklets: boolean = false;
  private browserSupportsWorkers: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.waveformManager = new WaveformManager();
    this.previewManager = new AudioPreviewManager();

    // Set up preview callbacks
    this.setupPreviewCallbacks();

    // Detect browser capabilities
    this.detectBrowserCapabilities();
  }

  /**
   * Set up callbacks for the preview manager
   */
  private setupPreviewCallbacks(): void {
    this.previewManager.setCallbacks(
      // Preview start callback
      () => {
        runInAction(() => {
          this.isPreviewActive = true;
        });
      },
      // Preview ready callback
      (url) => {
        runInAction(() => {
          this.previewUrl = url;
          this.isPreviewActive = false;
        });
      },
      // Preview error callback
      (error) => {
        runInAction(() => {
          this.isPreviewActive = false;
          console.error("Preview error:", error);
        });
      }
    );
  }

  /**
   * Detect browser capabilities for audio processing
   */
  private detectBrowserCapabilities(): void {
    // Check for Web Audio API support
    if (
      typeof AudioContext !== "undefined" ||
      typeof (window as any).webkitAudioContext !== "undefined"
    ) {
      // Check for Audio Worklet support
      const audioCtx = new (AudioContext ||
        (window as any).webkitAudioContext)();
      this.browserSupportsAudioWorklets = "audioWorklet" in audioCtx;

      // Close the test context
      audioCtx
        .close()
        .catch((e) => console.warn("Error closing test audio context:", e));
    }

    // Check for Web Worker support
    this.browserSupportsWorkers = typeof Worker !== "undefined";

    console.log(
      "Browser capabilities: Audio Worklets:",
      this.browserSupportsAudioWorklets,
      "Web Workers:",
      this.browserSupportsWorkers
    );
  }

  /**
   * Initialize the editor with a testimonial
   */
  initEditor = async (testimonial: Testimonial) => {
    if (testimonial.format !== "audio") {
      console.error("Cannot edit non-audio testimonial");
      return;
    }

    this.originalTestimonial = testimonial;
    this.duration = testimonial.media_duration!;
    this.trim = { startTime: 0, endTime: this.duration };
    this.resetEdits();
    this.generateInitialTimeline();

    // Initialize audio processor
    try {
      await audioProcessor.load();
      this.setupProcessorCallbacks();
    } catch (error) {
      console.error("Failed to load audio processor:", error);
    }

    // Generate waveform for the audio
    const audioUrl = testimonial.media_url;
    if (audioUrl) {
      this.waveformManager.generateWaveform(audioUrl);
    }

    // Auto-generate segments if transcript is available
    if (testimonial.transcript) {
      this.generateSegmentsFromTranscript(testimonial.transcript);
    }

    // Start auto-save
    this.startAutoSave();

    this.isPlaybackReady = true;
  };

  /**
   * Reset all edits to default values
   */
  resetEdits = () => {
    this.enhancement = {
      voiceClarity: 50,
      bassTone: 50,
      midTone: 50,
      trebleTone: 50,
      presence: 50,
    };
    this.noiseReduction = {
      strength: 50,
      sensitivity: 50,
      preserveVoice: 75,
    };
    this.volumeNormalize = 0;
    this.effects = {
      none: 0,
      reverb: 0,
      "eq-voice": 0,
      boost: 0,
      warmth: 0,
      clarity: 0,
    };
    this.processedAudioUrl = null;
    this.isDirty = false;
    this.editHistory = [];
    this.historyIndex = -1;
    this.pendingChanges.clear();
    this.processingResults.clear();
  };

  /**
   * Generate initial timeline markers based on audio duration
   */
  generateInitialTimeline = () => {
    // Create initial segments based on audio duration
    const segmentCount = Math.min(5, Math.ceil(this.duration / 15));
    const segmentDuration = this.duration / segmentCount;

    this.timelineSegments = Array.from({ length: segmentCount }).map(
      (_, index) => ({
        id: `segment-${index}`,
        startTime: index * segmentDuration,
        endTime: (index + 1) * segmentDuration,
        label: `Segment ${index + 1}`,
      })
    );

    // Add markers for each 5 seconds
    this.timelineMarkers = Array.from({
      length: Math.floor(this.duration / 5),
    }).map((_, index) => ({
      id: `marker-${index}`,
      time: (index + 1) * 5,
      type: "bookmark",
      label: `${(index + 1) * 5}s`,
    }));
  };

  /**
   * Generate segments from transcript text
   */
  generateSegmentsFromTranscript = (transcript: string) => {
    // Simple algorithm to split transcript into segments
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const segmentSize = Math.ceil(sentenceCount / 5); // Create ~5 segments

    const segments: AudioSegment[] = [];
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

  // Playback controls
  play = (): void => {
    if (this.currentTime >= this.duration) this.currentTime = 0;
    this.isPlaying = true;
  };

  pause = (): void => {
    this.isPlaying = false;
  };

  togglePlay = () => {
    this.isPlaying = !this.isPlaying;
  };

  seek = (time: number): void => {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.waveformManager.seekTo(this.currentTime);
  };

  setVolume = (volume: number) => {
    this.volume = Math.max(0, Math.min(volume, 1));
  };

  setPlaybackRate = (rate: number) => {
    this.playbackRate = rate;
  };

  toggleMute = () => {
    this.isMuted = !this.isMuted;
  };

  // Edit mode
  setEditMode = (mode: AudioEditMode | null) => {
    this.activeEditMode = mode;
  };

  // Editing operations
  setTrim = (trim: Partial<AudioTrim>): void => {
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

    // Generate trim preview
    if (this.originalTestimonial) {
      this.previewManager.previewTrim(
        this.originalTestimonial.media_url!,
        this.trim
        // this.currentTime
      );
    }
  };

  setEnhancement = (enhancement: Partial<AudioEnhancement>): void => {
    this.enhancement = { ...this.enhancement, ...enhancement };
    this.pendingChanges.add("enhance");
    this.isDirty = true;
    this.addToHistory();

    // Generate enhancement preview
    if (this.originalTestimonial) {
      this.previewManager.previewEnhancement(
        this.originalTestimonial.media_url!,
        this.enhancement,
        this.currentTime
      );
    }
  };

  setNoiseReduction = (noiseReduction: Partial<NoiseReduction>): void => {
    this.noiseReduction = { ...this.noiseReduction, ...noiseReduction };
    this.pendingChanges.add("noise-reduction");
    this.isDirty = true;
    this.addToHistory();

    // Generate noise reduction preview
    if (this.originalTestimonial) {
      this.previewManager.previewNoiseReduction(
        this.originalTestimonial.media_url!,
        this.noiseReduction,
        this.currentTime
      );
    }
  };

  setVolumeNormalize = (level: number): void => {
    this.volumeNormalize = Math.max(0, Math.min(level, 100));
    this.pendingChanges.add("normalize");
    this.isDirty = true;
    this.addToHistory();

    // Generate normalize preview
    if (this.originalTestimonial) {
      this.previewManager.previewVolumeNormalize(
        this.originalTestimonial.media_url!,
        this.volumeNormalize,
        this.currentTime
      );
    }
  };

  setEffect = (effect: AudioEffect, value: number): void => {
    this.effects[effect] = value;
    this.pendingChanges.add("effects");
    this.isDirty = true;
    this.addToHistory();

    // Generate effects preview
    if (this.originalTestimonial) {
      this.previewManager.previewAudioEffects(
        this.originalTestimonial.media_url!,
        this.effects,
        this.currentTime
      );
    }
  };

  // Processing status updates
  setProcessingStatus = (status: string) => {
    this.processingStatus = status;
    this.isProcessing = status !== "";
  };

  setProcessingProgress = (progress: number) => {
    this.processingProgress = progress;
  };

  // Set up callbacks for the audio processor
  private setupProcessorCallbacks() {
    audioProcessor.setCallbacks(
      // Progress callback
      (progress: number) => {
        runInAction(() => {
          this.processingProgress = progress;
        });
      },
      // Status callback
      (status: string) => {
        runInAction(() => {
          this.processingStatus = status;
          this.isProcessing = status !== "";
        });
      }
    );
  }

  /**
   * Preview the current edit
   * This uses the AudioPreviewManager for efficient preview generation
   */
  previewEdit = async (type: AudioEditMode | "all"): Promise<string | null> => {
    if (!this.originalTestimonial) return null;

    try {
      // Generate and play the appropriate preview using the preview manager
      switch (type) {
        case "trim":
          this.previewManager.previewTrim(
            this.originalTestimonial.media_url!,
            this.trim
            // this.currentTime
          );
          break;

        case "enhance":
          this.previewManager.previewEnhancement(
            this.originalTestimonial.media_url!,
            this.enhancement,
            this.currentTime
          );
          break;

        case "noise-reduction":
          this.previewManager.previewNoiseReduction(
            this.originalTestimonial.media_url!,
            this.noiseReduction,
            this.currentTime
          );
          break;

        case "normalize":
          this.previewManager.previewVolumeNormalize(
            this.originalTestimonial.media_url!,
            this.volumeNormalize,
            this.currentTime
          );
          break;

        case "effects":
          this.previewManager.previewAudioEffects(
            this.originalTestimonial.media_url!,
            this.effects,
            this.currentTime
          );
          break;

        case "all":
          // For "all", preview all effects combined
          this.previewManager.previewAll(
            this.originalTestimonial.media_url!,
            {
              trim: this.trim,
              enhancement: this.enhancement,
              noiseReduction: this.noiseReduction,
              volumeNormalize: this.volumeNormalize,
              effects: this.effects,
            },
            this.currentTime
          );
          break;

        default:
          console.warn(`Unknown preview type: ${type}`);
          return null;
      }

      // Return the current preview URL if available
      return this.previewUrl;
    } catch (error) {
      console.error(`Error creating preview for ${type}:`, error);
      return null;
    }
  };

  /**
   * Apply the current edit to the audio
   * This produces a final version with the current settings
   */
  applyEdit = async (
    editType:
      | "trim"
      | "enhance"
      | "noise-reduction"
      | "normalize"
      | "effects"
      | "subtitles"
      | "all"
  ): Promise<string | null> => {
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

      // Update the processed audio URL
      runInAction(() => {
        this.processedAudioUrl = result;
      });

      // For trim operations, update the waveform
      if (editType === "trim") {
        // Update waveform for new audio
        this.waveformManager.handleVideoTrimmed(
          this.originalTestimonial!.media_url!,
          result
        );
      }

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
   * Internal method to process an edit
   */
  private _processEdit = async (
    editType:
      | "trim"
      | "enhance"
      | "noise-reduction"
      | "normalize"
      | "effects"
      | "subtitles"
      | "all"
  ): Promise<string> => {
    const sourceUrl = this.originalTestimonial!.media_url!;

    try {
      switch (editType) {
        case "trim":
          return await audioProcessor.trimAudio(
            sourceUrl,
            this.trim.startTime,
            this.trim.endTime
          );

        case "enhance":
          return await audioProcessor.enhanceAudio(sourceUrl, this.enhancement);

        case "noise-reduction":
          return await audioProcessor.reduceNoise(
            sourceUrl,
            this.noiseReduction
          );

        case "normalize":
          return await audioProcessor.normalizeVolume(
            sourceUrl,
            this.volumeNormalize
          );

        case "effects":
          return await audioProcessor.applyEffects(sourceUrl, this.effects);

        case "subtitles":
          return await audioProcessor.generateSubtitles(
            sourceUrl,
            this.subtitles
          );

        case "all":
          return await audioProcessor.processCompletely(sourceUrl, {
            trim: this.trim,
            enhancement: this.enhancement,
            noiseReduction: this.noiseReduction,
            volumeNormalize: this.volumeNormalize,
            effects: this.effects,
            subtitles: this.showSubtitles ? this.subtitles : [],
          });

        default:
          throw new Error(`Unknown edit type: ${editType}`);
      }
    } catch (error) {
      console.error(`Error in _processEdit for ${editType}:`, error);
      throw error;
    }
  };

  // Timeline operations
  setTimelineZoom = (zoom: number) => {
    this.timelineZoom = Math.max(0.1, Math.min(zoom, 5));
    this.waveformManager.setZoom(this.timelineZoom);
  };

  // Subtitle operations
  get activeSubtitle() {
    return this.subtitles.find((s) => s.id === this.activeSubtitleId);
  }

  addSubtitle = (startTime: number, endTime: number, text: string) => {
    const newSubtitle: AudioSubtitle = {
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

  updateSubtitle = (id: string, updates: Partial<AudioSubtitle>) => {
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

  setActiveSubtitle = (id: string | null) => {
    this.activeSubtitleId = id;
  };

  toggleSubtitles = () => {
    this.showSubtitles = !this.showSubtitles;
  };

  addTimelineMarker = (marker: TimelineMarker) => {
    this.timelineMarkers.push(marker);
  };

  // History management
  addToHistory = () => {
    // If we're not at the end of the history, truncate
    if (this.historyIndex < this.editHistory.length - 1) {
      this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
    }

    // Add current state to history with timestamp and action type
    this.editHistory.push({
      timestamp: Date.now(),
      actionType: this.activeEditMode || "unknown",
      trim: { ...this.trim },
      enhancement: { ...this.enhancement },
      noiseReduction: { ...this.noiseReduction },
      volumeNormalize: this.volumeNormalize,
      effects: { ...this.effects },
      subtitles: this.subtitles.map((s) => ({ ...s })),
      activeEditMode: this.activeEditMode,
      showSubtitles: this.showSubtitles,
      timelineZoom: this.timelineZoom,
    });

    this.historyIndex = this.editHistory.length - 1;

    // Trigger auto-save
    this.autoSave();
  };

  undo = () => {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.applyHistoryState(this.editHistory[this.historyIndex]);
    }
  };

  redo = () => {
    if (this.historyIndex < this.editHistory.length - 1) {
      this.historyIndex++;
      this.applyHistoryState(this.editHistory[this.historyIndex]);
    }
  };

  /**
   * Export methods
   */

  // Set export format (mp3, wav, ogg)
  setExportFormat = (format: "mp3" | "wav" | "ogg") => {
    this.exportFormat = format;
    this.isDirty = true;
    this.addToHistory();
  };

  // Set export quality (low, medium, high)
  setExportQuality = (quality: "low" | "medium" | "high") => {
    this.exportQuality = quality;
    this.isDirty = true;
    this.addToHistory();
  };

  // Process and prepare audio for export
  prepareExport = async (): Promise<string | null> => {
    if (!this.originalTestimonial) return null;

    this.setProcessingStatus("Preparing export...");
    this.setProcessingProgress(0);

    try {
      // Apply different processing settings based on export quality
      const qualitySettings = {
        low: {
          bitrate: "96k",
          sampleRate: 22050,
          channels: 1,
        },
        medium: {
          bitrate: "128k",
          sampleRate: 44100,
          channels: 2,
        },
        high: {
          bitrate: "320k",
          sampleRate: 48000,
          channels: 2,
        },
      };

      // Set progress to show processing has started
      this.setProcessingProgress(10);

      // Get settings for selected quality
      const settings = qualitySettings[this.exportQuality];

      // Process all edits into final audio with specified quality settings
      const result = await audioProcessor.processCompletely(
        this.originalTestimonial.media_url!,
        {
          trim: this.trim,
          enhancement: this.enhancement,
          noiseReduction: this.noiseReduction,
          volumeNormalize: this.volumeNormalize,
          effects: this.effects,
          subtitles: this.showSubtitles ? this.subtitles : [],
          // Additional export-specific settings
          format: this.exportFormat,
          quality: settings,
        }
      );

      // Update progress for different stages
      this.setProcessingProgress(50);

      // Final progress
      this.setProcessingProgress(100);

      // Set the processed URL for preview
      this.processedAudioUrl = result;
      return result;
    } catch (error) {
      console.error("Error preparing export:", error);
      return null;
    } finally {
      // Clear processing status
      this.setProcessingStatus("");
      this.setProcessingProgress(0);
    }
  };

  // Get estimated file size based on format, quality and duration
  getEstimatedFileSize = (): number => {
    // Base bitrates in kilobits per second (kbps)
    const bitrates = {
      mp3: {
        low: 96,
        medium: 128,
        high: 320,
      },
      wav: {
        low: 705, // 16-bit, 44.1kHz, mono
        medium: 1411, // 16-bit, 44.1kHz, stereo
        high: 3072, // 24-bit, 48kHz, stereo
      },
      ogg: {
        low: 80,
        medium: 128,
        high: 256,
      },
    };

    // Calculate file size: bitrate (kbps) * duration (s) / 8 = size in KB
    const bitrate = bitrates[this.exportFormat][this.exportQuality];
    const trimmedDuration = this.trim.endTime - this.trim.startTime;
    const fileSizeKB = (bitrate * trimmedDuration) / 8;

    return fileSizeKB;
  };

  // Get maximum duration based on format and quality (for free tier limitations, etc.)
  getMaxDuration = (): number => {
    // Example limits, these would be based on your application's constraints
    const maxDurations = {
      mp3: {
        low: 60 * 60, // 60 minutes
        medium: 30 * 60, // 30 minutes
        high: 15 * 60, // 15 minutes
      },
      wav: {
        low: 30 * 60, // 30 minutes
        medium: 15 * 60, // 15 minutes
        high: 5 * 60, // 5 minutes (WAV files are large)
      },
      ogg: {
        low: 60 * 60, // 60 minutes
        medium: 30 * 60, // 30 minutes
        high: 15 * 60, // 15 minutes
      },
    };

    return maxDurations[this.exportFormat][this.exportQuality];
  };

  /**
   * Apply a history state to the current editor
   */
  private applyHistoryState = (state: any) => {
    this.trim = { ...state.trim };
    this.enhancement = { ...state.enhancement };
    this.noiseReduction = { ...state.noiseReduction };
    this.volumeNormalize = state.volumeNormalize;
    this.effects = { ...state.effects };
    this.subtitles = state.subtitles.map((s: AudioSubtitle) => ({ ...s }));

    // Apply additional states if they exist
    if (state.activeEditMode !== undefined)
      this.activeEditMode = state.activeEditMode;
    if (state.showSubtitles !== undefined)
      this.showSubtitles = state.showSubtitles;
    if (state.timelineZoom !== undefined)
      this.timelineZoom = state.timelineZoom;

    // Mark as dirty since we've changed state
    this.isDirty = true;

    // Update waveform
    this.waveformManager.updateTrimRegion(
      this.trim.startTime,
      this.trim.endTime
    );

    // Generate preview for current state if appropriate
    if (this.activeEditMode && this.originalTestimonial) {
      this.previewEdit(this.activeEditMode);
    }
  };

  // Auto-save method
  private autoSave = () => {
    if (!this.isDirty) return;

    const now = Date.now();
    // Only auto-save if it's been at least 5 seconds since the last save
    if (now - this.lastAutoSaveTime < 5000) return;

    this.lastAutoSaveTime = now;

    try {
      // Save current state to localStorage
      const saveData = {
        version: 1,
        timestamp: now,
        projectId: this.originalTestimonial?.id || "unknown",
        state: {
          trim: this.trim,
          enhancement: this.enhancement,
          noiseReduction: this.noiseReduction,
          volumeNormalize: this.volumeNormalize,
          effects: this.effects,
          subtitles: this.subtitles,
          activeEditMode: this.activeEditMode,
        },
      };

      localStorage.setItem("audioeditor_autoSave", JSON.stringify(saveData));
      console.log(
        "Auto-saved editor state at",
        new Date(now).toLocaleTimeString()
      );
    } catch (error) {
      console.error("Failed to auto-save editor state:", error);
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

  // Save operations
  saveEdits = async () => {
    try {
      this.setProcessingStatus("Saving edits...");

      // Process all edits into final audio
      const processedUrl = await this.applyEdit("all");

      if (!processedUrl || !this.originalTestimonial) {
        return false;
      }

      // Update the original testimonial
      runInAction(() => {
        if (
          this.originalTestimonial &&
          this.originalTestimonial.format === "audio"
        ) {
          // Update URL to the processed audio
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

            (this.originalTestimonial.content as any).transcript = transcript;
          }

          // Update duration if trimmed
          if (this.trim.startTime > 0 || this.trim.endTime < this.duration) {
            (this.originalTestimonial.content as any).duration =
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

  discardEdits = () => {
    this.resetEdits();
    this.processedAudioUrl = null;
    return true;
  };

  /**
   * Check if a specific edit type has pending changes
   */
  hasPendingChanges = (editType: string): boolean => {
    return this.pendingChanges.has(editType);
  };

  /**
   * Clean up resources when the editor is no longer needed
   */
  cleanup() {
    // Destroy WaveSurfer instance
    this.waveformManager.destroyWaveSurfer();

    // Clean up preview manager
    this.previewManager.cleanup();

    // Stop auto-save
    this.stopAutoSave();

    // Release processed URLs
    this.processingResults.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    // Clear all maps
    this.processingPromises.clear();
    this.processingResults.clear();
    this.pendingChanges.clear();
  }
}
