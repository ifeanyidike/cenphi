import { makeAutoObservable } from "mobx";
import { aspectRatioHandler } from "./aspect-ratio-handler";
import { workspaceHub } from "@/repo/workspace_hub";

/**
 * Enhanced CanvasCoordinator for high-performance video rendering
 *
 * This class handles all the real-time rendering of video effects without
 * requiring FFmpeg processing, making editing operations feel instantaneous.
 */
export class CanvasCoordinator {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;

  // Rendering state
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private frameSkipThreshold: number = 1000 / 30; // 30fps default target
  private isRendering: boolean = false;

  // Enhanced caching for better performance
  private cachedTransforms: Map<string, ImageData> = new Map();
  private cachedFrames: Map<number, ImageData> = new Map(); // Cache by timestamp
  private frameCacheSize: number = 20; // Number of frames to cache
  private frameCacheEnabled: boolean = true;

  // Performance optimization
  private qualityMode: "low" | "balanced" | "high" = "balanced";
  private frameRenderTimes: number[] = [];
  private frameRenderTimeLimit: number = 30; // Track last 30 frame render times
  private adaptiveQualityEnabled: boolean = true;
  private lastUsedCacheKey: string = "";
  // private isInteracting: boolean = false;
  private previousQualityMode: "low" | "balanced" | "high" | null = null;

  constructor() {
    makeAutoObservable(this);

    const isLowEndDevice = this.detectLowEndDevice();

    // Set initial quality based on device
    this.qualityMode = isLowEndDevice ? "low" : "balanced";

    // Adjust frame caching based on available memory
    if (isLowEndDevice) {
      this.frameCacheSize = 5; // Smaller cache for low-end devices
      this.frameCacheEnabled = false; // Disable frame caching on very low-end devices
    }
  }

  private detectLowEndDevice(): boolean {
    // Simple heuristics to detect low-end devices
    //@ts-expect-error assume device memory exists in navigator
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const hasSlowCPU =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    return hasLowMemory || hasSlowCPU;
  }

