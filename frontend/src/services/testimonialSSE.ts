/**
 * Testimonial SSE Service
 *
 * Simple service that connects to the testimonial processing SSE endpoint
 * and triggers refetches when jobs complete.
 */

import { authStore } from "@/stores/authStore";
import { workspaceHub } from "@/repo/workspace_hub";

class TestimonialSSEService {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;

  /**
   * Connect to testimonial processing SSE stream
   */
  async connect() {
    // Don't reconnect if already connected
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log("[TestimonialSSE] Already connected");
      return;
    }

    // Close any existing connection
    this.disconnect();

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        console.warn("[TestimonialSSE] No auth token");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      const sseUrl = `${apiUrl}/processing/testimonials/stream`;

      console.log("[TestimonialSSE] Connecting to:", sseUrl);

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log("[TestimonialSSE] ✅ Connected");
        this.isConnected = true;

        // Clear any pending reconnect
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      // Listen for specific events
      this.eventSource.addEventListener("connected", (event) => {
        console.log("[TestimonialSSE] Connection established:", event.data);
      });

      this.eventSource.addEventListener("transcription_completed", (event) => {
        this.handleJobComplete("transcription", event);
      });

      this.eventSource.addEventListener("sentiment_analysis_completed", (event) => {
        this.handleJobComplete("sentiment_analysis", event);
      });

      this.eventSource.addEventListener("highlights_extracted", (event) => {
        this.handleJobComplete("highlight_extraction", event);
      });

      this.eventSource.addEventListener("heartbeat", () => {
        console.debug("[TestimonialSSE] ❤️ Heartbeat");
      });

      this.eventSource.onerror = (error) => {
        console.error("[TestimonialSSE] ❌ Error:", error);
        this.isConnected = false;

        // Auto-reconnect after 5 seconds
        if (!this.reconnectTimeout) {
          console.log("[TestimonialSSE] Scheduling reconnect in 5s");
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 5000);
        }
      };
    } catch (error) {
      console.error("[TestimonialSSE] Failed to connect:", error);
      this.isConnected = false;
    }
  }

  /**
   * Handle job completion event
   */
  private async handleJobComplete(jobType: string, event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const testimonialId = data.testimonial_id;

      if (!testimonialId) {
        console.warn(`[TestimonialSSE] No testimonial_id in ${jobType} event`);
        return;
      }

      console.log(`[TestimonialSSE] 🎉 ${jobType} completed for testimonial:`, testimonialId);

      // Update ONLY this specific testimonial in the MobX store
      // This will:
      // 1. Fetch the latest data for this testimonial (with new artifacts)
      // 2. Update it in the testimonials array
      // 3. Update it as the current testimonial if it's being viewed
      // 4. MobX will automatically update all components observing this testimonial
      await workspaceHub.testimonialManager.updateTestimonial(testimonialId);

      console.log(`[TestimonialSSE] ✅ Testimonial ${testimonialId} updated`);
    } catch (error) {
      console.error(`[TestimonialSSE] Error handling ${jobType} completion:`, error);
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnected = false;
    console.log("[TestimonialSSE] Disconnected");
  }

  /**
   * Get connection status
   */
  get connected() {
    return this.isConnected;
  }
}

// Export singleton instance
export const testimonialSSE = new TestimonialSSEService();
