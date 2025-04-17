import { ffmpegImageUtils } from "@/services/ffmpeg-image-utils";

/**
 * ImageProcessor - A utility class for image processing that prioritizes web APIs
 * for speed and falls back to FFmpeg for more complex operations.
 */
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private originalImage: HTMLImageElement | null = null;
  private currentBlob: Blob | null = null;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  /**
   * Load an image from a URL or Blob
   */
  async loadImage(source: string | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.originalImage = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx?.drawImage(img, 0, 0);
        resolve(img);
      };

      img.onerror = (e) => reject(e);

      if (typeof source === "string") {
        img.src = source;
      } else {
        // If source is a Blob
        this.currentBlob = source;
        img.src = URL.createObjectURL(source);
      }
    });
  }

  /**
   * Apply basic adjustments (brightness, contrast, saturation) using Canvas API
   */
  async applyBasicAdjustments(
    brightness: number = 100,
    contrast: number = 100,
    saturation: number = 100
  ): Promise<Blob> {
    if (!this.ctx || !this.originalImage) {
      throw new Error("No image loaded");
    }

    // Reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    // Get image data
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;

    // Normalize values
    const brightnessValue = (brightness - 100) / 100;
    const contrastValue = contrast / 100;
    const saturationValue = saturation / 100;

    // Apply adjustments
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] += 255 * brightnessValue;
      data[i + 1] += 255 * brightnessValue;
      data[i + 2] += 255 * brightnessValue;

      // Apply contrast
      for (let j = 0; j < 3; j++) {
        data[i + j] = ((data[i + j] / 255 - 0.5) * contrastValue + 0.5) * 255;
      }

      // Apply saturation
      if (saturationValue !== 1) {
        const gray =
          0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray * (1 - saturationValue) + data[i] * saturationValue;
        data[i + 1] =
          gray * (1 - saturationValue) + data[i + 1] * saturationValue;
        data[i + 2] =
          gray * (1 - saturationValue) + data[i + 2] * saturationValue;
      }
    }

    // Put the modified data back
    this.ctx.putImageData(imageData, 0, 0);

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Apply filters using Web API where possible
   */
  async applyFilter(filter: string, intensity: number = 100): Promise<Blob> {
    if (!this.ctx || !this.originalImage) {
      throw new Error("No image loaded");
    }

    // Reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    // Apply filter using canvas
    if (filter === "none") {
      // No filter, just return the original
    } else if (filter === "grayscale") {
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const data = imageData.data;
      const intensityFactor = intensity / 100;

      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray * intensityFactor + data[i] * (1 - intensityFactor);
        data[i + 1] =
          gray * intensityFactor + data[i + 1] * (1 - intensityFactor);
        data[i + 2] =
          gray * intensityFactor + data[i + 2] * (1 - intensityFactor);
      }

      this.ctx.putImageData(imageData, 0, 0);
    } else if (filter === "sepia") {
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const data = imageData.data;
      const intensityFactor = intensity / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Sepia formula
        const newR = r * 0.393 + g * 0.769 + b * 0.189;
        const newG = r * 0.349 + g * 0.686 + b * 0.168;
        const newB = r * 0.272 + g * 0.534 + b * 0.131;

        // Apply based on intensity
        data[i] = r * (1 - intensityFactor) + newR * intensityFactor;
        data[i + 1] = g * (1 - intensityFactor) + newG * intensityFactor;
        data[i + 2] = b * (1 - intensityFactor) + newB * intensityFactor;
      }

      this.ctx.putImageData(imageData, 0, 0);
    } else if (filter === "invert") {
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const data = imageData.data;
      const intensityFactor = intensity / 100;

      for (let i = 0; i < data.length; i += 4) {
        data[i] =
          data[i] * (1 - intensityFactor) + (255 - data[i]) * intensityFactor;
        data[i + 1] =
          data[i + 1] * (1 - intensityFactor) +
          (255 - data[i + 1]) * intensityFactor;
        data[i + 2] =
          data[i + 2] * (1 - intensityFactor) +
          (255 - data[i + 2]) * intensityFactor;
      }

      this.ctx.putImageData(imageData, 0, 0);
    } else if (
      filter === "hue-rotate(90deg)" ||
      filter === "hue-rotate(180deg)"
    ) {
      // For more complex filters, defer to FFmpeg if available
      if (this.currentBlob) {
        try {
          const degrees = filter === "hue-rotate(90deg)" ? 90 : 180;
          return await ffmpegImageUtils.processImage(this.currentBlob, {
            filter: "hue-rotate",
            filterIntensity: intensity,
            // Additional parameter for hue rotation
            //@ts-expect-error hueRotate exists
            hueRotate: degrees,
          });
        } catch (e) {
          console.error("FFmpeg processing failed, falling back to canvas", e);
          // Fall back to basic hue rotation via canvas
          const imageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
          );
          const data = imageData.data;
          const hueShift = filter === "hue-rotate(90deg)" ? 0.25 : 0.5; // 90 degrees = 0.25, 180 degrees = 0.5

          for (let i = 0; i < data.length; i += 4) {
            // Convert RGB to HSL
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s;
            const l = (max + min) / 2;

            if (max === min) {
              h = s = 0; // achromatic
            } else {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r:
                  h = (g - b) / d + (g < b ? 6 : 0);
                  break;
                case g:
                  h = (b - r) / d + 2;
                  break;
                case b:
                  h = (r - g) / d + 4;
                  break;
                default:
                  h = 0;
              }
              h /= 6;
            }

            // Rotate hue
            h = (h + hueShift) % 1;

            // Convert back to RGB
            let r1, g1, b1;

            if (s === 0) {
              r1 = g1 = b1 = l; // achromatic
            } else {
              const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
              };

              const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              const p = 2 * l - q;
              r1 = hue2rgb(p, q, h + 1 / 3);
              g1 = hue2rgb(p, q, h);
              b1 = hue2rgb(p, q, h - 1 / 3);
            }

            // Apply based on intensity
            data[i] =
              r * 255 * (1 - intensity / 100) + r1 * 255 * (intensity / 100);
            data[i + 1] =
              g * 255 * (1 - intensity / 100) + g1 * 255 * (intensity / 100);
            data[i + 2] =
              b * 255 * (1 - intensity / 100) + b1 * 255 * (intensity / 100);
          }

          this.ctx.putImageData(imageData, 0, 0);
        }
      }
    } else {
      // For other filters, try FFmpeg if available
      if (this.currentBlob) {
        try {
          return await ffmpegImageUtils.applyFilter(
            this.currentBlob,
            filter,
            intensity
          );
        } catch (e) {
          console.error("FFmpeg processing failed, no filter applied", e);
          // No filter applied, original image retained
        }
      }
    }

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Zoom and crop using Canvas API
   */
  async zoomAndCrop(
    zoom: number,
    xOffset: number = 0,
    yOffset: number = 0
  ): Promise<Blob> {
    if (!this.ctx || !this.originalImage) {
      throw new Error("No image loaded");
    }

    const zoomFactor = zoom / 100;

    // Calculate actual offset in pixels
    const xOffsetPx = (xOffset / 100) * this.canvas.width;
    const yOffsetPx = (yOffset / 100) * this.canvas.height;

    // Create a temporary canvas for the zoomed image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      throw new Error("Could not create temporary canvas context");
    }

    // Clear and set up zoom transform
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate the center of the canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Draw the zoomed and offset image
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(zoomFactor, zoomFactor);
    this.ctx.translate(
      -centerX + xOffsetPx / zoomFactor,
      -centerY + yOffsetPx / zoomFactor
    );
    this.ctx.drawImage(this.originalImage, 0, 0);
    this.ctx.restore();

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Rotate image using Canvas API
   */
  async rotateImage(degrees: number): Promise<Blob> {
    if (!this.ctx || !this.originalImage) {
      throw new Error("No image loaded");
    }

    // For simple rotations (90, 180, 270), we can use a more efficient approach
    const angle = ((degrees % 360) * Math.PI) / 180;

    // Calculate new dimensions if the angle is not a multiple of 90 degrees
    let width = this.canvas.width;
    let height = this.canvas.height;

    if (degrees % 90 !== 0) {
      // For arbitrary rotations, we need to adjust the canvas size
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      width = height * absSin + width * absCos;
      height = height * absCos + width * absSin;
    }

    // Create a temporary canvas to perform the rotation
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      throw new Error("Could not create temporary canvas context");
    }

    // Move to center of temporary canvas
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate(angle);

    // Draw the original image, centered
    tempCtx.drawImage(
      this.originalImage,
      -this.originalImage.width / 2,
      -this.originalImage.height / 2
    );

    // Reset our main canvas to the new dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Copy the rotated image back to the main canvas
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Add text to the image with proper positioning
   */
  async addText(
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      isBold?: boolean;
      isItalic?: boolean;
      rotation?: number;
    } = {}
  ): Promise<Blob> {
    if (!this.ctx) {
      throw new Error("No canvas context available");
    }

    const {
      fontSize = 24,
      fontFamily = "Arial",
      color = "#ffffff",
      isBold = false,
      isItalic = false,
      rotation = 0,
    } = options;

    // Build font string
    const fontWeight = isBold ? "bold" : "normal";
    const fontStyle = isItalic ? "italic" : "normal";
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;

    // IMPORTANT: Set text baseline to middle for proper vertical alignment
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Add text shadow for better visibility
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Calculate position (x, y are in percentages)
    const posX = (x / 100) * this.canvas.width;
    const posY = (y / 100) * this.canvas.height;

    // Apply rotation if needed
    if (rotation !== 0) {
      this.ctx.save();
      this.ctx.translate(posX, posY);
      this.ctx.rotate((rotation * Math.PI) / 180);
      this.ctx.fillText(text, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.fillText(text, posX, posY);
    }

    // Reset shadow and text alignment settings
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.textAlign = "start";
    this.ctx.textBaseline = "alphabetic";

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Crop a specific region of the image
   */
  async cropImage(
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Blob> {
    if (!this.ctx || !this.originalImage) {
      throw new Error("No image loaded");
    }

    // Convert percentage values to actual pixel values
    const pixelX = (x / 100) * this.canvas.width;
    const pixelY = (y / 100) * this.canvas.height;
    const pixelWidth = (width / 100) * this.canvas.width;
    const pixelHeight = (height / 100) * this.canvas.height;

    // Create a temporary canvas for the cropped region
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = pixelWidth;
    tempCanvas.height = pixelHeight;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      throw new Error("Could not create temporary canvas context");
    }

    // Draw the cropped region to the temporary canvas
    tempCtx.drawImage(
      this.canvas,
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
      0,
      0,
      pixelWidth,
      pixelHeight
    );

    // Update the main canvas with the cropped image
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.ctx.clearRect(0, 0, pixelWidth, pixelHeight);
    this.ctx.drawImage(tempCanvas, 0, 0);

    // Return as blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.currentBlob = blob;
          resolve(blob);
        }
      });
    });
  }

  /**
   * Apply complex processing using FFmpeg when Web API is not sufficient
   * This is a fallback for operations that can't be efficiently done with Canvas
   */
  async processWithFFmpeg(options: any): Promise<Blob> {
    if (!this.currentBlob) {
      throw new Error("No image loaded");
    }

    try {
      return await ffmpegImageUtils.processImage(this.currentBlob, options);
    } catch (e) {
      console.error("FFmpeg processing failed", e);
      throw e;
    }
  }

  /**
   * Get the current image as a blob
   */
  getCurrentBlob(): Blob | null {
    return this.currentBlob;
  }

  /**
   * Get the current image as a data URL
   */
  getCurrentDataURL(type = "image/png", quality = 0.92): string {
    return this.canvas.toDataURL(type, quality);
  }
}

// Singleton instance
export const imageProcessor = new ImageProcessor();
