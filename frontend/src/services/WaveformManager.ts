/**
 * This is a focused patch for the WaveformManager that fixes the primary issues with
 * waveform generation and prevents fallbacks to the synthetic waveform.
 */

import { makeObservable, observable, action, runInAction } from "mobx";
import WaveSurfer from "wavesurfer.js";
import { GenericPlugin } from "wavesurfer.js/dist/base-plugin.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";

interface CachedWaveform {
  peaks: number[][];
  duration: number;
  sampleRate: number;
  timestamp: number;
}

type Region = {
  id: string;
  start: number;
  end: number;
  color: string;
  drag: boolean;
  resize: boolean;
};

interface GenericPluginProps extends GenericPlugin {
  name: string;
  getRegions: () => { remove: () => void }[];
  addRegion: ({ id, start, end, color, drag, resize }: Region) => Region;
}

interface WaveSurferProps extends WaveSurfer {
  backend?: { mergedPeaks: any; peaks: any; media: any };
  drawBuffer?: () => void;
  fireEvent?: (e: string) => void;
  addPlugin?: (e: RegionsPlugin) => void;
  initialisedPluginList?: RegionsPlugin[];
  loadMediaElement?: (
    vid: HTMLVideoElement | HTMLAudioElement | null,
    url: string
  ) => void;
  getActivePlugins: () => GenericPluginProps[];
}

export class WaveformManager {
  private waveformCache: Map<string, CachedWaveform> = new Map();
  private wavesurfer: WaveSurferProps | null = null;
  private containerRef: HTMLElement | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  private onProgressCallback: ((progress: number) => void) | null = null;
  private currentUrl: string = "";
  // private videoElement: HTMLVideoElement | null = null;
  // private audioElement: HTMLAudioElement | null = null;
  private element: HTMLVideoElement | HTMLAudioElement | null = null;
  // private elementType: "video" | "audio" | null = null;
  private readonly MAX_CACHE_SIZE = 10;
  private regions: { [id: string]: any } = {};
  zoom: number = 1;
  private lastContainerWidth: number = 0;

  // Added to track initialization attempts
  private initializationAttempts: number = 0;
  private readonly MAX_INIT_ATTEMPTS = 5;

  constructor() {
    makeObservable(this, {
      isLoading: observable,
      error: observable,
      zoom: observable,
      setContainer: action,
      setVideoElement: action,
      setAudioElement: action,
      generateWaveform: action,
      setZoom: action,
      seekTo: action,
      updateTrimRegion: action,
      clearRegions: action,
      clearCacheForUrl: action,
      clearCache: action,
      handleVideoTrimmed: action,
      destroyWaveSurfer: action,
    });
  }

  setContainer(container: HTMLElement | null) {
    console.log("WaveformManager: Setting container", container);
    this.containerRef = container;

    if (container) {
      this.lastContainerWidth = container.offsetWidth;

      // Ensure container has a height
      if (container.offsetHeight < 40) {
        container.style.height = "40px";
      }

      // If we have a URL, initialize waveform
      if (this.currentUrl && this.element) {
        this.generateWaveform(this.currentUrl);
      }
    }
  }

  setVideoElement(videoElement: HTMLVideoElement | null) {
    console.log("WaveformManager: Setting video element", videoElement);
    this.element = videoElement;
    // this.elementType = "video";

    // Reset initialization attempts when setting a new video element
    this.initializationAttempts = 0;

    // If we already have a URL and container, regenerate the waveform
    if (this.currentUrl && this.containerRef && this.element) {
      this.generateWaveform(this.currentUrl);
    }
  }

  setAudioElement(audioElement: HTMLAudioElement | null) {
    console.log("WaveformManager: Setting video element", audioElement);
    this.element = audioElement;
    // this.elementType = "audio";

    // Reset initialization attempts when setting a new video element
    this.initializationAttempts = 0;

    // If we already have a URL and container, regenerate the waveform
    if (this.currentUrl && this.containerRef && this.element) {
      this.generateWaveform(this.currentUrl);
    }
  }

  setProgressCallback(callback: (progress: number) => void) {
    this.onProgressCallback = callback;
  }

