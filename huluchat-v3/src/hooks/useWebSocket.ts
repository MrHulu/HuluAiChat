/**
 * useWebSocket Hook
 * WebSocket 连接管理，支持自动重连和指数退避
 *
 * TASK-216: 添加消息队列功能
 * - 断开时消息进入队列
 * - 重连成功后自动发送队列消息
 *
 * TASK-321: WebSocket 连接韧性增强
 * - 心跳响应
 * - 连接超时处理
 * - 重连状态追踪
 */
import { useEffect, useRef, useCallback, useState } from "react";

import { toast } from "sonner";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error" | "reconnecting";

/** Queued message type */
export interface QueuedMessage {
  id: string;
  data: string | object;
  timestamp: number;
}

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
  /** Maximum number of queued messages (default: 100) */
  maxQueueSize?: number;
  /** Callback when messages are queued */
  onMessageQueued?: (count: number) => void;
  /** Callback when queue is flushed */
  onQueueFlushed?: (count: number) => void;
  /** Connection timeout in ms (default: 10000) */
  connectionTimeout?: number;
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
  /** Send message or queue if disconnected (TASK-216) */
  sendOrQueue: (data: string | object) => void;
  disconnect: () => void;
  reconnect: () => void;
  /** Number of messages in queue waiting to be sent */
  queueSize: number;
  /** Clear the message queue */
  clearQueue: () => void;
  /** Current reconnect attempt (0 = not reconnecting, 1+ = attempt number) */
  reconnectAttempt: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts: number;
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
  maxQueueSize = 100,
  onMessageQueued,
  onQueueFlushed,
  connectionTimeout = 10000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Message queue for offline resilience (TASK-216)
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  // Use ref to store connect function for use in callbacks
  const connectRef = useRef<() => void>(() => {});

  // For backwards compatibility, use reconnectInterval as baseDelay if provided
  const effectiveBaseDelay = reconnectInterval ?? baseDelay;

  // Use refs for callbacks to avoid stale closures
  const onMessageQueuedRef = useRef(onMessageQueued);
  const onQueueFlushedRef = useRef(onQueueFlushed);

  useEffect(() => {
    onMessageQueuedRef.current = onMessageQueued;
    onQueueFlushedRef.current = onQueueFlushed;
  }, [onMessageQueued, onQueueFlushed]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("connecting");

    // Clear any existing connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        console.log("[WebSocket] Connection timeout");
        wsRef.current?.close();
        setStatus("error");
      }
    }, connectionTimeout);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // Clear connection timeout on successful connection
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setStatus("connected");
        attemptsRef.current = 0;
        setReconnectAttempt(0);

        // Flush message queue on reconnect (TASK-216)
        const queue = messageQueueRef.current;
        if (queue.length > 0 && ws.readyState === WebSocket.OPEN) {
          const flushedCount = queue.length;
          console.log(`[WebSocket] Flushing ${flushedCount} queued messages`);

          queue.forEach((queuedMsg) => {
            const message = typeof queuedMsg.data === "string"
              ? queuedMsg.data
              : JSON.stringify(queuedMsg.data);
            ws.send(message);
          });

          // Clear queue after flushing
          messageQueueRef.current = [];
          setQueueSize(0);
          onQueueFlushedRef.current?.(flushedCount);
        }

        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // TASK-321: Handle heartbeat ping from server
          if (data.type === "ping") {
            // Respond with pong
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
            return; // Don't forward ping to onMessage callback
          }

          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        onClose?.();

        // Auto reconnect using ref to avoid stale closure
        if (attemptsRef.current < reconnectAttempts) {
          // Calculate delay with exponential backoff or fixed interval
          const delay = exponentialBackoff
            ? calculateBackoff(attemptsRef.current, effectiveBaseDelay, maxDelay, jitter)
            : effectiveBaseDelay;

          attemptsRef.current++;
          setReconnectAttempt(attemptsRef.current);
          setStatus("reconnecting");
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${attemptsRef.current}/${reconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, delay);
        } else {
          // Max attempts reached
          setStatus("disconnected");
          setReconnectAttempt(0);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };
    } catch {
      setStatus("error");
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, exponentialBackoff, effectiveBaseDelay, maxDelay, jitter, connectionTimeout]);

  // Keep connectRef in sync
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
    setReconnectAttempt(0);
  }, []);

  const reconnect = useCallback(() => {
    attemptsRef.current = 0;
    setReconnectAttempt(0);
    disconnect();
    connect();
  }, [connect, disconnect]);

  const send = useCallback((data: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
    }
  }, []);

  /**
   * Send message or queue if disconnected (TASK-216)
   * - If connected: send immediately
   * - If disconnected: add to queue, will be sent on reconnect
   */
  const sendOrQueue = useCallback((data: string | object) => {
    // If connected, send immediately
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return;
    }

    // If disconnected or connecting, queue the message
    const queue = messageQueueRef.current;

    // Check queue size limit
    if (queue.length >= maxQueueSize) {
      console.warn(`[WebSocket] Queue full (${queue.length}/${maxQueueSize}), dropping oldest message`);
      queue.shift();
    }

    // Add message to queue
    const queuedMsg: QueuedMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
    };
    queue.push(queuedMsg);
    setQueueSize(queue.length);

    console.log(`[WebSocket] Message queued (${queue.length} in queue)`);
    onMessageQueuedRef.current?.(queue.length);

    // Show toast notification to user
    toast.info("Message queued", {
      description: `Will be sent when connection is restored (${queue.length} in queue)`,
      duration: 2000,
    });
  }, [maxQueueSize]);

  /**
   * Clear the message queue (TASK-216)
   */
  const clearQueue = useCallback(() => {
    messageQueueRef.current = [];
    setQueueSize(0);
    console.log("[WebSocket] Queue cleared");
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, send, sendOrQueue, disconnect, reconnect, queueSize, clearQueue, reconnectAttempt, maxReconnectAttempts: reconnectAttempts };
}
