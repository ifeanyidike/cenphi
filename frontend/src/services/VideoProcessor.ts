import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { app } from "@/stores/appStore";
import { FSNode } from "@ffmpeg/ffmpeg";
import { workspaceHub } from "@/repo/workspace_hub";

/**
 * Enhanced VideoProcessor provides optimized methods to process video for canvas rendering
 * Fixes performance issues, improves error handling, and optimizes memory management
 */

interface FileNode extends FSNode {
  name: string;
  size: number;
}
export class VideoProcessor {
  private ffmpegBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  private isLoaded = false;
  private processingQueue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private currentOperation: string | null = null;
  private loadPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;

  /**
   * Loads the FFmpeg core with better error handling and caching
   */
  public async load(): Promise<void> {
    if (this.isLoaded) return;

    // Return existing promise if already loading
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Set up abort controller for operation timeouts
        this.abortController = new AbortController();

        // Add event listeners
        app.ffmpeg.on("log", ({ message }) => {
          console.log("FFmpeg:", message);
        });

        // Improved progress reporting
        app.ffmpeg.on("progress", ({ progress, time }) => {
          if (workspaceHub.videoEditorManager) {
            workspaceHub.videoEditorManager.setProcessingProgress(
              progress * 100
            );
            // Update status with time estimate if available
            if (time && this.currentOperation) {
              workspaceHub.videoEditorManager.setProcessingStatus(
                `${this.currentOperation} - ${Math.round(progress * 100)}%`
              );
            }
          }
        });

        // Load FFmpeg with timeout to prevent hanging
        const loadTimeout = setTimeout(() => {
          reject(new Error("FFmpeg loading timed out"));
        }, 30000);

        await app.ffmpeg.load({
          coreURL: await toBlobURL(
            `${this.ffmpegBaseUrl}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${this.ffmpegBaseUrl}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
        });

        clearTimeout(loadTimeout);
        this.isLoaded = true;
        app.ffmpegLoaded = true;

        // Process any queued operations
        this.processQueue();
        resolve();
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        workspaceHub.videoEditorManager?.setProcessingStatus(
          "Failed to load video processor"
        );
        this.loadPromise = null;
        reject(error);
      }
    });

    return this.loadPromise;
  }

  /**
   * Process the queue of pending operations with better error recovery
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const nextOperation = this.processingQueue.shift();
      if (nextOperation) {
        await nextOperation();
      }
    } catch (error) {
      console.error("Error processing queue item:", error);
      // Report error to UI
      workspaceHub.videoEditorManager?.setProcessingStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.isProcessing = false;

      // Process next item if any
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100); // Small delay to prevent UI freezing
      } else {
        // Clear current operation when queue is empty
        this.currentOperation = null;
      }
    }
  }

  /**
   * Add an operation to the processing queue with improved control and timeout
   */
  private queueOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Create operation wrapper with cancellation support
      const operationWrapper = async () => {
        this.currentOperation = operationName;

        // Create new abort controller for each operation
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        // Set operation timeout
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
          reject(new Error(`Operation ${operationName} timed out`));
        }, 60000); // 60 second timeout

        try {
          // Clear previous files to save memory
          await this.clearPreviousOutput();

          // Check if operation was cancelled before starting
          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

          // Execute the operation
          const result = await operation();
          resolve(result);
        } catch (error) {
          console.error(`Error in operation ${operationName}:`, error);
          reject(error);
        } finally {
          clearTimeout(timeoutId);

          // Ensure we reset processing status on completion
          if (workspaceHub.videoEditorManager) {
            workspaceHub.videoEditorManager.setProcessingStatus("");
            workspaceHub.videoEditorManager.setProcessingProgress(0);
          }
        }
      };

      this.processingQueue.push(operationWrapper);

      // Start processing if not already in progress
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Clear previous output files to free up memory
   */
  private async clearPreviousOutput(): Promise<void> {
    try {
      const files = await app.ffmpeg.listDir("/");
      for (const file of files) {
        if (
          file.name.startsWith("output") ||
          file.name.endsWith(".txt") ||
          file.name.startsWith("temp")
        ) {
          await app.ffmpeg.deleteFile(file.name);
        }
      }
    } catch (error) {
      console.warn("Error clearing previous files:", error);
      // Non-fatal, continue with operation
    }
  }

  /**
   * Cancel the current processing operation
   */
  public async cancelProcessing(): Promise<boolean> {
    try {
      // Abort current operation if possible
      if (this.abortController) {
        this.abortController.abort();
      }

      // Clear the processing queue
      this.processingQueue = [];

      // Terminate or reset FFmpeg if possible
      if (this.isProcessing && this.isLoaded) {
        // We'll need to reload FFmpeg as a way to "cancel" the current operation
        this.isLoaded = false;
        this.isProcessing = false;
        this.currentOperation = null;

        // Reload FFmpeg for the next operation
        setTimeout(() => this.load(), 500);
      }

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus("Cancelled");
        workspaceHub.videoEditorManager.setProcessingProgress(0);
      }

      return true;
    } catch (error) {
      console.error("Error cancelling processing:", error);
      return false;
    }
  }

  /**
   * Optimized trim video function with memory usage improvements
   */
  // Modified trimVideo function with robust analysis step handling

  public async trimVideo(
    sourceUrl: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Trimming video", async () => {
      console.log("trimming");
      // Enhanced logging
      console.log(
        `🔷 TRIM: Processing video trim from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`
      );
      console.log(`🔷 TRIM: Source URL length: ${sourceUrl.length}`);

      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          `Preparing video trim...`
        );
      }

      try {
        // Load the video file with better error handling
        console.log(`🔷 TRIM: Fetching source video...`);
        try {
          const videoData = await fetchFile(sourceUrl);
          console.log(
            `🔷 TRIM: Fetched video data size: ${videoData.byteLength} bytes`
          );

          await app.ffmpeg.writeFile("input.mp4", videoData);
          console.log(
            `🔷 TRIM: Successfully wrote input.mp4 to FFmpeg filesystem`
          );
        } catch (fetchError: any) {
          console.error(
            `🔷 TRIM ERROR: Failed to fetch or write input video:`,
            fetchError
          );
          throw new Error(
            `Failed to process source video: ${fetchError.message}`
          );
        }

        // Validate the input file exists before proceeding
        try {
          const files = await app.ffmpeg.listDir(".");
          const inputFile = files.find(
            (f) => f.name === "input.mp4"
          ) as FileNode;
          if (!inputFile) {
            throw new Error("Input file not found in FFmpeg filesystem");
          }
          console.log(
            `🔷 TRIM: Verified input.mp4 exists (${inputFile.size} bytes)`
          );
        } catch (listError) {
          console.error(
            `🔷 TRIM ERROR: Failed to verify input file:`,
            listError
          );
        }

        // Get video information - with fallback for analysis failures
        let totalDuration = 0;
        let videoStream = null;
        let bitrateKbps = 2000; // Default bitrate if analysis fails

        try {
          console.log(`🔷 TRIM: Analyzing video...`);
          await app.ffmpeg.exec([
            "-i",
            "input.mp4",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            "info.json",
          ]);

          const infoData = (await app.ffmpeg.readFile(
            "info.json"
          )) as Uint8Array;
          const info = JSON.parse(new TextDecoder().decode(infoData));

          // Get total duration to validate trim points
          totalDuration = parseFloat(info.format?.duration || "0");
          videoStream = info.streams.find((s: any) => s.codec_type === "video");

          // Get optimal encoding settings based on original
          const originalWidth = videoStream?.width || 1280;
          const originalHeight = videoStream?.height || 720;
          bitrateKbps = videoStream?.bit_rate
            ? Math.min(parseInt(videoStream.bit_rate) / 1000, 5000) // Cap at 5Mbps
            : 2000; // Default to 2Mbps

          console.log(
            `🔷 TRIM: Analysis successful - Duration: ${totalDuration.toFixed(2)}s, Resolution: ${originalWidth}x${originalHeight}, Bitrate: ${bitrateKbps}kbps`
          );
        } catch (analysisError) {
          console.error(`🔷 TRIM ERROR: Video analysis failed:`, analysisError);
          console.log(`🔷 TRIM: Using fallback duration and encoding settings`);

          // Use provided duration or fallback - critical for trim operation
          totalDuration = workspaceHub.videoEditorManager?.duration || 60;

          // Continue with fallback values for the trim operation
        }

        // Use workspaceHub values if analysis failed to provide duration
        if (totalDuration <= 0 && workspaceHub.videoEditorManager) {
          totalDuration = workspaceHub.videoEditorManager.duration;
          console.log(`🔷 TRIM: Using store duration: ${totalDuration}s`);
        }

        // Validate trim values against duration
        if (startTime < 0) startTime = 0;
        if (endTime > totalDuration) endTime = totalDuration;
        if (endTime <= startTime) {
          console.error(
            `🔷 TRIM ERROR: Invalid trim points: ${startTime} to ${endTime}`
          );
          throw new Error(
            "Invalid trim points: end time must be greater than start time"
          );
        }

        const trimDuration = endTime - startTime;
        console.log(
          `🔷 TRIM: Validated trim points: ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s (${trimDuration.toFixed(2)}s)`
        );

        // Set detailed status
        if (workspaceHub.videoEditorManager) {
          workspaceHub.videoEditorManager.setProcessingStatus(
            `Trimming video (${trimDuration.toFixed(1)}s)...`
          );
        }

        console.log(`🔷 TRIM: Running FFmpeg trim operation...`);

        // SIMPLIFIED APPROACH: Skip the concat demuxer and go straight to more reliable method
        try {
          console.log(`🔷 TRIM: Using direct trim approach with seeking`);

          await app.ffmpeg.exec([
            "-ss",
            startTime.toFixed(3),
            "-i",
            "input.mp4",
            "-t",
            (endTime - startTime).toFixed(3),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast", // Use faster preset to ensure it completes
            "-b:v",
            `${bitrateKbps}k`,
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-avoid_negative_ts",
            "make_zero",
            "-movflags",
            "+faststart",
            "-max_muxing_queue_size",
            "9999",
            "output.mp4",
          ]);

          console.log(`🔷 TRIM: Direct trim approach successful`);
        } catch (trimError) {
          console.error(`🔷 TRIM: Direct trim approach failed:`, trimError);

          // LAST RESORT: Try copy-only approach which should be very reliable
          console.log(`🔷 TRIM: Trying copy-only approach...`);

          try {
            await app.ffmpeg.exec([
              "-ss",
              startTime.toFixed(3),
              "-i",
              "input.mp4",
              "-t",
              (endTime - startTime).toFixed(3),
              "-c",
              "copy", // Just copy streams without re-encoding
              "-avoid_negative_ts",
              "make_zero",
              "output.mp4",
            ]);

            console.log(`🔷 TRIM: Copy-only approach successful`);
          } catch (copyError) {
            console.error(`🔷 TRIM: All trim approaches failed`);
            throw copyError; // Re-throw to handle at higher level
          }
        }

        // Verify the output exists and has reasonable size
        const outputFiles = await app.ffmpeg.listDir(".");
        const outputFile = outputFiles.find(
          (f) => f.name === "output.mp4"
        ) as FileNode;

        if (!outputFile || outputFile.size < 100) {
          // Lower threshold to catch empty files
          console.error(
            `🔷 TRIM ERROR: Output file is missing or too small: ${outputFile?.size} bytes`
          );
          throw new Error("Failed to generate valid output file");
        }

        console.log(`🔷 TRIM: Output file generated: ${outputFile.size} bytes`);

        // Read the result
        const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
        console.log(`🔷 TRIM: Read ${data.byteLength} bytes of output data`);

        // CRITICAL: Update the video store with the new duration
        if (workspaceHub.videoEditorManager) {
          workspaceHub.videoEditorManager.duration = trimDuration;

          // Reset trim points to match new duration
          workspaceHub.videoEditorManager.setTrim({
            startTime: 0,
            endTime: trimDuration,
          });

          // Reset current time to beginning of trimmed video
          workspaceHub.videoEditorManager.currentTime = 0;

          console.log(
            `🔷 TRIM: Updated store with new duration: ${trimDuration}s`
          );
        }

        // Create result URL
        const outputUrl = URL.createObjectURL(
          new Blob([data.buffer], { type: "video/mp4" })
        );

        console.log(`🔷 TRIM: Successfully created trimmed video URL`);
        return outputUrl;
      } catch (error: any) {
        console.error(`🔷 TRIM ERROR: Trim operation failed:`, error);
        if (workspaceHub.videoEditorManager) {
          workspaceHub.videoEditorManager.setProcessingStatus(
            `Error: Trim operation failed: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  /**
   * Improved crop video function with better aspect ratio handling
   */
  public async cropVideo(
    sourceUrl: string,
    crop: { x: number; y: number; width: number; height: number },
    originalWidth: number,
    originalHeight: number
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Cropping video", async () => {
      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Preparing to crop video..."
        );
      }

      // Calculate absolute dimensions from percentages with guard against invalid values
      const x = Math.max(0, Math.floor((crop.x / 100) * originalWidth));
      const y = Math.max(0, Math.floor((crop.y / 100) * originalHeight));
      const width = Math.max(2, Math.floor((crop.width / 100) * originalWidth));
      const height = Math.max(
        2,
        Math.floor((crop.height / 100) * originalHeight)
      );

      // Load the video file
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Cropping video..."
        );
      }

      // Execute FFmpeg command to crop the video with optimized settings
      await app.ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        `crop=${width}:${height}:${x}:${y}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "copy", // Copy audio stream
        "-movflags",
        "+faststart",
        "-max_muxing_queue_size",
        "9999",
        "output.mp4",
      ]);

      // Read the result
      const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    });
  }

  /**
   * Improved video filters application with reduced memory usage
   */
  public async applyFilters(
    sourceUrl: string,
    filters: Record<string, number>
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Applying filters", async () => {
      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Preparing to apply filters..."
        );
      }

      // Build filter string with improved handling
      let filterString = "";

      if (filters.grayscale > 0) {
        filterString += `grayscale=${Math.min(filters.grayscale, 100) / 100},`;
      }

      if (filters.sepia > 0) {
        filterString += `sepia=${Math.min(filters.sepia, 100) / 100},`;
      }

      const brightnessValue = filters.brightness / 100 - 1;
      if (Math.abs(brightnessValue) > 0.01) {
        // Only apply if significant change
        filterString += `eq=brightness=${brightnessValue}:`;
      } else {
        filterString += "eq=brightness=0:";
      }

      const contrastValue = filters.contrast / 100;
      if (Math.abs(contrastValue - 1) > 0.01) {
        // Only apply if significant change
        filterString += `contrast=${contrastValue}:`;
      } else {
        filterString += "contrast=1:";
      }

      const saturationValue = filters.saturation / 100;
      if (Math.abs(saturationValue - 1) > 0.01) {
        // Only apply if significant change
        filterString += `saturation=${saturationValue}`;
      } else {
        filterString += "saturation=1";
      }

      // Remove trailing comma if present
      if (filterString.endsWith(",")) {
        filterString = filterString.slice(0, -1);
      }

      // Load the video file
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Applying filters..."
        );
      }

      // Execute FFmpeg command with filters
      if (filterString) {
        await app.ffmpeg.exec([
          "-i",
          "input.mp4",
          "-vf",
          filterString,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "copy", // Copy audio stream
          "-movflags",
          "+faststart",
          "-max_muxing_queue_size",
          "9999",
          "output.mp4",
        ]);
      } else {
        // No filters applied, just copy the file
        await app.ffmpeg.exec(["-i", "input.mp4", "-c", "copy", "output.mp4"]);
      }

      // Read the result
      const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    });
  }

  /**
   * Improved transform video function (rotation and flips)
   */
  public async transformVideo(
    sourceUrl: string,
    transform: {
      rotate: number;
      flipHorizontal: boolean;
      flipVertical: boolean;
    }
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Transforming video", async () => {
      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Preparing to transform video..."
        );
      }

      // Build filter string based on transformations
      let filterString = "";

      // Handle rotation with better normalization
      if (transform.rotate !== 0) {
        // Normalize rotation to 0, 90, 180, or 270 degrees for FFmpeg
        const normalizedRotation = Math.round(transform.rotate / 90) * 90;
        switch (
          ((normalizedRotation % 360) + 360) %
          360 // Handle negative rotations
        ) {
          case 90:
            filterString += "transpose=1,"; // 90 degrees clockwise
            break;
          case 180:
            filterString += "transpose=2,transpose=2,"; // 180 degrees
            break;
          case 270:
            filterString += "transpose=2,"; // 90 degrees counter-clockwise
            break;
        }
      }

      // Handle flips
      if (transform.flipHorizontal) {
        filterString += "hflip,";
      }
      if (transform.flipVertical) {
        filterString += "vflip,";
      }

      // Remove trailing comma if present
      if (filterString.endsWith(",")) {
        filterString = filterString.slice(0, -1);
      }

      // Load the video file
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Transforming video..."
        );
      }

      // Execute FFmpeg command with transformations
      if (filterString) {
        await app.ffmpeg.exec([
          "-i",
          "input.mp4",
          "-vf",
          filterString,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "copy", // Copy audio stream
          "-movflags",
          "+faststart",
          "-max_muxing_queue_size",
          "9999",
          "output.mp4",
        ]);
      } else {
        // No transformations applied, just copy the file
        await app.ffmpeg.exec(["-i", "input.mp4", "-c", "copy", "output.mp4"]);
      }

      // Read the result
      const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    });
  }

  /**
   * Improved aspect ratio change with better memory management
   */
  public async changeAspectRatio(
    sourceUrl: string,
    aspectRatio: string,
    customRatio?: { width: number; height: number }
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Changing aspect ratio", async () => {
      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Analyzing video dimensions..."
        );
      }

      // Get input video information
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      // Use FFprobe to get video info
      await app.ffmpeg.exec([
        "-i",
        "input.mp4",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "-hide_banner",
        "info.json",
      ]);

      const infoData = (await app.ffmpeg.readFile("info.json")) as Uint8Array;
      const info = JSON.parse(new TextDecoder().decode(infoData));

      const videoStream = info.streams.find(
        (s: any) => s.codec_type === "video"
      );
      const originalWidth = parseInt(videoStream.width);
      const originalHeight = parseInt(videoStream.height);

      // Calculate new dimensions based on aspect ratio
      let targetWidth: number, targetHeight: number;
      let ratioValue: number;

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Changing aspect ratio..."
        );
      }

      if (aspectRatio === "original") {
        // Just use the original dimensions
        targetWidth = originalWidth;
        targetHeight = originalHeight;
      } else if (aspectRatio === "custom" && customRatio) {
        // Apply custom ratio but maintain original area
        ratioValue = customRatio.width / customRatio.height;
        const originalArea = originalWidth * originalHeight;
        targetHeight = Math.round(Math.sqrt(originalArea / ratioValue));
        targetWidth = Math.round(targetHeight * ratioValue);
      } else {
        // Apply standard ratios
        switch (aspectRatio) {
          case "16:9":
            ratioValue = 16 / 9;
            break;
          case "4:3":
            ratioValue = 4 / 3;
            break;
          case "1:1":
            ratioValue = 1;
            break;
          case "9:16":
            ratioValue = 9 / 16;
            break;
          default:
            ratioValue = originalWidth / originalHeight;
            break;
        }

        // Try to maintain original size
        const originalArea = originalWidth * originalHeight;
        targetHeight = Math.round(Math.sqrt(originalArea / ratioValue));
        targetWidth = Math.round(targetHeight * ratioValue);
      }

      // Round dimensions to even numbers (required by some codecs)
      targetWidth = Math.max(2, Math.round(targetWidth / 2) * 2);
      targetHeight = Math.max(2, Math.round(targetHeight / 2) * 2);

      // Execute FFmpeg to resize and pad the video
      await app.ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "copy", // Copy audio stream
        "-movflags",
        "+faststart",
        "-max_muxing_queue_size",
        "9999",
        "output.mp4",
      ]);

      // Read the result
      const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    });
  }

  /**
   * Optimized method to process all edits in one operation
   */
  public async processCompletely(
    sourceUrl: string,
    options: {
      originalWidth?: number;
      originalHeight?: number;
      trim?: { startTime: number; endTime: number };
      crop?: { x: number; y: number; width: number; height: number };
      transform?: {
        rotate: number;
        flipHorizontal: boolean;
        flipVertical: boolean;
      };
      filters?: Record<string, number>;
      aspectRatio?: string;
      customRatio?: { width: number; height: number };
      subtitles?: any[];
    }
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Processing video", async () => {
      // Set processing status
      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Preparing for processing..."
        );
      }

      // Load the video file
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      // Get video info if not provided
      let originalWidth = options.originalWidth || 0;
      let originalHeight = options.originalHeight || 0;
      let duration = 0;

      if (!originalWidth || !originalHeight) {
        await app.ffmpeg.exec([
          "-i",
          "input.mp4",
          "-v",
          "quiet",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          "-hide_banner",
          "info.json",
        ]);

        const infoData = (await app.ffmpeg.readFile("info.json")) as Uint8Array;
        const info = JSON.parse(new TextDecoder().decode(infoData));

        const videoStream = info.streams.find(
          (s: any) => s.codec_type === "video"
        );
        originalWidth = parseInt(videoStream.width);
        originalHeight = parseInt(videoStream.height);

        if (info.format && info.format.duration) {
          duration = parseFloat(info.format.duration);
        }
      }

      // Convert existing crop values from percentages to absolute values
      let cropValues: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null = null;
      if (
        options.crop &&
        (options.crop.x !== 0 ||
          options.crop.y !== 0 ||
          options.crop.width !== 100 ||
          options.crop.height !== 100)
      ) {
        const x = Math.floor((options.crop.x / 100) * originalWidth);
        const y = Math.floor((options.crop.y / 100) * originalHeight);
        const width = Math.floor((options.crop.width / 100) * originalWidth);
        const height = Math.floor((options.crop.height / 100) * originalHeight);

        cropValues = { x, y, width, height };
      }

      if (workspaceHub.videoEditorManager) {
        workspaceHub.videoEditorManager.setProcessingStatus(
          "Processing video..."
        );
      }

      // Build FFmpeg arguments
      const ffmpegArgs = ["-i", "input.mp4"];

      // Handle trim options first to reduce processing load
      if (options.trim && duration > 0) {
        if (options.trim.startTime > 0) {
          ffmpegArgs.push("-ss", `${options.trim.startTime}`);
        }

        if (options.trim.endTime < duration) {
          ffmpegArgs.push("-to", `${options.trim.endTime}`);
        }
      }

      // Build complex filter chain
      const filters = [];

      // Apply crop if needed
      if (cropValues) {
        filters.push(
          `crop=${cropValues.width}:${cropValues.height}:${cropValues.x}:${cropValues.y}`
        );
      }

      // Apply transforms if needed
      if (options.transform) {
        // Handle rotation
        if (options.transform.rotate !== 0) {
          const normalizedRotation =
            Math.round(options.transform.rotate / 90) * 90;
          switch (((normalizedRotation % 360) + 360) % 360) {
            case 90:
              filters.push("transpose=1"); // 90 degrees clockwise
              break;
            case 180:
              filters.push("transpose=2,transpose=2"); // 180 degrees
              break;
            case 270:
              filters.push("transpose=2"); // 90 degrees counter-clockwise
              break;
          }
        }

        // Handle flips
        if (options.transform.flipHorizontal) {
          filters.push("hflip");
        }
        if (options.transform.flipVertical) {
          filters.push("vflip");
        }
      }

      // Apply filters if needed
      if (options.filters) {
        // Combine all eq filters for better performance
        const eqFilters = [];

        if (options.filters.brightness !== 100) {
          eqFilters.push(`brightness=${options.filters.brightness / 100 - 1}`);
        }

        if (options.filters.contrast !== 100) {
          eqFilters.push(`contrast=${options.filters.contrast / 100}`);
        }

        if (options.filters.saturation !== 100) {
          eqFilters.push(`saturation=${options.filters.saturation / 100}`);
        }

        if (eqFilters.length > 0) {
          filters.push(`eq=${eqFilters.join(":")}`);
        }

        if (options.filters.grayscale > 0) {
          filters.push(`grayscale=${options.filters.grayscale / 100}`);
        }

        if (options.filters.sepia > 0) {
          filters.push(`sepia=${options.filters.sepia / 100}`);
        }
      }

      // Change aspect ratio if needed
      if (options.aspectRatio && options.aspectRatio !== "original") {
        // Calculate new dimensions based on aspect ratio
        let targetWidth, targetHeight;
        let ratioValue;

        if (options.aspectRatio === "custom" && options.customRatio) {
          ratioValue = options.customRatio.width / options.customRatio.height;
        } else {
          switch (options.aspectRatio) {
            case "16:9":
              ratioValue = 16 / 9;
              break;
            case "4:3":
              ratioValue = 4 / 3;
              break;
            case "1:1":
              ratioValue = 1;
              break;
            case "9:16":
              ratioValue = 9 / 16;
              break;
            default:
              ratioValue = originalWidth / originalHeight;
              break;
          }
        }

        // Try to maintain original area
        const originalArea = originalWidth * originalHeight;
        targetHeight = Math.sqrt(originalArea / ratioValue);
        targetWidth = targetHeight * ratioValue;

        // Round dimensions to even numbers
        targetWidth = Math.round(targetWidth / 2) * 2;
        targetHeight = Math.round(targetHeight / 2) * 2;

        filters.push(
          `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`
        );
      }

      // Add filter chain to FFmpeg args if we have filters
      if (filters.length > 0) {
        ffmpegArgs.push("-vf", filters.join(","));
      }

      // Burn in subtitles if needed
      if (options.subtitles && options.subtitles.length > 0) {
        // Create SRT file
        let srtContent = "";
        options.subtitles.forEach((subtitle, index) => {
          srtContent += `${index + 1}\n`;
          srtContent += `${formatSrtTime(subtitle.startTime)} --> ${formatSrtTime(subtitle.endTime)}\n`;
          srtContent += `${subtitle.text}\n\n`;
        });

        await app.ffmpeg.writeFile("subtitles.srt", srtContent);

        // Add subtitle filter
        ffmpegArgs.push(
          "-vf",
          `subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=24'`
        );
      }

      // Add encoding options - optimized for web playback
      ffmpegArgs.push(
        "-c:v",
        "libx264",
        "-preset",
        "medium", // Better quality for final output
        "-crf",
        "23", // Good balance of quality/size
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart", // Optimize for web playback
        "-max_muxing_queue_size",
        "9999",
        "output.mp4"
      );

      // Execute the FFmpeg command
      await app.ffmpeg.exec(ffmpegArgs);

      // Read the result
      const data = (await app.ffmpeg.readFile("output.mp4")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
    });
  }

  /**
   * Generate a frame thumbnail from video
   */
  public async generateThumbnail(
    sourceUrl: string,
    time: number
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.load();
    }

    return this.queueOperation("Generating thumbnail", async () => {
      // Load the video file
      await app.ffmpeg.writeFile("input.mp4", await fetchFile(sourceUrl));

      // Extract frame at specified time
      await app.ffmpeg.exec([
        "-i",
        "input.mp4",
        "-ss",
        `${time}`,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        "-f",
        "image2",
        "thumbnail.jpg",
      ]);

      // Read the result
      const data = (await app.ffmpeg.readFile("thumbnail.jpg")) as Uint8Array;
      return URL.createObjectURL(
        new Blob([data.buffer], { type: "image/jpeg" })
      );
    });
  }
}

// Helper function to format time for SRT subtitles
function formatSrtTime(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);

  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const secs = date.getUTCSeconds().toString().padStart(2, "0");
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${secs},${milliseconds}`;
}

export const videoProcessor = new VideoProcessor();