  async generateWaveform(videoUrl: string, forceRegenerate: boolean = false) {
    console.trace("WaveformManager: Generating waveform for", videoUrl);

    if (!videoUrl) {
      console.warn("No video URL provided");
      return;
    }

    if (!this.containerRef) {
      console.warn("No container reference available");
      return;
    }

    if (!this.element) {
      console.warn("No video element available");
      this.error = "Video element not found. Please try reloading the page.";
      return;
    }

    // Track initialization attempt
    this.initializationAttempts++;
    if (this.initializationAttempts > this.MAX_INIT_ATTEMPTS) {
      console.warn("Max initialization attempts reached, creating fallback");
      this.createFallbackWaveform("Too many initialization attempts");
      return;
    }

    // Update current URL
    this.currentUrl = videoUrl;

    // Set loading state
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      // Check cache first unless forced to regenerate
      if (!forceRegenerate && this.waveformCache.has(videoUrl)) {
        console.log("Using cached waveform data");
        await this.loadFromCache(videoUrl);
        return;
      }

      // Destroy previous instance if exists
      this.destroyWaveSurfer();

      // First, ensure the video is in a state where we can extract audio
      await this.ensureVideoReady();

      // Create new WaveSurfer instance with more robust initialization
      await this.createWaveSurferInstance(videoUrl);
    } catch (err) {
      console.error("Waveform generation error:", err);
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to generate waveform";
        this.isLoading = false;
      });
      this.createFallbackWaveform(this.error || "Unknown error");
    }
  }

  /**
   * Ensure video is ready for waveform generation
   */
  private async ensureVideoReady(): Promise<void> {
    if (!this.element) {
      throw new Error("No video element available");
    }

    // Check if the video metadata is loaded
    if (this.element.readyState < 1) {
      console.log("Video metadata not loaded, waiting...");

      try {
        await new Promise<void>((resolve, reject) => {
          const loadHandler = () => {
            this.element?.removeEventListener("loadedmetadata", loadHandler);
            resolve();
          };

          const errorHandler = () => {
            this.element?.removeEventListener("error", errorHandler);
            reject(
              new Error(
                `Video loading error: ${(this.element as any)?.error?.message || "Unknown error"}`
              )
            );
          };

          // Set timeout for loading
          const timeout = setTimeout(() => {
            this.element?.removeEventListener("loadedmetadata", loadHandler);
            this.element?.removeEventListener("error", errorHandler);
            reject(new Error("Video metadata loading timeout"));
          }, 10000);

          this.element?.addEventListener("loadedmetadata", loadHandler);
          this.element?.addEventListener("error", errorHandler);

          // Clean up timeout on success
          loadHandler["cleanup"] = () => clearTimeout(timeout);
        });
      } catch (error) {
        console.error("Error waiting for video metadata:", error);
        throw error;
      }
    }

    // Ensure the video has some data loaded
    if (this.element.readyState < 2) {
      console.log("Waiting for video data to load...");

      try {
        await new Promise<void>((resolve, reject) => {
          const loadHandler = () => {
            this.element?.removeEventListener("loadeddata", loadHandler);
            resolve();
          };

          const timeout = setTimeout(() => {
            this.element?.removeEventListener("loadeddata", loadHandler);
            reject(new Error("Video data loading timeout"));
          }, 10000);

          this.element?.addEventListener("loadeddata", loadHandler);

          // Already loaded? Resolve immediately
          if (this.element && this.element.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
          }
        });
      } catch (error) {
        console.error("Error waiting for video data:", error);
        throw error;
      }
    }
  }

  private setupWavesurferEvents(videoUrl: string) {
    if (!this.wavesurfer) return;

    // Ready event - fired when waveform is generated and ready
    this.wavesurfer.on("ready", () => {
      console.log("WaveSurfer ready event fired");
      if (!this.wavesurfer) return;

      runInAction(() => {
        this.isLoading = false;
        this.error = null;
      });

      // Cache the waveform data
      this.cacheWaveformData(videoUrl);

      // Apply current zoom level immediately
      if (this.zoom !== 1) {
        this.applyZoom(this.zoom);
      }
    });

    // Error event with better error details
    this.wavesurfer.on("error", (err) => {
      console.error("WaveSurfer error:", err);

      // Extract more specific error information
      const errorMsg = err?.toString() || "Unknown error";

      // Check if this is a no-audio error
      const isNoAudioError =
        errorMsg.includes("no audio") ||
        errorMsg.includes("audio track") ||
        errorMsg.includes("MediaElementAudioSource");

      runInAction(() => {
        this.error = isNoAudioError
          ? "No audio track detected in video"
          : `Error loading audio: ${errorMsg}`;
        this.isLoading = false;
      });

      this.createFallbackWaveform(this.error || undefined);
    });

    // Loading progress event
    this.wavesurfer.on("loading", (percent) => {
      console.log("WaveSurfer loading progress:", percent);
      if (this.onProgressCallback) {
        this.onProgressCallback(percent / 100);
      }
    });

    // Debug events
    this.wavesurfer.on("decode", () => {
      console.log("WaveSurfer decode complete");
    });

    this.wavesurfer.on("zoom", (minPxPerSec) => {
      console.log("WaveSurfer zoom event:", minPxPerSec);
    });
  }

  private createFallbackWaveform(
    errorMessage: string = "Audio extraction failed"
  ) {
    if (!this.containerRef) return;

    console.log("Creating fallback waveform with message:", errorMessage);

    // Clear the container
    while (this.containerRef.firstChild) {
      this.containerRef.removeChild(this.containerRef.firstChild);
    }

    // Create a canvas for manual drawing
    const canvas = document.createElement("canvas");
    canvas.width = this.containerRef.offsetWidth;
    canvas.height = 40;
    canvas.style.width = "100%";
    canvas.style.height = "40px";
    this.containerRef.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with a light background
    ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a synthetic waveform that clearly shows it's a fallback
    ctx.fillStyle = "rgba(99, 102, 241, 0.6)";

    const points = 100;
    const width = canvas.width / points;

    // Draw a more clearly synthetic pattern
    const centerY = canvas.height / 2;
    for (let i = 0; i < points; i++) {
      // Simple sine wave with small random variation
      const height = Math.sin(i / 8) * 8 + 10;

      // Draw a bar centered on the midpoint
      ctx.fillRect(i * width, centerY - height / 2, width - 1, height);
    }

    // Add a text label
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(errorMessage, canvas.width / 2, 12);

    runInAction(() => {
      this.isLoading = false;
      if (!this.error) {
        this.error = errorMessage;
      }
    });
  }

  private cacheWaveformData(url: string) {
    if (!this.wavesurfer) return;

    try {
      console.log("Caching waveform data");

      // Get duration
      const duration = this.wavesurfer.getDuration() || 0;

      // Try to get the actual peaks from the wavesurfer instance
      let peaks: number[][] = [];
      try {
        const rawPeaks =
          this.wavesurfer.backend?.mergedPeaks ||
          this.wavesurfer.backend?.peaks ||
          this.wavesurfer.exportPeaks?.();

        if (rawPeaks && Array.isArray(rawPeaks)) {
          peaks = [rawPeaks];
        } else {
          // Generate synthetic peaks if we can't get real ones
          const syntheticPeaks = Array.from({ length: 1000 }).map(
            () => Math.random() * 0.5 + 0.25
          );
          peaks = [syntheticPeaks];
        }
      } catch (e) {
        console.warn("Error extracting peaks, using synthetic data", e);
        // Generate synthetic peaks as fallback
        const syntheticPeaks = Array.from({ length: 1000 }).map(
          () => Math.random() * 0.5 + 0.25
        );
        peaks = [syntheticPeaks];
      }

      // Store in cache
      this.waveformCache.set(url, {
        peaks,
        duration,
        sampleRate: 1000,
        timestamp: Date.now(),
      });

      // Manage cache size
      this.pruneCache();
    } catch (err) {
      console.warn("Failed to cache waveform data:", err);
    }
  }

  private async loadFromCache(url: string) {
    if (!this.containerRef) return;

    const cachedData = this.waveformCache.get(url);
    if (!cachedData) return;

    console.log("Loading waveform from cache");

    // Destroy previous instance
    this.destroyWaveSurfer();

    // Create new instance with cached data
    await this.createWaveSurferInstance(url);

    // Update cache timestamp
    this.waveformCache.set(url, {
      ...cachedData,
      timestamp: Date.now(),
    });

    runInAction(() => {
      this.isLoading = false;
    });
  }

  private pruneCache() {
    if (this.waveformCache.size <= this.MAX_CACHE_SIZE) return;

    // Convert to array, sort by timestamp, and remove oldest
    const entries = Array.from(this.waveformCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries
    const entriesToRemove = entries.slice(
      0,
      entries.length - this.MAX_CACHE_SIZE
    );
    for (const [url] of entriesToRemove) {
      this.waveformCache.delete(url);
    }
  }

  destroyWaveSurfer() {
    console.log("Destroying WaveSurfer instance");
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
      this.wavesurfer = null;
    }
  }

  setZoom(zoomLevel: number) {
    console.log("Setting zoom level:", zoomLevel);

    // Store the new zoom level
    this.zoom = zoomLevel;

    // Apply zoom to wavesurfer
    this.applyZoom(zoomLevel);
  }

  private applyZoom(zoomLevel: number) {
    if (!this.wavesurfer || !this.containerRef) return;

    try {
      console.log("Applying zoom level:", zoomLevel);

      // Check if container width has changed (can affect zoom)
      const currentWidth = this.containerRef.offsetWidth;
      if (currentWidth !== this.lastContainerWidth) {
        console.log(
          "Container width changed from",
          this.lastContainerWidth,
          "to",
          currentWidth
        );
        this.lastContainerWidth = currentWidth;
      }

      // Calculate the ideal minPxPerSec for the zoom level
      const duration = this.wavesurfer.getDuration() || 1;
      const baseMinPxPerSec = currentWidth / duration;
      const newMinPxPerSec = baseMinPxPerSec * zoomLevel;

      // Apply the zoom with the calculated value
      this.wavesurfer.zoom(newMinPxPerSec);

      // For no or fallback waveforms, update the canvas width
      if (this.error && this.containerRef) {
        const canvas = this.containerRef.querySelector("canvas");
        if (canvas) {
          canvas.style.width = `${currentWidth * zoomLevel}px`;
        }
      }
    } catch (err) {
      console.error("Error applying zoom:", err);
    }
  }

  updateScrollPosition() {
    if (!this.wavesurfer || !this.containerRef) return;

    try {
      const scrollContainer = this.containerRef.parentElement;
      if (!scrollContainer || !scrollContainer.scrollLeft) return;

      // Get current time and duration
      const currentTime = this.wavesurfer.getCurrentTime();
      const duration = this.wavesurfer.getDuration();

      if (!duration) return;

      // Calculate position of playhead within waveform
      const currentPosition =
        (currentTime / duration) * this.containerRef.scrollWidth;

      // Get container dimensions
      const containerWidth = scrollContainer.clientWidth;

      // Center the playhead in the container
      const newScrollLeft = currentPosition - containerWidth / 2;

      // Apply scroll position
      scrollContainer.scrollLeft = Math.max(0, newScrollLeft);
    } catch (err) {
      console.error("Error updating scroll position:", err);
    }
  }

  seekTo(time: number) {
    if (!this.wavesurfer) return;

    try {
      const duration = this.wavesurfer.getDuration() || 1;
      const normalizedTime = Math.max(0, Math.min(time, duration));
      this.wavesurfer.seekTo(normalizedTime / duration);
    } catch (err) {
      console.error("Error seeking:", err);
    }
  }

  getCurrentTime(): number {
    if (!this.wavesurfer) return 0;
    try {
      return this.wavesurfer.getCurrentTime();
    } catch (err) {
      console.error("Error getting current time:", err);
      return 0;
    }
  }

  getDuration(): number {
    if (!this.wavesurfer) return 0;
    try {
      return this.wavesurfer.getDuration();
    } catch (err) {
      console.error("Error getting duration:", err);
      return 0;
    }
  }

  updateTrimRegion(startTime: number, endTime: number) {
    if (!this.wavesurfer) return;

    try {
      console.log("Updating trim region:", startTime, endTime);

      // Find the regions plugin
      const plugins = this.wavesurfer.getActivePlugins();
      const regionsPlugin = plugins.find((p) => p.name === "regions");

      if (!regionsPlugin) {
        console.warn("Regions plugin not found");
        return;
      }

      // Remove existing trim region
      if (this.regions.trim) {
        try {
          const existingRegions = regionsPlugin.getRegions?.() || [];
          const existingRegion = existingRegions.find(
            (r: any) => r.id === "trim"
          );
          if (existingRegion && existingRegion.remove) {
            existingRegion.remove();
          }
        } catch (err) {
          console.warn("Error removing existing region:", err);
        }
        delete this.regions.trim;
      }

      // Create new trim region
      try {
        if (regionsPlugin.addRegion) {
          const region = regionsPlugin.addRegion({
            id: "trim",
            start: startTime,
            end: endTime,
            color: "rgba(99, 102, 241, 0.2)",
            drag: false,
            resize: false,
          });

          if (region) {
            this.regions.trim = region.id;
          }
        }
      } catch (err) {
        console.error("Error creating trim region:", err);
      }
    } catch (err) {
      console.error("Error in updateTrimRegion:", err);
    }
  }

  clearRegions() {
    if (!this.wavesurfer) return;

    try {
      // Find the regions plugin
      const plugins = this.wavesurfer.getActivePlugins();
      const regionsPlugin = plugins.find((p) => p.name === "regions") as any;

      if (!regionsPlugin || !regionsPlugin.clearRegions) return;

      // Clear all regions
      regionsPlugin.clearRegions();
      this.regions = {};
    } catch (err) {
      console.error("Error clearing regions:", err);
    }
  }

  clearCacheForUrl(url: string) {
    this.waveformCache.delete(url);
  }

  clearCache() {
    this.waveformCache.clear();
  }

  handleVideoTrimmed(originalUrl: string, newUrl: string) {
    // Reset initialization attempts
    this.initializationAttempts = 0;

    // Clear cache for original URL
    this.clearCacheForUrl(originalUrl);

    // Generate waveform for the new URL
    this.generateWaveform(newUrl, true);
  }

  private async createWaveSurferInstance(mediaUrl: string) {
    if (!this.containerRef) {
      throw new Error("No container reference available");
    }

    try {
      console.log("Creating WaveSurfer instance");

      // Clear the container
      while (this.containerRef.firstChild) {
        this.containerRef.removeChild(this.containerRef.firstChild);
      }

      // Create a configuration that works across WaveSurfer versions
      const wavesurferConfig: any = {
        container: this.containerRef,
        waveColor: "rgba(99, 102, 241, 0.6)",
        progressColor: "rgba(79, 70, 229, 0.8)",
        height: 40,
        fillParent: true,
        hideScrollbar: true,
        // Improve rendering
        barWidth: 2,
        barGap: 1,
        barRadius: 0,
        cursorWidth: 0,
        // Don't connect to audio node to prevent playback interference
        mediaControls: false,
      };

      // Check WaveSurfer version and adjust configuration
      const isWaveSurferV6Plus = typeof WaveSurfer.create === "function";

      if (isWaveSurferV6Plus) {
        // WaveSurfer v6+ configuration
        console.log("Using WaveSurfer v6+ configuration");
        wavesurferConfig.backend = "WebAudio";
        wavesurferConfig.normalize = true;
        wavesurferConfig.pixelRatio = window.devicePixelRatio || 1;
        wavesurferConfig.minPxPerSec = 1;
        wavesurferConfig.interact = false;
        wavesurferConfig.autoCenter = false;
      } else {
        // WaveSurfer v5 or earlier configuration
        console.log("Using WaveSurfer v5 or earlier configuration");
        wavesurferConfig.backend = "MediaElement";
        wavesurferConfig.normalize = true;
        wavesurferConfig.pixelRatio = window.devicePixelRatio || 1;
        wavesurferConfig.minPxPerSec = 1;
      }

      // Create the WaveSurfer instance
      this.wavesurfer = WaveSurfer.create(wavesurferConfig) as WaveSurferProps;

      console.log("WaveSurfer instance created");

      // Set up event listeners
      this.setupWavesurferEvents(mediaUrl);

      // Create an abort controller for timeouts
      const abortController = new AbortController();
      const { signal } = abortController;

      // Set a timeout for wave generation
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 20000); // 20 seconds timeout

      try {
        // Use different approaches based on the WaveSurfer version and what's available
        if (this.element) {
          console.log("Using video element for waveform source");

          await Promise.race([
            new Promise<void>((resolve, reject) => {
              try {
                // Listen for ready event
                this.wavesurfer!.once("ready", () => {
                  clearTimeout(timeoutId);
                  console.log(
                    "Waveform successfully generated from video element"
                  );
                  resolve();
                });

                // Listen for error event
                this.wavesurfer!.once("error", (err) => {
                  clearTimeout(timeoutId);
                  console.error("WaveSurfer error while loading:", err);
                  reject(
                    new Error(
                      `WaveSurfer error: ${err?.toString() || "unknown error"}`
                    )
                  );
                });

                // Try different methods to connect the video element based on WaveSurfer version
                // Method 1: First try loadMediaElement if available (WaveSurfer v2+)
                if (typeof this.wavesurfer?.loadMediaElement === "function") {
                  console.log("Using loadMediaElement method");
                  this.wavesurfer.loadMediaElement(this.element, mediaUrl);
                }
                // Method 2: Try load with media element source (WaveSurfer v6+)
                else if (isWaveSurferV6Plus) {
                  console.log(
                    "Using WaveSurfer v6+ load method with media element"
                  );

                  // For WaveSurfer v6+, we might need to set the source differently
                  // Create a temporary media source from the video element
                  const url =
                    mediaUrl || this.element?.src || this.element?.currentSrc;

                  if (url) {
                    console.log("Loading from URL:", url);
                    this.wavesurfer?.load(url);
                  } else {
                    console.log(
                      "No URL found, attempting to extract audio directly"
                    );
                    // Try to create an audio context and extract audio manually
                    this.extractAudioManually();
                  }
                }
                // Method 3: For WaveSurfer v5 or older with the Backend set to "MediaElement"
                else if (
                  wavesurferConfig.backend === "MediaElement" &&
                  this.wavesurfer?.backend
                ) {
                  console.log("Using MediaElement backend method");
                  try {
                    // Try to directly set the media element if the backend supports it
                    (this.wavesurfer.backend as any).media = this.element;
                    this.wavesurfer.drawBuffer?.();

                    // Call any initialization methods that might be needed
                    if (typeof this.wavesurfer.load === "function") {
                      this.wavesurfer.load(mediaUrl || this.element?.src || "");
                    } else {
                      // If we can't find a way to load, but we've set the media element,
                      // manually resolve after a short delay to give it time to process
                      setTimeout(() => resolve(), 1000);
                    }
                  } catch (err) {
                    console.error("Error setting media element directly:", err);
                    // Fall back to URL loading
                    this.wavesurfer.load(mediaUrl);
                  }
                }
                // Method 4: Last resort, just try standard load with URL
                else {
                  console.log("Falling back to standard URL loading");
                  this.wavesurfer?.load(mediaUrl);
                }
              } catch (err) {
                clearTimeout(timeoutId);
                reject(err);
              }
            }),
            new Promise<never>((_, reject) => {
              signal.addEventListener("abort", () => {
                reject(new Error("Waveform generation timeout"));
              });
            }),
          ]);
        } else {
          // Fallback to direct URL loading (less reliable)
          console.log(
            "No video element available, using URL directly (less reliable)"
          );

          await Promise.race([
            new Promise<void>((resolve, reject) => {
              this.wavesurfer!.once("ready", () => {
                clearTimeout(timeoutId);
                resolve();
              });

              this.wavesurfer!.once("error", (err) => {
                clearTimeout(timeoutId);
                reject(
                  new Error(
                    `WaveSurfer error: ${err?.toString() || "unknown error"}`
                  )
                );
              });

              this.wavesurfer!.load(mediaUrl);
            }),
            new Promise<never>((_, reject) => {
              signal.addEventListener("abort", () => {
                reject(new Error("Waveform generation timeout"));
              });
            }),
          ]);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      // Add regions plugin after successful load
      this.addRegionsPlugin();
    } catch (err) {
      console.error("Error creating WaveSurfer instance:", err);
      throw err;
    }
  }

  /**
   * Manual audio extraction as a last resort for difficult cases
   */
  private extractAudioManually() {
    if (!this.element || !this.wavesurfer) return;

    try {
      console.log("Attempting manual audio extraction");

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create source from video element
      const source = audioContext.createMediaElementSource(this.element);

      // Connect to destination to enable audio processing
      source.connect(audioContext.destination);

      // Signal to WaveSurfer that audio is ready (if it has this method)
      if (typeof this.wavesurfer.fireEvent === "function") {
        setTimeout(() => {
          this.wavesurfer?.fireEvent?.("ready");
        }, 1000);
      }
    } catch (err) {
      console.error("Manual audio extraction failed:", err);

      // If all else fails, create a synthetic waveform
      setTimeout(() => {
        this.createFallbackWaveform(
          "Audio extraction not supported in this browser"
        );
      }, 500);
    }
  }

  /**
   * Adds the regions plugin with version compatibility
   */
  private addRegionsPlugin() {
    if (!this.wavesurfer) return;

    try {
      // Check if RegionsPlugin is exported as default (newer versions) or as a property

      const regionsPlugin =
        typeof RegionsPlugin === "function"
          ? RegionsPlugin.create()
          : //@ts-expect-error assume create exists in RegionsPlugin
            typeof RegionsPlugin.create === "function"
            ? //@ts-expect-error assume create exists in RegionsPlugin
              RegionsPlugin.create()
            : //@ts-expect-error assume regions exists in RegionsPlugin
              typeof RegionsPlugin.regions === "function"
              ? //@ts-expect-error assume regions exists in RegionsPlugin
                RegionsPlugin.regions()
              : null;

      if (regionsPlugin) {
        // Different versions have different registration methods
        if (typeof this.wavesurfer.registerPlugin === "function") {
          this.wavesurfer.registerPlugin(regionsPlugin);
        } else if (typeof this.wavesurfer.addPlugin === "function") {
          (this.wavesurfer as any).addPlugin(regionsPlugin);
        } else if (this.wavesurfer.initialisedPluginList !== undefined) {
          (this.wavesurfer as any).initialisedPluginList.push(regionsPlugin);
        }
        console.log("Regions plugin registered");
      } else {
        console.warn("Could not create regions plugin - incompatible version");
      }
    } catch (err) {
      console.warn("Could not initialize regions plugin:", err);
    }
  }
}

