// hooks/useSSEProcessing.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { authStore } from "@/stores/authStore";

export interface SSEProcessingEvent {
  type: "progress" | "completed" | "error" | "step_change";
  data: {
    testimonialId: string;
    step?: string;
    progress?: number;
    message?: string;
    results?: any;
    error?: string;
    estimatedTimeRemaining?: number;
  };
}

export interface ProcessingStatus {
  step: "uploading" | "transcribing" | "extracting" | "rendering" | "completed";
  progress: number;
  message: string;
  estimatedTimeRemaining: number;
  completed: boolean;
  error?: string;
  results?: any;
}

interface UseSSEProcessingOptions {
  testimonialId?: string;
  autoConnect?: boolean;
  onProgress?: (status: ProcessingStatus) => void;
  onCompleted?: (results: any) => void;
  onError?: (error: string) => void;
}

export const useSSEProcessing = (options: UseSSEProcessingOptions = {}) => {
  const {
    testimonialId,
    autoConnect = true,
    onProgress,
    onCompleted,
    onError,
  } = options;

  const [status, setStatus] = useState<ProcessingStatus>({
    step: "uploading",
    progress: 0,
    message: "Starting processing...",
    estimatedTimeRemaining: 0,
    completed: false,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(
    async (targetTestimonialId?: string) => {
      const id = targetTestimonialId || testimonialId;
      if (!id) return;

      try {
        // Get auth token
        const token = await authStore.user?.getIdToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Close existing connection
        disconnect();

        // Create SSE URL with auth token
        const url = new URL(
          `${import.meta.env.VITE_API_URL}/testimonials/${id}/processing/stream`
        );
        url.searchParams.set("token", token);

        // Create EventSource
        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("SSE connection opened");
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const sseEvent: SSEProcessingEvent = JSON.parse(event.data);
            handleSSEEvent(sseEvent);
          } catch (error) {
            console.error("Failed to parse SSE event:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("SSE connection error:", error);
          setIsConnected(false);

          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
            console.log(
              `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect(id);
            }, delay);
          } else {
            setConnectionError("Failed to connect to processing updates");
            onError?.("Connection failed after multiple attempts");
          }
        };

        // Handle specific event types
        eventSource.addEventListener("progress", (event) => {
          try {
            const data = JSON.parse(event.data);
            handleSSEEvent({ type: "progress", data });
          } catch (error) {
            console.error("Failed to parse progress event:", error);
          }
        });

        eventSource.addEventListener("completed", (event) => {
          try {
            const data = JSON.parse(event.data);
            handleSSEEvent({ type: "completed", data });
          } catch (error) {
            console.error("Failed to parse completed event:", error);
          }
        });

        eventSource.addEventListener("error", (event) => {
          try {
            const data = JSON.parse((event as any).data);
            handleSSEEvent({ type: "error", data });
          } catch (error) {
            console.error("Failed to parse error event:", error);
          }
        });
      } catch (error) {
        console.error("Failed to establish SSE connection:", error);
        setConnectionError("Failed to connect to processing updates");
        onError?.(error instanceof Error ? error.message : "Connection failed");
      }
    },
    [testimonialId, onError]
  );

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const handleSSEEvent = useCallback(
    (event: SSEProcessingEvent) => {
      const { type, data } = event;

      switch (type) {
        case "progress":
        case "step_change":
          const newStatus: ProcessingStatus = {
            step: (data.step as ProcessingStatus["step"]) || status.step,
            progress: data.progress || status.progress,
            message: data.message || status.message,
            estimatedTimeRemaining:
              data.estimatedTimeRemaining || status.estimatedTimeRemaining,
            completed: false,
            error: undefined,
          };

          setStatus(newStatus);
          onProgress?.(newStatus);
          break;

        case "completed":
          const completedStatus: ProcessingStatus = {
            step: "completed",
            progress: 100,
            message: "Processing completed successfully",
            estimatedTimeRemaining: 0,
            completed: true,
            results: data.results,
          };

          setStatus(completedStatus);
          onCompleted?.(data.results);

          // Auto-disconnect on completion
          disconnect();
          break;

        case "error":
          const errorStatus: ProcessingStatus = {
            step: status.step,
            progress: status.progress,
            message: status.message,
            estimatedTimeRemaining: 0,
            completed: false,
            error: data.error || "Processing error occurred",
          };

          setStatus(errorStatus);
          onError?.(data.error || "Processing error occurred");

          // Auto-disconnect on error
          disconnect();
          break;

        default:
          console.warn("Unknown SSE event type:", type);
      }
    },
    [status, onProgress, onCompleted, onError, disconnect]
  );

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && testimonialId && authStore.user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, testimonialId, authStore.user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    isConnected,
    connectionError,
    connect,
    disconnect,
    retry: () => connect(),
  };
};
