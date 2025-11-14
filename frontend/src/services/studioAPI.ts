import { authStore } from "@/stores/authStore";
import { workspaceHub } from "@/repo/workspace_hub";
import {
  HighlightMoment,
  AIOrderingRequest,
  AIOrderingResponse,
} from "@/types/ai-service";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export interface SuggestedClip {
  id: number;
  url: string;
  name: string;
  thumbnail: string;
  duration: number;
  pexels_id: number;
  search_keyword: string;
  relevance_explanation: string;
  relevance_score: number;
  media_type: "video" | "image";
}

export interface AIBrollSuggestionRequest {
  transcript_text: string;
  video_duration: number;
  max_clips?: number;
  orientation?: string;
}

export interface AIBrollSuggestionResponse {
  suggested_clips: SuggestedClip[];
  search_keywords: string[];
  themes: string[];
  ai_analysis: string;
  duration_budget: number; // Max total B-roll duration allowed (30% of video)
  total_duration: number; // Total duration of suggested clips
  budget_percentage: number; // Percentage of video that B-roll can occupy (0.30 = 30%)
}

export interface CreateSessionRequest {
  testimonial_id?: string;
  workspace_id: string;
  pipeline_type:
    | "platform_optimization"
    | "clipping"
    | "story_video"
    | "custom_pipeline";
  selected_stages?: string[];
  auto_proceed: boolean;
  config?: {
    moments?: HighlightMoment[]; // NEW: Full moment objects
    [key: string]: any;
  };
}

export interface CreateSessionResponse {
  session_id: string;
  testimonial_id?: string; // Testimonial ID for testimonial-based sessions
  clip_id?: string; // Clip ID for clipping sessions
  session_type: string;
  status: string;
  auto_proceed: boolean;
  created_at: string;
  stream_url: string;
  current_stage_id?: string; // Current stage being processed
  stages_reordered?: boolean; // True if backend reordered stages
  reorder_message?: string; // Human-readable message about what was reordered
}

export interface CompletedSessionResponse {
  session_id: string;
  testimonial_id?: string;
  workspace_id: string;
  session_type: string;
  status: string;
  auto_proceed: boolean;
  started_at: string;
  completed_at: string;
  stream_url: string;
  current_stage_id?: string; // Current stage being processed
}

/**
 * StudioAPI - Centralized API client for Studio session control operations
 * Uses existing backend routes for pause/resume/skip/retry
 */