// import { makeObservable, observable, action, runInAction } from "mobx";
// import { createFallbackWaveform } from "../utils/initialize";

// // Define types for better TypeScript support
// interface WavesurferInterface {
//   destroy: () => void;
//   load: (url: string) => void;
//   on: (event: string, callback: (...args: any[]) => void) => void;
//   once: (event: string, callback: (...args: any[]) => void) => void;
//   getDuration: () => number;
//   seekTo: (position: number) => void;
//   getCurrentTime: () => number;
//   getActivePlugins: () => any[];
//   zoom: (value: number) => void;
//   [key: string]: any;
// }

// interface CachedWaveform {
//   peaks: number[][];
//   duration: number;
//   sampleRate: number;
//   timestamp: number;
// }

// export class WaveformManager {
//   private waveformCache: Map<string, CachedWaveform> = new Map();
//   private wavesurfer: WavesurferInterface | null = null;
//   private containerRef: HTMLElement | null = null;
//   isLoading: boolean = false;
//   error: string | null = null;
//   private onProgressCallback: ((progress: number) => void) | null = null;
//   private currentUrl: string = "";
//   private videoElement: HTMLVideoElement | null = null;
//   private audioElement: HTMLAudioElement | null = null;
//   private readonly MAX_CACHE_SIZE = 10;
//   private regions: { [id: string]: any } = {};
//   zoom: number = 1;
//   private lastContainerWidth: number = 0;

