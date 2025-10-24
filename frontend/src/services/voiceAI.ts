import { VOICE_AI_CONFIG } from "../config/features";

// Types for Voice AI service
export interface VoiceTestimonialRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  scheduledTime?: string;
  customQuestions?: string[];
  callbackUrl?: string;
}

export interface VoiceTestimonialSession {
  id: string;
  status: "scheduled" | "in_progress" | "completed" | "failed" | "cancelled";
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  transcript?: string;
  processedTestimonial?: string;
  vapiCallId?: string;
  questions: string[];
  recording?: {
    url: string;
    duration: number;
  };
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceTestimonialResponse {
  sessionId: string;
  status: string;
  scheduledTime: string;
  callInstructions: string;
}

class VoiceAIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
    this.apiKey = localStorage.getItem("auth_token") || "";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voice AI API error: ${error}`);
    }

    return response.json();
  }

  // Schedule a voice testimonial collection call
  async scheduleVoiceTestimonial(
    workspaceId: string,
    request: VoiceTestimonialRequest
  ): Promise<VoiceTestimonialResponse> {
    return this.makeRequest<VoiceTestimonialResponse>(
      `/workspaces/${workspaceId}/voice-testimonials/schedule`,
      {
        method: "POST",
        body: JSON.stringify({
          ...request,
          vapiConfig: {
            assistantId: VOICE_AI_CONFIG.VAPI_ASSISTANT_ID,
            maxDuration: VOICE_AI_CONFIG.MAX_CALL_DURATION,
            questions:
              request.customQuestions || VOICE_AI_CONFIG.DEFAULT_QUESTIONS,
          },
        }),
      }
    );
  }

  // Get voice testimonial session status
  async getVoiceTestimonialSession(
    workspaceId: string,
    sessionId: string
  ): Promise<VoiceTestimonialSession> {
    return this.makeRequest<VoiceTestimonialSession>(
      `/workspaces/${workspaceId}/voice-testimonials/${sessionId}`
    );
  }

  // List all voice testimonial sessions
  async listVoiceTestimonialSessions(
    workspaceId: string,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    sessions: VoiceTestimonialSession[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/workspaces/${workspaceId}/voice-testimonials${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  // Cancel a scheduled voice testimonial
  async cancelVoiceTestimonial(
    workspaceId: string,
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(
      `/workspaces/${workspaceId}/voice-testimonials/${sessionId}/cancel`,
      {
        method: "POST",
      }
    );
  }

  // Process completed voice testimonial (convert to text testimonial)
  async processVoiceTestimonial(
    workspaceId: string,
    sessionId: string,
    options?: {
      includeAudio?: boolean;
      customPrompt?: string;
      targetLength?: "short" | "medium" | "long";
    }
  ): Promise<{
    testimonialId: string;
    processedText: string;
    originalTranscript: string;
  }> {
    return this.makeRequest(
      `/workspaces/${workspaceId}/voice-testimonials/${sessionId}/process`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    );
  }

  // Get available time slots for scheduling
  async getAvailableTimeSlots(
    timezone: string = VOICE_AI_CONFIG.CALL_SCHEDULING.TIMEZONE,
    days: number = 7
  ): Promise<
    {
      date: string;
      slots: string[];
    }[]
  > {
    return this.makeRequest(
      `/voice-ai/available-slots?timezone=${timezone}&days=${days}`
    );
  }

  // Validate phone number for voice calls
  async validatePhoneNumber(phone: string): Promise<{
    isValid: boolean;
    formatted: string;
    country: string;
    type: "mobile" | "landline" | "unknown";
  }> {
    return this.makeRequest("/voice-ai/validate-phone", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  // Get voice AI usage statistics
  async getVoiceAIUsage(
    workspaceId: string,
    period: "week" | "month" | "quarter" = "month"
  ): Promise<{
    totalCalls: number;
    completedCalls: number;
    successRate: number;
    averageDuration: number;
    totalCost: number;
    testimonialsGenerated: number;
  }> {
    return this.makeRequest(
      `/workspaces/${workspaceId}/voice-ai/usage?period=${period}`
    );
  }
}

export const voiceAIService = new VoiceAIService();
