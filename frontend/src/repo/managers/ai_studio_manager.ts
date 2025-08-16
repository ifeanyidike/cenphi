import { makeAutoObservable, runInAction } from "mobx";

export type ServiceType =
  | "enhancement"
  | "story_mode"
  | "clipping"
  | "platform_optimizer"
  | "noise_removal"
  | "content_generator"
  | "text_polishing"
  | "translation"
  | "narration";

export type HighlightType =
  | "general"
  | "emotional"
  | "thematic"
  | "before_after"
  | "recommendation"
  | "metrics"
  | "results"
  | "solution"
  | "problem";

export interface ProcessingJob {
  id: string;
  service: ServiceType;
  testimonialIds: string[];
  status:
    | "pending"
    | "queued"
    | "processing"
    | "streaming"
    | "completed"
    | "failed"
    | "cancelled";
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
  isStreaming?: boolean;
}

export interface StreamingResult {
  content: string;
  isComplete: boolean;
  isStreaming: boolean;
  type: "markdown" | "text" | "json";
}

export interface TestimonialData {
  id: string;
  customer_name: string;
  company: string;
  content_preview: string;
  media_type: "video" | "text";
  rating: number;
  duration?: number;
  created_at: string;
  sentiment_score: number;
  highlight_count?: number;
  thumbnail?: string;
}