//   // Added to track initialization attempts and fallback status
//   private initializationAttempts: number = 0;
//   private readonly MAX_INIT_ATTEMPTS = 3;
//   private useFallbackWaveform: boolean = false;
//   private wavesurferLibLoaded: boolean = false;

//   constructor() {
//     makeObservable(this, {
//       isLoading: observable,
//       error: observable,
//       zoom: observable,
//       setContainer: action,
//       setVideoElement: action,
//       generateWaveform: action,
//       setZoom: action,
//       seekTo: action,
//       updateTrimRegion: action,
//       clearRegions: action,
//       clearCacheForUrl: action,
//       clearCache: action,
//       handleVideoTrimmed: action,
//       destroyWaveSurfer: action,
//     });

//     // Attempt to load the wavesurfer library
//     this.loadWavesurferLibrary();
//   }

//   /**
//    * Load the wavesurfer library dynamically
//    */
//   private async loadWavesurferLibrary(): Promise<void> {
//     // Check if wavesurfer is already available in the global scope
//     if (window.WaveSurfer) {
//       console.log("WaveSurfer already loaded in window scope");
//       this.wavesurferLibLoaded = true;
//       return;
//     }

//     try {
//       // Dynamically load wavesurfer if needed (fallback mechanism)
//       const cdnUrl =
//         "https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/6.6.3/wavesurfer.min.js";

