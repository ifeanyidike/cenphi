import { app } from "@/stores/appStore";
import { fetchFile } from "@ffmpeg/util";

/**
 * Image processing utilities using FFmpeg.
 * Extends the existing FFmpeg functionality to handle image editing operations.
 */
class FFmpegImageUtils {
  /**
   * Process an image with various editing operations using FFmpeg
   *
   * @param imageBlob - The source image blob
   * @param options - Image processing options
   * @returns Promise<Blob> - The processed image blob
   */
  async processImage(
    imageBlob: Blob,
    options: {
      brightness?: number; // 0-200 (100 is normal)
      contrast?: number; // 0-200 (100 is normal)
      zoom?: number; // 100-200 (100 is normal)
      rotation?: number; // -180 to 180
      cropOffset?: { x: number; y: number }; // -100 to 100
      filter?: string; // none, grayscale, sepia, vintage
      filterIntensity?: number; // 0-100
    }
  ): Promise<Blob> {
    if (!app.ffmpegLoaded || !app.ffmpeg) {
      throw new Error("FFmpeg not loaded");
    }

    // Default values
    const {
      brightness = 100,
      contrast = 100,
      zoom = 100,
      rotation = 0,
      cropOffset = { x: 0, y: 0 },
      filter = "none",
      filterIntensity = 100,
    } = options;

    // Determine input format from the blob
    const inputFormat = imageBlob.type.split("/")[1] || "jpeg";
    const inputFile = `input.${inputFormat}`;
    const outputFile = `output.${inputFormat}`;

    // Write the input image to FFmpeg's virtual filesystem
    await app.ffmpeg.writeFile(inputFile, await fetchFile(imageBlob));

    // Build FFmpeg filter complex string
    const filterComplex = [];

    // Apply zoom and crop if needed
    if (zoom > 100 || cropOffset.x !== 0 || cropOffset.y !== 0) {
      // For zooming, we scale up and then crop to original size
      // First get the image dimensions
      await app.ffmpeg.exec([
        "-i",
        inputFile,
        "-hide_banner",
        "-f",
        "null",
        "null",
      ]);

      const zoomFactor = zoom / 100;

      // Calculate crop parameters based on zoom and offset
      // We'll need to adjust these values based on the actual image dimensions
      // This is an approximation
      filterComplex.push(`scale=iw*${zoomFactor}:ih*${zoomFactor}`);

      // Apply crop with offset
      // The offset calculation needs to be refined based on testing
      const xOffset = (cropOffset.x / 100) * 50; // Convert percentage to pixels (approximation)
      const yOffset = (cropOffset.y / 100) * 50; // Convert percentage to pixels (approximation)
      filterComplex.push(
        `crop=iw/=${zoomFactor}:ih/=${zoomFactor}:${xOffset}:${yOffset}`
      );
    }

    // Apply rotation if needed
    if (rotation !== 0) {
      // Convert degrees to radians for FFmpeg
      const radians = (rotation * Math.PI) / 180;
      filterComplex.push(`rotate=${radians}:c=black@0`);
    }

    // Apply brightness and contrast adjustments
    if (brightness !== 100 || contrast !== 100) {
      // FFmpeg eq filter uses different scale: brightness -1.0 to 1.0, contrast 0.0 to 2.0
      const brightnessValue = (brightness - 100) / 100;
      const contrastValue = contrast / 100;
      filterComplex.push(
        `eq=brightness=${brightnessValue}:contrast=${contrastValue}`
      );
    }

    // Apply color filters
    const intensityFactor = filterIntensity / 100;

    if (filter === "grayscale") {
      if (intensityFactor < 1) {
        // Partial grayscale by blending
        filterComplex.push(`split[color][gray]`);
        filterComplex.push(`[gray]grayscale[gout]`);
        filterComplex.push(
          `[color][gout]blend=all_mode=normal:all_opacity=${intensityFactor}`
        );
      } else {
        filterComplex.push("grayscale");
      }
    } else if (filter === "sepia") {
      // Sepia tone filter
      filterComplex.push(
        `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`
      );
    } else if (filter === "vintage") {
      // Vintage look with slight color manipulation and vignette
      filterComplex.push(
        `colorbalance=rs=.3:gs=0:bs=-.2:rm=.1:gm=0:bm=-.1:rh=.1:gh=0:bh=-.1`
      );
      if (intensityFactor > 0.5) {
        // Add vignette effect for stronger vintage look
        filterComplex.push(`vignette=angle=PI/6:mode=backward`);
      }
    }

    // Build the FFmpeg command
    const ffmpegArgs = ["-i", inputFile];

    if (filterComplex.length > 0) {
      ffmpegArgs.push("-vf", filterComplex.join(","));
    }

    // Add quality settings and output
    ffmpegArgs.push(
      "-q:v",
      "2", // High quality
      outputFile
    );

    // Execute the FFmpeg command
    await app.ffmpeg.exec(ffmpegArgs);

    // Read the processed image
    const data = (await app.ffmpeg.readFile(outputFile)) as any;
    return new Blob([data.buffer], { type: imageBlob.type });
  }

  /**
   * Apply a specific filter to an image
   *
   * @param imageBlob - The source image blob
   * @param filterType - The type of filter to apply
   * @param intensity - Filter intensity (0-100)
   * @returns Promise<Blob> - The filtered image blob
   */
  async applyFilter(
    imageBlob: Blob,
    filterType: string,
    intensity: number = 100
  ): Promise<Blob> {
    return this.processImage(imageBlob, {
      filter: filterType,
      filterIntensity: intensity,
    });
  }

  /**
   * Crop and zoom an image
   *
   * @param imageBlob - The source image blob
   * @param zoom - Zoom level (100-200)
   * @param xOffset - Horizontal offset (-100 to 100)
   * @param yOffset - Vertical offset (-100 to 100)
   * @returns Promise<Blob> - The cropped image blob
   */
  async cropAndZoom(
    imageBlob: Blob,
    zoom: number,
    xOffset: number = 0,
    yOffset: number = 0
  ): Promise<Blob> {
    return this.processImage(imageBlob, {
      zoom,
      cropOffset: { x: xOffset, y: yOffset },
    });
  }

  /**
   * Rotate an image
   *
   * @param imageBlob - The source image blob
   * @param degrees - Rotation angle in degrees
   * @returns Promise<Blob> - The rotated image blob
   */
  async rotateImage(imageBlob: Blob, degrees: number): Promise<Blob> {
    return this.processImage(imageBlob, {
      rotation: degrees,
    });
  }

  /**
   * Adjust image brightness and contrast
   *
   * @param imageBlob - The source image blob
   * @param brightness - Brightness level (0-200)
   * @param contrast - Contrast level (0-200)
   * @returns Promise<Blob> - The adjusted image blob
   */
  async adjustImage(
    imageBlob: Blob,
    brightness: number = 100,
    contrast: number = 100
  ): Promise<Blob> {
    return this.processImage(imageBlob, {
      brightness,
      contrast,
    });
  }
}

export const ffmpegImageUtils = new FFmpegImageUtils();
