// src/stores/brandGuideStore.ts
import { makeAutoObservable, toJS, runInAction } from "mobx";
import { cloneDeep, merge, set } from "lodash";
import { BrandData, BrandPreset } from "@/types/setup";
import {
  brandPresets,
  defaultBrandData,
} from "@/components/brand-guide/constants";

class BrandGuideStore {
  brandData: BrandData = cloneDeep(defaultBrandData);
  isSaving: boolean = false;
  isSaved: boolean = true;
  recentColors: string[] = [];
  brandPresets: BrandPreset[] = brandPresets;
  selectedPreset: string | null = null;
  error: string | null = null;
  history: BrandData[] = [];
  historyIndex: number = -1;
  isDirty: boolean = false;
  aiGenerating: boolean = false;
  uploadProgress: number = 0;
  exportFormat: "pdf" | "json" | "html" = "pdf";
  previewMode: "desktop" | "tablet" | "mobile" = "desktop";
  previewTab: "website" | "widget" | "email" | "social" = "website";
  showAiSuggestions: boolean = false;
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  init() {
    // Load data from localStorage
    this.loadBrandData();
    this.loadRecentColors();
  }

  loadBrandData() {
    try {
      const savedData = localStorage.getItem("brandGuideData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Use runInAction to ensure all updates are properly tracked by MobX
        runInAction(() => {
          // Merge the saved data with default data to ensure all properties exist
          this.brandData = merge(cloneDeep(defaultBrandData), parsedData);
        });
      }
    } catch (e) {
      console.error("Failed to load brand data from localStorage", e);
      this.error = "Failed to load saved brand data";
      // Ensure we have default data if loading fails
      this.brandData = cloneDeep(defaultBrandData);
    }
  }

  loadRecentColors() {
    try {
      const savedColors = localStorage.getItem("brandGuideRecentColors");
      if (savedColors) {
        runInAction(() => {
          this.recentColors = JSON.parse(savedColors);
        });
      }
    } catch (e) {
      console.error("Failed to load recent colors from localStorage", e);
      // If loading fails, keep the empty array
    }
  }

  /**
   * Update a property in the brand data using a path array
   * Example: updateBrandData(['colors', 'primary'], '#ff0000')
   */
  updateBrandData(path: string[], value: any) {
    // Use lodash's set function for safe and immutable updates
    console.log("existing brand data", this, this.brandData, path, value);
    const updatedData = cloneDeep(this.brandData);
    set(updatedData, path, value);
    updatedData.updatedAt = new Date();
    this.brandData = updatedData;
    console.log("updateddata", this.brandData);
    this.isSaved = false;
  }

  /**
   * Save all changes to localStorage and (in a real app) to the server
   */
  async saveChanges() {
    this.isSaving = true;
    this.error = null;

    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      localStorage.setItem(
        "brandGuideData",
        JSON.stringify(toJS(this.brandData))
      );

      runInAction(() => {
        this.isSaved = true;
      });

      return true;
    } catch (e) {
      console.error("Failed to save brand data", e);
      runInAction(() => {
        this.error = "Failed to save changes";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }

  /**
   * Reset brand data to defaults
   */
  resetToDefault() {
    runInAction(() => {
      const id = this.brandData.id; // Preserve the ID
      this.brandData = { ...cloneDeep(defaultBrandData), id };
      this.isSaved = false;
    });
  }

  /**
   * Add a color to the recent colors list
   */
  addRecentColor = (color: string) => {
    // Check if color already exists in recentColors
    if (!this.recentColors.includes(color)) {
      // Add to the beginning and limit to 10 colors
      this.recentColors = [color, ...this.recentColors.slice(0, 9)];
    } else {
      // Move to beginning if it exists
      this.recentColors = [
        color,
        ...this.recentColors.filter((c) => c !== color),
      ].slice(0, 10);
    }
  };

  addToHistory = (data: BrandData) => {
    // If we're not at the end of the history, remove everything after current index
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add the new state and update index
    this.history.push(JSON.parse(JSON.stringify(data)));
    this.historyIndex = this.history.length - 1;

    // Limit history size (optional)
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  };

  /**
   * Apply a preset to the brand data
   */
  //   applyPreset(presetId: string) {
  //     const preset = this.brandPresets.find((p) => p.id === presetId);
  //     if (!preset) return;

  //     runInAction(() => {
  //       // Make a deep copy of the current data
  //       const updatedData = cloneDeep(this.brandData);

  //       // Apply preset colors (deep merge)
  //       updatedData.colors = { ...updatedData.colors, ...preset.colors };

  //       // Apply typography settings
  //       updatedData.typography = {
  //         ...updatedData.typography,
  //         headingFont: preset.typography.headingFont,
  //         bodyFont: preset.typography.bodyFont,
  //       };

  //       // Apply testimonial style
  //       updatedData.testimonials = {
  //         ...updatedData.testimonials,
  //         style: preset.testimonials.style,
  //       };

  //       // Update timestamp
  //       updatedData.updatedAt = new Date().toISOString();

  //       // Update the brand data
  //       this.brandData = updatedData;
  //       this.isSaved = false;
  //     });
  //   }

  applyPreset = (presetId: string) => {
    const preset = brandPresets.find((p) => p.id === presetId);
    if (!preset) return;

    this.selectedPreset = presetId;

    // Create a new brand data object with preset values
    const newBrandData = {
      ...this.brandData,
      colors: {
        ...preset.colors,
      },
      typography: {
        ...this.brandData.typography,
        headingFont: preset.typography.headingFont,
        bodyFont: preset.typography.bodyFont,
      },
    };

    this.brandData = newBrandData;
    this.isSaved = false;

    // Add to history
    this.addToHistory(this.brandData);
  };

  undo = () => {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.brandData = JSON.parse(
        JSON.stringify(this.history[this.historyIndex])
      );
      this.isDirty = true;
      this.isSaved = false;
    }
  };

  redo = () => {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.brandData = JSON.parse(
        JSON.stringify(this.history[this.historyIndex])
      );
      this.isDirty = true;
      this.isSaved = false;
    }
  };

