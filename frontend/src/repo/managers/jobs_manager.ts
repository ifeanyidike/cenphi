// src/repo/manager/ai_studio_manager.ts
import {
  AIService,
  ContentConfig,
  DefaultSettings,
  ProcessingJob,
  ServiceType,
  SourceInfo,
} from "@/types/ai-service";
import { makeAutoObservable, runInAction } from "mobx";
import { AIStudioManager } from "./ai_studio_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useNotifications } from "@/components/job-system/NotificationCenter";

export class JobsManager {
  private studioManager: AIStudioManager;
  private notificationHandler?: ReturnType<typeof useNotifications>;
  // private currentStreamingModal: ProcessingJob | null = null;
  private isStreamingService(service: ServiceType): boolean {
    return ["content_generation", "text_polishing", "translation"].includes(
      service
    );
  }

  // private isProcessingService(service: ServiceType): boolean {
  //   return [
  //     "story_mode",
  //     "enhancement",
  //     "clipping",
  //     "platform_optimizer",
  //   ].includes(service);
  // }

  constructor(studioManager: AIStudioManager) {
    this.studioManager = studioManager;
    makeAutoObservable(this);
  }

  // Job Status Management
  public handleJobStatusUpdate(data: any) {
    if (!this.studioManager.mounted) return;

    runInAction(() => {
      const jobIdx = this.studioManager.jobs.findIndex(
        (j) => j.id === data.job_id
      );
      if (jobIdx > -1) {
        this.studioManager.jobs[jobIdx].progress =
          data.progress || this.studioManager.jobs[jobIdx].progress;
        this.studioManager.jobs[jobIdx].status =
          data.status || this.studioManager.jobs[jobIdx].status;
      }
    });
  }

  public handleJobCompletion(data: any) {
    if (!this.studioManager.mounted) return;

    runInAction(() => {
      const jobIdx = this.studioManager.jobs.findIndex(
        (j) => j.id === data.job_id
      );

      if (jobIdx > -1) {
        const job = this.studioManager.jobs[jobIdx];
        job.status = "completed";
        job.progress = 100;
        job.result = data.result || data;
        job.endTime = new Date();

        // Add completion notification
        if (!job.metadata?.notificationShown) {
          this.addJobCompletionNotification(job);
          job.metadata = { ...job.metadata, notificationShown: true };
        }
      }

      this.studioManager.isProcessing = this.studioManager.jobs.some(
        (j) => j.status === "processing" || j.status === "streaming"
      );
    });
  }