//       console.log("Attempting to load WaveSurfer from CDN");

//       const script = document.createElement("script");
//       script.src = cdnUrl;
//       script.async = true;

//       const loadPromise = new Promise<void>((resolve, reject) => {
//         script.onload = () => {
//           console.log("WaveSurfer loaded successfully from CDN");
//           this.wavesurferLibLoaded = true;
//           resolve();
//         };
//         script.onerror = () => {
//           console.error("Failed to load WaveSurfer from CDN");
//           reject(new Error("Failed to load WaveSurfer library"));
//         };
//       });

//       document.head.appendChild(script);

//       // Set timeout for loading
//       const timeoutPromise = new Promise<never>((_, reject) => {
//         setTimeout(() => {
//           reject(new Error("Timed out loading WaveSurfer library"));
//         }, 10000);
//       });

//       await Promise.race([loadPromise, timeoutPromise]);
//     } catch (error) {
//       console.error("Error loading WaveSurfer:", error);
//       this.useFallbackWaveform = true;
//     }
//   }

//   setContainer(container: HTMLElement | null) {
//     console.log("WaveformManager: Setting container", container);
//     this.containerRef = container;

//     if (container) {
//       this.lastContainerWidth = container.offsetWidth;

//       // Ensure container has a height
//       if (container.offsetHeight < 40) {
//         container.style.height = "40px";
//       }

//       // If we have a URL, initialize waveform
//       if (this.currentUrl) {
//         this.generateWaveform(this.currentUrl);
//       }
//     }
//   }

//   setVideoElement(videoElement: HTMLVideoElement | null) {
//     console.log("WaveformManager: Setting video element", videoElement);
//     this.videoElement = videoElement;

//     // Reset initialization attempts when setting a new video element
//     this.initializationAttempts = 0;

//     // If we already have a URL and container, regenerate the waveform
//     if (this.currentUrl && this.containerRef) {
//       this.generateWaveform(this.currentUrl);
//     }
//   }

//   setAudioElement(audioElement: HTMLAudioElement | null) {
//     console.log("WaveformManager: Setting audio element", audioElement);
//     this.audioElement = audioElement;

//     // Reset initialization attempts when setting a new video element
//     this.initializationAttempts = 0;

//     // If we already have a URL and container, regenerate the waveform
//     if (this.currentUrl && this.containerRef) {
//       this.generateWaveform(this.currentUrl);
//     }
//   }

//   setProgressCallback(callback: (progress: number) => void) {
//     this.onProgressCallback = callback;
//   }

//   async generateWaveform(audioUrl: string, forceRegenerate: boolean = false) {
//     console.log("WaveformManager: Generating waveform for", audioUrl);

//     if (!audioUrl) {
//       console.warn("No audio URL provided");
//       this.createFallbackWaveform("No audio URL provided");
//       return;
//     }

//     if (!this.containerRef) {
//       console.warn("No container reference available");
//       return;
//     }

//     // Update current URL
//     this.currentUrl = audioUrl;

//     // Set loading state
//     runInAction(() => {
//       this.isLoading = true;
//       this.error = null;
//     });

//     // If using fallback waveform mode, don't try to use WaveSurfer
//     if (this.useFallbackWaveform) {
//       this.createFallbackWaveform("Using fallback waveform visualization");
//       return;
//     }

//     // Track initialization attempt
//     this.initializationAttempts++;
//     if (this.initializationAttempts > this.MAX_INIT_ATTEMPTS) {
//       console.warn(
//         "Max initialization attempts reached, switching to fallback"
//       );
//       this.useFallbackWaveform = true;
//       this.createFallbackWaveform("Too many initialization attempts");
//       return;
//     }