export interface ServiceConfig {
  enhancement: {
    quality: "professional" | "high" | "standard";
    customEnhancements: string[];
    addBranding: boolean;
    removeNoise: boolean;
    addBackgroundMusic: boolean;
    logoUrl?: string;
    watermarkText?: string;
    watermarkPosition:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
    backgroundMusicUrl?: string;
    backgroundMusicVolume: number;
    colorEnhancement: boolean;
    stabilization: boolean;
    sharpening: boolean;
    lightingEnhancement: boolean;
  };
  story_mode: {
    highlightType: HighlightType;
    addIntro: boolean;
    addOutro: boolean;
    introText?: string;
    outroText?: string;
    brandColor?: string;
    voiceOverEnabled: boolean;
    voiceOverText?: string;
    voiceType: "male" | "female" | "neutral";
    backgroundMusic: boolean;
    backgroundMusicUrl?: string;
    removeNoise: boolean;
    transitionStyle: "fade" | "cut" | "slide" | "zoom";
    maxDuration: number;
    includeTimestamps: boolean;
  };
  clipping: {
    highlightType: HighlightType;
    maxClips: number;
    clipDuration: number;
    addBranding: boolean;
    backgroundMusic: boolean;
    removeNoise: boolean;
    clipNamingPattern: string;
    includeSubtitles: boolean;
    autoGenerateTitles: boolean;
    exportFormat: "mp4" | "mov" | "webm";
  };
  platform_optimizer: {
    platforms: (
      | "instagram_reel"
      | "instagram_story"
      | "youtube_short"
      | "tiktok"
      | "linkedin_video"
      | "twitter_video"
    )[];
    contentAwareCropping: boolean;
    addCaptions: boolean;
    captionStyle: "modern" | "classic" | "bold" | "minimal";
    backgroundMusic: boolean;
    removeNoise: boolean;
    enhanceAfterOptimization: boolean;
    addHashtags: boolean;
    customAspectRatio?: string;
    maxFileSize?: number;
  };
  noise_removal: {
    intensity: "light" | "medium" | "aggressive";
    preserveVoice: boolean;
    removeEcho: boolean;
    enhanceClarity: boolean;
    normalizeVolume: boolean;
    outputFormat: "mp3" | "wav" | "aac";
  };
  content_generator: {
    contentTypes: (
      | "email"
      | "blog"
      | "case_study"
      | "sales_deck"
      | "whitepaper"
      | "social_posts"
      | "press_release"
      | "landing_page"
      | "testimonial_wall"
    )[];
    testimonialIds: string[];
    customRequirement?: string;
    autoSelectPositive: boolean;
    tone: "professional" | "casual" | "persuasive" | "technical" | "friendly";
    targetAudience: string;
    includeMetrics: boolean;
    brandVoice?: string;
    wordCountTarget?: number;
    seoOptimization: boolean;
    includeCTA: boolean;
    seoKeywords?: string;
    focusKeyword?: string;
  };
  text_polishing: {
    preserveAuthenticity: boolean;
    targetStyle:
      | "professional"
      | "casual"
      | "marketing"
      | "technical"
      | "conversational";
    customPrompt?: string;
    grammarCorrection: boolean;
    toneAdjustment: boolean;
    lengthOptimization: "expand" | "condense" | "maintain";
    industryTerminology: boolean;
    tone: "neutral" | "enthusiastic" | "formal" | "friendly" | "persuasive";
  };
  translation: {
    targetLanguages: string[];
    preserveTone: boolean;
    culturalAdaptation: boolean;
    formalityLevel: "formal" | "informal" | "neutral";
    includeOriginal: boolean;
    localization: boolean;
  };
  narration: {
    voiceProvider: "elevenlabs" | "openai";
    voiceId: string;
    voiceName: string;
    speed: number;
    pitch: number;
    emotion: "neutral" | "happy" | "professional" | "energetic" | "calm";
    addBackgroundMusic: boolean;
    backgroundMusicVolume: number;
    outputFormat: "mp3" | "wav" | "aac";
    enhanceAudio: boolean;
    selectedMusic?: string;
    customMusicUrl?: string;
    musicVolume: number;
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: "elevenlabs" | "openai";
  gender: "male" | "female" | "neutral";
  accent: string;
  description: string;
  previewUrl?: string;
  category: "professional" | "casual" | "energetic" | "calm";
}

export interface ServicePreset {
  id: string;
  name: string;
  config: any;
  createdAt: Date;
}

export interface AIService {
  id: ServiceType;
  title: string;
  description: string;
  icon: any;
  category: string;
  estimatedTime: string;
  complexity: string;
  features: string[];
  gradient: string;
  isQueued: boolean;
  supportsStreaming: boolean;
  endpoint: string;
  defaultSettings: any;
}

// API Configuration
const API_BASE_URL = "http://localhost:8081/api";

export class AIStudioManager {
  public activeService: ServiceType | null = null;
  public selectedTestimonials: string[] = [];
  public jobs: ProcessingJob[] = [];
  public streamingResults: Record<string, StreamingResult> = {};
  public isProcessing = false;
  public serviceConfigs: Partial<ServiceConfig> = {};
  public savedPresets: Record<string, ServicePreset[]> = {};
  public defaultPresets: Record<string, ServicePreset> = {};
  public previewData: Record<string, any> = {};
  public error: string | null = null;
  public connectionStatus: "connected" | "disconnected" | "error" =
    "disconnected";

  // SSE and streaming connections
  private eventSource: EventSource | null = null;
  private streamingConnections: Record<string, EventSource> = {};
  private mounted = true;

  constructor() {
    this.initializeDefaultConfigs();
    this.initializeSSE();
    makeAutoObservable(this);
  }