  /**
   * Initialize the canvas renderer with improved error handling
   */
  initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): void {
    if (!videoElement || !canvasElement) {
      console.error(
        "Invalid video or canvas element provided to CanvasCoordinator"
      );
      return;
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    try {
      // Use optimized context creation for better performance
      this.canvasContext = canvasElement.getContext("2d", {
        alpha: true,
        desynchronized: true, // Hardware acceleration when available
        willReadFrequently: this.frameCacheEnabled, // Optimize for caching frames
      });
    } catch (error) {
      console.error("Failed to create canvas context:", error);
      this.canvasContext = canvasElement.getContext("2d");
    }

    // Clear any existing rendering loop
    this.stopRendering();
    this.clearTransformCache();

    console.log("CanvasCoordinator initialized successfully");

    // Start rendering immediately to show the first frame
    this.startRendering();
  }

  /**
   * Start the optimized rendering loop
   */
  startRendering(): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.renderFrame();
  }

  /**
   * Stop the rendering loop
   */
  stopRendering(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRendering = false;
  }

  /**
   * Set render quality with optimized defaults
   */
  setQuality(mode: "low" | "balanced" | "high"): void {
    this.qualityMode = mode;

    // Adjust frame rate based on quality mode
    switch (mode) {
      case "low":
        this.frameSkipThreshold = 1000 / 15; // 15fps
        this.frameCacheSize = 5; // Smaller cache for memory savings
        break;
      case "balanced":
        this.frameSkipThreshold = 1000 / 30; // 30fps
        this.frameCacheSize = 20;
        break;
      case "high":
        this.frameSkipThreshold = 1000 / 60; // 60fps
        this.frameCacheSize = 30; // Larger cache for smoother playback
        break;
    }

    // Clear cache when changing quality
    this.clearTransformCache();
  }

  getAverageRenderTime() {
    return 0;
  }
  /**
   * Enable or disable frame caching for performance
   */
  setFrameCaching(enabled: boolean): void {
    this.frameCacheEnabled = enabled;
    if (!enabled) {
      this.clearTransformCache();
    }
  }

  /**
   * Clear all cached transforms and frames
   */
  clearTransformCache(): void {
    this.cachedTransforms.clear();
    this.cachedFrames.clear();
    this.lastUsedCacheKey = "";
  }

  /**
   * Set whether the user is currently interacting with controls
   * This can be used to optimize rendering during interactions
   */
  setInteracting(interacting: boolean): void {
    // this.isInteracting = interacting;

    if (interacting) {
      // When interaction starts, ensure rendering is active
      this.startRendering();

      // Lower quality during interactions for better performance
      if (this.qualityMode !== "low") {
        this.previousQualityMode = this.qualityMode;
        this.setQuality("low");
      }
    } else {
      // When interaction ends, restore previous quality if needed
      if (this.previousQualityMode && this.previousQualityMode !== "low") {
        this.setQuality(this.previousQualityMode);
        this.previousQualityMode = null;
      }

      // Clear transform cache to update with final state
      this.clearTransformCache();
    }
  }

  /**
   * Main rendering function with optimized performance
   */
  private renderFrame(): void {
    if (
      !this.isRendering ||
      !this.videoElement ||
      !this.canvasElement ||
      !this.canvasContext
    ) {
      this.rafId = null;
      return;
    }

    const now = performance.now();
    const timeSinceLastFrame = now - this.lastFrameTime;

    // Skip frame rendering during playback if we're rendering too frequently
    // This improves performance on slower devices
    if (
      timeSinceLastFrame < this.frameSkipThreshold &&
      this.rafId !== null &&
      workspaceHub.videoEditorManager?.isPlaying
    ) {
      this.rafId = requestAnimationFrame(() => this.renderFrame());
      return;
    }

    this.lastFrameTime = now;
    const startRenderTime = performance.now();

    try {
      // Ensure canvas size is updated before drawing
      this.updateCanvasSize();

      // Try to draw from cache first (fast path)
      if (!this.drawFromCache()) {
        // If cache miss, render the full frame (slow path)
        this.drawVideoFrame();
      }

      // Record render time for performance monitoring
      const renderTime = performance.now() - startRenderTime;
      this.frameRenderTimes.push(renderTime);

      // Maintain limited history for performance monitoring
      if (this.frameRenderTimes.length > this.frameRenderTimeLimit) {
        this.frameRenderTimes.shift();
      }

      // Adapt quality based on performance
      if (this.adaptiveQualityEnabled) {
        this.adaptiveQualityAdjustment();
      }
    } catch (error) {
      console.error("Error rendering video frame:", error);
    }

    // Continue rendering loop
    this.rafId = requestAnimationFrame(() => this.renderFrame());
  }

  /**
   * Try to draw from the cache for improved performance
   * @returns true if successfully drew from cache, false otherwise
   */
  private drawFromCache(): boolean {
    if (!this.frameCacheEnabled || !this.canvasContext) return false;

    const { videoEditorManager } = workspaceHub;

    // Generate cache key for current state
    const cacheKey = this.generateTransformCacheKey();

    // Fast path: If we're using exactly the same cache key as last time
    if (cacheKey === this.lastUsedCacheKey) {
      return true; // No need to redraw anything, frame is already correct
    }

    // Check if we have this exact transform cached
    if (this.cachedTransforms.has(cacheKey)) {
      const cachedFrame = this.cachedTransforms.get(cacheKey);
      if (cachedFrame) {
        this.canvasContext.putImageData(cachedFrame, 0, 0);
        this.lastUsedCacheKey = cacheKey;
        return true;
      }
    }

    // If playing, try drawing from frame cache (for better performance)
    if (videoEditorManager.isPlaying) {
      // Round time to nearest 0.1s for frame cache
      const timeKey = Math.round(videoEditorManager.currentTime * 10);

      if (this.cachedFrames.has(timeKey)) {
        const cachedFrame = this.cachedFrames.get(timeKey);
        if (cachedFrame) {
          this.canvasContext.putImageData(cachedFrame, 0, 0);
          return true;
        }
      }
    }

    return false; // Cache miss
  }

  /**
   * Updates the canvas size with optimized performance
   */
  private updateCanvasSize(): void {
    if (!this.canvasElement || !this.videoElement || !this.canvasContext)
      return;

    const { videoEditorManager } = workspaceHub;

    // Use device pixel ratio based on quality setting for best performance/quality tradeoff
    const dpr = this.qualityMode === "low" ? 1 : window.devicePixelRatio || 1;

    // Get the container dimensions
    const containerWidth = this.canvasElement.clientWidth;
    const containerHeight = this.canvasElement.clientHeight;

    // Skip update if dimensions haven't changed (performance optimization)
    if (
      this.canvasElement.width === containerWidth * dpr &&
      this.canvasElement.height === containerHeight * dpr
    ) {
      return;
    }

    // Calculate dimensions based on aspect ratio and container
    const displayDimensions = aspectRatioHandler.calculateDisplayDimensions(
      containerWidth,
      containerHeight,
      videoEditorManager.videoWidth || this.videoElement.videoWidth,
      videoEditorManager.videoHeight || this.videoElement.videoHeight,
      videoEditorManager.aspectRatio,
      videoEditorManager.customAspectRatio
    );

    // Set canvas size accounting for device pixel ratio
    const canvasWidth = displayDimensions.width * dpr;
    const canvasHeight = displayDimensions.height * dpr;

    // Update canvas dimensions
    this.canvasElement.width = canvasWidth;
    this.canvasElement.height = canvasHeight;

    // Scale drawing operations by the device pixel ratio
    this.canvasContext.scale(dpr, dpr);

    // Update CSS dimensions for proper display
    this.canvasElement.style.width = `${displayDimensions.width}px`;
    this.canvasElement.style.height = `${displayDimensions.height}px`;

    // Clear all caches when dimensions change
    this.clearTransformCache();
  }

  /**
   * Draw the current video frame with all effects applied
   */
  drawVideoFrame(): void {
    if (!this.videoElement || !this.canvasElement || !this.canvasContext)
      return;

    const { videoEditorManager } = workspaceHub;
    const ctx = this.canvasContext;
    const containerWidth = this.canvasElement.clientWidth;
    const containerHeight = this.canvasElement.clientHeight;

    // Skip rendering if video isn't ready
    if (
      this.videoElement.readyState < 2 ||
      !this.videoElement.videoWidth ||
      !this.videoElement.videoHeight
    ) {
      // Clear canvas and draw loading indicator instead
      ctx.clearRect(0, 0, containerWidth, containerHeight);
      this.drawLoadingIndicator();
      return;
    }

    // Clear the canvas first
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Generate cache key for this frame
    const cacheKey = this.generateTransformCacheKey();

    // Save context state
    ctx.save();

    // Apply transformations in order
    // 1. Move to center for rotation and flipping
    ctx.translate(containerWidth / 2, containerHeight / 2);

    // 2. Apply rotation
    if (videoEditorManager.transform.rotate !== 0) {
      ctx.rotate((videoEditorManager.transform.rotate * Math.PI) / 180);
    }

    // 3. Apply flips
    if (videoEditorManager.transform.flipHorizontal) {
      ctx.scale(-1, 1);
    }
    if (videoEditorManager.transform.flipVertical) {
      ctx.scale(1, -1);
    }

    // 4. Apply CSS filters for visual effects
    let filterString = "";

    // Only include non-default filters for performance
    if (videoEditorManager.videoFilters.grayscale > 0) {
      filterString += `grayscale(${videoEditorManager.videoFilters.grayscale / 100}) `;
    }
    if (videoEditorManager.videoFilters.sepia > 0) {
      filterString += `sepia(${videoEditorManager.videoFilters.sepia / 100}) `;
    }
    if (videoEditorManager.videoFilters.brightness !== 100) {
      filterString += `brightness(${videoEditorManager.videoFilters.brightness / 100}) `;
    }
    if (videoEditorManager.videoFilters.contrast !== 100) {
      filterString += `contrast(${videoEditorManager.videoFilters.contrast / 100}) `;
    }
    if (videoEditorManager.videoFilters.saturation !== 100) {
      filterString += `saturate(${videoEditorManager.videoFilters.saturation / 100}) `;
    }

    if (filterString.length > 0) {
      ctx.filter = filterString.trim();
    }

    // 5. Move back to draw from the top-left
    ctx.translate(-containerWidth / 2, -containerHeight / 2);

    // 6. Get crop parameters
    const cropParams = aspectRatioHandler.calculateCanvasCropParameters(
      videoEditorManager.crop,
      videoEditorManager.videoWidth || this.videoElement.videoWidth,
      videoEditorManager.videoHeight || this.videoElement.videoHeight,
      containerWidth,
      containerHeight
    );

    // 7. Draw the video with crop settings
    try {
      if (
        cropParams.sWidth > 0 &&
        cropParams.sHeight > 0 &&
        cropParams.dWidth > 0 &&
        cropParams.dHeight > 0
      ) {
        ctx.drawImage(
          this.videoElement,
          cropParams.sx,
          cropParams.sy,
          cropParams.sWidth,
          cropParams.sHeight,
          cropParams.dx,
          cropParams.dy,
          cropParams.dWidth,
          cropParams.dHeight
        );
      } else {
        // Fallback if crop dimensions are invalid
        ctx.drawImage(this.videoElement, 0, 0, containerWidth, containerHeight);
      }
    } catch (error) {
      console.error("Error drawing video frame:", error);
      // Try simpler drawing as fallback
      try {
        ctx.drawImage(this.videoElement, 0, 0, containerWidth, containerHeight);
      } catch (fallbackError: any) {
        // If even the fallback fails, just show an error indicator
        console.log("fallbackError", fallbackError.message);
        this.drawErrorIndicator("Error rendering video");
      }
    }

    // 8. Draw trim indicators if in trim mode
    if (videoEditorManager.activeEditMode === "trim") {
      this.drawTrimIndicators();
    }

    // 9. Cache the rendered frame for future use
    if (this.frameCacheEnabled) {
      try {
        // Cache the transform result
        this.cachedTransforms.set(
          cacheKey,
          ctx.getImageData(0, 0, containerWidth, containerHeight)
        );

        // Update last used cache key
        this.lastUsedCacheKey = cacheKey;

        // Also cache by time for playback optimization
        if (videoEditorManager.isPlaying) {
          // Round time to nearest 0.1s for frame cache
          const timeKey = Math.round(videoEditorManager.currentTime * 10);

          // Store in frame cache with LRU behavior (remove oldest frames if over cache size)
          this.cachedFrames.set(
            timeKey,
            ctx.getImageData(0, 0, containerWidth, containerHeight)
          );

          // Enforce cache size limit
          if (this.cachedFrames.size > this.frameCacheSize) {
            const oldestKey = this.cachedFrames.keys().next().value;
            if (oldestKey) this.cachedFrames.delete(oldestKey);
          }
        }
      } catch (error) {
        console.warn("Failed to cache frame:", error);
      }
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Draw loading indicator when video isn't ready
   */
  private drawLoadingIndicator(): void {
    if (!this.canvasContext || !this.canvasElement) return;

    const ctx = this.canvasContext;
    const width = this.canvasElement.clientWidth;
    const height = this.canvasElement.clientHeight;

    // Draw spinning circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.1;

    ctx.save();

    // Draw dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);

    // Draw spinner
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Calculate spinner position based on time
    const now = performance.now() / 1000;
    const startAngle = (now * Math.PI) % (Math.PI * 2);
    const endAngle = startAngle + Math.PI * 1.5;

    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading video...", centerX, centerY + radius + 30);

    ctx.restore();
  }

  /**
   * Draw error indicator when rendering fails
   */
  private drawErrorIndicator(message: string): void {
    if (!this.canvasContext || !this.canvasElement) return;

    const ctx = this.canvasContext;
    const width = this.canvasElement.clientWidth;
    const height = this.canvasElement.clientHeight;

    ctx.save();

    // Draw error background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    // Draw error icon
    ctx.fillStyle = "#ff5555";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 30, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw X in the circle
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2 - 40);
    ctx.lineTo(width / 2 + 10, height / 2 - 20);
    ctx.moveTo(width / 2 + 10, height / 2 - 40);
    ctx.lineTo(width / 2 - 10, height / 2 - 20);
    ctx.stroke();

    // Draw error message
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, width / 2, height / 2 + 20);

    ctx.restore();
  }

  /**
   * Draw trim indicators when in trim mode
   */
  private drawTrimIndicators(): void {
    if (!this.canvasContext || !this.canvasElement) return;

    const { videoEditorManager } = workspaceHub;
    if (videoEditorManager.activeEditMode !== "trim") return;

    const ctx = this.canvasContext;
    const width = this.canvasElement.clientWidth;
    const height = this.canvasElement.clientHeight;

    const duration = videoEditorManager.duration;
    const currentTime = videoEditorManager.currentTime;
    const startTime = videoEditorManager.trim.startTime;
    const endTime = videoEditorManager.trim.endTime;

    // Show grayed out regions for trimmed portions
    ctx.save();

    // Start trimmed region
    if (startTime > 0) {
      const startPos = (startTime / duration) * width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, startPos, height);

      // Draw start marker
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(startPos - 2, 0, 4, height);
    }

    // End trimmed region
    if (endTime < duration) {
      const endPos = (endTime / duration) * width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(endPos, 0, width - endPos, height);

      // Draw end marker
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(endPos - 2, 0, 4, height);
    }

    // Current time indicator
    const timePos = (currentTime / duration) * width;
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(timePos - 1, 0, 2, height);

    ctx.restore();
  }

  /**
   * Generate a cache key for the current transform state
   */
  private generateTransformCacheKey(): string {
    const { videoEditorManager } = workspaceHub;

    // Create a compact key that captures all transformation parameters
    // Optimize by only including parameters that affect rendering
    const key = {
      // Round values to reduce cache key variations but maintain visual fidelity
      c: [
        Math.round(videoEditorManager.crop.x * 10) / 10,
        Math.round(videoEditorManager.crop.y * 10) / 10,
        Math.round(videoEditorManager.crop.width * 10) / 10,
        Math.round(videoEditorManager.crop.height * 10) / 10,
      ],
      t: [
        Math.round(videoEditorManager.transform.rotate),
        videoEditorManager.transform.flipHorizontal ? 1 : 0,
        videoEditorManager.transform.flipVertical ? 1 : 0,
      ],
      f: [
        Math.round(videoEditorManager.videoFilters.grayscale / 5) * 5,
        Math.round(videoEditorManager.videoFilters.sepia / 5) * 5,
        Math.round(videoEditorManager.videoFilters.brightness / 5) * 5,
        Math.round(videoEditorManager.videoFilters.contrast / 5) * 5,
        Math.round(videoEditorManager.videoFilters.saturation / 5) * 5,
      ],
      a: videoEditorManager.aspectRatio,
      // Round time to nearest 0.1s to reduce cache variations during playback
      time: Math.round(videoEditorManager.currentTime * 10) / 10,
      // Include dimensions to account for canvas size changes
      d: `${this.canvasElement?.clientWidth}x${this.canvasElement?.clientHeight}`,
    };

    return JSON.stringify(key);
  }

  /**
   * Adjusts quality settings based on performance
   */
  private adaptiveQualityAdjustment(): void {
    if (!this.adaptiveQualityEnabled || this.frameRenderTimes.length < 10)
      return;

    // Calculate average render time
    const avgRenderTime =
      this.frameRenderTimes.reduce((a, b) => a + b, 0) /
      this.frameRenderTimes.length;

    const { videoEditorManager } = workspaceHub;
    const isPlaying = videoEditorManager?.isPlaying || false;

    // Implement smart quality adjustment with hysteresis to prevent oscillation
    if (isPlaying) {
      // During playback, prioritize performance
      if (avgRenderTime > 25 && this.qualityMode !== "low") {
        console.log(
          `Performance optimization: Reducing quality (${avgRenderTime.toFixed(2)}ms/frame)`
        );
        this.setQuality("low");

        // Also reduce cache size for memory efficiency
        this.frameCacheSize = 5;
      } else if (avgRenderTime < 8 && this.qualityMode === "low") {
        console.log(
          `Performance optimization: Increasing quality (${avgRenderTime.toFixed(2)}ms/frame)`
        );
        this.setQuality("balanced");
      }
    } else {
      // When paused, try to increase quality if performance allows
      if (avgRenderTime < 20 && this.qualityMode === "low") {
        this.setQuality("balanced");
      } else if (avgRenderTime < 10 && this.qualityMode === "balanced") {
        this.setQuality("high");
      }
    }
  }

  /**
   * Capture the current canvas content as a data URL
   */
  captureFrame(): string | null {
    if (!this.canvasElement) return null;

    try {
      // Force a render to ensure we have the latest state
      this.drawVideoFrame();

      // Get data URL from canvas
      return this.canvasElement.toDataURL("image/jpeg", 0.9);
    } catch (error) {
      console.error("Error capturing frame:", error);
      return null;
    }
  }

  /**
   * Render a specific frame at the given time
   */
  renderFrameAtTime(time: number): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.videoElement || !this.canvasElement) {
        resolve(null);
        return;
      }

      // Set the video time
      this.videoElement.currentTime = time;

      // Wait for the video to update to the specified time
      const handleSeeked = () => {
        // Remove the event listener
        this.videoElement?.removeEventListener("seeked", handleSeeked);

        // Render the frame
        this.drawVideoFrame();

        // Capture the frame
        const frameUrl = this.captureFrame();
        resolve(frameUrl);
      };

      // Add an event listener for when seeking is complete
      this.videoElement.addEventListener("seeked", handleSeeked);
    });
  }

  /**
   * Get performance metrics for debugging and monitoring
   */
  getPerformanceMetrics() {
    const avgRenderTime = this.frameRenderTimes.length
      ? this.frameRenderTimes.reduce((a, b) => a + b, 0) /
        this.frameRenderTimes.length
      : 0;

    return {
      averageRenderTime: avgRenderTime,
      cacheSize: this.cachedTransforms.size,
      frameCacheSize: this.cachedFrames.size,
      qualityMode: this.qualityMode,
      estimatedFps: avgRenderTime > 0 ? 1000 / avgRenderTime : 0,
    };
  }
}

export const canvasCoordinator = new CanvasCoordinator();