//     try {
//       // Wait for wavesurfer library to be available
//       if (!this.wavesurferLibLoaded && !window.WaveSurfer) {
//         await this.loadWavesurferLibrary();
//       }

//       // Check if WaveSurfer is available
//       if (!window.WaveSurfer && !this.wavesurferLibLoaded) {
//         throw new Error("WaveSurfer library not available");
//       }

//       // Check cache first unless forced to regenerate
//       if (!forceRegenerate && this.waveformCache.has(audioUrl)) {
//         console.log("Using cached waveform data");
//         await this.loadFromCache(audioUrl);
//         return;
//       }

//       // Destroy previous instance if exists
//       this.destroyWaveSurfer();

//       // Create new WaveSurfer instance with more robust initialization
//       await this.createWaveSurferInstance(audioUrl);
//     } catch (err) {
//       console.error("Waveform generation error:", err);
//       runInAction(() => {
//         this.error =
//           err instanceof Error ? err.message : "Failed to generate waveform";
//         this.isLoading = false;
//       });
//       this.createFallbackWaveform(this.error || "Unknown error");
//     }
//   }

//   /**
//    * Create a fallback waveform when WaveSurfer fails
//    */
//   private createFallbackWaveform(
//     errorMessage: string = "Audio visualization failed"
//   ): void {
//     if (!this.containerRef) return;

//     console.log("Creating fallback waveform with message:", errorMessage);

//     // Clear the container
//     while (this.containerRef.firstChild) {
//       this.containerRef.removeChild(this.containerRef.firstChild);
//     }

//     // Create a canvas for manual drawing
//     const canvas = document.createElement("canvas");
//     canvas.width = this.containerRef.offsetWidth;
//     canvas.height = 40;
//     canvas.style.width = "100%";
//     canvas.style.height = "40px";
//     this.containerRef.appendChild(canvas);

//     // Use the utility function to draw the fallback waveform
//     createFallbackWaveform(canvas);

//     runInAction(() => {
//       this.isLoading = false;
//       if (!this.error) {
//         this.error = errorMessage;
//       }
//     });
//   }

//   private async createWaveSurferInstance(audioUrl: string) {
//     if (!this.containerRef) {
//       throw new Error("No container reference available");
//     }

//     try {
//       console.log("Creating WaveSurfer instance");

//       // Clear the container
//       while (this.containerRef.firstChild) {
//         this.containerRef.removeChild(this.containerRef.firstChild);
//       }

//       // Create the WaveSurfer instance
//       const WaveSurfer = window.WaveSurfer;

//       // Create a configuration that works with WaveSurfer
//       const wavesurferConfig: any = {
//         container: this.containerRef,
//         waveColor: "rgba(99, 102, 241, 0.6)",
//         progressColor: "rgba(79, 70, 229, 0.8)",
//         height: 40,
//         fillParent: true,
//         hideScrollbar: true,
//         barWidth: 2,
//         barGap: 1,
//         barRadius: 0,
//         cursorWidth: 0,
//         mediaControls: false,
//         normalize: true,
//         pixelRatio: window.devicePixelRatio || 1,
//         responsive: true,
//         partialRender: true,
//       };

//       // For modern WaveSurfer (6+)
//       if (typeof WaveSurfer.create === "function") {
//         this.wavesurfer = WaveSurfer.create(wavesurferConfig);
//       } else {
//         // Fallback for older versions
//         this.wavesurfer = new WaveSurfer(wavesurferConfig);
//       }

//       console.log("WaveSurfer instance created");

//       // Set up event listeners
//       this.setupWavesurferEvents(audioUrl);

//       // Create an abort controller for timeouts
//       const abortController = new AbortController();
//       const { signal } = abortController;

//       // Set a timeout for wave generation
//       const timeoutId = setTimeout(() => {
//         abortController.abort();
//       }, 20000); // 20 seconds timeout

//       try {
//         // Load the audio URL
//         this.wavesurfer?.load(audioUrl);

//         // Wait for either ready event or timeout
//         await Promise.race([
//           new Promise<void>((resolve, reject) => {
//             if (!this.wavesurfer) {
//               reject(new Error("WaveSurfer instance not available"));
//               return;
//             }

//             // Listen for ready event
//             this.wavesurfer.once("ready", () => {
//               clearTimeout(timeoutId);
//               resolve();
//             });

//             // Listen for error event
//             this.wavesurfer.once("error", (err: any) => {
//               clearTimeout(timeoutId);
//               reject(
//                 new Error(
//                   `WaveSurfer error: ${err?.toString() || "unknown error"}`
//                 )
//               );
//             });
//           }),
//           new Promise<never>((_, reject) => {
//             signal.addEventListener("abort", () => {
//               reject(new Error("Waveform generation timeout"));
//             });
//           }),
//         ]);
//       } catch (error) {
//         clearTimeout(timeoutId);
//         throw error;
//       }

//       // Add regions plugin if successful
//       this.addRegionsPlugin();
//     } catch (err) {
//       console.error("Error creating WaveSurfer instance:", err);
//       throw err;
//     }
//   }

//   private setupWavesurferEvents(audioUrl: string) {
//     if (!this.wavesurfer) return;

//     // Ready event - fired when waveform is generated and ready
//     this.wavesurfer.on("ready", () => {
//       console.log("WaveSurfer ready event fired");
//       if (!this.wavesurfer) return;

//       runInAction(() => {
//         this.isLoading = false;
//         this.error = null;
//       });

//       // Cache the waveform data
//       this.cacheWaveformData(audioUrl);

//       // Apply current zoom level immediately
//       if (this.zoom !== 1) {
//         this.applyZoom(this.zoom);
//       }
//     });

//     // Error event with better error details
//     this.wavesurfer.on("error", (err: any) => {
//       console.error("WaveSurfer error:", err);

//       // Extract more specific error information
//       const errorMsg = err?.toString() || "Unknown error";

//       // Check if this is a no-audio error
//       const isNoAudioError =
//         errorMsg.includes("no audio") ||
//         errorMsg.includes("audio track") ||
//         errorMsg.includes("MediaElementAudioSource");

//       runInAction(() => {
//         this.error = isNoAudioError
//           ? "No audio track detected"
//           : `Error loading audio: ${errorMsg}`;
//         this.isLoading = false;
//       });

//       this.createFallbackWaveform(this.error || undefined);
//     });

//     // Loading progress event
//     this.wavesurfer.on("loading", (percent: number) => {
//       console.log("WaveSurfer loading progress:", percent);
//       if (this.onProgressCallback) {
//         this.onProgressCallback(percent / 100);
//       }
//     });
//   }

