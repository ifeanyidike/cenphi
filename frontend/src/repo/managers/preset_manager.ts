import { AI_SERVICES } from "@/components/ai-studio/definitions";
import {
  DefaultSettings,
  Preset,
  Segment,
  ServiceType,
} from "@/types/ai-service";
import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { TestimonialArtifact } from "@/types/testimonial";
import { aiStudioManager } from "./ai_studio_manager";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  params?: Record<string, string>;
}

interface BackendPreset {
  id: string;
  name: string;
  service_id: string;
  workspace_id: string;
  config: DefaultSettings;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePresetRequest {
  id: string;
  name: string;
  service_id: string;
  workspace_id: string;
  config: DefaultSettings;
}

interface UpdatePresetRequest {
  name?: string;
  config?: DefaultSettings;
}

interface SetDefaultPresetRequest {
  preset_id: string;
  service_id: string;
  workspace_id: string;
}

export class PresetManager {
  // Local cache - synchronized with backend
  defaultPresets: Record<string, Preset> = {};
  savedPresets: Record<string, Preset[]> = {};
  serviceConfig: DefaultSettings = {};

  // Loading states
  loading: boolean = false;
  loadingStates: Record<string, boolean> = {};
  error: string | null = null;

  // Cache management
  private fetchPromises: Record<string, Promise<any>> = {};
  private lastFetchedWorkspace: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Centralized API client
  private async apiCall<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { method = "GET", data, params } = config;

