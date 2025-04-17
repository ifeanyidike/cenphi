import { makeAutoObservable, runInAction } from "mobx";
import { imageProcessor } from "../../services/ImageProcessor";

export type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type TextOverlay = {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  rotation: number;
};

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FilterType =
  | "none"
  | "grayscale"
  | "sepia"
  | "invert"
  | "hue-rotate(90deg)"
  | "hue-rotate(180deg)";

export type ToolType =
  | "select"
  | "zoom"
  | "crop"
  | "annotate"
  | "text"
  | "draw"
  | "adjust";

/**
 * MobX store for managing image editor state
 */
export class ImageEditorManager {
  // Image state
  originalImageUrl: string | null = null;
  editedImageUrl: string | null = null;
  processingImage: boolean = false;
  originalBlob: Blob | null = null;
  currentBlob: Blob | null = null;
  historyStack: Blob[] = [];
  historyPosition: number = -1;
  maxHistorySize: number = 10;

  // UI state
  selectedTool: ToolType = "select";
  showZoomPanel: boolean = false;
  showEditingPanel: boolean = false;
  showExtractionPanel: boolean = false;
  isFullscreen: boolean = false;
  extractedText: string | null = null;
  extractingText: boolean = false;

  // Image settings
  zoom: number = 100;
  rotation: number = 0;
  brightness: number = 100;
  contrast: number = 100;
  saturation: number = 100;
  filter: FilterType = "none";
  filterIntensity: number = 100;

  // Annotations and overlays
  annotations: Annotation[] = [];
  textOverlays: TextOverlay[] = [];
  selectedAnnotationId: string | null = null;
  selectedTextOverlayId: string | null = null;

  // Crop state
  cropArea: CropArea | null = null;

