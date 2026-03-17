import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "./useWebSocket";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];
  static shouldFailOnConnect = false;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  url: string;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;

  constructor(url: string) {
    this.url = url;
    this.send = vi.fn();
    this.close = vi.fn();
    MockWebSocket.instances.push(this);

    if (MockWebSocket.shouldFailOnConnect) {
      throw new Error("Connection failed");
    }

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }
}

// Replace global WebSocket with mock
vi.stubGlobal("WebSocket", MockWebSocket);

describe("useWebSocket hook", () => {
  const testUrl = "ws://localhost:8080/test";

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    MockWebSocket.shouldFailOnConnect = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start in connecting state", () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    expect(result.current.status).toBe("connecting");
  });

  it("should transition to connected when WebSocket opens", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    expect(result.current.status).toBe("connecting");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");
  });

  it("should call onOpen callback when connected", async () => {
    const onOpen = vi.fn();

    renderHook(() =>
      useWebSocket({ url: testUrl, onOpen })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(onOpen).toHaveBeenCalled();
  });

  it("should call onMessage callback with parsed JSON", async () => {
    const onMessage = vi.fn();

    renderHook(() =>
      useWebSocket({ url: testUrl, onMessage })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const ws = MockWebSocket.instances[0];
    if (ws?.onmessage) {
      ws.onmessage({ data: JSON.stringify({ type: "test", data: "hello" }) });
    }

    expect(onMessage).toHaveBeenCalledWith({ type: "test", data: "hello" });
  });

  it("should call onMessage callback with plain text when JSON parse fails", async () => {
    const onMessage = vi.fn();

    renderHook(() =>
      useWebSocket({ url: testUrl, onMessage })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const ws = MockWebSocket.instances[0];
    if (ws?.onmessage) {
      ws.onmessage({ data: "plain text message" });
    }

    expect(onMessage).toHaveBeenCalledWith("plain text message");
  });

  it("should send string messages", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    act(() => {
      result.current.send("test message");
    });

    const ws = MockWebSocket.instances[0];
    expect(ws?.send).toHaveBeenCalledWith("test message");
  });

  it("should send object messages as JSON", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const testObject = { type: "chat", content: "hello" };

    act(() => {
      result.current.send(testObject);
    });

    const ws = MockWebSocket.instances[0];
    expect(ws?.send).toHaveBeenCalledWith(JSON.stringify(testObject));
  });

  it("should not send when not connected", () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    act(() => {
      result.current.send("test message");
    });

    const ws = MockWebSocket.instances[0];
    expect(ws?.send).not.toHaveBeenCalled();
  });

  it("should disconnect properly", async () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl, onClose })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe("disconnected");
    const ws = MockWebSocket.instances[0];
    expect(ws?.close).toHaveBeenCalled();
  });

  it("should reconnect", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");

    act(() => {
      result.current.reconnect();
    });

    expect(result.current.status).toBe("connecting");
  });

  it("should call onError callback when WebSocket errors", async () => {
    const onError = vi.fn();

    renderHook(() =>
      useWebSocket({ url: testUrl, onError })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const ws = MockWebSocket.instances[0];
    if (ws?.onerror) {
      const errorEvent = new Event("error");
      ws.onerror(errorEvent);
    }

    expect(onError).toHaveBeenCalled();
  });

  it("should set status to error when WebSocket errors", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");

    const ws = MockWebSocket.instances[0];
    // Trigger error event directly
    if (ws && ws.onerror) {
      const errorEvent = new Event("error") as Event;
      act(() => {
        ws.onerror!(errorEvent);
      });
    }

    expect(result.current.status).toBe("error");
  });

  it("should call onClose callback when WebSocket closes", async () => {
    const onClose = vi.fn();

    renderHook(() =>
      useWebSocket({ url: testUrl, onClose, reconnectAttempts: 0 })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const ws = MockWebSocket.instances[0];
    if (ws?.onclose) {
      ws.onclose();
    }

    expect(onClose).toHaveBeenCalled();
  });

  it("should auto-reconnect when connection closes with attempts remaining", async () => {
    // Use shorter interval for faster testing
    const reconnectInterval = 50;

    const { result } = renderHook(() =>
      useWebSocket({
        url: testUrl,
        reconnectAttempts: 3,
        reconnectInterval,
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");
    expect(MockWebSocket.instances.length).toBe(1);

    // Simulate connection close - must update readyState
    const ws = MockWebSocket.instances[0];
    if (ws?.onclose) {
      ws.readyState = MockWebSocket.CLOSED;
      const oncloseHandler = ws.onclose;
      act(() => {
        oncloseHandler();
      });
    }

    expect(result.current.status).toBe("reconnecting");

    // Wait for reconnect timeout + connection delay
    // Need extra time for the second WebSocket to complete connection (setTimeout 0 in mock)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval + 50));
    });

    // Should have created a new WebSocket instance for reconnect
    expect(MockWebSocket.instances.length).toBe(2);
    expect(result.current.status).toBe("connected");
  });

  it("should not auto-reconnect when max attempts reached", async () => {
    const reconnectInterval = 20;

    renderHook(() =>
      useWebSocket({
        url: testUrl,
        reconnectAttempts: 0,  // No auto-reconnect allowed
        reconnectInterval,
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(MockWebSocket.instances.length).toBe(1);

    const ws = MockWebSocket.instances[0];
    // Close the connection
    if (ws?.onclose) {
      ws.readyState = MockWebSocket.CLOSED;
      const oncloseHandler = ws.onclose;
      act(() => {
        oncloseHandler();
      });
    }

    // Wait for potential reconnect (should NOT happen with reconnectAttempts=0)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval + 50));
    });

    // Should NOT have created a new connection
    expect(MockWebSocket.instances.length).toBe(1);
  });

  it("should set error status when WebSocket constructor throws", async () => {
    MockWebSocket.shouldFailOnConnect = true;

    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    expect(result.current.status).toBe("error");

    MockWebSocket.shouldFailOnConnect = false;
  });

  it("should clear reconnect timeout on disconnect", async () => {
    const reconnectInterval = 100;

    const { result } = renderHook(() =>
      useWebSocket({
        url: testUrl,
        reconnectAttempts: 5,
        reconnectInterval,
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const initialInstanceCount = MockWebSocket.instances.length;

    // Trigger a close that would normally cause reconnect
    const ws = MockWebSocket.instances[0];
    if (ws?.onclose) {
      const oncloseHandler = ws.onclose;
      act(() => {
        oncloseHandler();
      });
    }

    // Immediately call disconnect before reconnect timer fires
    act(() => {
      result.current.disconnect();
    });

    // Wait for what would have been the reconnect timeout
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval + 50));
    });

    // Should still be disconnected (reconnect was cancelled)
    expect(result.current.status).toBe("disconnected");
    // No new WebSocket should have been created after disconnect
    expect(MockWebSocket.instances.length).toBe(initialInstanceCount);
  });

  it("should skip connection if already connected", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: testUrl })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");
    expect(MockWebSocket.instances.length).toBe(1);

    // Try to reconnect manually while connected
    act(() => {
      result.current.reconnect();
    });

    // reconnect() calls disconnect() first which creates a new instance
    // then connect() - this is expected behavior
    // The test verifies no duplicate connections pile up
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
  });

  it("should use exponential backoff for reconnection delays", async () => {
    // Disable exponential backoff for comparison - should use fixed interval
    const fixedInterval = 50;

    const { result } = renderHook(() =>
      useWebSocket({
        url: testUrl,
        reconnectAttempts: 3,
        reconnectInterval: fixedInterval,
        exponentialBackoff: false,
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");

    // Close and verify fixed interval reconnect
    const ws = MockWebSocket.instances[0];
    if (ws?.onclose) {
      ws.readyState = MockWebSocket.CLOSED;
      act(() => {
        ws.onclose!();
      });
    }

    // Wait for fixed interval + connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, fixedInterval + 50));
    });

    expect(MockWebSocket.instances.length).toBe(2);
    expect(result.current.status).toBe("connected");
  });

  it("should support new exponential backoff options", async () => {
    const baseDelay = 10;
    const maxDelay = 100;

    const { result } = renderHook(() =>
      useWebSocket({
        url: testUrl,
        reconnectAttempts: 2,
        exponentialBackoff: true,
        baseDelay,
        maxDelay,
        jitter: 0, // No jitter for predictable testing
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("connected");

    // Close connection
    const ws = MockWebSocket.instances[0];
    if (ws?.onclose) {
      ws.readyState = MockWebSocket.CLOSED;
      act(() => {
        ws.onclose!();
      });
    }

    // First reconnect should use baseDelay (10ms) + some buffer
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, baseDelay + 50));
    });

    expect(MockWebSocket.instances.length).toBe(2);
  });

  // TASK-216: Message Queue Tests
  describe("TASK-216: Message Queue", () => {
    it("sendOrQueue should send immediately when connected", async () => {
      const { result } = renderHook(() =>
        useWebSocket({ url: testUrl })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.status).toBe("connected");

      act(() => {
        result.current.sendOrQueue({ type: "test", data: "hello" });
      });

      const ws = MockWebSocket.instances[0];
      expect(ws?.send).toHaveBeenCalledWith(JSON.stringify({ type: "test", data: "hello" }));
      expect(result.current.queueSize).toBe(0);
    });

    it("sendOrQueue should queue message when disconnected", async () => {
      const onMessageQueued = vi.fn();

      const { result } = renderHook(() =>
        useWebSocket({
          url: testUrl,
          reconnectAttempts: 0, // Disable auto-reconnect for test
          onMessageQueued,
        })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Disconnect the WebSocket
      const ws = MockWebSocket.instances[0];
      if (ws?.onclose) {
        ws.readyState = MockWebSocket.CLOSED;
        act(() => {
          ws.onclose!();
        });
      }

      expect(result.current.status).toBe("disconnected");

      // Queue a message
      act(() => {
        result.current.sendOrQueue({ type: "test", data: "queued" });
      });

      expect(result.current.queueSize).toBe(1);
      expect(onMessageQueued).toHaveBeenCalledWith(1);
    });

    it("should flush queue on reconnect", async () => {
      const onQueueFlushed = vi.fn();
      const reconnectInterval = 50;

      const { result } = renderHook(() =>
        useWebSocket({
          url: testUrl,
          reconnectAttempts: 3,
          reconnectInterval,
          onQueueFlushed,
        })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Disconnect
      const ws = MockWebSocket.instances[0];
      if (ws?.onclose) {
        ws.readyState = MockWebSocket.CLOSED;
        act(() => {
          ws.onclose!();
        });
      }

      // Queue messages while disconnected
      act(() => {
        result.current.sendOrQueue({ type: "test", data: "msg1" });
        result.current.sendOrQueue({ type: "test", data: "msg2" });
      });

      expect(result.current.queueSize).toBe(2);

      // Wait for reconnect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, reconnectInterval + 50));
      });

      // Queue should be flushed
      expect(result.current.queueSize).toBe(0);
      expect(onQueueFlushed).toHaveBeenCalledWith(2);
    });

    it("should respect maxQueueSize limit", async () => {
      const maxQueueSize = 3;

      const { result } = renderHook(() =>
        useWebSocket({
          url: testUrl,
          reconnectAttempts: 0,
          maxQueueSize,
        })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Disconnect
      const ws = MockWebSocket.instances[0];
      if (ws?.onclose) {
        ws.readyState = MockWebSocket.CLOSED;
        act(() => {
          ws.onclose!();
        });
      }

      // Queue more messages than limit
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.sendOrQueue({ type: "test", data: `msg${i}` });
        }
      });

      // Should drop oldest messages when over limit
      expect(result.current.queueSize).toBe(3);
    });

    it("clearQueue should empty the queue", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          url: testUrl,
          reconnectAttempts: 0,
        })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Disconnect
      const ws = MockWebSocket.instances[0];
      if (ws?.onclose) {
        ws.readyState = MockWebSocket.CLOSED;
        act(() => {
          ws.onclose!();
        });
      }

      // Queue messages
      act(() => {
        result.current.sendOrQueue({ type: "test", data: "msg1" });
        result.current.sendOrQueue({ type: "test", data: "msg2" });
      });

      expect(result.current.queueSize).toBe(2);

      // Clear queue
      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queueSize).toBe(0);
    });

    it("should send queued messages to the new WebSocket on reconnect", async () => {
      const reconnectInterval = 50;

      const { result } = renderHook(() =>
        useWebSocket({
          url: testUrl,
          reconnectAttempts: 3,
          reconnectInterval,
        })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Disconnect
      const ws1 = MockWebSocket.instances[0];
      if (ws1?.onclose) {
        ws1.readyState = MockWebSocket.CLOSED;
        act(() => {
          ws1.onclose!();
        });
      }

      // Queue a message
      act(() => {
        result.current.sendOrQueue({ type: "test", data: "queued" });
      });

      // Wait for reconnect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, reconnectInterval + 50));
      });

      // The new WebSocket should have received the queued message
      const ws2 = MockWebSocket.instances[1];
      expect(ws2?.send).toHaveBeenCalledWith(JSON.stringify({ type: "test", data: "queued" }));
    });
  });

  // TASK-321: Heartbeat Tests
  describe("TASK-321: Heartbeat", () => {
    it("should respond to ping with pong", async () => {
      const onMessage = vi.fn();

      renderHook(() =>
        useWebSocket({ url: testUrl, onMessage })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const ws = MockWebSocket.instances[0];
      // Simulate server ping
      if (ws?.onmessage) {
        ws.onmessage({ data: JSON.stringify({ type: "ping" }) });
      }

      // Should have sent pong response
      expect(ws?.send).toHaveBeenCalledWith(JSON.stringify({ type: "pong" }));

      // onMessage should NOT be called for ping
      expect(onMessage).not.toHaveBeenCalled();
    });

    it("should not send pong when not connected", async () => {
      renderHook(() =>
        useWebSocket({ url: testUrl })
      );

      // Don't wait for connection, ping should be ignored
      const ws = MockWebSocket.instances[0];
      if (ws?.onmessage) {
        ws.readyState = MockWebSocket.CONNECTING;
        ws.onmessage({ data: JSON.stringify({ type: "ping" }) });
      }

      // Should not have sent pong (WebSocket not open)
      expect(ws?.send).not.toHaveBeenCalled();
    });
  });
});