  private initializeDefaultConfigs() {
    this.serviceConfigs = {
      enhancement: {
        quality: "professional",
        customEnhancements: [],
        addBranding: true,
        removeNoise: true,
        addBackgroundMusic: false,
        watermarkPosition: "bottom-right",
        backgroundMusicVolume: 20,
        colorEnhancement: true,
        stabilization: true,
        sharpening: true,
        lightingEnhancement: true,
      },
      story_mode: {
        highlightType: "general",
        addIntro: true,
        addOutro: true,
        voiceOverEnabled: false,
        voiceType: "neutral",
        backgroundMusic: true,
        removeNoise: true,
        transitionStyle: "fade",
        maxDuration: 60,
        includeTimestamps: false,
      },
      clipping: {
        highlightType: "general",
        maxClips: 5,
        clipDuration: 15,
        addBranding: true,
        backgroundMusic: false,
        removeNoise: true,
        clipNamingPattern: "Clip_{index}_{highlight_type}",
        includeSubtitles: true,
        autoGenerateTitles: true,
        exportFormat: "mp4",
      },
      platform_optimizer: {
        platforms: ["instagram_reel"],
        contentAwareCropping: true,
        addCaptions: true,
        captionStyle: "modern",
        backgroundMusic: false,
        removeNoise: true,
        enhanceAfterOptimization: false,
        addHashtags: true,
      },
      noise_removal: {
        intensity: "medium",
        preserveVoice: true,
        removeEcho: true,
        enhanceClarity: true,
        normalizeVolume: true,
        outputFormat: "mp3",
      },
      content_generator: {
        contentTypes: ["email"],
        testimonialIds: [],
        autoSelectPositive: true,
        tone: "professional",
        targetAudience: "potential customers",
        includeMetrics: true,
        seoOptimization: false,
        includeCTA: true,
      },
      text_polishing: {
        preserveAuthenticity: true,
        targetStyle: "professional",
        grammarCorrection: true,
        toneAdjustment: false,
        lengthOptimization: "maintain",
        industryTerminology: false,
        tone: "neutral",
      },
      translation: {
        targetLanguages: ["es"],
        preserveTone: true,
        culturalAdaptation: true,
        formalityLevel: "neutral",
        includeOriginal: false,
        localization: true,
      },
      narration: {
        voiceProvider: "elevenlabs",
        voiceId: "rachel",
        voiceName: "Rachel",
        speed: 1.0,
        pitch: 1.0,
        emotion: "professional",
        addBackgroundMusic: false,
        backgroundMusicVolume: 15,
        outputFormat: "mp3",
        enhanceAudio: true,
        musicVolume: 15,
      },
    };
  }

  // SSE Connection Management
  private initializeSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${API_BASE_URL}/jobs/stream`);

    this.eventSource.onopen = () => {
      console.log("✅ SSE connection established");
      runInAction(() => {
        this.connectionStatus = "connected";
      });
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE event received:", data);

        if (data.job_id && data.service_id) {
          this.handleJobStatusUpdate(data.service_id, data);
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    this.eventSource.addEventListener("job_completed", (event) => {
      try {
        const data = JSON.parse((event as any).data);
        console.log("✅ Job completed:", data);
        this.handleJobCompletion(data.service_id, data);
      } catch (error) {
        console.error("Error parsing job completion data:", error);
      }
    });

    this.eventSource.addEventListener("job_failed", (event) => {
      try {
        const data = JSON.parse((event as any).data);
        console.log("❌ Job failed:", data);
        this.handleJobFailure(data.service_id, data);
      } catch (error) {
        console.error("Error parsing job failure data:", error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
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

  // Streaming Connection Management
  private initializeStreamingConnection(serviceId: string, endpoint: string) {
    if (this.streamingConnections[serviceId]) {
      this.streamingConnections[serviceId].close();
    }

    const streamingEventSource = new EventSource(
      `${API_BASE_URL}${endpoint}/stream`
    );
    this.streamingConnections[serviceId] = streamingEventSource;

    streamingEventSource.onopen = () => {
      console.log(`✅ Streaming connection established for ${serviceId}`);
    };

    streamingEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📨 Streaming data received for ${serviceId}:`, data);