  // Drawing state
  drawingPaths: any[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Load image from URL or Blob
   */
  async loadImage(source: string | Blob) {
    this.processingImage = true;

    try {
      // Store the original source
      if (typeof source === "string") {
        this.originalImageUrl = source;
        // Fetch the blob if it's a URL
        const response = await fetch(source);
        this.originalBlob = await response.blob();
      } else {
        this.originalBlob = source;
        this.originalImageUrl = URL.createObjectURL(source);
      }

      // Load the image with the processor
      await imageProcessor.loadImage(this.originalBlob!);

      // Update the edited image URL
      this.currentBlob = this.originalBlob;
      this.editedImageUrl = this.originalImageUrl;

      // Reset history
      this.resetHistory();

      // Add the original image to history
      this.addToHistory(this.originalBlob!);
    } catch (error) {
      console.error("Error loading image:", error);
    } finally {
      runInAction(() => {
        this.processingImage = false;
      });
    }
  }

  /**
   * Apply all current adjustments to the image
   */
  async applyAdjustments() {
    if (!this.originalBlob) return;

    this.processingImage = true;

    try {
      // Start with the original image
      await imageProcessor.loadImage(this.originalBlob);

      // Apply basic adjustments
      await imageProcessor.applyBasicAdjustments(
        this.brightness,
        this.contrast,
        this.saturation
      );

      // Apply filter if not 'none'
      if (this.filter !== "none") {
        await imageProcessor.applyFilter(this.filter, this.filterIntensity);
      }

      // Apply rotation if not 0
      if (this.rotation !== 0) {
        await imageProcessor.rotateImage(this.rotation);
      }

      // Apply zoom if not 100
      if (this.zoom !== 100) {
        await imageProcessor.zoomAndCrop(this.zoom, 0, 0);
      }

      // IMPORTANT: No text overlays are applied here

      // Get the processed image
      const processedBlob = imageProcessor.getCurrentBlob();

      if (processedBlob) {
        runInAction(() => {
          // Revoke previous URL to prevent memory leaks
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          this.currentBlob = processedBlob;
          this.editedImageUrl = URL.createObjectURL(processedBlob);
          this.addToHistory(processedBlob);
        });
      }
    } catch (error) {
      console.error("Error applying adjustments:", error);
    } finally {
      runInAction(() => {
        this.processingImage = false;
      });
    }
  }

  /**
   * Apply a single adjustment (for real-time preview)
   */
  async applyQuickAdjustment(
    type:
      | "brightness"
      | "contrast"
      | "saturation"
      | "filter"
      | "zoom"
      | "rotation",
    value: number | string
  ) {
    if (!this.currentBlob) return;

    this.processingImage = true;

    try {
      // Load the current state
      await imageProcessor.loadImage(this.currentBlob);

      // Apply the specific adjustment
      switch (type) {
        case "brightness":
          if (typeof value === "number") {
            runInAction(() => {
              this.brightness = value;
            });
            await imageProcessor.applyBasicAdjustments(
              value,
              this.contrast,
              this.saturation
            );
          }
          break;
        case "contrast":
          if (typeof value === "number") {
            runInAction(() => {
              this.contrast = value;
            });
            await imageProcessor.applyBasicAdjustments(
              this.brightness,
              value,
              this.saturation
            );
          }
          break;
        case "saturation":
          if (typeof value === "number") {
            runInAction(() => {
              this.saturation = value;
            });
            await imageProcessor.applyBasicAdjustments(
              this.brightness,
              this.contrast,
              value
            );
          }
          break;
        case "filter":
          if (typeof value === "string") {
            runInAction(() => {
              this.filter = value as FilterType;
            });
            await imageProcessor.applyFilter(
              value as string,
              this.filterIntensity
            );
          }
          break;
        case "zoom":
          if (typeof value === "number") {
            runInAction(() => {
              this.zoom = value;
            });
            await imageProcessor.zoomAndCrop(value, 0, 0);
          }
          break;
        case "rotation":
          if (typeof value === "number") {
            runInAction(() => {
              this.rotation = value;
            });
            await imageProcessor.rotateImage(value);
          }
          break;
      }

      // Get the processed image
      const processedBlob = imageProcessor.getCurrentBlob();

      if (processedBlob) {
        runInAction(() => {
          // Revoke previous URL to prevent memory leaks
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          this.currentBlob = processedBlob;
          this.editedImageUrl = URL.createObjectURL(processedBlob);
        });
      }
    } catch (error) {
      console.error(`Error applying ${type} adjustment:`, error);
    } finally {
      runInAction(() => {
        this.processingImage = false;
      });
    }
  }

  /**
   * Extract text from image
   */
  async extractText() {
    if (!this.currentBlob) return;

    this.extractingText = true;

    try {
      // This would typically call an OCR service
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate extracted text
      runInAction(() => {
        this.extractedText =
          "Absolutely love this product! ★★★★★ Would buy again in a heartbeat. #bestpurchase";
      });

      // In a real implementation, you would use something like Tesseract.js or a backend OCR service
      // const { createWorker } = await import('tesseract.js');
      // const worker = await createWorker();
      // await worker.loadLanguage('eng');
      // await worker.initialize('eng');
      // const { data: { text } } = await worker.recognize(this.currentBlob);
      // await worker.terminate();
      // runInAction(() => {
      //   this.extractedText = text;
      // });
    } catch (error) {
      console.error("Error extracting text:", error);
    } finally {
      runInAction(() => {
        this.extractingText = false;
      });
    }
  }

  /**
   * Create a new annotation
   */
  addAnnotation(x: number, y: number, text: string = "") {
    const id = `annotation-${Date.now()}`;
    const annotation: Annotation = { id, x, y, text };

    this.annotations.push(annotation);
    this.selectedAnnotationId = id;

    return id;
  }

  /**
   * Update an existing annotation
   */
  updateAnnotation(id: string, updates: Partial<Annotation>) {
    const index = this.annotations.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.annotations[index] = { ...this.annotations[index], ...updates };
    }
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(id: string) {
    this.annotations = this.annotations.filter((a) => a.id !== id);
    if (this.selectedAnnotationId === id) {
      this.selectedAnnotationId = null;
    }
  }

  /**
   * Add a text overlay to the image
   */
  addTextOverlay(x: number, y: number, text: string = "Text") {
    const id = `text-${Date.now()}`;
    const overlay: TextOverlay = {
      id,
      x,
      y,
      text,
      fontSize: 24,
      fontFamily: "Arial",
      color: "#ffffff",
      isBold: false,
      isItalic: false,
      rotation: 0,
    };

    this.textOverlays.push(overlay);
    this.selectedTextOverlayId = id;

    return id;
  }

  /**
   * Update a text overlay
   */
  updateTextOverlay(id: string, updates: Partial<TextOverlay>) {
    const index = this.textOverlays.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.textOverlays[index] = { ...this.textOverlays[index], ...updates };
    }
  }

