// frontend/src/services/websocketClient.ts
import { useCallback, useRef } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageCallback = (data: any) => void;
type ErrorCallback = (error: Event) => void;
type ConnectionCallback = () => void;

export const useWebSocketClient = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<MessageCallback[]>([]);
  const errorHandlersRef = useRef<ErrorCallback[]>([]);
  const connectHandlersRef = useRef<ConnectionCallback[]>([]);
  const disconnectHandlersRef = useRef<ConnectionCallback[]>([]);

  // Base URL determination
  const getBaseUrl = useCallback(() => {
    const isSecure = window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    return `${protocol}//${host}`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(
    (path: string) => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      const url = `${getBaseUrl()}${path}`;
      const ws = new WebSocket(url);

      // Set up event handlers
      ws.onopen = () => {
        console.log("WebSocket connection established");
        connectHandlersRef.current.forEach((handler) => handler());
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageHandlersRef.current.forEach((handler) => handler(data));
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        errorHandlersRef.current.forEach((handler) => handler(error));
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        disconnectHandlersRef.current.forEach((handler) => handler());
      };

      wsRef.current = ws;
    },
    [getBaseUrl]
  );

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Send message
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Send binary data
  const sendBinary = useCallback((data: Blob | ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Register message handler
  const onMessage = useCallback((callback: MessageCallback) => {
    messageHandlersRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(
        (handler) => handler !== callback
      );
    };
  }, []);

  // Register error handler
  const onError = useCallback((callback: ErrorCallback) => {
    errorHandlersRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      errorHandlersRef.current = errorHandlersRef.current.filter(
        (handler) => handler !== callback
      );
    };
  }, []);

  // Register connect handler
  const onConnect = useCallback((callback: ConnectionCallback) => {
    connectHandlersRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      connectHandlersRef.current = connectHandlersRef.current.filter(
        (handler) => handler !== callback
      );
    };
  }, []);

  // Register disconnect handler
  const onDisconnect = useCallback((callback: ConnectionCallback) => {
    disconnectHandlersRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      disconnectHandlersRef.current = disconnectHandlersRef.current.filter(
        (handler) => handler !== callback
      );
    };
  }, []);

  // Check if connected
  const isConnected = useCallback(() => {
    return (
      wsRef.current !== null && wsRef.current.readyState === WebSocket.OPEN
    );
  }, []);

  return {
    connect,
    disconnect,
    send,
    sendBinary,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    isConnected,
  };
};
