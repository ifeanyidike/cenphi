// src/stores/brandGuideStore.ts
import { makeAutoObservable, toJS, runInAction } from "mobx";
import { cloneDeep, merge, set } from "lodash";
import { BrandGuide, BrandPreset } from "@/types/setup";
import {
  brandPresets,
  defaultBrandData,
} from "@/components/brand-guide/constants";

class BrandGuideStore {
  brandData: BrandGuide = cloneDeep(defaultBrandData);
  isSaving: boolean = false;
  isSaved: boolean = true;
  recentColors: string[] = [];
  brandPresets: BrandPreset[] = brandPresets;
  selectedPreset: string | null = null;
  error: string | null = null;
  history: BrandGuide[] = [];
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
    // Load data from localStorage and workspace if available
    this.loadBrandData();
    this.loadRecentColors();
  }

  /**
   * Initialize brand data from workspace brand_context
   */
  initializeFromWorkspace(workspaceBrandContext: Record<string, any>) {
    try {
      const updatedData = cloneDeep(defaultBrandData);

      // Map workspace brand_context to brand guide structure
      if (workspaceBrandContext.tagline) {
        updatedData.tagline = workspaceBrandContext.tagline;
      }

      if (workspaceBrandContext.about_info) {
        updatedData.description = workspaceBrandContext.about_info;
      }

      if (workspaceBrandContext.logo_url) {
        updatedData.logo.main = workspaceBrandContext.logo_url;
      }

      // Map brand colors if they exist
      if (
        workspaceBrandContext.brand_colors &&
        Object.keys(workspaceBrandContext.brand_colors).length > 0
      ) {
        const colors = workspaceBrandContext.brand_colors;
        if (colors.primary) updatedData.colors.primary = colors.primary;
        if (colors.secondary) updatedData.colors.secondary = colors.secondary;
        if (colors.accent) updatedData.colors.accent = colors.accent;
      }

      // Map fonts if they exist
      if (
        workspaceBrandContext.brand_fonts &&
        workspaceBrandContext.brand_fonts.primary
      ) {
        const primaryFont = workspaceBrandContext.brand_fonts.primary[0];
        if (primaryFont && primaryFont !== "var(--body-fontFamily)") {
          // Convert CSS font family to our font system
          const fontName = this.mapCSSFontToSystemFont(primaryFont);
          updatedData.typography.headingFont = fontName;
          updatedData.typography.bodyFont = fontName;
        }
      }

      // Map tone to brand voice/description if available
      if (workspaceBrandContext.tone) {
        updatedData.voice = {
          ...updatedData.voice,
          tone: workspaceBrandContext.tone,
        };
      }

      // Map mission statement
      if (workspaceBrandContext.mission_statement) {
        updatedData.mission = workspaceBrandContext.mission_statement;
      }

      // Map target audience
      if (workspaceBrandContext.target_audience) {
        updatedData.audience = workspaceBrandContext.target_audience;
      }

      // Map industry
      if (workspaceBrandContext.industry) {
        updatedData.voice = updatedData.voice || {};
        updatedData.voice.attributes = updatedData.voice.attributes || [];
        if (
          !updatedData.voice.attributes.includes(workspaceBrandContext.industry)
        ) {
          updatedData.voice.attributes.push(workspaceBrandContext.industry);
        }
      }

      // Map tone
      if (workspaceBrandContext.tone) {
        updatedData.voice = updatedData.voice || {};
        updatedData.voice.tone = workspaceBrandContext.tone;
      }

      // Map values array
      if (
        workspaceBrandContext.values &&
        Array.isArray(workspaceBrandContext.values)
      ) {
        updatedData.voice = updatedData.voice || {};
        updatedData.voice.personality = workspaceBrandContext.values;
      }

      // Map brand colors from brand_context
      if (
        workspaceBrandContext.brand_colors &&
        Array.isArray(workspaceBrandContext.brand_colors)
      ) {
        if (workspaceBrandContext.brand_colors[0]) {
          updatedData.colors.primary = workspaceBrandContext.brand_colors[0];
        }
        if (workspaceBrandContext.brand_colors[1]) {
          updatedData.colors.secondary = workspaceBrandContext.brand_colors[1];
        }
      }

      updatedData.updated_at = new Date();

      runInAction(() => {
        this.brandData = updatedData;
        this.isSaved = false; // Mark as unsaved since we have new data
      });

      console.log(
        "Initialized brand guide from workspace context:",
        updatedData
      );
    } catch (e) {
      console.error("Failed to initialize from workspace context", e);
      this.error = "Failed to load workspace brand data";
    }
  }

  /**
   * Map CSS font family names to our simplified font system
   */
  private mapCSSFontToSystemFont(cssFont: string): string {
    const fontMap: Record<string, string> = {
      Inter: "inter",
      Poppins: "poppins",
      Roboto: "roboto",
      "Open Sans": "open-sans",
      Montserrat: "montserrat",
      "Source Sans Pro": "source-sans-pro",
      Lato: "lato",
      "Playfair Display": "playfair-display",
      Merriweather: "merriweather",
    };

    // Try to find a match in our supported fonts
    for (const [cssName, systemName] of Object.entries(fontMap)) {
      if (cssFont.toLowerCase().includes(cssName.toLowerCase())) {
        return systemName;
      }
    }

    // Default to system if no match found
    return "system";
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
    updatedData.updated_at = new Date();
    this.brandData = updatedData;
    console.log("updateddata", this.brandData);
    this.isSaved = false;
  }

  /**
   * Save all changes to localStorage and backend via workspace update
   */
  async saveChanges() {
    this.isSaving = true;
    this.error = null;

    try {
      // Import workspace hub dynamically to avoid circular dependency
      const { workspaceHub } = await import("@/repo/workspace_hub");

      // Convert brand guide data back to workspace brand_context format
      const brandContext = this.convertToWorkspaceFormat(this.brandData);

      // Save to backend via workspace update
      const success = await workspaceHub.update({
        brand_context: brandContext,
      });

      if (success) {
        // Also save to localStorage as backup
        localStorage.setItem(
          "brandGuideData",
          JSON.stringify(toJS(this.brandData))
        );

        // Update the workspace in memory
        if (workspaceHub.workspace) {
          runInAction(() => {
            workspaceHub.workspace!.brand_context = brandContext;
          });
        }

        runInAction(() => {
          this.isSaved = true;
        });

        return true;
      } else {
        throw new Error("Failed to save to backend");
      }
    } catch (e: any) {
      console.error("Failed to save brand data", e);
      runInAction(() => {
        this.error = e.message || "Failed to save changes";
      });
      throw e;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }

  /**
   * Convert brand guide data back to workspace brand_context format
   */
  private convertToWorkspaceFormat(brandData: any): Record<string, any> {
    const brandContext: Record<string, any> = {};

    // Map back to workspace format
    if (brandData.tagline) {
      brandContext.tagline = brandData.tagline;
    }

    if (brandData.description) {
      brandContext.about_info = brandData.description;
    }

    if (brandData.logo?.main) {
      brandContext.logo_url = brandData.logo.main;
    }

    // Map colors back
    if (brandData.colors) {
      brandContext.brand_colors = {
        primary: brandData.colors.primary,
        secondary: brandData.colors.secondary,
        accent: brandData.colors.accent,
      };
    }

    // Map fonts back
    if (brandData.typography) {
      const fontName = this.convertSystemFontToCSSFont(
        brandData.typography.headingFont
      );
      brandContext.brand_fonts = {
        primary: [fontName],
        total_found: 1,
      };
    }

    // Map other fields
    if (brandData.voice?.tone) {
      brandContext.tone = brandData.voice.tone;
    }

    // Map values/personality back
    if (
      brandData.voice?.personality &&
      Array.isArray(brandData.voice.personality)
    ) {
      brandContext.values = brandData.voice.personality;
    }

    // Map industry back from voice attributes
    if (
      brandData.voice?.attributes &&
      Array.isArray(brandData.voice.attributes)
    ) {
      if (brandData.voice.attributes.length > 0) {
        brandContext.industry = brandData.voice.attributes[0]; // Use first attribute as industry
      }
    }

    // Map mission and audience back
    if (brandData.mission) {
      brandContext.mission_statement = brandData.mission;
    }

    if (brandData.audience) {
      brandContext.target_audience = brandData.audience;
    }

    // Map brand colors array format
    if (brandData.colors) {
      brandContext.brand_colors = [
        brandData.colors.primary,
        brandData.colors.secondary,
      ];
    }

    return brandContext;
  }

  /**
   * Convert our font system back to CSS font names
   */
  private convertSystemFontToCSSFont(systemFont: string): string {
    const reverseMap: Record<string, string> = {
      inter: "Inter",
      poppins: "Poppins",
      roboto: "Roboto",
      "open-sans": "Open Sans",
      montserrat: "Montserrat",
      "source-sans-pro": "Source Sans Pro",
      lato: "Lato",
      "playfair-display": "Playfair Display",
      merriweather: "Merriweather",
      system: "var(--body-fontFamily)",
    };

    return reverseMap[systemFont] || "var(--body-fontFamily)";
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

  addToHistory = (data: BrandGuide) => {
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
  getBrandDataCopy(): BrandGuide {
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
        this.brandData.updated_at = new Date();
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
}

export const brandGuideStore = new BrandGuideStore();