export class StudioAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get authorization headers with Firebase token
   */
  private async getHeaders(): Promise<HeadersInit> {
    const tokenInfo = await authStore.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenInfo.token}`,
    };
  }

  /**
   * Create a new processing session
   * Route: POST /studio/sessions
   */
  async createSession(
    request: CreateSessionRequest
  ): Promise<CreateSessionResponse> {
    const response = await fetch(`${this.baseUrl}/studio/sessions`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to create session",
      }));
      throw new Error(error.message || "Failed to create session");
    }

    return response.json();
  }

  /**
   * Pause an active studio session
   * Route: POST /studio/sessions/{sessionID}/pause
   */
  async pauseSession(
    sessionId: string,
    pausedByUser: boolean = true
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/pause`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ paused_by_user: pausedByUser }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to pause session",
      }));
      throw new Error(error.message || "Failed to pause session");
    }
  }

  /**
   * Resume a paused studio session
   * Route: POST /studio/sessions/{sessionID}/resume
   */
  async resumeSession(
    sessionId: string,
    resumeFromStageId?: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/resume`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({
          resume_from_stage_id: resumeFromStageId || null,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to resume session",
      }));
      throw new Error(error.message || "Failed to resume session");
    }
  }

  /**
   * Skip a specific stage in the processing pipeline
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/skip
   */
  async skipStage(
    sessionId: string,
    stageId: string,
    skipReason: string = "user_manual_skip"
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/skip`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ skip_reason: skipReason }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to skip stage",
      }));
      throw new Error(error.message || "Failed to skip stage");
    }
  }

  /**
   * Retry a failed stage in the processing pipeline
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/retry
   */
  async retryStage(sessionId: string, stageId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/retry`,
      {
        method: "POST",
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to retry stage",
      }));
      throw new Error(error.message || "Failed to retry stage");
    }
  }

  /**
   * Accept a completed stage in the processing pipeline
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/accept
   */
  async acceptStage(sessionId: string, stageId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/accept`,
      {
        method: "POST",
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to accept stage",
      }));
      throw new Error(error.message || "Failed to accept stage");
    }
  }

  /**
   * Save an individual stage's result to permanent storage
   * This allows saving a specific stage without finalizing the entire session
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/save
   */
  async saveStageResult(
    sessionId: string,
    stageId: string
  ): Promise<{
    message: string;
    artifact_id: string;
    artifact_url: string;
    stage_id: string;
    saved_at: string;
    result_category: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/save`,
      {
        method: "POST",
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to save stage result",
      }));
      throw new Error(error.message || "Failed to save stage result");
    }

    return response.json();
  }

  /**
   * Select specific clips from a clipping stage
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/select-clips
   */
  async selectClips(
    sessionId: string,
    stageId: string,
    clipIds: string[]
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/select-clips`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ selected_clip_ids: clipIds }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to select clips",
      }));
      throw new Error(error.message || "Failed to select clips");
    }
  }

  /**
   * Get SSE stream URL for studio session events
   * Route: GET /studio/sessions/{sessionID}/stream
   */
  getStreamURL(sessionId: string): string {
    return `${this.baseUrl}/studio/sessions/${sessionId}/stream`;
  }

  /**
   * Get AI B-roll suggestions based on transcript
   * Route: POST /ai/suggest-broll
   */
  async suggestBroll(
    request: AIBrollSuggestionRequest
  ): Promise<AIBrollSuggestionResponse> {
    const response = await fetch(`${this.baseUrl}/ai/suggest-broll`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to get AI suggestions",
      }));
      throw new Error(
        error.message || "Failed to get AI suggestions. Please try again."
      );
    }

    return response.json();
  }

  /**
   * Get session artifacts
   * Route: GET /studio/sessions/{sessionID}/artifacts
   */
  async getSessionArtifacts(sessionId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/artifacts`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get session artifacts");
    }

    return response.json();
  }

  /**
   * Cancel a session and trigger cleanup
   * Route: POST /studio/sessions/{sessionID}/cancel
   */
  async cancelSession(sessionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/cancel`,
      {
        method: "POST",
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to cancel session",
      }));
      throw new Error(error.message || "Failed to cancel session");
    }
  }

  /**
   * Regenerate text optimization for a stage with optional custom prompt
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/regenerate-text
   */
  async regenerateTextOptimization(
    sessionId: string,
    stageId: string,
    customPrompt?: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/regenerate-text`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ custom_prompt: customPrompt || "" }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to regenerate text",
      }));
      throw new Error(error.message || "Failed to regenerate text");
    }
  }

  /**
   * Update stage configuration (music, branding, etc.)
   * Route: POST /studio/sessions/{sessionID}/stages/{stageID}/config
   */
  async updateStageConfig(
    sessionId: string,
    stageId: string,
    config: Record<string, any>
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/stages/${stageId}/config`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify(config),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to update stage configuration",
      }));
      throw new Error(error.message || "Failed to update stage configuration");
    }
  }

  /**
   * Check if a session exists and get its status
   * Route: GET /studio/sessions/{sessionID}/status
   * Returns null if session doesn't exist or has been cancelled/expired
   */
  async checkSessionStatus(
    sessionId: string
  ): Promise<{ status: string; exists: boolean } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/studio/sessions/${sessionId}/status`,
        {
          headers: await this.getHeaders(),
        }
      );

      if (!response.ok) {
        // 404 or other errors mean session doesn't exist
        return null;
      }

      const data = await response.json();
      return {
        status: data.status,
        exists: true,
      };
    } catch (error) {
      // Network error or session not found
      console.warn(`[StudioAPI] Failed to check session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get active sessions for a testimonial or workspace
   * Route: GET /studio/sessions?testimonial_id={id} OR GET /studio/sessions?workspace_id={id}
   */
  async getActiveSessions(params: {
    testimonialId?: string;
    workspaceId?: string;
  }): Promise<{
    sessions: CreateSessionResponse[];
    count: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.testimonialId) {
      queryParams.append("testimonial_id", params.testimonialId);
    }
    if (params.workspaceId) {
      queryParams.append("workspace_id", params.workspaceId);
    }

    const response = await fetch(
      `${this.baseUrl}/studio/sessions?${queryParams.toString()}`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to get active sessions",
      }));
      throw new Error(error.message || "Failed to get active sessions");
    }

    return response.json();
  }

  /**
   * Get completed sessions for a workspace (for history)
   * Returns up to 50 sessions completed within the last 24 hours
   * Route: GET /studio/sessions/completed?workspace_id={id}
   */
  async getCompletedSessions(workspaceId: string): Promise<{
    sessions: CompletedSessionResponse[];
    count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/completed?workspace_id=${workspaceId}`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to get completed sessions",
      }));
      throw new Error(error.message || "Failed to get completed sessions");
    }

    return response.json();
  }

  /**
   * Finalize a session - save/discard/replace artifacts
   * Route: POST /studio/sessions/{sessionID}/finalize
   */
  async finalizeSession(
    sessionId: string,
    action: "save" | "discard" | "replace",
    options?: {
      preserveSources?: boolean;
      artifactMetadata?: Record<string, string>;
      optimizedText?: string;
    }
  ): Promise<{
    session_id: string;
    action: string;
    artifacts_created: number;
    final_artifact_ids: string[];
    message: string;
    finalized_at: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/studio/sessions/${sessionId}/finalize`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({
          action,
          preserve_sources: options?.preserveSources ?? false,
          artifact_metadata: options?.artifactMetadata,
          optimized_text: options?.optimizedText,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to finalize session",
      }));
      throw new Error(error.message || "Failed to finalize session");
    }

    return response.json();
  }

  /**
   * Generate highlights by specific type
   * Route: POST /ai/highlights/by-type
   */
  async generateHighlightsByType(
    testimonialId: string,
    text: string,
    segments: any[],
    highlightType: string,
    artifactId?: string,
    customPrompt?: string
  ): Promise<any[]> {
    const workspaceId = workspaceHub.workspace?.id;
    if (!workspaceId) {
      throw new Error("No workspace selected");
    }

    const response = await fetch(`${this.baseUrl}/ai/highlights/by-type`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({
        workspace_id: workspaceId,
        testimonial_id: testimonialId,
        text,
        segments,
        highlight_type: highlightType,
        prompt: customPrompt || "",
        artifact_id: artifactId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate highlights: ${error}`);
    }

    return response.json();
  }

  /**
   * Get transcript segments for a testimonial (lazy-loaded)
   * Route: GET /api/testimonials/{id}/transcript-segments
   */
  async getTranscriptSegments(testimonialId: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/testimonials/${testimonialId}/transcript-segments`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to get transcript segments",
      }));
      throw new Error(error.message || "Failed to get transcript segments");
    }

    return response.json();
  }

  /**
   * Get video duration from transcript segments (lazy-loaded)
   * Route: GET /api/testimonials/{id}/duration
   */
  async getTestimonialDuration(testimonialId: string): Promise<{
    duration: number;
    segment_count: number;
    has_segments: boolean;
  }> {
    const response = await fetch(
      `${this.baseUrl}/testimonials/${testimonialId}/duration`,
      {
        headers: await this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to get duration",
      }));
      throw new Error(error.message || "Failed to get duration");
    }

    return response.json();
  }

  /**
   * Order moments using AI
   * Route: POST /ai/order-moments
   *
   * NOTE: This can be implemented on backend or as frontend-only logic initially
   * For frontend-only, this method simulates AI ordering using engagement scores
   */
  async orderMoments(request: AIOrderingRequest): Promise<AIOrderingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/order-moments`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to order moments",
        }));
        throw new Error(error.message || "Failed to order moments");
      }

      return response.json();
    } catch (error) {
      console.error("AI ordering failed:", error);

      // Fallback to simple ordering if API fails
      const orderedMoments = [...request.moments].sort((a, b) => {
        // Primary: engagement score (descending)
        const engagementDiff = b.engagement_score - a.engagement_score;
        if (Math.abs(engagementDiff) > 0.05) return engagementDiff;

        // Secondary: chronological order (ascending)
        return a.start_time - b.start_time;
      });

      const estimatedDuration = orderedMoments.reduce(
        (sum, m) => sum + (m?.duration || 0),
        0
      );

      return {
        ordered_moment_ids: orderedMoments.map((m) => m.id),
        reasoning: "Fallback ordering by engagement score (API unavailable).",
        estimated_duration: estimatedDuration,
      };
    }
  }

  /**
   * Fetch or generate story_video highlights for multiple testimonials
   * Route: POST /ai/story-video-highlights
   *
   * This endpoint will:
   * - Check Redis cache first for existing highlights
   * - Check database for saved highlights
   * - Generate new highlights using AI if not found
   * - Save generated highlights to database
   * - Cache results for future requests
   */
  async getStoryVideoHighlights(
    testimonialIds: string[]
  ): Promise<{
    testimonials: Array<{
      testimonial_id: string;
      highlights: HighlightMoment[];
      source: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/story-video-highlights`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ testimonial_ids: testimonialIds }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch story video highlights",
      }));
      throw new Error(
        error.message || "Failed to fetch story video highlights"
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const studioAPI = new StudioAPI();
