import { useState, useEffect, useCallback, useRef } from 'react';

interface StudioEvent {
  id: string;
  type: string;
  job_id: string;
  testimonial_id?: string;
  workspace_id?: string;
  stage?: any;
  preview?: any;
  suggestions?: any[];
  options?: any[];
  metadata?: Record<string, any>;
  timestamp: string;
}

interface UseStudioSSEReturn {
  isConnected: boolean;
  lastEvent: StudioEvent | null;
  events: StudioEvent[];
  error: string | null;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useStudioSSE = (sessionId?: string | null): UseStudioSSEReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<StudioEvent | null>(null);
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

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
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  const connect = useCallback((newSessionId: string) => {
    // Disconnect any existing connection
    disconnect();

    if (!newSessionId) {
      setError('Session ID is required');
      return;
    }

    sessionIdRef.current = newSessionId;
    setError(null);

    try {
      const sseUrl = `${import.meta.env.VITE_API_URL}/api/studio/sessions/${newSessionId}/stream`;

      console.log('Connecting to Studio SSE:', sseUrl);

      const eventSource = new EventSource(sseUrl, {
        withCredentials: false, // Adjust based on your auth setup
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('Studio SSE connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StudioEvent;
          console.log('Studio SSE event received:', data);

          setLastEvent(data);
          setEvents(prev => [...prev.slice(-49), data]); // Keep last 50 events
        } catch (err) {
          console.error('Failed to parse Studio SSE event:', err);
          setError('Failed to parse event data');
        }
      };

      // Handle specific event types
      eventSource.addEventListener('session_connected', (event) => {
        try {
          const data = JSON.parse(event.data) as StudioEvent;
          console.log('Studio session connected:', data);
          setLastEvent(data);
        } catch (err) {
          console.error('Failed to parse session_connected event:', err);
        }
      });

      eventSource.addEventListener('stage_progress', (event) => {
        try {
          const data = JSON.parse(event.data) as StudioEvent;
          console.log('Stage progress update:', data);
          setLastEvent(data);
        } catch (err) {
          console.error('Failed to parse stage_progress event:', err);
        }
      });

      eventSource.addEventListener('stage_completed', (event) => {
        try {
          const data = JSON.parse(event.data) as StudioEvent;
          console.log('Stage completed:', data);
          setLastEvent(data);
        } catch (err) {
          console.error('Failed to parse stage_completed event:', err);
        }
      });

      eventSource.addEventListener('stage_accepted', (event) => {
        try {
          const data = JSON.parse(event.data) as StudioEvent;
          console.log('Stage accepted:', data);
          setLastEvent(data);
        } catch (err) {
          console.error('Failed to parse stage_accepted event:', err);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat events to keep connection alive
        // Don't update lastEvent for heartbeats to avoid unnecessary re-renders
      });

      eventSource.onerror = (event) => {
        console.error('Studio SSE error:', event);
        setIsConnected(false);

        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Connection closed by server');
          // Attempt to reconnect
          attemptReconnect();
        } else {
          setError('Connection error occurred');
        }
      };

    } catch (err) {
      console.error('Failed to create Studio SSE connection:', err);
      setError('Failed to establish connection');
    }
  }, [disconnect]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached');
      return;
    }

    if (!sessionIdRef.current) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s

    console.log(`Attempting to reconnect to Studio SSE in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect(sessionIdRef.current!);
    }, delay);
  }, [connect]);

  const reconnect = useCallback(() => {
    if (sessionIdRef.current) {
      reconnectAttempts.current = 0;
      connect(sessionIdRef.current);
    }
  }, [connect]);

  // Auto-connect when sessionId is provided
  useEffect(() => {
    if (sessionId) {
      connect(sessionId);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, connection might be paused
        console.log('Page hidden, Studio SSE might be paused');
      } else {
        // Page is visible, check connection
        console.log('Page visible, checking Studio SSE connection');
        if (!isConnected && sessionIdRef.current) {
          reconnect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, reconnect]);

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