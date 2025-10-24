import { makeAutoObservable } from "mobx";
import axios from "axios";
import { authStore } from "@/stores/authStore";
import { TestimonialArtifact } from "@/types/testimonial";

export interface ArtifactsResponse {
  success: boolean;
  data: TestimonialArtifact[];
  count: number;
}

export class AIArtifactsManager {
  artifacts: TestimonialArtifact[] = [];
  contentGenerationArtifacts: TestimonialArtifact[] = [];
  storyVideoArtifacts: TestimonialArtifact[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Cache tracking
  private cachedWorkspaceId: string | null = null;
  private cacheTimestamp: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  private server_addr = import.meta.env.VITE_API_URL;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Check if cache is valid for the given workspace
   */
  private isCacheValid(workspaceId: string): boolean {
    const now = Date.now();
    const cacheAge = now - this.cacheTimestamp;
    return (
      this.cachedWorkspaceId === workspaceId &&
      this.artifacts.length > 0 &&
      cacheAge < this.CACHE_TTL
    );
  }

  /**
   * Get all artifacts for a workspace with optional filtering by processing types
   */
  async getArtifactsByWorkspace(
    workspaceId: string,
    processingTypes?: string[],
    limit?: number,
    offset?: number,
    refresh: boolean = false
  ): Promise<TestimonialArtifact[]> {
    // Check cache if not forcing refresh and no filters applied
    if (
      !refresh &&
      !processingTypes &&
      !limit &&
      !offset &&
      this.isCacheValid(workspaceId)
    ) {
      console.log("[AIArtifactsManager] Using cached artifacts:", {
        count: this.artifacts.length,
        workspaceId,
      });
      return this.artifacts;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (processingTypes && processingTypes.length > 0) {
        processingTypes.forEach((type) => params.append("type", type));
      }
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());

      const queryString = params.toString();
      const url = `${this.server_addr}/ai/workspaces/${workspaceId}/artifacts${queryString ? `?${queryString}` : ""}`;

      const response = await axios.get<ArtifactsResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.artifacts = response.data.data || [];

      // Update cache metadata only if no filters were applied
      if (!processingTypes && !limit && !offset) {
        this.cachedWorkspaceId = workspaceId;
        this.cacheTimestamp = Date.now();
        console.log("[AIArtifactsManager] Cached artifacts:", {
          count: this.artifacts.length,
          workspaceId,
        });
      }

      console.log("response data", response.data.data);
      this.isLoading = false;
      return this.artifacts;
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to fetch artifacts";
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Get content generation artifacts (multi-testimonial artifacts)
   */
  async getContentGenerationArtifacts(
    workspaceId: string,
    limit?: number,
    offset?: number
  ): Promise<TestimonialArtifact[]> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());

      const queryString = params.toString();
      const url = `${this.server_addr}/ai/workspaces/${workspaceId}/content-generation${queryString ? `?${queryString}` : ""}`;

      const response = await axios.get<ArtifactsResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.contentGenerationArtifacts = response.data.data || [];
      this.isLoading = false;
      return this.contentGenerationArtifacts;
    } catch (error: any) {
      this.error =
        error.response?.data?.message ||
        "Failed to fetch content generation artifacts";
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Get story video artifacts
   */
  async getStoryVideoArtifacts(
    workspaceId: string,
    limit?: number,
    offset?: number
  ): Promise<TestimonialArtifact[]> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());

      const queryString = params.toString();
      const url = `${this.server_addr}/ai/workspaces/${workspaceId}/story-videos${queryString ? `?${queryString}` : ""}`;

      const response = await axios.get<ArtifactsResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.storyVideoArtifacts = response.data.data || [];
      this.isLoading = false;
      return this.storyVideoArtifacts;
    } catch (error: any) {
      this.error =
        error.response?.data?.message ||
        "Failed to fetch story video artifacts";
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Get artifacts by specific processing types
   */
  async getArtifactsByTypes(
    workspaceId: string,
    processingTypes: string[],
    limit?: number,
    offset?: number
  ): Promise<TestimonialArtifact[]> {
    return this.getArtifactsByWorkspace(
      workspaceId,
      processingTypes,
      limit,
      offset
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Invalidate cache to force refetch on next call
   */
  invalidateCache(): void {
    console.log("[AIArtifactsManager] Cache invalidated");
    this.cachedWorkspaceId = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.artifacts = [];
    this.contentGenerationArtifacts = [];
    this.storyVideoArtifacts = [];
    this.error = null;
    this.isLoading = false;
    this.invalidateCache();
  }

  /**
   * Filter artifacts by processing type from loaded data
   */
  getArtifactsByProcessingType(processingType: string): TestimonialArtifact[] {
    return this.artifacts.filter(
      (artifact) => artifact.processing_type === processingType
    );
  }

  /**
   * Get content generation artifacts from loaded data
   */
  getContentGenerationFromLoaded(): TestimonialArtifact[] {
    const contentTypes = [
      "content_generation",
      "story_mode_generation",
      "best_story_moments",
    ];
    return this.artifacts.filter((artifact) =>
      contentTypes.includes(artifact.processing_type)
    );
  }

  /**
   * Get story video artifacts from loaded data
   */
  getStoryVideosFromLoaded(): TestimonialArtifact[] {
    const storyTypes = ["story_mode_generation", "best_story_moments"];
    return this.artifacts.filter((artifact) =>
      storyTypes.includes(artifact.processing_type)
    );
  }
}

export const aiArtifactsManager = new AIArtifactsManager();
