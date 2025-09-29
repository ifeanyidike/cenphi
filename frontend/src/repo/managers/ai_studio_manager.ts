// src/repo/manager/ai_studio_manager.ts
import {
  AIService,
  DefaultSettings,
  ProcessingJob,
  ServiceType,
  SourceInfo,
  StreamingResult,
} from "@/types/ai-service";
import { makeAutoObservable, runInAction } from "mobx";
import { JobsManager } from "./jobs_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { AI_SERVICES } from "@/components/ai-studio/definitions";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export class AIStudioManager {
  activeService: AIService | null = null;
  selectedArtifact: string[] = [];
  jobs: ProcessingJob[] = [];
  streamingResults: Record<string, StreamingResult> = {};
  isProcessing = false;
  serviceConfigs: Partial<DefaultSettings> = {};
  previewData: Record<string, any> = {};
  error: string | null = null;
  connectionStatus: "connected" | "disconnected" | "error" = "disconnected";
  baseUrl = API_BASE_URL;

  // selectedTestimonial: string | null = null;
  selectedTestimonials: string[] = [];
  tokenInfo = authStore.getToken();

  // SSE and streaming connections
  eventSource: EventSource | null = null;
  streamingConnections: Record<string, EventSource> = {};
  mounted = true;
  jobsManager: JobsManager;

  constructor() {
    // this.initializeDefaultConfigs();
    this.jobsManager = new JobsManager(this);
    // this.initializeSSE();
    makeAutoObservable(this);
  }

  public serviceValidation: {
    loading: boolean;
    errors: string[];
    warnings: string[];
    blockedServices: ServiceType[];
    validatedSources: boolean;
  } = {
    loading: false,
    errors: [],
    warnings: [],
    blockedServices: [],
    validatedSources: false,
  };

  /**
   * Initialize the manager
   */
  initialize(): void {
    this.mounted = true;
    if (!this.eventSource && this.connectionStatus !== "connected") {
      this.initializeSSE();
    }
    this.setSelectedTestimonials();
  }

  // SSE Connection Management
  private async initializeSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    // const token = (await this.tokenInfo).token;
    this.eventSource = new EventSource(`${API_BASE_URL}/ai/jobs/stream`);

    this.eventSource.onopen = () => {
      console.log("SSE connection established");
      runInAction(() => {
        this.connectionStatus = "connected";
      });
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE event received:", data);

        if (data.job_id && data.service_id) {
          this.jobsManager.handleJobStatusUpdate(data);
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    this.eventSource.addEventListener("job_completed", (event) => {
      try {
        const data = JSON.parse((event as any).data);
        console.log("Job completed:", data);
        this.jobsManager.handleJobCompletion(data);
      } catch (error) {
        console.error("Error parsing job completion data:", error);
      }
    });

    this.eventSource.addEventListener("job_failed", (event) => {
      try {
        const data = JSON.parse((event as any).data);
        console.log("Job failed:", data);
        this.jobsManager.handleJobFailure(data);
      } catch (error) {
        console.error("Error parsing job failure data:", error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      runInAction(() => {
        this.connectionStatus = "error";
      });

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (this.mounted) {
          this.initializeSSE();
        }
      }, 5000);
    };
  }

  setActiveService(serviceId: ServiceType | null) {
    if (!serviceId) {
      runInAction(() => {
        this.activeService = null;
      });
      return;
    }

    const service = AI_SERVICES.find((s) => s.id === serviceId);
    runInAction(() => {
      this.activeService = service || null;
    });
  }

  setSelectedTestimonials() {
    const testimonialIds = new URLSearchParams(window.location.search).get(
      "testimonials"
    );
    if (testimonialIds) {
      const ids = testimonialIds.split(",").filter((id) => id.trim()) || [];
      runInAction(() => (this.selectedTestimonials = ids));
      return;
    }

    runInAction(() => (this.selectedTestimonials = []));
  }

  handleTestimonialsChanged(testimonialIds: string[]) {
    runInAction(() => (this.selectedTestimonials = testimonialIds));
    const url = new URL(window.location.href);
    if (testimonialIds.length > 0) {
      url.searchParams.set("testimonials", testimonialIds.join(","));
    } else {
      url.searchParams.delete("testimonials");
    }

    window.history.replaceState({}, "", url.toString());
  }

  get selectedTestimonial() {
    if (
      this.activeService?.id === "story_mode" ||
      this.activeService?.id === "clipping"
    ) {
      if (this.selectedTestimonials.length) {
        return workspaceHub.testimonialManager.testimonials?.find(
          (t) => t.id === this.selectedTestimonials[0]
        );
      }
    }
    return null;
  }

  /**
   * Enhanced startJobWithContext with lineage validation
   */
  async startJob(
    service: ServiceType,
    selectedArtifacts?: string[],
    artifactData?: any,
    config?: DefaultSettings,
    serviceDefinition?: AIService
  ): Promise<string> {
    // Create source info using your existing logic
    const sourceInfo = this.jobsManager.determineSourceInfo(
      service,
      this.selectedTestimonials,
      selectedArtifacts,
      artifactData
    );
    console.log("source info", sourceInfo);

    // Use JobsManager's validation and job creation
    const jobId = await this.jobsManager.startJob(
      service,
      sourceInfo,
      config,
      serviceDefinition
    );

    // if (!result.success) {
    //   throw new Error(result.error || "Failed to create job");
    // }

    // return result.jobId!;
    return jobId;
  }

  /**
   * Utility method to create source info from selection
   * Exposes your existing logic for external use
   */
  createSourceInfoFromSelection(
    service: ServiceType,
    selectedTestimonials: string[],
    selectedArtifacts?: string[],
    artifactData?: any
  ): SourceInfo {
    return this.jobsManager.determineSourceInfo(
      service,
      selectedTestimonials,
      selectedArtifacts,
      artifactData
    );
  }

  // Job Management
  // private createJobId(): string {
  //   return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // }

  // Clean up all streaming connections
  cleanup() {
    this.mounted = false;

    // Close all streaming connections
    Object.values(this.streamingConnections).forEach((connection) => {
      if (connection.readyState !== EventSource.CLOSED) {
        connection.close();
      }
    });
    this.streamingConnections = {};

    // Close main event source
    if (
      this.eventSource &&
      this.eventSource.readyState !== EventSource.CLOSED
    ) {
      this.eventSource.close();
      this.eventSource = null;
    }

    runInAction(() => {
      this.connectionStatus = "disconnected";
    });
  }

  getServiceEndpoint(service: ServiceType): string {
    const endpoints = {
      enhancement: "/enhance-media",
      story_mode: "/story-video",
      clipping: "/smart-clips",
      platform_optimizer: "/optimize-platform",
      noise_removal: "/remove-noise",
      content_generation: "/generate-content",
      text_polishing: "/polish",
      translation: "/translate",
      narration: "/generate-narration",
    };

    return endpoints[service];
  }
  async saveArtifact(
    job: ProcessingJob,
    content: string | undefined,
    is_streamed: boolean
  ) {
    const payload: Record<string, any> = {
      processing_type: job.service,
      workspace_id: job.workspaceId,
      is_user_saved: true,
      is_streamed: is_streamed,
      result_category: "processing",
    };

    if (job.testimonialId) {
      payload.testimonial_id = job.testimonialId;
    }

    if (job.testimonialIds) {
      payload.data = {
        ...(payload.data || {}),
        testimonial_ids: job.testimonialIds,
      };
    }

    if (content) {
      payload.text_content = content;
    }

    if (job.metadata?.content_type) {
      payload.content_type = job.metadata?.content_type;
    }

    try {
      await fetch(`${this.baseUrl}/ai/save-artifact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await this.tokenInfo).token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to notify backend of job cancellation:", error);
    }
  }

  removeJob(jobId: string) {
    this.jobs = this.jobs.filter((job) => job.id !== jobId);
  }

  // Cleanup
  destroy() {
    this.mounted = false;

    if (this.eventSource) {
      this.eventSource.close();
    }

    Object.values(this.streamingConnections).forEach((connection) => {
      connection.close();
    });
    this.streamingConnections = {};
  }

  /**
   * Save highlight order for a testimonial
   */
  async saveHighlightOrder(
    testimonialId: string,
    highlightIds: string[]
  ): Promise<void> {
    try {
      const payload = {
        workspace_id: workspaceHub.workspace?.id,
        testimonial_id: testimonialId,
        highlight_ids: highlightIds,
      };

      const response = await fetch(`${this.baseUrl}/ai/highlights/save-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await this.tokenInfo).token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save highlight order: ${error}`);
      }

      console.log("Highlight order saved successfully");
    } catch (error) {
      console.error("Error saving highlight order:", error);
      throw error;
    }
  }

  /**
   * Generate highlights by specific type
   */
  async generateHighlightsByType(
    testimonialId: string,
    text: string,
    segments: any[],
    highlightType: string,
    customPrompt?: string,
    maxHighlights?: number
  ): Promise<any[]> {
    try {
      const payload = {
        workspace_id: workspaceHub.workspace?.id,
        testimonial_id: testimonialId,
        text,
        segments,
        highlight_type: highlightType,
        prompt: customPrompt || "",
        max_highlights: maxHighlights || 5,
      };

      const response = await fetch(`${this.baseUrl}/ai/highlights/by-type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await this.tokenInfo).token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate highlights: ${error}`);
      }

      const highlights = await response.json();
      console.log(`Generated ${highlightType} highlights:`, highlights);
      return highlights;
    } catch (error) {
      console.error("Error generating highlights:", error);
      throw error;
    }
  }

  // Utility
  reset() {
    this.activeService = null;
    this.previewData = {};
    this.error = null;
    // this.initializeDefaultConfigs();
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.destroy();
    this.mounted = true;
    this.initializeSSE();
  }
}

// Export singleton instance
export const aiStudioManager = new AIStudioManager();
