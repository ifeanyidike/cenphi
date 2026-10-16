import { useState, useEffect, useCallback, useRef } from "react";
import { authStore } from "@/stores/authStore";
import { connectSSE } from "@/hooks/sse/connection";

interface StudioEvent {
  id: string;
  type: string;
  job_id: string;
  session_id?: string;
  testimonial_id?: string;
  workspace_id?: string;
  stage?: any;
  preview?: any;
  suggestions?: any[];
  options?: any[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export const useStudioSSE = (sessionId?: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<StudioEvent | null>(null);
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const disconnect = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    sessionIdRef.current = null;
    setIsConnected(false);
  }, []);

  const connect = useCallback(
    (id: string) => {
      disconnect();
      setLastEvent(null);
      setEvents([]);
      setError(null);
      if (!id) {
        setError("Session ID is required");
        return;
      }
      sessionIdRef.current = id;
      stopRef.current = connectSSE(
        async () => {
          const token = await authStore.user?.getIdToken();
          if (!token) throw new Error("Authentication required");
          return `${import.meta.env.VITE_API_URL}/studio/sessions/${encodeURIComponent(id)}/stream?token=${encodeURIComponent(token)}`;
        },
        {
          onOpen: () => {
            setIsConnected(true);
            setError(null);
          },
          onError: (message) => {
            setIsConnected(false);
            setError(message);
          },
          onMessage: (event) => {
            try {
              const data: StudioEvent = JSON.parse(event.data);
              if (
                !data ||
                typeof data.type !== "string" ||
                data.type === "heartbeat"
              )
                return;
              if (data.session_id && data.session_id !== id) return;
              setLastEvent(data);
              setEvents((prev) => [...prev.slice(-49), data]);
            } catch {
              setError("Failed to parse event data");
            }
          },
        },
      );
    },
    [disconnect],
  );

  const reconnect = useCallback(() => {
    const id = sessionIdRef.current;
    if (id) connect(id);
  }, [connect]);

  useEffect(() => {
    if (sessionId) connect(sessionId);
    else disconnect();
    return disconnect;
  }, [sessionId, connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    events,
    error,
    connect,
    disconnect,
    reconnect,
  };
};