    try {
      const { token } = await authStore.getToken();

      let url = `${API_BASE_URL}/presets${endpoint}`;

      // Add query parameters
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const response = await axios({
        method,
        url,
        data,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // return response.data;
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: "Request successful",
      } as T;
    } catch (error: any) {
      console.error(`API call failed [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // URL builders for cleaner endpoint construction
  private getWorkspacePresetsEndpoint(workspaceId: string): string {
    return `/workspace/${workspaceId}`;
  }

  private getDefaultPresetEndpoint(workspaceId: string): string {
    return `/default/${workspaceId}`;
  }

  private getPresetEndpoint(presetId: string): string {
    return `/${presetId}`;
  }

  // Convert backend preset to frontend format
  private transformBackendPreset(backendPreset: BackendPreset): Preset {
    return {
      id: backendPreset.id,
      name: backendPreset.name,
      config: backendPreset.config,
      createdAt: new Date(backendPreset.created_at),
    };
  }

  // Get config for a service (with backend sync)
  async getConfig(serviceId: ServiceType): Promise<DefaultSettings> {
    const service = AI_SERVICES.find((s) => s.id === serviceId);
    const brand_context = workspaceHub.workspace?.brand_context;

    try {
      // Load default preset from backend if not cached
      if (!this.defaultPresets[serviceId]) {
        await this.loadDefaultPreset(serviceId);
      }

      const defaultSettings = {
        ...(service?.defaultSettings || {}),
        logo_url: brand_context?.logo_url || "",
        watermark_text: workspaceHub.workspace?.name || "",
      } as any;

      if (serviceId === "story_mode" || serviceId === "clipping") {
        const artifacts = aiStudioManager.selectedTestimonial?.artifacts;
        if (artifacts) {
          defaultSettings.segments = this.normalizedHighlights;
        }
      }

      const savedDefault = this.defaultPresets[serviceId]?.config as any;
      if (savedDefault && Array.isArray(savedDefault.segment_ids)) {
        savedDefault.segments = this.getAndNormalizeHighlightsByIds(
          savedDefault.segment_ids
        );
      }
      const config = savedDefault || defaultSettings;

      runInAction(() => {
        this.serviceConfig = config || {};
      });

      return config || {};
    } catch (error) {
      console.error("Failed to get config:", error);
      // Fallback to service default
      const config = service?.defaultSettings || {};
      runInAction(() => {
        this.serviceConfig = config;
      });
      return config;
    }
  }

  // Update local config (before saving)
  updateConfig(key: string, value: any) {
    runInAction(() => {
      this.serviceConfig = { ...this.serviceConfig, [key]: value };
    });
    console.log("config", this.serviceConfig);
  }

  // Set config from preset
  setConfig(preset: Preset) {
    runInAction(() => {
      this.serviceConfig = preset.config || {};
    });
  }

  // Load all presets for workspace from backend
  async loadPresetsForWorkspace(): Promise<void> {
    const workspaceId = workspaceHub.workspace!.id;
    const cacheKey = `workspace_${workspaceId}`;

    // Return existing promise if already loading
    if (this.fetchPromises[cacheKey] !== undefined) {
      return this.fetchPromises[cacheKey];
    }
    // If we already have data for this workspace, skip loading
    if (
      this.lastFetchedWorkspace === workspaceId &&
      Object.keys(this.savedPresets).length > 0
    ) {
      return;
    }

    // Create and store the promise
    const loadPromise = this.performLoadPresetsForWorkspace(workspaceId);
    this.fetchPromises[cacheKey] = loadPromise;

    try {
      await loadPromise;
    } finally {
      // Clean up promise when done
      delete this.fetchPromises[cacheKey];
    }
  }

  private async performLoadPresetsForWorkspace(
    workspaceId: string
  ): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      const { data } = await this.apiCall<{
        data: { presets: BackendPreset[] };
      }>(this.getWorkspacePresetsEndpoint(workspaceId));

      const backendPresets = data.presets || [];

      runInAction(() => {
        // Clear existing presets
        this.savedPresets = {};
        this.defaultPresets = {};

        // Group presets by service
        backendPresets.forEach((backendPreset) => {
          const preset = this.transformBackendPreset(backendPreset);

          if (!this.savedPresets[backendPreset.service_id]) {
            this.savedPresets[backendPreset.service_id] = [];
          }

          this.savedPresets[backendPreset.service_id].push(preset);

          // Set default preset
          if (backendPreset.is_default) {
            this.defaultPresets[backendPreset.service_id] = preset;
          }
        });

        this.lastFetchedWorkspace = workspaceId;
      });
    } catch (error: any) {
      console.error("Failed to load presets:", error);
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to load presets";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Load default preset for a specific service
  async loadDefaultPreset(serviceId: string): Promise<void> {
    const workspaceId = workspaceHub.workspace!.id;
    const cacheKey = `default_${serviceId}_${workspaceId}`;

    // Return existing promise if already loading
    if (this.fetchPromises[cacheKey] !== undefined) {
      return this.fetchPromises[cacheKey];
    }

    // If we already have the default preset for this service, skip loading
    if (this.defaultPresets[serviceId]) {
      return;
    }

    if (this.savedPresets) {
      const servicePresets = this.savedPresets[serviceId];
      if (servicePresets && servicePresets.length > 0) {
        // Check if any preset is marked as default
        const defaultPreset = servicePresets.find((p) => {
          const backendPreset = p as any;
          return backendPreset.is_default;
        });
        if (defaultPreset) {
          runInAction(() => {
            this.defaultPresets[serviceId] = defaultPreset;
          });
          return;
        }
        // If none marked as default, pick the first one
        runInAction(() => {
          this.defaultPresets[serviceId] = servicePresets[0];
        });
        return;
      }
    } else {
      const loadPromise = this.performLoadDefaultPreset(serviceId, workspaceId);
      this.fetchPromises[cacheKey] = loadPromise;

      try {
        await loadPromise;
      } finally {
        // Clean up promise when done
        delete this.fetchPromises[cacheKey];
      }
    }

    // // Create and store the promise
  }

  private async performLoadDefaultPreset(
    serviceId: string,
    workspaceId: string
  ): Promise<void> {
    try {
      const { data } = await this.apiCall<{ data: { preset?: BackendPreset } }>(
        this.getDefaultPresetEndpoint(workspaceId),
        {
          params: { service_id: serviceId },
        }
      );

      if (data.preset) {
        const preset = this.transformBackendPreset(data.preset);

        runInAction(() => {
          this.defaultPresets[serviceId] = preset;
        });
      }
    } catch (error: any) {
      // Default preset not found is not an error - service will use its defaults
      if (error.response?.status !== 404) {
        console.error("Failed to load default preset:", error);
        throw error;
      }
    }
  }

  get segmentIds() {
    const ids = [];
    for (const data of (this.serviceConfig as any).segments) {
      const entry = Object.values(data);
      if (!Array.isArray(entry)) continue;
      const services = entry.flatMap((i: any) => i);
      for (const s of services) {
        ids.push(s.id);
      }
    }

    return ids;
  }

  // Save preset to backend
  async savePreset(serviceId: string, name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Preset name is required");
    }

    try {
      runInAction(() => {
        this.loadingStates[`save_${serviceId}`] = true;
        this.error = null;
      });

      const workspaceId = workspaceHub.workspace!.id;
      console.log("workspaceId", workspaceId);

      const newConfig = { ...this.serviceConfig } as any;
      if ((this.serviceConfig as any).segments) {
        newConfig.segment_ids = this.segmentIds;
        delete newConfig.segments;
      }

      const createRequest: CreatePresetRequest = {
        id: crypto.randomUUID(),
        name: trimmedName,
        service_id: serviceId,
        workspace_id: workspaceId,
        config: newConfig,
      };

      const response = await this.apiCall<{ status: number }>("", {
        method: "POST",
        data: createRequest,
      });
      console.log("response data", response);

      // const preset = this.transformBackendPreset(data.preset);
      // console.log("created preset", preset);
      if (response.status === 200 || response.status === 201) {
        const preset = { ...createRequest, createdAt: new Date() };
        runInAction(() => {
          if (!this.savedPresets[serviceId]) {
            this.savedPresets[serviceId] = [];
          }
          this.savedPresets[serviceId].push(preset);
        });
      }
    } catch (error: any) {
      console.error("Failed to save preset:", error);
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to save preset";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loadingStates[`save_${serviceId}`] = false;
      });
    }
  }

  // Delete preset from backend
  async deletePreset(serviceId: string, presetId: string): Promise<void> {
    try {
      runInAction(() => {
        this.loadingStates[`delete_${presetId}`] = true;
        this.error = null;
      });

      await this.apiCall(this.getPresetEndpoint(presetId), {
        method: "DELETE",
      });

      runInAction(() => {
        if (this.savedPresets[serviceId]) {
          this.savedPresets[serviceId] = this.savedPresets[serviceId].filter(
            (p) => p.id !== presetId
          );
        }

        // Clear default if it was the deleted preset
        if (this.defaultPresets[serviceId]?.id === presetId) {
          delete this.defaultPresets[serviceId];
        }
      });
    } catch (error: any) {
      console.error("Failed to delete preset:", error);
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to delete preset";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loadingStates[`delete_${presetId}`] = false;
      });
    }
  }

  // Set default preset on backend
  async setDefaultPreset(serviceId: string, preset: Preset): Promise<void> {
    try {
      runInAction(() => {
        this.loadingStates[`default_${serviceId}`] = true;
        this.error = null;
      });

      const workspaceId = workspaceHub.workspace!.id;

      const setDefaultRequest: SetDefaultPresetRequest = {
        preset_id: preset.id,
        service_id: serviceId,
        workspace_id: workspaceId,
      };

      await this.apiCall("/set-default", {
        method: "POST",
        data: setDefaultRequest,
      });

      runInAction(() => {
        this.defaultPresets[serviceId] = preset;
      });
    } catch (error: any) {
      console.error("Failed to set default preset:", error);
      runInAction(() => {
        this.error =
          error.response?.data?.message || "Failed to set default preset";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loadingStates[`default_${serviceId}`] = false;
      });
    }
  }

  // Update existing preset
  async updatePreset(
    serviceId: string,
    presetId: string,
    updates: UpdatePresetRequest
  ): Promise<void> {
    try {
      runInAction(() => {
        this.loadingStates[`update_${presetId}`] = true;
        this.error = null;
      });

      const { data } = await this.apiCall<{ data: { preset: BackendPreset } }>(
        this.getPresetEndpoint(presetId),
        {
          method: "PUT",
          data: updates,
        }
      );

      const updatedPreset = this.transformBackendPreset(data.preset);

      runInAction(() => {
        if (this.savedPresets[serviceId]) {
          const index = this.savedPresets[serviceId].findIndex(
            (p) => p.id === presetId
          );
          if (index !== -1) {
            this.savedPresets[serviceId][index] = updatedPreset;
          }
        }

        // Update default if it's the same preset
        if (this.defaultPresets[serviceId]?.id === presetId) {
          this.defaultPresets[serviceId] = updatedPreset;
        }
      });
    } catch (error: any) {
      console.error("Failed to update preset:", error);
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to update preset";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loadingStates[`update_${presetId}`] = false;
      });
    }
  }

  // Get saved presets for a service
  getSavedPresets(serviceId: string): Preset[] {
    return this.savedPresets[serviceId] || [];
  }

  // Get default preset for a service
  getDefaultPreset(serviceId: string): Preset | null {
    return this.defaultPresets[serviceId] || null;
  }

  // Clear all caches (useful for workspace switching)
  clearCache(): void {
    runInAction(() => {
      this.defaultPresets = {};
      this.savedPresets = {};
      this.serviceConfig = {};
      this.error = null;
      this.loading = false;
      this.loadingStates = {};
    });

    // Clear fetch promises
    this.fetchPromises = {};
    this.lastFetchedWorkspace = null;
  }

  // Utility method to check if operations are loading
  isLoading(operation?: string): boolean {
    if (operation) {
      return this.loadingStates[operation] || false;
    }
    return this.loading || Object.values(this.loadingStates).some(Boolean);
  }

  // Initialize presets for workspace (call this when workspace changes)
  async initialize(): Promise<void> {
    try {
      await this.loadPresetsForWorkspace();
    } catch (error) {
      console.error("Failed to initialize preset manager:", error);
    }
  }

  get normalizedHighlights() {
    const testimonial = aiStudioManager.selectedTestimonial;
    if (testimonial) {
      return this.getAndNormalizeHighlights(testimonial.artifacts);
    }
    return [];
  }

  getAndNormalizeHighlights(artifacts: TestimonialArtifact[]) {
    const highlight_artifacts =
      artifacts.filter((a) => a.processing_type === "highlight_extraction") ||
      [];

    const segments: Record<string, Segment[]>[] = [];

    for (const artifact of highlight_artifacts) {
      const normalized_segments: Record<string, Segment[]> = {};
      for (const [highlightType, segments] of Object.entries(artifact.data)) {
        if (!Array.isArray(segments)) {
          console.warn(
            `Expected array for ${highlightType}, got:`,
            typeof segments,
            segments
          );
          continue;
        }

        normalized_segments[highlightType] = segments.map((segment) => ({
          ...segment,
          start_time: segment.start_time / 1000,
          end_time: segment.end_time / 1000,
        }));
      }
      segments.push(normalized_segments);
    }

    // return normalized_segments;
    return segments;
  }

  getAndNormalizeHighlightsByIds(ids: string[]) {
    const testimonial = aiStudioManager.selectedTestimonial;
    const artifacts = testimonial?.artifacts;
    if (!artifacts || ids.length === 0) return [];

    const highlight_artifacts =
      artifacts.filter((a) => a.processing_type === "highlight_extraction") ||
      [];

    const segments: Record<string, Segment[]>[] = [];

    for (const artifact of highlight_artifacts) {
      const normalized_segments: Record<string, Segment[]> = {};
      for (const [highlightType, segments] of Object.entries(artifact.data)) {
        if (!Array.isArray(segments)) {
          console.warn(
            `Expected array for ${highlightType}, got:`,
            typeof segments,
            segments
          );
          continue;
        }
        const segment: any = [];
        for (const s of segments) {
          if (ids.includes(s.id)) {
            segment.push({
              ...s,
              start_time: s.start_time / 1000,
              end_time: s.end_time / 1000,
            });
          }
        }
        normalized_segments[highlightType] = segment;
      }
      segments.push(normalized_segments);
    }

    // return normalized_segments;
    return segments;
  }
}

export const preset_manager = new PresetManager();
