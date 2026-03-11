/**
 * useWebSocket Hook
 * WebSocket 连接管理，支持自动重连和指数退避
 */
import { useEffect, useRef, useCallback, useState } from "react";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  /** Maximum number of reconnect attempts (default: 10) */
  reconnectAttempts?: number;
  /** @deprecated Use exponentialBackoff instead. Base interval for reconnection in ms (default: 1000) */
  reconnectInterval?: number;
  /** Enable exponential backoff for reconnection (default: true) */
  exponentialBackoff?: boolean;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Maximum delay for exponential backoff in ms (default: 30000) */
  maxDelay?: number;
  /** Jitter factor (0-1) to randomize delay (default: 0.3) */
  jitter?: number;
}

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt Current attempt number (0-indexed)
 * @param baseDelay Base delay in ms
 * @param maxDelay Maximum delay in ms
 * @param jitterFactor Random factor (0-1) to add jitter
 */
function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter to avoid thundering herd
  const jitter = cappedDelay * jitterFactor * Math.random();
  return Math.floor(cappedDelay + jitter);
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (data: string | object) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectAttempts = 10,
  reconnectInterval,
  exponentialBackoff = true,
  baseDelay = 1000,
  maxDelay = 30000,
  jitter = 0.3,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use ref to store connect function for use in callbacks
  const connectRef = useRef<() => void>(() => {});

  // For backwards compatibility, use reconnectInterval as baseDelay if provided
  const effectiveBaseDelay = reconnectInterval ?? baseDelay;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        attemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onClose?.();

        // Auto reconnect using ref to avoid stale closure
        if (attemptsRef.current < reconnectAttempts) {
          // Calculate delay with exponential backoff or fixed interval
          const delay = exponentialBackoff
            ? calculateBackoff(attemptsRef.current, effectiveBaseDelay, maxDelay, jitter)
            : effectiveBaseDelay;

          attemptsRef.current++;
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${attemptsRef.current}/${reconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };
    } catch {
      setStatus("error");
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, exponentialBackoff, effectiveBaseDelay, maxDelay, jitter]);

  // Keep connectRef in sync
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    attemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  const send = useCallback((data: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, send, disconnect, reconnect };
}