        runInAction(() => {
          if (data.type === "chunk") {
            this.streamingResults[serviceId] = {
              content:
                (this.streamingResults[serviceId]?.content || "") +
                data.content,
              isComplete: false,
              isStreaming: true,
              type: data.content_type || "text",
            };
          } else if (data.type === "complete") {
            this.streamingResults[serviceId] = {
              ...this.streamingResults[serviceId],
              isComplete: true,
              isStreaming: false,
            };

            // Update job status
            const job = this.jobs.find((j) => j.service === serviceId);
            if (job) {
              job.status = "completed";
              job.progress = 100;
              job.endTime = new Date();
              job.result = this.streamingResults[serviceId].content;
            }
          } else if (data.type === "error") {
            this.streamingResults[serviceId] = {
              ...this.streamingResults[serviceId],
              isComplete: true,
              isStreaming: false,
            };

            // Update job with error
            const job = this.jobs.find((j) => j.service === serviceId);
            if (job) {
              job.status = "failed";
              job.error = data.error || "Streaming error occurred";
              job.endTime = new Date();
            }
          }
        });
      } catch (error) {
        console.error(`Error parsing streaming data for ${serviceId}:`, error);
      }
    };

    streamingEventSource.onerror = (error) => {
      console.error(`❌ Streaming connection error for ${serviceId}:`, error);
      runInAction(() => {
        this.streamingResults[serviceId] = {
          ...this.streamingResults[serviceId],
          isComplete: true,
          isStreaming: false,
        };
      });
    };

    return streamingEventSource;
  }

  // Job Status Management
  private handleJobStatusUpdate(serviceId: string, data: any) {
    if (!this.mounted) return;

    runInAction(() => {
      const job = this.jobs.find((j) => j.service === serviceId);
      if (job) {
        Object.assign(job, data);
        job.progress = data.progress || job.progress;
        job.status = data.status || job.status;
      }
    });
  }

  private handleJobCompletion(serviceId: string, data: any) {
    if (!this.mounted) return;

    runInAction(() => {
      const job = this.jobs.find((j) => j.service === serviceId);
      if (job) {
        job.status = "completed";
        job.progress = 100;
        job.result = data.result || data;
        job.endTime = new Date();
      }
      this.isProcessing = this.jobs.some(
        (j) => j.status === "processing" || j.status === "streaming"
      );
    });
  }

  private handleJobFailure(serviceId: string, data: any) {
    if (!this.mounted) return;

    runInAction(() => {
      const job = this.jobs.find((j) => j.service === serviceId);
      if (job) {
        job.status = "failed";
        job.error = data.error || "Job failed";
        job.endTime = new Date();
      }
      this.isProcessing = this.jobs.some(
        (j) => j.status === "processing" || j.status === "streaming"
      );
    });
  }

  // Service Selection
  setActiveService(service: ServiceType | null) {
    this.activeService = service;
    this.error = null;
  }

  // Testimonial Selection
  selectTestimonial(testimonialId: string) {
    if (!this.selectedTestimonials.includes(testimonialId)) {
      this.selectedTestimonials.push(testimonialId);
    }
  }

  deselectTestimonial(testimonialId: string) {
    this.selectedTestimonials = this.selectedTestimonials.filter(
      (id) => id !== testimonialId
    );
  }

  toggleTestimonialSelection(testimonialId: string) {
    if (this.selectedTestimonials.includes(testimonialId)) {
      this.deselectTestimonial(testimonialId);
    } else {
      this.selectTestimonial(testimonialId);
    }
  }

  selectAllTestimonials(testimonialIds: string[]) {
    this.selectedTestimonials = [
      ...new Set([...this.selectedTestimonials, ...testimonialIds]),
    ];
  }

  clearTestimonialSelection() {
    this.selectedTestimonials = [];
  }

  // Service Configuration
  updateServiceConfig<T extends ServiceType>(
    service: T,
    config: Partial<ServiceConfig[T]>
  ) {
    this.serviceConfigs[service] = {
      ...this.serviceConfigs[service],
      ...config,
    } as ServiceConfig[T];
  }

  getServiceConfig<T extends ServiceType>(
    service: T
  ): ServiceConfig[T] | undefined {
    return this.serviceConfigs[service] as ServiceConfig[T];
  }

  // Preset Management
  savePreset(serviceId: string, preset: ServicePreset) {
    if (!this.savedPresets[serviceId]) {
      this.savedPresets[serviceId] = [];
    }
    this.savedPresets[serviceId].push(preset);
  }

  deletePreset(serviceId: string, presetId: string) {
    if (this.savedPresets[serviceId]) {
      this.savedPresets[serviceId] = this.savedPresets[serviceId].filter(
        (p) => p.id !== presetId
      );
    }
  }

  setDefaultPreset(serviceId: string, preset: ServicePreset) {
    this.defaultPresets[serviceId] = preset;
  }

  // Job Management
  private createJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startJob(
    service: ServiceType,
    testimonialIds: string[],
    config?: any,
    serviceDefinition?: AIService
  ): Promise<string> {
    const jobId = this.createJobId();

    const job: ProcessingJob = {
      id: jobId,
      service,
      testimonialIds,
      status: "pending",
      progress: 0,
      startTime: new Date(),
      metadata: config || this.serviceConfigs[service],
    };

    runInAction(() => {
      this.jobs.push(job);
      this.isProcessing = true;
      this.error = null;
    });

    try {
      await this.processJob(job, serviceDefinition);
      return jobId;
    } catch (error) {
      runInAction(() => {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.endTime = new Date();
        this.isProcessing = this.jobs.some(
          (j) => j.status === "processing" || j.status === "streaming"
        );
      });
      throw error;
    }
  }

  private async processJob(job: ProcessingJob, serviceDefinition?: AIService) {
    runInAction(() => {
      job.status = serviceDefinition?.supportsStreaming
        ? "streaming"
        : serviceDefinition?.isQueued
          ? "queued"
          : "processing";
      job.progress = 10;
    });

    const endpoint = this.getServiceEndpoint(job.service);
    const payload = this.buildServicePayload(job);

    try {
      if (serviceDefinition?.supportsStreaming) {
        // Set up streaming
        runInAction(() => {
          this.streamingResults[job.service] = {
            content: "",
            isComplete: false,
            isStreaming: true,
            type: job.service === "content_generator" ? "markdown" : "text",
          };
        });

        // Initialize streaming connection
        this.initializeStreamingConnection(job.service, endpoint);

        // Make the API call
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: "test-workspace-id", // Replace with actual workspace ID
            job_id: job.id,
            ...payload,
          }),
        });

        if (!response.ok) {
          throw new Error(`Service request failed: ${response.statusText}`);
        }

        // Handle streaming response
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            runInAction(() => {
              this.streamingResults[job.service] = {
                ...this.streamingResults[job.service],
                content:
                  (this.streamingResults[job.service]?.content || "") + chunk,
              };
            });
          }

          // Mark as complete
          runInAction(() => {
            this.streamingResults[job.service] = {
              ...this.streamingResults[job.service],
              isComplete: true,
              isStreaming: false,
            };
            job.status = "completed";
            job.progress = 100;
            job.endTime = new Date();
            job.result = this.streamingResults[job.service].content;
          });
        }
      } else {
        // Non-streaming request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: "test-workspace-id", // Replace with actual workspace ID
            job_id: job.id,
            ...payload,
          }),
        });

        if (!response.ok) {
          throw new Error(`Service request failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (serviceDefinition?.isQueued) {
          // Queued job - will be handled by SSE
          runInAction(() => {
            job.status = "queued";
            job.id = result.job_id || job.id;
          });
        } else {
          // Immediate result
          runInAction(() => {
            job.status = "completed";
            job.progress = 100;
            job.endTime = new Date();
            job.result = result;
            this.isProcessing = this.jobs.some(
              (j) => j.status === "processing" || j.status === "streaming"
            );
          });
        }
      }
    } catch (error) {
      runInAction(() => {
        job.status = "failed";
        job.error =
          error instanceof Error ? error.message : "Service request failed";
        job.endTime = new Date();
        this.isProcessing = this.jobs.some(
          (j) => j.status === "processing" || j.status === "streaming"
        );
      });
      throw error;
    }
  }

  private getServiceEndpoint(service: ServiceType): string {
    const endpoints = {
      enhancement: "/enhance-media",
      story_mode: "/story-video",
      clipping: "/smart-clips",
      platform_optimizer: "/optimize-platform",
      noise_removal: "/transcribe",
      content_generator: "/generate-content",
      text_polishing: "/polish",
      translation: "/translate",
      narration: "/generate-narration",
    };

    return endpoints[service];
  }

  private buildServicePayload(job: ProcessingJob): Record<string, any> {
    const config = this.serviceConfigs[job.service] || {};

    const basePayload = {
      testimonial_ids: job.testimonialIds,
      service_type: job.service,
      ...config,
    };

    // Add service-specific payload modifications
    switch (job.service) {
      case "content_generator":
        return {
          ...basePayload,
          testimonial_ids: job.testimonialIds,
        };

      case "platform_optimizer":
        return {
          ...basePayload,
          platforms: (config as any).platforms || ["instagram_reel"],
        };

      case "narration":
        return {
          ...basePayload,
          voice_config: {
            provider: (config as any).voiceProvider,
            voice_id: (config as any).voiceId,
            voice_name: (config as any).voiceName,
            speed: (config as any).speed,
            pitch: (config as any).pitch,
            emotion: (config as any).emotion,
          },
        };

      default:
        return basePayload;
    }
  }

  // Job Status Management
  cancelJob(jobId: string) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job && (job.status === "processing" || job.status === "streaming")) {
      runInAction(() => {
        job.status = "cancelled";
        job.endTime = new Date();
        this.isProcessing = this.jobs.some(
          (j) => j.status === "processing" || j.status === "streaming"
        );
      });

      // Close streaming connection if exists
      if (this.streamingConnections[job.service]) {
        this.streamingConnections[job.service].close();
        delete this.streamingConnections[job.service];
      }
    }
  }

  removeJob(jobId: string) {
    this.jobs = this.jobs.filter((job) => job.id !== jobId);
  }

  retryJob(jobId: string) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      // Start a new job with the same configuration
      this.startJob(job.service, job.testimonialIds, job.metadata);
      // Remove the failed job
      this.removeJob(jobId);
    }
  }

  clearCompletedJobs() {
    this.jobs = this.jobs.filter(
      (job) =>
        job.status === "processing" ||
        job.status === "pending" ||
        job.status === "streaming"
    );
  }

  clearAllJobs() {
    this.jobs = [];
    this.streamingResults = {};
    this.isProcessing = false;

    // Close all streaming connections
    Object.values(this.streamingConnections).forEach((connection) => {
      connection.close();
    });
    this.streamingConnections = {};
  }

  // Computed getters
  get activeJobs() {
    return this.jobs.filter(
      (job) =>
        job.status === "processing" ||
        job.status === "pending" ||
        job.status === "streaming"
    );
  }

  get completedJobs() {
    return this.jobs.filter((job) => job.status === "completed");
  }

  get failedJobs() {
    return this.jobs.filter((job) => job.status === "failed");
  }

  get hasSelectedTestimonials() {
    return this.selectedTestimonials.length > 0;
  }

  get canStartJob() {
    return this.hasSelectedTestimonials && !this.isProcessing;
  }

  get jobStats() {
    return {
      total: this.jobs.length,
      active: this.activeJobs.length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
    };
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

  // Utility
  reset() {
    this.activeService = null;
    this.selectedTestimonials = [];
    this.previewData = {};
    this.error = null;
    this.initializeDefaultConfigs();
  }

  resetJobs() {
    this.clearAllJobs();
  }
}

// Export singleton instance
export const aiStudioManager = new AIStudioManager();
