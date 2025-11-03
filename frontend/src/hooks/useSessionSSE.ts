import { useState, useEffect, useRef, useCallback } from "react";
import { authStore } from "@/stores/authStore";

export interface ProcessingStage {
  id: string;
  session_id: string;
  stage_id: string;
  stage_name: string;
  display_name: string;
  stage_order: number;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "reviewing"
    | "accepted"
    | "skipped"
    | "skipped_auto"
    | "failed";
  progress: number;
  message?: string;
  skip_reason?: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingSession {
  id: string;
  testimonial_id?: string;
  workspace_id: string;
  session_type: string;
  status: "active" | "paused" | "completed" | "cancelled";
  auto_proceed: boolean;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  started_at: string;
}

export interface PreviewArtifact {
  id: string;
  session_id: string;
  stage_id?: string;
  storage_path: string;
  preview_url: string;
  artifact_type: "video" | "audio" | "image" | "json";
  file_size_bytes?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// Enhanced SSE event types with better type safety
interface BaseSSEEvent {
  type: string;
  session_id: string;
  timestamp: string;
  data: any;
}

interface StageSSEEvent extends BaseSSEEvent {
  type: "stage_started" | "stage_progress" | "stage_complete" | "stage_retry" | "stage_accepted";
  stage_id?: string;
  stage?: any;
}

interface PreviewSSEEvent extends BaseSSEEvent {
  type: "preview_ready";
  stage_id?: string;
  preview?: any;
}

export type SSEEvent =
  | BaseSSEEvent
  | StageSSEEvent
  | PreviewSSEEvent;

interface UseSessionSSEReturn {
  session: ProcessingSession | null;
  stages: ProcessingStage[];
  isConnected: boolean;
  error: string | null;
  currentStage: ProcessingStage | null;
  latestPreview: PreviewArtifact | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSessionSSE = (sessionId: string): UseSessionSSEReturn => {
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<ProcessingStage | null>(null);
  const [latestPreview, setLatestPreview] = useState<PreviewArtifact | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const artifactsFetchedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Cleanup helper
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout]);

  // Extract and set preview from stage metadata
  const setPreviewFromStages = useCallback((currentStages: ProcessingStage[]) => {
    if (!isMountedRef.current) return;

    console.log("[useSessionSSE] Extracting preview from stage metadata");

    // Find latest completed/accepted stage with preview_url in metadata
    let latestStage: ProcessingStage | null = null;
    let latestOrder = -1;

    for (const stage of currentStages) {
      if (
        (stage.status === "completed" || stage.status === "accepted") &&
        stage.metadata?.preview_url &&
        stage.stage_order > latestOrder
      ) {
        latestOrder = stage.stage_order;
        latestStage = stage;
      }
    }

    // Set latest preview from stage metadata
    if (latestStage?.metadata?.preview_url) {
      console.log(
        "[useSessionSSE] Setting preview from stage metadata:",
        latestStage.stage_id,
        latestStage.metadata.preview_url
      );

      setLatestPreview({
        id: latestStage.id || "",
        session_id: sessionId,
        stage_id: latestStage.stage_id,
        storage_path: latestStage.metadata.storage_path || "",
        preview_url: latestStage.metadata.preview_url,
        artifact_type: latestStage.metadata.artifact_type || "video",
        file_size_bytes: latestStage.metadata.file_size_bytes,
        metadata: latestStage.metadata,
        created_at: latestStage.completed_at || new Date().toISOString(),
      });
    } else {
      console.log("[useSessionSSE] No completed stages with preview_url found");
    }
  }, [sessionId]);