  /**
   * Delete a text overlay
   */
  // deleteTextOverlay(id: string) {
  //   this.textOverlays = this.textOverlays.filter((t) => t.id !== id);
  //   if (this.selectedTextOverlayId === id) {
  //     this.selectedTextOverlayId = null;
  //   }
  // }

  deleteTextOverlay(id: string) {
    this.textOverlays = this.textOverlays.filter((t) => t.id !== id);
    if (this.selectedTextOverlayId === id) {
      this.selectedTextOverlayId = null;
    }
    // this.applyTextOverlays().then(() => {
    //   // Ensure history is updated after applying changes
    //   if (this.currentBlob) {
    //     this.addToHistory(this.currentBlob);
    //   }
    // });
  }

  /**
   * Apply text overlays to the image
   */
  async applyTextOverlays(finalRender = false) {
    if (!this.originalBlob) return;

    this.processingImage = true;

    try {
      // Start with the original image
      await imageProcessor.loadImage(this.originalBlob);

      // Apply basic adjustments first
      await imageProcessor.applyBasicAdjustments(
        this.brightness,
        this.contrast,
        this.saturation
      );

      // Apply filter if not 'none'
      if (this.filter !== "none") {
        await imageProcessor.applyFilter(this.filter, this.filterIntensity);
      }

      // Apply rotation if not 0
      if (this.rotation !== 0) {
        await imageProcessor.rotateImage(this.rotation);
      }

      // Apply zoom if not 100
      if (this.zoom !== 100) {
        await imageProcessor.zoomAndCrop(this.zoom, 0, 0);
      }

      // Only apply text when finalRender=true (for export/save)
      // During normal editing, text remains as React components only
      if (finalRender && this.textOverlays.length > 0) {
        for (const overlay of this.textOverlays) {
          await imageProcessor.addText(overlay.text, overlay.x, overlay.y, {
            fontSize: overlay.fontSize,
            fontFamily: overlay.fontFamily,
            color: overlay.color,
            isBold: overlay.isBold,
            isItalic: overlay.isItalic,
            rotation: overlay.rotation,
          });
        }
      }

      // Get the processed image
      const processedBlob = imageProcessor.getCurrentBlob();

      if (processedBlob) {
        runInAction(() => {
          // Revoke previous URL to prevent memory leaks
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          this.currentBlob = processedBlob;
          this.editedImageUrl = URL.createObjectURL(processedBlob);
          this.addToHistory(processedBlob);
        });
      }
    } catch (error) {
      console.error("Error applying text overlays:", error);
    } finally {
      runInAction(() => {
        this.processingImage = false;
      });
    }
  }

  async saveImageWithOverlays(
    format: string = "image/jpeg",
    quality: number = 0.92
  ): Promise<Blob | null> {
    if (!this.currentBlob) return null;

    // Apply all adjustments INCLUDING text for the final version
    await this.applyTextOverlays(true);

    return this.saveImage(format, quality);
  }

  /**
   * Set the crop area
   */
  setCropArea(area: CropArea | null) {
    this.cropArea = area;
  }

  /**
   * Apply crop to the image
   */
  async applyCrop() {
    if (!this.currentBlob || !this.cropArea) return;

    this.processingImage = true;

    try {
      // Load the current image
      await imageProcessor.loadImage(this.currentBlob);

      // Apply the crop
      await imageProcessor.cropImage(
        this.cropArea.x,
        this.cropArea.y,
        this.cropArea.width,
        this.cropArea.height
      );

      // Get the processed image
      const processedBlob = imageProcessor.getCurrentBlob();

      if (processedBlob) {
        runInAction(() => {
          // Revoke previous URL to prevent memory leaks
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          this.currentBlob = processedBlob;
          this.editedImageUrl = URL.createObjectURL(processedBlob);
          this.addToHistory(processedBlob);

          // Reset crop area
          this.cropArea = null;
        });
      }
    } catch (error) {
      console.error("Error applying crop:", error);
    } finally {
      runInAction(() => {
        this.processingImage = false;
      });
    }
  }

  /**
   * Reset all image adjustments to default
   */
  resetAdjustments() {
    this.brightness = 100;
    this.contrast = 100;
    this.saturation = 100;
    this.filter = "none";
    this.filterIntensity = 100;
    this.zoom = 100;
    this.rotation = 0;
  }