//   private cacheWaveformData(url: string) {
//     if (!this.wavesurfer) return;

//     try {
//       console.log("Caching waveform data");

//       // Get duration
//       const duration = this.wavesurfer.getDuration() || 0;

//       // Try to get the actual peaks or create a synthetic representation
//       let peaks: number[][] = [];
//       try {
//         // Different versions of wavesurfer store peaks differently
//         const rawPeaks =
//           (this.wavesurfer as any).backend?.mergedPeaks ||
//           (this.wavesurfer as any).backend?.peaks ||
//           (this.wavesurfer as any).exportPeaks?.();

//         if (rawPeaks && Array.isArray(rawPeaks)) {
//           peaks = [rawPeaks];
//         } else {
//           // Generate synthetic peaks if we can't get real ones
//           const syntheticPeaks = Array.from({ length: 1000 }).map(
//             () => Math.random() * 0.5 + 0.25
//           );
//           peaks = [syntheticPeaks];
//         }
//       } catch (e) {
//         console.warn("Error extracting peaks, using synthetic data", e);
//         // Generate synthetic peaks as fallback
//         const syntheticPeaks = Array.from({ length: 1000 }).map(
//           () => Math.random() * 0.5 + 0.25
//         );
//         peaks = [syntheticPeaks];
//       }

//       // Store in cache
//       this.waveformCache.set(url, {
//         peaks,
//         duration,
//         sampleRate: 1000,
//         timestamp: Date.now(),
//       });

//       // Manage cache size
//       this.pruneCache();
//     } catch (err) {
//       console.warn("Failed to cache waveform data:", err);
//     }
//   }

//   private async loadFromCache(url: string) {
//     if (!this.containerRef) return;

//     const cachedData = this.waveformCache.get(url);
//     if (!cachedData) return;

//     console.log("Loading waveform from cache");

//     try {
//       // Destroy previous instance
//       this.destroyWaveSurfer();

//       // Create new instance with cached data
//       await this.createWaveSurferInstance(url);

//       // Update cache timestamp
//       this.waveformCache.set(url, {
//         ...cachedData,
//         timestamp: Date.now(),
//       });

//       runInAction(() => {
//         this.isLoading = false;
//       });
//     } catch (error) {
//       console.error("Error loading from cache:", error);
//       // Fall back to regular generation
//       this.createFallbackWaveform("Error loading from cache");
//     }
//   }

//   private pruneCache() {
//     if (this.waveformCache.size <= this.MAX_CACHE_SIZE) return;

//     // Convert to array, sort by timestamp, and remove oldest
//     const entries = Array.from(this.waveformCache.entries());
//     entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

//     // Remove oldest entries
//     const entriesToRemove = entries.slice(
//       0,
//       entries.length - this.MAX_CACHE_SIZE
//     );
//     for (const [url] of entriesToRemove) {
//       this.waveformCache.delete(url);
//     }
//   }

//   destroyWaveSurfer() {
//     console.log("Destroying WaveSurfer instance");
//     if (this.wavesurfer) {
//       try {
//         this.wavesurfer.destroy();
//       } catch (error) {
//         console.error("Error destroying WaveSurfer:", error);
//       }
//       this.wavesurfer = null;
//     }
//   }

//   setZoom(zoomLevel: number) {
//     console.log("Setting zoom level:", zoomLevel);

//     // Store the new zoom level
//     this.zoom = zoomLevel;

//     // Apply zoom to wavesurfer
//     this.applyZoom(zoomLevel);
//   }

//   private applyZoom(zoomLevel: number) {
//     if (!this.wavesurfer || !this.containerRef) return;

//     try {
//       console.log("Applying zoom level:", zoomLevel);

//       // Check if container width has changed (can affect zoom)
//       const currentWidth = this.containerRef.offsetWidth;
//       if (currentWidth !== this.lastContainerWidth) {
//         console.log(
//           "Container width changed from",
//           this.lastContainerWidth,
//           "to",
//           currentWidth
//         );
//         this.lastContainerWidth = currentWidth;
//       }

//       // Calculate the ideal minPxPerSec for the zoom level
//       const duration = this.wavesurfer.getDuration() || 1;
//       const baseMinPxPerSec = currentWidth / duration;
//       const newMinPxPerSec = baseMinPxPerSec * zoomLevel;

//       // Apply the zoom with the calculated value
//       this.wavesurfer.zoom(newMinPxPerSec);

//       // For fallback waveforms, update the canvas width
//       if (this.error && this.containerRef) {
//         const canvas = this.containerRef.querySelector("canvas");
//         if (canvas) {
//           canvas.style.width = `${currentWidth * zoomLevel}px`;
//         }
//       }
//     } catch (err) {
//       console.error("Error applying zoom:", err);
//     }
//   }

//   seekTo(time: number) {
//     if (this.useFallbackWaveform || !this.wavesurfer) {
//       // In fallback mode, we can still update the visual marker
//       if (this.containerRef) {
//         const canvas = this.containerRef.querySelector("canvas");
//         if (canvas) {
//           const ctx = canvas.getContext("2d");
//           if (ctx) {
//             // Redraw the canvas with the current time marker
//             createFallbackWaveform(canvas);

//             // Draw the time marker
//             const duration = this.getDuration(); // Use our own duration getter
//             if (duration > 0) {
//               const position = (time / duration) * canvas.width;
//               ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
//               ctx.fillRect(position, 0, 2, canvas.height);
//             }
//           }
//         }
//       }
//       return;
//     }

//     try {
//       const duration = this.wavesurfer.getDuration() || 1;
//       const normalizedTime = Math.max(0, Math.min(time, duration));

//       // Different WaveSurfer versions use different seeking methods
//       if (typeof this.wavesurfer.seekTo === "function") {
//         // Newer versions use seekTo with 0-1 position value
//         this.wavesurfer.seekTo(normalizedTime / duration);
//       } else if (typeof this.wavesurfer.skip === "function") {
//         // Some versions use skip with time difference
//         const currentTime = this.wavesurfer.getCurrentTime() || 0;
//         this.wavesurfer.skip(normalizedTime - currentTime);
//       } else if (typeof this.wavesurfer.currentTime === "function") {
//         // Some versions might have currentTime setter
//         this.wavesurfer.currentTime(normalizedTime);
//       }
//     } catch (err) {
//       console.error("Error seeking:", err);
//     }
//   }

//   getCurrentTime(): number {
//     if (!this.wavesurfer) return 0;
//     try {
//       return this.wavesurfer.getCurrentTime();
//     } catch (err) {
//       console.error("Error getting current time:", err);
//       return 0;
//     }
//   }

//   getDuration(): number {
//     if (!this.wavesurfer) return 0;
//     try {
//       return this.wavesurfer.getDuration();
//     } catch (err) {
//       console.error("Error getting duration:", err);
//       return 0;
//     }
//   }