  const connect = useCallback(async () => {
    // Prevent connection if component is unmounted
    if (!isMountedRef.current) return;

    disconnect();
    artifactsFetchedRef.current = false;

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const sseUrl = `${import.meta.env.VITE_API_URL}/studio/sessions/${sessionId}/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;

        console.error("[useSessionSSE] SSE connection error, readyState:", eventSource.readyState);
        setIsConnected(false);

        // Exponential backoff reconnection
        if (eventSource.readyState === EventSource.CLOSED) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;

            console.log(
              `[useSessionSSE] Connection closed, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
            );
            setError(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

            clearReconnectTimeout();
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && eventSourceRef.current?.readyState === EventSource.CLOSED) {
                connect();
              }
            }, delay);
          } else {
            setError("Connection failed. Please refresh the page.");
            console.error("[useSessionSSE] Max reconnection attempts reached");
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          setError("Connecting to server...");
        }
      };

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);

          switch (sseEvent.type) {
            case "session_created": {
              const sessionData = sseEvent.data;
              setSession({
                id: sessionData.session_id || sessionId,
                testimonial_id: sessionData.testimonial_id,
                workspace_id: sessionData.workspace_id,
                session_type: sessionData.type || sessionData.session_type,
                status: sessionData.status || "active",
                auto_proceed: sessionData.auto_proceed ?? false,
                total_steps: sessionData.total_steps || 0,
                completed_steps: 0,
                skipped_steps: 0,
                started_at: sessionData.started_at || new Date().toISOString(),
              });

              const initialStages = sessionData.stages || [];
              if (Array.isArray(initialStages) && initialStages.length > 0) {
                const mappedStages: ProcessingStage[] = initialStages.map((stage: any) => {
                  const mapped: ProcessingStage = {
                    id: stage.id || stage.ID || "",
                    session_id: sessionData.session_id || sessionId,
                    stage_id: stage.stage_id || stage.id || stage.ID || "",
                    stage_name: stage.stage_name || stage.name || stage.Name || "",
                    display_name: stage.display_name || stage.DisplayName || stage.name || stage.Name || "",
                    stage_order: stage.stage_order ?? stage.order ?? stage.Order ?? 0,
                    status: stage.status || "pending",
                    progress: stage.progress ?? stage.Progress ?? 0,
                    message: stage.message || stage.Message || "",
                    skip_reason: stage.skip_reason,
                    started_at: stage.started_at || stage.StartedAt,
                    completed_at: stage.completed_at || stage.CompletedAt,
                    metadata: stage.metadata,
                  };

                  // Fix progress/status inconsistency
                  if (mapped.progress === 100 && mapped.status === "processing") {
                    console.warn(
                      `[useSessionSSE] Stage ${mapped.stage_id} has progress=100 but status=processing, fixing to completed`
                    );
                    mapped.status = "completed";
                    if (!mapped.completed_at) {
                      mapped.completed_at = new Date().toISOString();
                    }
                  }

                  return mapped;
                });

                const sortedStages = mappedStages.sort((a, b) => a.stage_order - b.stage_order);
                setStages(sortedStages);

                // Set currentStage if there's a stage currently processing
                const processingStage = mappedStages.find((s) => s.status === "processing");
                if (processingStage) {
                  setCurrentStage(processingStage);
                }

                // Extract preview if stages are completed
                const hasCompleted = mappedStages.some(
                  (s) => s.status === "completed" || s.status === "accepted"
                );
                if (hasCompleted && !artifactsFetchedRef.current) {
                  artifactsFetchedRef.current = true;
                  setPreviewFromStages(sortedStages);
                }
              }
              break;
            }

            case "stages_initialized": {
              const initialStages = sseEvent.data.stages;
              if (Array.isArray(initialStages)) {
                const sortedStages = initialStages.sort(
                  (a: ProcessingStage, b: ProcessingStage) => a.stage_order - b.stage_order
                );
                setStages(sortedStages);
                if (!artifactsFetchedRef.current) {
                  artifactsFetchedRef.current = true;
                  setPreviewFromStages(sortedStages);
                }
              }
              break;
            }

            case "stage_started":
            case "step_started": {
              const stageEvent = sseEvent as StageSSEEvent;
              const stageData = stageEvent.stage || sseEvent.data;
              if (!stageData) break;

              const newStage: ProcessingStage = {
                id: stageData.id || stageData.ID || "",
                session_id: sseEvent.session_id || sessionId,
                stage_id: stageData.stage_id || stageData.id || stageData.ID || "",
                stage_name: stageData.stage_name || stageData.name || stageData.Name || "",
                display_name: stageData.display_name || stageData.DisplayName || stageData.name || stageData.Name || "",
                stage_order: stageData.stage_order ?? stageData.order ?? stageData.Order ?? 0,
                status: "processing",
                progress: stageData.progress ?? 0,
                message: stageData.message || "",
                started_at: stageData.started_at || stageData.StartedAt,
              };

              setCurrentStage(newStage);
              setStages((prev) => {
                const existing = prev.find((s) => s.stage_id === newStage.stage_id);
                if (existing) {
                  return prev.map((s) => (s.stage_id === newStage.stage_id ? newStage : s));
                }
                return [...prev, newStage].sort((a, b) => a.stage_order - b.stage_order);
              });
              break;
            }

            case "stage_progress":
            case "step_progress": {
              const stageEvent = sseEvent as StageSSEEvent;
              const stageData = stageEvent.stage || sseEvent.data;
              if (!stageData) break;

              const stageId = stageData.stage_id || stageData.id || stageEvent.stage_id || "";
              const progress = stageData.progress ?? 0;
              const message = stageData.message || "";

              setStages((prev) =>
                prev.map((s) =>
                  s.stage_id === stageId ? { ...s, progress, message, status: "processing" } : s
                )
              );

              setCurrentStage((prev) =>
                prev && prev.stage_id === stageId ? { ...prev, progress, message } : prev
              );
              break;
            }

            case "preview_ready": {
              const previewEvent = sseEvent as PreviewSSEEvent;
              const previewData = previewEvent.preview || sseEvent.data;
              if (!previewData) break;

              const stageId = previewData.stage_id || previewEvent.stage_id || "";
              const eventData = sseEvent.data || {};
              const previewType = previewData.type || previewData.artifact_type || "video";

              // Extract preview URL - only for video/image types, not JSON
              let previewUrl = previewData.preview_url || previewData.url || "";
              if (!previewUrl && previewData.content && typeof previewData.content === "string") {
                previewUrl = previewData.content;
              }

              const preview: PreviewArtifact = {
                id: previewData.id || "",
                session_id: sseEvent.session_id || sessionId,
                stage_id: stageId,
                storage_path: previewData.storage_path || "",
                preview_url: previewUrl,
                artifact_type: previewType,
                file_size_bytes: previewData.file_size_bytes,
                metadata: previewData.metadata,
                created_at: previewData.created_at || new Date().toISOString(),
              };

              // Check if this is an individual clip preview or JSON type
              const isClipPreview = eventData.clip_index !== undefined;
              const isJsonPreview = previewType === "json";

              // Only set latest preview for actual video/image previews
              if (!isClipPreview && !isJsonPreview && previewUrl) {
                setLatestPreview(preview);
              }

              // Update stage metadata - preserve existing metadata especially clips array
              setStages((prev) =>
                prev.map((s) =>
                  s.stage_id === stageId
                    ? {
                        ...s,
                        metadata: {
                          ...s.metadata,
                          ...(isClipPreview
                            ? {}
                            : {
                                preview_url: preview.preview_url,
                                duration: previewData.metadata?.duration,
                                width: previewData.metadata?.width,
                                height: previewData.metadata?.height,
                                aspect_ratio: previewData.metadata?.aspect_ratio,
                              }),
                        },
                      }
                    : s
                )
              );
              break;
            }

            case "stage_complete":
            case "step_complete": {
              const stageEvent = sseEvent as StageSSEEvent;
              const stageData = stageEvent.stage || sseEvent.data;
              if (!stageData) break;

              const stageId = stageData.stage_id || stageData.id || stageEvent.stage_id || "";

              // Log clips completion
              if (stageId === "extract_clips" && stageData.metadata?.clips?.length > 0) {
                console.log(
                  `[useSessionSSE] Clips ready: ${stageData.metadata.clips.length} clips extracted`
                );
              }

              setStages((prev) =>
                prev.map((s) =>
                  s.stage_id === stageId
                    ? {
                        ...s,
                        status: "completed",
                        progress: 100,
                        completed_at: stageData.completed_at || stageData.CompletedAt || new Date().toISOString(),
                        metadata: stageData.metadata || s.metadata,
                      }
                    : s
                )
              );

              setCurrentStage((prev) => (prev?.stage_id === stageId ? null : prev));
              setSession((prev) =>
                prev ? { ...prev, completed_steps: (prev.completed_steps || 0) + 1 } : null
              );
              break;
            }

            case "stage_retry": {
              const stageEvent = sseEvent as StageSSEEvent;
              const stageData = stageEvent.stage || sseEvent.data;
              if (!stageData) break;

              const stageId = stageData.stage_id || stageData.id || stageEvent.stage_id || "";

              setStages((prev) =>
                prev.map((s) =>
                  s.stage_id === stageId
                    ? {
                        ...s,
                        status: "pending",
                        progress: 0,
                        message: "Retrying...",
                        started_at: undefined,
                        completed_at: undefined,
                      }
                    : s
                )
              );
              break;
            }

            case "stage_accepted": {
              const stageEvent = sseEvent as StageSSEEvent;
              const stageData = stageEvent.stage || sseEvent.data;
              if (!stageData) break;

              const stageId = stageData.stage_id || stageData.id || stageEvent.stage_id || "";

              setStages((prev) =>
                prev.map((s) =>
                  s.stage_id === stageId
                    ? {
                        ...s,
                        status: "accepted",
                        progress: 100,
                        completed_at: stageData.completed_at || stageData.CompletedAt || new Date().toISOString(),
                      }
                    : s
                )
              );

              setCurrentStage((prev) => (prev?.stage_id === stageId ? null : prev));
              break;
            }

            case "session_complete":
              setSession((prev) => (prev ? { ...prev, status: "completed" } : null));
              break;

            case "session_paused":
              setSession((prev) => (prev ? { ...prev, status: "paused" } : null));
              break;

            case "session_resumed":
              setSession((prev) => (prev ? { ...prev, status: "active" } : null));
              break;

            case "job_cancelled": // Backend sends this event
            case "session_cancelled": // Keep this for compatibility
              console.log("[useSessionSSE] Session cancelled");
              setSession((prev) => (prev ? { ...prev, status: "cancelled" } : null));
              disconnect(); // Close SSE connection since session is done
              break;

            case "error":
              setError(sseEvent.data.message || "An error occurred");
              break;

            case "heartbeat":
            case "connection_established":
              // No action needed
              break;

            default:
              console.warn("[useSessionSSE] Unknown SSE event type:", sseEvent.type);
          }
        } catch (err) {
          console.error("[useSessionSSE] Failed to parse SSE event:", err, event.data);
        }
      };
    } catch (err: any) {
      console.error("[useSessionSSE] Connection error:", err);
      setError(err.message || "Failed to connect");
      setIsConnected(false);
    }
  }, [sessionId, disconnect, clearReconnectTimeout, setPreviewFromStages]);

  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    session,
    stages,
    isConnected,
    error,
    currentStage,
    latestPreview,
    connect,
    disconnect,
  };
};