  handleImageUpload = async (field: string, file: File): Promise<void> => {
    if (!file) return Promise.reject(new Error("No file provided"));

    this.uploadProgress = 0;

    try {
      // Simulate file upload with progress
      const interval = setInterval(() => {
        runInAction(() => {
          this.uploadProgress += 10;
          if (this.uploadProgress >= 100) {
            clearInterval(interval);
          }
        });
      }, 200);

      // In a real implementation, you would upload to a server or storage
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, create a local object URL
      const imageUrl = URL.createObjectURL(file);

      // Update the appropriate logo field
      const pathArray = field.split(".");
      const newData = { ...this.brandData };

      let current: any = newData;
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }

      current[pathArray[pathArray.length - 1]] = imageUrl;

      runInAction(() => {
        this.brandData = newData;
        this.isDirty = true;
        this.isSaved = false;
        this.uploadProgress = 0;

        // Add to history
        this.addToHistory(this.brandData);
      });

      return Promise.resolve();
    } catch (error) {
      runInAction(() => {
        this.uploadProgress = 0;
      });

      return Promise.reject(error);
    }
  };
  /**
   * Get a copy of the brand data (useful for exporting)
   */
  getBrandDataCopy(): BrandData {
    return cloneDeep(toJS(this.brandData));
  }

  saveBrandData = async (): Promise<void> => {
    this.isLoading = true;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, you would save to a server here

      runInAction(() => {
        this.isDirty = false;
        this.isSaved = true;
        this.isLoading = false;
        this.brandData.updatedAt = new Date();
      });

      return Promise.resolve();
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });

      return Promise.reject(error);
    }
  };

  resetToDefaults = () => {
    this.brandData = { ...defaultBrandData };
    this.isDirty = true;
    this.isSaved = false;
    this.selectedPreset = null;

    // Add to history
    this.addToHistory(this.brandData);
  };

  exportBrandGuide = async (
    format: "pdf" | "json" | "html" = "pdf"
  ): Promise<void> => {
    this.exportFormat = format;
    this.isLoading = true;

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you would generate and download the export here

      runInAction(() => {
        this.isLoading = false;
      });

      return Promise.resolve();
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });

      return Promise.reject(error);
    }
  };

  setPreviewMode = (mode: "desktop" | "tablet" | "mobile") => {
    this.previewMode = mode;
  };

  setPreviewTab = (tab: "website" | "widget" | "email" | "social") => {
    this.previewTab = tab;
  };

  toggleAiSuggestions = () => {
    this.showAiSuggestions = !this.showAiSuggestions;
  };

  generateAiSuggestions = async () => {
    this.aiGenerating = true;
    this.showAiSuggestions = true;

    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you would call an AI API here
      // Example AI-enhanced voice suggestions
      runInAction(() => {
        this.brandData.voice = {
          ...this.brandData.voice,
          tone: "conversational",
          values: ["Authentic", "Trustworthy", "Innovative"],
          examples: [
            "Our customers are at the heart of everything we do.",
            "We're committed to delivering exceptional experiences.",
            "Join thousands of satisfied customers who trust our solutions.",
          ],
          ctas: [
            "Share your story",
            "Tell us about your experience",
            "How did we do?",
          ],
          channels: {
            ...this.brandData.voice.channels,
            email: {
              ...this.brandData.voice.channels.email,
              requestTemplate:
                "Hi {{name}},\n\nWe hope you're enjoying your experience with {{brand}}! We would love to hear your thoughts. Would you mind taking a moment to share your feedback?\n\nBest,\n{{brand}} Team",
              thankYouTemplate:
                "Thank you for your feedback, {{name}}! We appreciate your input and look forward to serving you better.",
            },
          },
        };

        this.isDirty = true;
        this.isSaved = false;
        this.aiGenerating = false;

        // Add to history
        this.addToHistory(this.brandData);
      });

      return Promise.resolve();
    } catch (error) {
      runInAction(() => {
        this.aiGenerating = false;
      });

      return Promise.reject(error);
    }
  };
}

export const brandGuideStore = new BrandGuideStore();