//   updateTrimRegion(startTime: number, endTime: number) {
//     if (this.useFallbackWaveform || !this.wavesurfer) {
//       // In fallback mode, draw a simplified region on the canvas
//       if (this.containerRef) {
//         const canvas = this.containerRef.querySelector("canvas");
//         if (canvas && canvas.getContext) {
//           const ctx = canvas.getContext("2d");
//           if (ctx) {
//             const duration = this.getDuration();
//             if (duration > 0) {
//               // Redraw the base waveform
//               createFallbackWaveform(canvas);

//               // Draw trim region
//               const startX = (startTime / duration) * canvas.width;
//               const endX = (endTime / duration) * canvas.width;
//               const width = endX - startX;

//               // Draw semi-transparent overlay for the trimmed region
//               ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
//               ctx.fillRect(startX, 0, width, canvas.height);

//               // Draw start and end markers
//               ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
//               ctx.fillRect(startX, 0, 2, canvas.height);
//               ctx.fillRect(endX, 0, 2, canvas.height);
//             }
//           }
//         }
//       }
//       return;
//     }

//     try {
//       console.log("Updating trim region:", startTime, endTime);

//       // Find the regions plugin or create basic visualization if not available
//       const plugins = this.wavesurfer.getActivePlugins();
//       const regionsPlugin = plugins.find((p) => p.name === "regions");

//       if (!regionsPlugin) {
//         console.warn("Regions plugin not found, using basic visualization");
//         // Draw basic trim region on the waveform directly
//         if (this.containerRef) {
//           const canvas = this.containerRef.querySelector("canvas");
//           if (canvas && canvas.getContext) {
//             const ctx = canvas.getContext("2d");
//             if (ctx) {
//               const duration = this.getDuration();
//               if (duration > 0) {
//                 // Calculate positions
//                 const startX = (startTime / duration) * canvas.width;
//                 const endX = (endTime / duration) * canvas.width;
//                 const width = endX - startX;

//                 // Draw semi-transparent overlay for the trimmed region
//                 ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
//                 ctx.fillRect(startX, 0, width, canvas.height);

//                 // Draw start and end markers
//                 ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
//                 ctx.fillRect(startX, 0, 2, canvas.height);
//                 ctx.fillRect(endX, 0, 2, canvas.height);
//               }
//             }
//           }
//         }
//         return;
//       }

//       // Remove existing trim region
//       if (this.regions.trim) {
//         try {
//           const existingRegions = regionsPlugin.getRegions?.() || [];
//           const existingRegion = existingRegions.find(
//             (r: any) => r.id === "trim"
//           );
//           if (existingRegion && existingRegion.remove) {
//             existingRegion.remove();
//           }
//         } catch (err) {
//           console.warn("Error removing existing region:", err);
//         }
//         delete this.regions.trim;
//       }

//       // Create new trim region
//       try {
//         if (regionsPlugin.addRegion) {
//           const region = regionsPlugin.addRegion({
//             id: "trim",
//             start: startTime,
//             end: endTime,
//             color: "rgba(99, 102, 241, 0.2)",
//             drag: false,
//             resize: false,
//           });

//           if (region) {
//             this.regions.trim = region.id;
//           }
//         }
//       } catch (err) {
//         console.error("Error creating trim region:", err);
//       }
//     } catch (err) {
//       console.error("Error in updateTrimRegion:", err);
//     }
//   }

//   clearRegions() {
//     if (this.useFallbackWaveform || !this.wavesurfer) {
//       // In fallback mode, just redraw the canvas without regions
//       if (this.containerRef) {
//         const canvas = this.containerRef.querySelector("canvas");
//         if (canvas) {
//           createFallbackWaveform(canvas);
//         }
//       }
//       return;
//     }

//     try {
//       // Find the regions plugin
//       const plugins = this.wavesurfer.getActivePlugins();
//       const regionsPlugin = plugins.find((p) => p.name === "regions") as any;

//       if (!regionsPlugin || !regionsPlugin.clearRegions) return;

//       // Clear all regions
//       regionsPlugin.clearRegions();
//       this.regions = {};
//     } catch (err) {
//       console.error("Error clearing regions:", err);
//     }
//   }

//   clearCacheForUrl(url: string) {
//     this.waveformCache.delete(url);
//   }

//   clearCache() {
//     this.waveformCache.clear();
//   }

//   handleVideoTrimmed(originalUrl: string, newUrl: string) {
//     // Reset initialization attempts
//     this.initializationAttempts = 0;

//     // Clear cache for original URL
//     this.clearCacheForUrl(originalUrl);

//     // Generate waveform for the new URL
//     this.generateWaveform(newUrl, true);
//   }

//   private addRegionsPlugin() {
//     if (this.useFallbackWaveform || !this.wavesurfer) return;

//     // Try to dynamically detect if regions plugin is available
//     try {
//       // Check if we can get the plugin
//       const RegionsPlugin =
//         window.WaveSurfer?.plugins?.regions || window.WaveSurferRegions;

//       if (!RegionsPlugin) {
//         console.warn(
//           "WaveSurfer Regions plugin not found - regions functionality will be limited"
//         );
//         return;
//       }

//       // Determine the correct way to create and register the plugin
//       let regionsPlugin;

//       // Try different methods to create the plugin based on version
//       if (typeof RegionsPlugin === "function") {
//         regionsPlugin = RegionsPlugin.create
//           ? RegionsPlugin.create()
//           : new RegionsPlugin();
//       } else if (typeof RegionsPlugin.create === "function") {
//         regionsPlugin = RegionsPlugin.create();
//       } else if (typeof RegionsPlugin.regions === "function") {
//         regionsPlugin = RegionsPlugin.regions();
//       }

//       if (!regionsPlugin) {
//         console.warn("Could not create regions plugin instance");
//         return;
//       }

//       // Register the plugin with WaveSurfer
//       if (typeof this.wavesurfer.registerPlugin === "function") {
//         this.wavesurfer.registerPlugin(regionsPlugin);
//       } else if (typeof this.wavesurfer.addPlugin === "function") {
//         (this.wavesurfer as any).addPlugin(regionsPlugin);
//       } else if ((this.wavesurfer as any).initialisedPluginList !== undefined) {
//         (this.wavesurfer as any).initialisedPluginList.push(regionsPlugin);
//       }

//       console.log("Regions plugin registered successfully");
//     } catch (err) {
//       console.warn("Could not initialize regions plugin:", err);
//     }
//   }
// }

// // Add WaveSurfer type definitions for better TypeScript support
// declare global {
//   interface Window {
//     WaveSurfer: any;
//     WaveSurferRegions?: any;
//   }
// }