  /**
   * Reset the entire editor state
   */
  resetEditor() {
    this.resetAdjustments();
    this.annotations = [];
    this.textOverlays = [];
    this.selectedAnnotationId = null;
    this.selectedTextOverlayId = null;
    this.cropArea = null;
    this.drawingPaths = [];
    this.selectedTool = "select";

    // Reset the image to original
    if (this.originalBlob) {
      this.loadImage(this.originalBlob);
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  /**
   * Toggle panels
   */
  toggleZoomPanel() {
    this.showZoomPanel = !this.showZoomPanel;
    if (this.showZoomPanel) {
      this.showEditingPanel = false;
      this.showExtractionPanel = false;
    }
  }

  toggleEditingPanel() {
    this.showEditingPanel = !this.showEditingPanel;
    if (this.showEditingPanel) {
      this.showZoomPanel = false;
      this.showExtractionPanel = false;
    }
  }

  toggleExtractionPanel() {
    this.showExtractionPanel = !this.showExtractionPanel;
    if (this.showExtractionPanel) {
      this.showZoomPanel = false;
      this.showEditingPanel = false;

      // Trigger text extraction if panel is being opened
      if (
        this.showExtractionPanel &&
        !this.extractedText &&
        !this.extractingText
      ) {
        this.extractText();
      }
    }
  }

  /**
   * Set the active tool
   */
  setTool(tool: ToolType) {
    this.selectedTool = tool;
  }

  /**
   * History management functions
   */
  resetHistory() {
    // Revoke any existing object URLs to prevent memory leaks
    this.historyStack.forEach((blob) => {
      const url = URL.createObjectURL(blob);
      URL.revokeObjectURL(url);
    });

    this.historyStack = [];
    this.historyPosition = -1;
  }

  addToHistory(blob: Blob) {
    // If we're not at the end of the history, truncate everything after current position
    if (this.historyPosition < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyPosition + 1);
    }

    // Add the new state to history
    this.historyStack.push(blob);

    // If history exceeds maximum size, remove the oldest entry
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
    }

    // Update the position
    this.historyPosition = this.historyStack.length - 1;
  }

  canUndo(): boolean {
    return this.historyPosition > 0;
  }

  canRedo(): boolean {
    return this.historyPosition < this.historyStack.length - 1;
  }

  async undo() {
    if (!this.canUndo()) return;

    this.historyPosition--;
    const previousBlob = this.historyStack[this.historyPosition];

    if (previousBlob) {
      // Revoke previous URL to prevent memory leaks
      if (
        this.editedImageUrl &&
        this.editedImageUrl !== this.originalImageUrl
      ) {
        URL.revokeObjectURL(this.editedImageUrl);
      }

      this.currentBlob = previousBlob;
      this.editedImageUrl = URL.createObjectURL(previousBlob);

      // Update image processor with this state
      await imageProcessor.loadImage(previousBlob);
    }
  }