  public handleJobFailure(data: any) {
    if (!this.studioManager.mounted) return;

    runInAction(() => {
      const jobIdx = this.studioManager.jobs.findIndex(
        (j) => j.id === data.job_id
      );

      if (jobIdx > -1) {
        const job = this.studioManager.jobs[jobIdx];
        job.status = "failed";
        job.error = data.error || "Job failed";
        job.endTime = new Date();

        // Add failure notification
        if (!job.metadata?.notificationShown) {
          this.addJobFailureNotification(job);
          job.metadata = { ...job.metadata, notificationShown: true };
        }
      }

      this.studioManager.isProcessing = this.studioManager.jobs.some(
        (j) => j.status === "processing" || j.status === "streaming"
      );
    });
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string) {
    const job = this.studioManager.jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Close streaming connection if exists
    if (this.studioManager.streamingConnections[jobId]) {
      this.studioManager.streamingConnections[jobId].close();
      delete this.studioManager.streamingConnections[jobId];
    }

    // Update job status
    runInAction(() => {
      job.status = "cancelled";
      job.endTime = new Date();
      job.error = "Job cancelled by user";
    });

    // Notify backend to cancel job if needed
    try {
      await fetch(`${this.studioManager.baseUrl}/ai/jobs/cancel/${jobId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await this.studioManager.tokenInfo).token}`,
        },
      });
    } catch (error) {
      console.error("Failed to notify backend of job cancellation:", error);
    }
  }

  public setNotificationHandler(handler: ReturnType<typeof useNotifications>) {
    this.notificationHandler = handler;
  }

  public getJobNavigationPath(job: ProcessingJob): string | null {
    if (job.testimonialId) {
      return `/detail/${job.testimonialId}?jobId=${job.id}`;
    }

    // All story video jobs go to ai-content page (including multi-testimonial and best_story_moments)
    if (job.service === "story_mode") {
      return `/ai-content`;
    }

    // Streaming jobs should open modal (handled differently)
    if (job.status === "streaming") {
      return null; // Modal will handle this
    }

    // Fallback to studio main page
    return `/studio`;
  }

  private getServiceDisplayName(service: string): string {
    const serviceNames = {
      content_generation: "Content Generation",
      story_mode: "Story Video",
      enhancement: "Media Enhancement",
      clipping: "Smart Clipping",
      text_polishing: "Text Enhancement",
      translation: "Translation",
      narration: "AI Narration",
      platform_optimizer: "Platform Optimization",
    };

    return serviceNames[service as keyof typeof serviceNames] || service;
  }

  // Add notification when job starts
  private addJobLaunchNotification(job: ProcessingJob) {
    if (!this.notificationHandler) return;

    // Only show notifications for processing services, not streaming services
    // if (!this.isProcessingService(job.service)) return;
    if (this.isStreamingService(job.service)) return;

    const serviceName = this.getServiceDisplayName(job.service);

    this.notificationHandler.addNotification({
      type: "info",
      title: "Job Started",
      message: `${serviceName} processing has begun`,
      service: job.service,
      serviceName: serviceName,
      duration: 4,
      action: {
        label: "View Progress",
        onClick: () => {
          const path = this.getJobNavigationPath(job);
          if (path) {
            window.location.href = path;
          }
        },
      },
    });
  }

  private triggerStreamingModal(job: ProcessingJob) {
    job.metadata = {
      ...job.metadata,
      streamingModalRequested: true,
      modalShown: false, // Will be set to true when modal opens
    };
  }

  // Add notification when job completes
  private addJobCompletionNotification(job: ProcessingJob) {
    if (!this.notificationHandler) return;

    const serviceName = this.getServiceDisplayName(job.service);

    this.notificationHandler.addNotification({
      type: "success",
      title: "Job Completed",
      message: `${serviceName} processing finished successfully`,
      service: job.service,
      serviceName: serviceName,
      duration: 6,
      action: {
        label: "View Results",
        onClick: () => {
          const path = this.getJobNavigationPath(job);
          if (path) {
            window.location.href = path;
          }
        },
      },
    });
  }

  // Add notification when job fails
  private addJobFailureNotification(job: ProcessingJob) {
    if (!this.notificationHandler) return;

    const serviceName = this.getServiceDisplayName(job.service);
    const errorMessage = job.error || "Unknown error occurred";

    this.notificationHandler.addNotification({
      type: "error",
      title: "Job Failed",
      message: `${serviceName} processing failed: ${errorMessage}`,
      service: job.service,
      serviceName: serviceName,
      duration: 8,
      action: {
        label: "Retry",
        onClick: () => {
          // Handle retry logic here
          console.log("Retry job:", job.id);
        },
      },
    });
  }

  async startJob(
    service: ServiceType,
    sourceInfo: SourceInfo,
    config?: DefaultSettings,
    serviceDefinition?: AIService
  ): Promise<string> {
    const workspaceId = workspaceHub.workspace?.id || "";
    // Validate service can be applied
    const validation = this.validateServiceCanBeApplied(service, sourceInfo);
    if (!validation.canApply) {
      throw new Error(validation.reason);
    }

    // const jobId = this.studioManager.createJobId();
    const jobId = crypto.randomUUID();

    const job: ProcessingJob = {
      id: jobId,
      serviceId: service,
      service,
      testimonialIds: [], // Not needed anymore
      workspaceId,
      status: "queued",
      progress: 0,
      startTime: new Date(),
      metadata: config,
      //  || this.studioManager.serviceConfigs[service]
      sourceInfo,
    };

    runInAction(() => {
      this.studioManager.jobs.push(job);
      this.studioManager.isProcessing = true;
      this.studioManager.error = null;
    });

    try {
      await this.processJob(job, serviceDefinition, config);

      const currentJob = this.studioManager.jobs.find((j) => j.id === jobId);
      if (currentJob) {
        if (this.isStreamingService(service)) {
          this.triggerStreamingModal(currentJob);
        } else {
          this.addJobLaunchNotification(currentJob);
        }
      }

      return jobId;
    } catch (error) {
      runInAction(() => {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.endTime = new Date();
      });
      throw error;
    }
  }

  private async processJob(
    job: ProcessingJob,
    serviceDefinition: AIService | undefined,
    config: DefaultSettings
  ) {
    console.log("serviceDefinition", serviceDefinition);
    const jobIdx = this.studioManager.jobs.findIndex((j) => j.id === job.id);
    runInAction(() => {
      if (jobIdx > -1) {
        this.studioManager.jobs[jobIdx].status =
          serviceDefinition?.supportsStreaming ? "streaming" : "processing";

        this.studioManager.jobs[jobIdx].progress = 10;

        if (serviceDefinition?.supportsStreaming) {
          this.studioManager.jobs[jobIdx].metadata = {
            ...this.studioManager.jobs[jobIdx].metadata,
            content_type: (config as ContentConfig).content_type,
          };
        }
      }
    });

    const endpoint = this.studioManager.getServiceEndpoint(job.service);
    const payload = this.buildServicePayload(job, config);
    console.log("payload", payload);
    try {
      const response = await fetch(
        `${this.studioManager.baseUrl}/ai${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await this.studioManager.tokenInfo).token}`,
          },

          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response body:", errorText);
        console.log("Response status:", response.status, response.statusText);

        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.error || errorData.message || errorData.detail;
        } catch {
          errorMessage = errorText; // Use raw text if not JSON
        }

        throw new Error(
          errorMessage || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (serviceDefinition?.supportsStreaming && response.body) {
        // Handle direct streaming response
        await this.handleDirectStreaming(job, response);
      } else {
        // Handle regular response
        const result = await response.json();
        console.log("result", result);
        if (
          serviceDefinition?.shouldQueue &&
          (result.job_id || result.data?.job_id)
        ) {
          // Queued job - will be handled by SSE
          runInAction(() => {
            if (jobIdx > -1) {
              this.studioManager.jobs[jobIdx].status = "queued";
              this.studioManager.jobs[jobIdx].id =
                result.job_id || result.data.job_id || job.id;
            }
          });
        } else {
          // Immediate result
          runInAction(() => {
            if (jobIdx > -1) {
              this.studioManager.jobs[jobIdx].status = "completed";
              this.studioManager.jobs[jobIdx].progress = 100;
              this.studioManager.jobs[jobIdx].endTime = new Date();
              this.studioManager.jobs[jobIdx].result = result;
            }

            this.studioManager.isProcessing = this.studioManager.jobs.some(
              (j) => j.status === "processing" || j.status === "streaming"
            );
          });
        }
      }
    } catch (error) {
      runInAction(() => {
        if (jobIdx > -1) {
          this.studioManager.jobs[jobIdx].status = "failed";
          this.studioManager.jobs[jobIdx].error =
            error instanceof Error ? error.message : "Service request failed";
          this.studioManager.jobs[jobIdx].endTime = new Date();
        }

        this.studioManager.isProcessing = this.studioManager.jobs.some(
          (j) => j.status === "processing" || j.status === "streaming"
        );
      });
      throw error;
    }
  }

  /**
   * Handle direct streaming response efficiently
   */
  private async handleDirectStreaming(
    job: ProcessingJob,
    response: Response
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // Add buffer for smoother display

    const jobIdx = this.studioManager.jobs.findIndex((j) => j.id === job.id);

    // Initialize streaming result
    runInAction(() => {
      this.studioManager.streamingResults[job.id] = {
        content: "",
        isComplete: false,
        isStreaming: true,
        type: job.service === "content_generation" ? "markdown" : "text",
      };
    });

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (!value) {
          continue;
        }

        let chunk;
        try {
          chunk = decoder.decode(value, { stream: true });
        } catch (decodeError) {
          console.error("Decode error:", decodeError);
          continue;
        }

        if (chunk === null || chunk === undefined) {
          continue;
        }

        // Add to buffer and update UI less frequently for smoother display
        buffer += chunk;

        // Update UI every few characters or on word boundaries for better UX
        if (buffer.length > 50 || chunk.includes(" ") || chunk.includes("\n")) {
          runInAction(() => {
            const currentResult = this.studioManager.streamingResults[job.id];
            this.studioManager.streamingResults[job.id] = {
              ...currentResult,
              content: (currentResult?.content || "") + buffer,
            };
            if (jobIdx > -1) {
              this.studioManager.jobs[jobIdx].progress = Math.min(
                job.progress + 2,
                90
              ); // Slower progress increments
            }
          });
          buffer = ""; // Clear buffer
        }
      }

      // Final buffer flush
      if (buffer) {
        runInAction(() => {
          const currentResult = this.studioManager.streamingResults[job.id];
          this.studioManager.streamingResults[job.id] = {
            ...currentResult,
            content: (currentResult?.content || "") + buffer,
          };
        });
      }

      // Mark as complete but keep the content
      runInAction(() => {
        this.studioManager.streamingResults[job.id] = {
          ...this.studioManager.streamingResults[job.id],
          isComplete: true,
          isStreaming: false,
        };
        if (jobIdx > -1) {
          this.studioManager.jobs[jobIdx].status = "completed";
          this.studioManager.jobs[jobIdx].progress = 100;
          this.studioManager.jobs[jobIdx].endTime = new Date();
          this.studioManager.jobs[jobIdx].result = {
            type: job.service === "content_generation" ? "markdown" : "text",
            content: this.studioManager.streamingResults[job.id].content,
          };
        }
        this.studioManager.isProcessing = this.studioManager.jobs.some(
          (j) => j.status === "processing" || j.status === "streaming"
        );
      });
    } catch (error) {
      console.error("Streaming error:", error);
      runInAction(() => {
        this.studioManager.streamingResults[job.id] = {
          ...this.studioManager.streamingResults[job.id],
          isComplete: true,
          isStreaming: false,
        };
        if (jobIdx > -1) {
          this.studioManager.jobs[jobIdx].status = "failed";
          this.studioManager.jobs[jobIdx].error =
            error instanceof Error ? error.message : "Streaming failed";
          this.studioManager.jobs[jobIdx].endTime = new Date();
        }
      });
      throw error;
    }
  }

  clearCompletedJobs() {
    this.studioManager.jobs = this.studioManager.jobs.filter(
      (job) =>
        job.status === "processing" ||
        job.status === "queued" ||
        job.status === "streaming"
    );
  }
  clearAllJobs() {
    this.studioManager.jobs = [];
    this.studioManager.streamingResults = {};
    this.studioManager.isProcessing = false;

    // Close all streaming connections
    Object.values(this.studioManager.streamingConnections).forEach(
      (connection) => {
        connection.close();
      }
    );
    this.studioManager.streamingConnections = {};
  }

  // Computed getters
  get activeJobs() {
    return this.studioManager.jobs.filter(
      (job) =>
        job.status === "processing" ||
        job.status === "queued" ||
        job.status === "streaming"
    );
  }

  get completedJobs() {
    return this.studioManager.jobs.filter((job) => job.status === "completed");
  }

  get failedJobs() {
    return this.studioManager.jobs.filter((job) => job.status === "failed");
  }

  get jobStats() {
    return {
      total: this.studioManager.jobs.length,
      active: this.activeJobs.length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
    };
  }

  private buildServicePayload(
    job: ProcessingJob,
    config: DefaultSettings
  ): Record<string, any> {
    // const config = this.studioManager.serviceConfigs[job.service] || {};
    const source = this.buildSourceParameter(job.sourceInfo);
    const basePayload = {
      workspace_id: job.workspaceId,
      ...config,
      source,
      id: job.id,
    } as any;

    if (job.sourceInfo.type === "best_story_moments") {
      return basePayload;
    }

    // Build source parameter for backend

    // Service-specific payload modifications
    switch (job.service) {
      case "clipping":
        return {
          ...basePayload,
          testimonial_id: job.sourceInfo.data, // For clipping, data is testimonial ID
          media_url: job.metadata?.media_url,
        };

      case "enhancement":
        if (job.sourceInfo.type === "testimonial") {
          return {
            ...basePayload,
            testimonial_id: job.sourceInfo.data,
            media_url: job.metadata?.media_url,
          };
        } else {
          return {
            ...basePayload,
            media_url: job.metadata?.media_url,
            // For artifacts, media_url should come from artifact data
          };
        }

      case "platform_optimizer":
        // Backend automatically determines text vs video optimization
        return {
          ...basePayload,
          media_url: job.metadata?.media_url,
          ...(job.sourceInfo.type === "testimonial"
            ? {
                testimonial_id: job.sourceInfo.data,
              }
            : {}),
        };

      case "story_mode":
        if (job.sourceInfo.type === "clips") {
          return {
            ...basePayload,
            clip_sources: job.sourceInfo.data, // Pass the clips data
            media_url: job.metadata?.media_url,
          };
        }
        return {
          ...basePayload,
          testimonial_segments: [{ testimonial_id: job.sourceInfo.data }],
        };

      case "narration":
        return {
          ...basePayload,
          // artifact_id: job.metadata?.text, // TODO pass artifact id
          ...(job.sourceInfo.type === "testimonial"
            ? {
                testimonial_id: job.sourceInfo.data,
              }
            : {}),
        };

      default:
        return basePayload;
    }
  }

  // Helper to build source parameter for backend
  private buildSourceParameter(sourceInfo: SourceInfo): any {
    switch (sourceInfo.type) {
      case "testimonial":
        return {
          type: "testimonial",
          data: sourceInfo.data, // testimonial ID
        };

      case "artifact":
        return {
          type: "artifact",
          data: sourceInfo.data, // artifact ID
          from: sourceInfo.from,
          raw_data: sourceInfo.raw_data,
          parent_testimonial_id: sourceInfo.parentTestimonialId,
        };

      case "clip":
        return {
          type: "clip",
          data: sourceInfo.data, // { ArtifactID, ClipID }
          raw_data: sourceInfo.raw_data,
          parent_testimonial_id: sourceInfo.parentTestimonialId,
        };

      case "clips":
        return {
          type: "clips",
          data: sourceInfo.data, // Array of { ArtifactID, ClipID }
          raw_data: sourceInfo.raw_data,
          parent_testimonial_id: sourceInfo.parentTestimonialId,
        };

      case "best_story_moments":
        return {
          type: sourceInfo.type,
        };

      case "no_source":
      default:
        return {
          type: "no_source",
          data: null,
        };
    }
  }

  determineSourceInfo(
    service: ServiceType,
    selectedTestimonials: string[],
    selectedArtifacts?: string[],
    artifactData?: any
  ): SourceInfo {
    // Services that support batch processing with multiple testimonials
    const batchSupportedServices = [
      "content_generation",
      "text_polishing",
      "translation",
    ];
    const streamTypes = ["content_generation", "text_polishing", "translation"];
    const isStreamType = streamTypes.includes(service);
    const supportsBatch = batchSupportedServices.includes(service);

    if (isStreamType) {
      if (selectedArtifacts && selectedArtifacts.length > 0) {
        return {
          type: "artifact",
          data: supportsBatch ? selectedArtifacts : selectedArtifacts[0],
        };
      } else {
        return {
          type: "testimonial",
          data: supportsBatch ? selectedTestimonials : selectedTestimonials[0],
        };
      }
    }

    if (artifactData) {
      if (artifactData.type === "clips") {
        console.log("artifactData", artifactData);
        return {
          type: "clips",
          from: artifactData.from,
          raw_data: artifactData.data,
          data: artifactData.data.map((clip: any) => ({
            ArtifactID: clip.artifactId,
            ClipID: clip.id,
          })),
          appliedServices: this.extractAppliedServices(artifactData.data),
          parentTestimonialId: artifactData.parentTestimonialId,
        };
      } else if (artifactData.data?.id) {
        const artifact_id = artifactData.data?.artifactId;
        const clip_id = artifactData.data?.id;
        const type = artifact_id && clip_id ? "clip" : "artifact";
        const data =
          type === "clip" ? { clip_id, artifact_id } : artifactData.data?.id;

        return {
          type,
          data,
          from: artifactData.from,
          raw_data: artifactData.data,
          appliedServices: artifactData.data.metadata?.applied_services || [],
          parentTestimonialId: artifactData.parentTestimonialId,
        };
      }
    }

    if (selectedArtifacts && selectedArtifacts.length > 0) {
      if (selectedArtifacts.length === 1) {
        return {
          type: "artifact",
          data: selectedArtifacts[0],
          appliedServices: [],
        };
      } else {
        return {
          type: "clips",
          data: selectedArtifacts.map((id) => ({ ArtifactID: id, ClipID: id })),
          appliedServices: [],
        };
      }
    }

    // Default to testimonial source
    if (selectedTestimonials.length > 0) {
      // Services that can handle multiple testimonials
      const batchCapableServices = [
        "content_generation",
        "text_polishing",
        "translation",
      ];
      const supportsBatch = batchCapableServices.includes(service);

      return {
        type: "testimonial",
        data: supportsBatch ? selectedTestimonials : selectedTestimonials[0],
        appliedServices: [],
      };
    }

    return {
      type: "no_source",
      data: null,
      appliedServices: [],
    };
  }

  private extractAppliedServices(artifacts: any[]): ServiceType[] {
    const services = new Set<ServiceType>();
    artifacts.forEach((artifact) => {
      if (artifact.processing_type) {
        services.add(artifact.processing_type as ServiceType);
      }
    });
    return Array.from(services);
  }

  // Enhanced service validation
  private validateServiceCanBeApplied(
    service: ServiceType,
    sourceInfo: SourceInfo
  ): { canApply: boolean; reason?: string } {
    const appliedServices = sourceInfo.appliedServices || [];

    // Prevent duplicate services
    if (appliedServices.includes(service)) {
      return {
        canApply: false,
        reason: `${service} has already been applied to this content`,
      };
    }

    // Service-specific validations
    switch (service) {
      case "clipping":
        // Clipping can only be done on original testimonials
        if (sourceInfo.type !== "testimonial") {
          return {
            canApply: false,
            reason: "Clipping can only be performed on original testimonials",
          };
        }
        break;

      case "enhancement":
        // Enhancement needs video content
        if (sourceInfo.type === "no_source") {
          return {
            canApply: false,
            reason: "Enhancement requires video content",
          };
        }
        break;

      case "platform_optimizer":
        // Platform optimization can work on any content
        break;

      case "narration":
        // Narration can work on text or processed content
        break;

      case "story_mode":
        // Story mode can work on clips or original content
        break;

      default:
        break;
    }

    return { canApply: true };
  }
  resetJobs() {
    this.clearAllJobs();
  }
}
