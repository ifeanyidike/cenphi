// src/components/capture-widget/hooks/useWebSocket.ts
import { useCallback, useRef, useEffect, useState } from "react";
import { WebSocketMessage, ConnectionStatus } from "../types";

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface UseWebSocketReturn {
  connect: (path: string) => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => boolean;
  sendBinary: (data: Blob | ArrayBuffer) => boolean;
  isConnected: () => boolean;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
}

export const useWebSocket = (
  baseUrl: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 2000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000, // 30 seconds
  } = options;

  // State
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // Refs for stable references
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const pathRef = useRef<string>("");
  const isConnectingRef = useRef<boolean>(false);
  const isManuallyDisconnectedRef = useRef<boolean>(false);

  // Clear timeouts helper
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current !== null) {
      window.clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({ type: "ping", timestamp: Date.now() })
        );
        lastHeartbeatRef.current = Date.now();

        // Schedule next heartbeat
        heartbeatTimeoutRef.current = window.setTimeout(
          sendHeartbeat,
          heartbeatInterval
        );
      } catch (error) {
        console.error("Failed to send heartbeat:", error);
        // Don't continue heartbeat if sending fails
      }
    }
  }, [heartbeatInterval]);

  // Handle WebSocket message
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Handle internal messages
        if (data.type === "pong") {
          lastHeartbeatRef.current = Date.now();
          console.log("🏓 Received pong response");
          return;
        }

        // Call user message handler
        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        if (onError) {
          onError(new Event("message_parse_error"));
        }
      }
    },
    [onMessage, onError]
  );

  // Handle WebSocket open
  const handleOpen = useCallback(() => {
    console.log("✅ WebSocket connected");
    setConnectionStatus("connected");
    setReconnectAttempts(0);
    isConnectingRef.current = false;
    isManuallyDisconnectedRef.current = false;

    // Start heartbeat
    sendHeartbeat();

    if (onConnect) {
      onConnect();
    }
  }, [onConnect, sendHeartbeat]);

  // Handle WebSocket close
  const handleClose = useCallback(
    (event: CloseEvent) => {
      console.log("❌ WebSocket disconnected:", event.code, event.reason);

      setConnectionStatus("disconnected");
      isConnectingRef.current = false;
      clearTimeouts();

      if (onDisconnect) {
        onDisconnect();
      }

      // Attempt reconnection if not manually disconnected
      if (
        !isManuallyDisconnectedRef.current &&
        autoReconnect &&
        reconnectAttempts < maxReconnectAttempts
      ) {
        console.log(
          `🔄 Attempting reconnection (${reconnectAttempts + 1}/${maxReconnectAttempts})`
        );

        setReconnectAttempts((prev) => prev + 1);

        reconnectTimeoutRef.current = window.setTimeout(
          () => {
            if (pathRef.current && !isManuallyDisconnectedRef.current) {
              connect(pathRef.current);
            }
          },
          reconnectInterval * Math.pow(2, reconnectAttempts)
        ); // Exponential backoff
      }
    },
    [
      onDisconnect,
      autoReconnect,
      maxReconnectAttempts,
      reconnectAttempts,
      reconnectInterval,
    ]
  );

  // Handle WebSocket error
  const handleError = useCallback(
    (event: Event) => {
      console.error("❌ WebSocket error:", event);

      if (onError) {
        onError(event);
      }
    },
    [onError]
  );

  // Connect to WebSocket
  const connect = useCallback(
    (path: string) => {
      // Prevent multiple simultaneous connection attempts
      if (isConnectingRef.current) {
        console.log("⚠️ Connection attempt already in progress");
        return;
      }

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      clearTimeouts();
      pathRef.current = path;
      isConnectingRef.current = true;
      isManuallyDisconnectedRef.current = false;
      setConnectionStatus("connecting");

      try {
        const url = `${baseUrl.replace(/^http/, "ws")}${path}`;
        console.log(`🔌 Connecting to WebSocket: ${url}`);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        // Set up event handlers
        ws.onopen = handleOpen;
        ws.onmessage = handleMessage;
        ws.onclose = handleClose;
        ws.onerror = handleError;
      } catch (error) {
        console.error("❌ Failed to create WebSocket connection:", error);
        setConnectionStatus("disconnected");
        isConnectingRef.current = false;

        if (onError) {
          onError(new Event("connection_failed"));
        }
      }
    },
    [
      baseUrl,
      handleOpen,
      handleMessage,
      handleClose,
      handleError,
      clearTimeouts,
      onError,
    ]
  );

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log("🔌 Manually disconnecting WebSocket");

    isManuallyDisconnectedRef.current = true;
    clearTimeouts();

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setConnectionStatus("disconnected");
    setReconnectAttempts(0);
  }, [clearTimeouts]);

  // Send message
  const send = useCallback((message: WebSocketMessage): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        // Add timestamp if not present
        if (!message.timestamp) {
          message.timestamp = Date.now();
        }

        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("❌ Failed to send WebSocket message:", error);
        return false;
      }
    }

    console.warn("⚠️ WebSocket not connected, cannot send message");
    return false;
  }, []);

  // Send binary data
  const sendBinary = useCallback((data: Blob | ArrayBuffer): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(data);
        return true;
      } catch (error) {
        console.error("❌ Failed to send binary WebSocket data:", error);
        return false;
      }
    }

    console.warn("⚠️ WebSocket not connected, cannot send binary data");
    return false;
  }, []);

  // Check if connected
  const isConnected = useCallback((): boolean => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyDisconnectedRef.current = true;
      clearTimeouts();

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clearTimeouts]);

  // Monitor connection health
  useEffect(() => {
    if (connectionStatus === "connected") {
      const healthCheckInterval = setInterval(() => {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;

        // If no heartbeat for more than 2 intervals, consider connection dead
        if (timeSinceLastHeartbeat > heartbeatInterval * 2) {
          console.warn(
            "⚠️ WebSocket connection appears to be dead, reconnecting..."
          );

          if (wsRef.current) {
            wsRef.current.close();
          }
        }
      }, heartbeatInterval);

      return () => {
        clearInterval(healthCheckInterval);
      };
    }
  }, [connectionStatus, heartbeatInterval]);

  return {
    connect,
    disconnect,
    send,
    sendBinary,
    isConnected,
    connectionStatus,
    reconnectAttempts,
  };
};