  async performUndo() {
    if (!this.canUndo()) return;

    try {
      // Get the position before decrementing
      const currentPosition = this.historyPosition;

      // Directly access the previous blob from history
      if (currentPosition > 0) {
        const previousBlob = this.historyStack[currentPosition - 1];

        if (previousBlob) {
          // Decrement position first
          this.historyPosition = currentPosition - 1;

          // Update the current blob
          this.currentBlob = previousBlob;

          // Update the image URL (revoking previous one to prevent memory leaks)
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          // Create new URL and update
          this.editedImageUrl = URL.createObjectURL(previousBlob);

          // Load the image to display it
          await imageProcessor.loadImage(previousBlob);

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error performing undo:", error);
      return false;
    }
  }

  async redo() {
    if (!this.canRedo()) return;

    this.historyPosition++;
    const nextBlob = this.historyStack[this.historyPosition];

    if (nextBlob) {
      // Revoke previous URL to prevent memory leaks
      if (
        this.editedImageUrl &&
        this.editedImageUrl !== this.originalImageUrl
      ) {
        URL.revokeObjectURL(this.editedImageUrl);
      }

      this.currentBlob = nextBlob;
      this.editedImageUrl = URL.createObjectURL(nextBlob);

      // Update image processor with this state
      await imageProcessor.loadImage(nextBlob);
    }
  }

  async performRedo() {
    if (!this.canRedo()) return;

    try {
      // Get current position
      const currentPosition = this.historyPosition;

      // Directly access the next blob in history
      if (currentPosition < this.historyStack.length - 1) {
        const nextBlob = this.historyStack[currentPosition + 1];

        if (nextBlob) {
          // Increment position first
          this.historyPosition = currentPosition + 1;

          // Update the current blob
          this.currentBlob = nextBlob;

          // Update the image URL (revoking previous one to prevent memory leaks)
          if (
            this.editedImageUrl &&
            this.editedImageUrl !== this.originalImageUrl
          ) {
            URL.revokeObjectURL(this.editedImageUrl);
          }

          // Create new URL and update
          this.editedImageUrl = URL.createObjectURL(nextBlob);

          // Load the image to display it
          await imageProcessor.loadImage(nextBlob);

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error performing redo:", error);
      return false;
    }
  }

  /**
   * Save the current state of the image
   */
  // ===== PART 1: ImageEditorStore.ts =====

  /**
   * Save the current state of the image with all text properly rendered and sized
   */
  async saveImage(
    format: string = "image/jpeg",
    quality: number = 0.92
  ): Promise<Blob | null> {
    if (!this.currentBlob) return null;

    // Store the current overlays state
    const currentOverlays = [...this.textOverlays];

    try {
      // 1. First hide all text overlay components by clearing the array
      runInAction(() => {
        this.textOverlays = [];
      });

      // 2. Apply all adjustments without text
      await this.applyAdjustments();

      // 3. Get a reference to the current canvas state
      const baseCanvas = document.createElement("canvas");
      const img = new Image();

      // Wait for image to load
      await new Promise<void>((resolve) => {
        img.onload = () => {
          baseCanvas.width = img.width;
          baseCanvas.height = img.height;
          const ctx = baseCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
          resolve();
        };
        img.src = this.editedImageUrl!;
      });

      // 4. Create a new canvas for the final output
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = baseCanvas.width;
      finalCanvas.height = baseCanvas.height;
      const finalCtx = finalCanvas.getContext("2d");

      if (!finalCtx) {
        throw new Error("Could not create canvas context");
      }

      // Draw base image
      finalCtx.drawImage(baseCanvas, 0, 0);

      // 5. Draw each text overlay directly to the final canvas
      for (const overlay of currentOverlays) {
        // Apply a fixed multiplier to match CSS sizing to Canvas sizing
        // This constant is based on empirical testing - adjust as needed
        const fontSizeMultiplier = 1.8;
        const adjustedFontSize = overlay.fontSize * fontSizeMultiplier;

        // Set text properties with adjusted font size
        const fontWeight = overlay.isBold ? "bold" : "normal";
        const fontStyle = overlay.isItalic ? "italic" : "normal";
        finalCtx.font = `${fontStyle} ${fontWeight} ${adjustedFontSize}px ${overlay.fontFamily}`;
        finalCtx.fillStyle = overlay.color;

        // Set text alignment for better positioning
        finalCtx.textAlign = "center";
        finalCtx.textBaseline = "middle";

        // Add text shadow for better visibility
        finalCtx.shadowColor = "rgba(0, 0, 0, 0.7)";
        finalCtx.shadowBlur = 3;
        finalCtx.shadowOffsetX = 1;
        finalCtx.shadowOffsetY = 1;

        // Calculate position (x, y are in percentages)
        const posX = (overlay.x / 100) * finalCanvas.width;
        const posY = (overlay.y / 100) * finalCanvas.height;

        // Apply rotation if needed
        if (overlay.rotation !== 0) {
          finalCtx.save();
          finalCtx.translate(posX, posY);
          finalCtx.rotate((overlay.rotation * Math.PI) / 180);
          finalCtx.fillText(overlay.text, 0, 0);
          finalCtx.restore();
        } else {
          finalCtx.fillText(overlay.text, posX, posY);
        }

        // Reset shadow
        finalCtx.shadowColor = "transparent";
        finalCtx.shadowBlur = 0;
        finalCtx.shadowOffsetX = 0;
        finalCtx.shadowOffsetY = 0;
      }

      // 6. Convert to blob with proper format
      return new Promise((resolve) => {
        finalCanvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          format,
          quality
        );
      });
    } finally {
      // 7. Restore the text overlays for UI
      runInAction(() => {
        this.textOverlays = currentOverlays;
      });
    }
  }
}
