// services/SSEServiceManager.ts

export interface SSEEvent {
  type: string;
  data: any;
  event?: string;
  id?: string;
  retry?: number;
}

export interface JobStatusUpdate {
  job_id: string;
  service_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
  metadata?: any;
}

export interface StreamChunk {
  type: "chunk" | "complete" | "error";
  content: string;
  content_type?: "text" | "markdown" | "json";
  job_id?: string;
  service_id?: string;
}

/**
 * Enhanced SSE Service Manager with proper error handling and reconnection logic
 */
export class SSEServiceManager {
  private eventSource: EventSource | null = null;
  private streamingConnections: Map<string, EventSource> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnected: boolean = false;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize main SSE connection for job status updates
   */
  initializeJobStatusSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();

      const url = `${this.baseUrl}/jobs/stream`;
      console.log(`🔌 Initializing SSE connection to: ${url}`);

      this.eventSource = new EventSource(url);

      this.eventSource.onopen = (event) => {
        console.log("✅ SSE connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit("connection", { status: "connected" });
        resolve();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 SSE message received:", data);
          this.handleJobStatusUpdate(data);
        } catch (error) {
          console.error("❌ Error parsing SSE message:", error);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error("❌ SSE connection error:", event);
        this.isConnected = false;
        this.emit("connection", { status: "error", event });

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(
            () => {
              this.reconnectAttempts++;
              console.log(
                `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
              );
              this.initializeJobStatusSSE().catch(console.error);
            },
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
          );
        } else {
          console.error("💥 Max reconnection attempts reached");
          this.emit("connection", { status: "failed" });
          reject(new Error("Failed to establish SSE connection"));
        }
      };

      // Setup event listeners for specific job events
      this.eventSource.addEventListener("job_update", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.handleJobStatusUpdate(data);
        } catch (error) {
          console.error("Error parsing job update:", error);
        }
      });

      this.eventSource.addEventListener("job_completed", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.emit("job_completed", data);
        } catch (error) {
          console.error("Error parsing job completion:", error);
        }
      });

      this.eventSource.addEventListener("job_failed", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.emit("job_failed", data);
        } catch (error) {
          console.error("Error parsing job failure:", error);
        }
      });
    });
  }

  /**
   * Initialize streaming connection for a specific service
   */
  initializeServiceStreaming(
    serviceId: string,
    endpoint: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close existing connection for this service
      if (this.streamingConnections.has(serviceId)) {
        this.streamingConnections.get(serviceId)?.close();
        this.streamingConnections.delete(serviceId);
      }

      const url = `${this.baseUrl}${endpoint}/stream`;
      console.log(`🌊 Initializing streaming for ${serviceId}: ${url}`);

      const streamingEventSource = new EventSource(url);
      this.streamingConnections.set(serviceId, streamingEventSource);

      streamingEventSource.onopen = () => {
        console.log(`✅ Streaming connection established for ${serviceId}`);
        resolve();
      };

      streamingEventSource.onmessage = (event) => {
        try {
          const data: StreamChunk = JSON.parse(event.data);
          console.log(`🌊 Streaming chunk received for ${serviceId}:`, data);
          this.handleStreamingChunk(serviceId, data);
        } catch (error) {
          console.error(
            `❌ Error parsing streaming data for ${serviceId}:`,
            error
          );
        }
      };

      streamingEventSource.onerror = (error) => {
        console.error(`❌ Streaming connection error for ${serviceId}:`, error);
        this.emit("streaming_error", { serviceId, error });

        // Attempt reconnection for streaming
        setTimeout(() => {
          this.initializeServiceStreaming(serviceId, endpoint).catch(
            console.error
          );
        }, 2000);
      };

      // Custom event listeners for streaming
      streamingEventSource.addEventListener("chunk", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.handleStreamingChunk(serviceId, { ...data, type: "chunk" });
        } catch (error) {
          console.error("Error parsing chunk event:", error);
        }
      });

      streamingEventSource.addEventListener("complete", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.handleStreamingChunk(serviceId, { ...data, type: "complete" });
        } catch (error) {
          console.error("Error parsing complete event:", error);
        }
      });

      streamingEventSource.addEventListener("error", (event) => {
        try {
          const data = JSON.parse((event as any).data);
          this.handleStreamingChunk(serviceId, { ...data, type: "error" });
        } catch (error) {
          console.error("Error parsing error event:", error);
        }
      });
    });
  }

  /**
   * Handle job status updates
   */
  private handleJobStatusUpdate(data: JobStatusUpdate): void {
    this.emit("job_status_update", data);

    // Emit specific events based on status
    switch (data.status) {
      case "queued":
        this.emit("job_queued", data);
        break;
      case "processing":
        this.emit("job_processing", data);
        break;
      case "completed":
        this.emit("job_completed", data);
        break;
      case "failed":
        this.emit("job_failed", data);
        break;
    }
  }

  /**
   * Handle streaming chunks
   */
  private handleStreamingChunk(serviceId: string, chunk: StreamChunk): void {
    this.emit("streaming_chunk", { serviceId, chunk });

    // Emit specific streaming events
    switch (chunk.type) {
      case "chunk":
        this.emit("streaming_data", { serviceId, chunk });
        break;
      case "complete":
        this.emit("streaming_complete", { serviceId, chunk });
        break;
      case "error":
        this.emit("streaming_error", { serviceId, chunk });
        break;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get active streaming connections
   */
  getActiveStreamingConnections(): string[] {
    return Array.from(this.streamingConnections.keys());
  }

  /**
   * Close streaming connection for a specific service
   */
  closeStreamingConnection(serviceId: string): void {
    const connection = this.streamingConnections.get(serviceId);
    if (connection) {
      connection.close();
      this.streamingConnections.delete(serviceId);
      console.log(`🔌 Closed streaming connection for ${serviceId}`);
    }
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    console.log("🧹 Cleaning up SSE connections");

    // Close main SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Close all streaming connections
    this.streamingConnections.forEach((connection, serviceId) => {
      connection.close();
      console.log(`🔌 Closed streaming connection for ${serviceId}`);
    });
    this.streamingConnections.clear();

    // Clear listeners
    this.listeners.clear();

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.cleanup();
    this.reconnectAttempts = 0;
    this.initializeJobStatusSSE().catch(console.error);
  }
}

// Singleton instance
export const sseServiceManager = new SSEServiceManager(
  import.meta.env.VITE_API_URL || "http://localhost:8080"
);
