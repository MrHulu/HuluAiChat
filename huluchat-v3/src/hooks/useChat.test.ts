import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChat } from "./useChat";

// Mock getSessionMessages and createChatWebSocket
vi.mock("@/api/client", () => ({
  getSessionMessages: vi.fn(),
  getChatWebSocketUrl: vi.fn((sessionId: string) => `ws://localhost:8765/api/chat/ws/${sessionId}`),
}));

// Mock useWebSocket hook
vi.mock("./useWebSocket", () => ({
  useWebSocket: vi.fn(),
  ConnectionStatus: {},
}));

const mockGetSessionMessages = vi.mocked(
  await import("@/api/client").then((m) => m.getSessionMessages)
);

interface MockWebSocketReturn {
  status: string;
  send: ReturnType<typeof vi.fn>;
  sendOrQueue: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  reconnect: ReturnType<typeof vi.fn>;
  queueSize: number;
  clearQueue: ReturnType<typeof vi.fn>;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
}

describe("useChat hook", () => {
  let mockWSReturn: MockWebSocketReturn;
  let mockOnMessage: ((data: unknown) => void) | undefined;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default WebSocket mock return
    mockWSReturn = {
      status: "connected",
      send: vi.fn(),
      sendOrQueue: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      queueSize: 0,
      clearQueue: vi.fn(),
      reconnectAttempt: 0,
      maxReconnectAttempts: 10,
    };

    const mockUseWebSocket = vi.mocked(
      await import("./useWebSocket").then((m) => m.useWebSocket)
    );

    mockUseWebSocket.mockImplementation(({ onMessage }) => {
      mockOnMessage = onMessage;
      return mockWSReturn;
    });

    mockGetSessionMessages.mockResolvedValue({ messages: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockOnMessage = undefined;
  });

  it("should initialize with empty messages when no session", () => {
    const { result } = renderHook(() => useChat(null));

    expect(result.current.messages).toEqual([]);
    expect(result.current.streamingMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should load history when session changes", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        session_id: "session-1",
        role: "user" as const,
        content: "Hello",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        content: "Hi there!",
        created_at: "2024-01-01T00:00:01Z",
      },
    ];

    mockGetSessionMessages.mockResolvedValue({ messages: mockMessages });

    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    expect(mockGetSessionMessages).toHaveBeenCalledWith("session-1");
    expect(result.current.messages).toEqual(mockMessages);
  });

  it("should handle history loading error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSessionMessages.mockRejectedValue(new Error("Failed to load"));

    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    expect(result.current.messages).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it("should return connection status from WebSocket", () => {
    mockWSReturn.status = "connecting";

    const { result } = renderHook(() => useChat("session-1"));

    expect(result.current.connectionStatus).toBe("connecting");
  });

  it("should not send message when content is empty", () => {
    const { result } = renderHook(() => useChat("session-1"));

    act(() => {
      result.current.sendMessage("");
    });

    expect(mockWSReturn.sendOrQueue).not.toHaveBeenCalled();
  });

  it("should not send message when connection is not established", () => {
    mockWSReturn.status = "disconnected";

    const { result } = renderHook(() => useChat("session-1"));

    act(() => {
      result.current.sendMessage("Hello");
    });

    expect(mockWSReturn.sendOrQueue).not.toHaveBeenCalled();
  });

  it("should send message and add user message to list", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    act(() => {
      result.current.sendMessage("Hello, AI!");
    });

    // Should add user message
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Hello, AI!");

    // Should call WebSocket send
    expect(mockWSReturn.sendOrQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "message",
        content: "Hello, AI!",
      })
    );

    // Should set loading
    expect(result.current.isLoading).toBe(true);
  });

  it("should send message with model parameter", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    act(() => {
      result.current.sendMessage("Hello", "gpt-4");
    });

    expect(mockWSReturn.sendOrQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "message",
        content: "Hello",
        model: "gpt-4",
      })
    );
  });

  it("should handle stream_start message", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Simulate stream_start from WebSocket
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-123",
        });
      }
    });

    expect(result.current.streamingMessage).toEqual({
      id: "stream-123",
      content: "",
      isStreaming: true,
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("should handle stream_chunk message", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Start streaming
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-123",
        });
      }
    });

    // Add chunks
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_chunk",
          content: "Hello",
        });
      }
    });

    expect(result.current.streamingMessage?.content).toBe("Hello");

    // Add another chunk
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_chunk",
          content: " World",
        });
      }
    });

    expect(result.current.streamingMessage?.content).toBe("Hello World");
  });

  it("should handle stream_end message", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Simulate complete streaming flow
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-123",
        });
      }
    });

    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_chunk",
          content: "Hello World",
        });
      }
    });

    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_end",
        });
      }
    });

    expect(result.current.streamingMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toBe("Hello World");
    expect(result.current.messages[0].role).toBe("assistant");
  });

  it("should handle complete message (non-streaming)", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "message",
          message_id: "msg-123",
          content: "Complete response",
        });
      }
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toBe("Complete response");
    expect(result.current.messages[0].id).toBe("msg-123");
    expect(result.current.messages[0].role).toBe("assistant");
  });

  it("should handle history message from WebSocket", async () => {
    const wsHistory = [
      {
        id: "ws-msg-1",
        session_id: "session-1",
        role: "user" as const,
        content: "WS History",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "history",
          messages: wsHistory,
        });
      }
    });

    expect(result.current.messages).toEqual(wsHistory);
  });

  it("should handle error message from WebSocket", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Start streaming first
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-123",
        });
      }
    });

    expect(result.current.streamingMessage).not.toBeNull();

    // Simulate error
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "error",
          error: "Something went wrong",
        });
      }
    });

    expect(result.current.streamingMessage).toBeNull();
    expect(result.current.isLoading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("should clear messages when session becomes null", async () => {
    const { result, rerender } = renderHook(
      ({ sessionId }: { sessionId: string | null }) => useChat(sessionId),
      { initialProps: { sessionId: "session-1" } }
    );

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Add a message
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "message",
          message_id: "msg-1",
          content: "Test",
        });
      }
    });

    expect(result.current.messages.length).toBe(1);

    // Change to null session
    rerender({ sessionId: null });

    expect(result.current.messages).toEqual([]);
    expect(result.current.streamingMessage).toBeNull();
  });

  it("should switch sessions and load new history", async () => {
    const session1Messages = [
      {
        id: "msg-1",
        session_id: "session-1",
        role: "user" as const,
        content: "Session 1",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const session2Messages = [
      {
        id: "msg-2",
        session_id: "session-2",
        role: "user" as const,
        content: "Session 2",
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    mockGetSessionMessages
      .mockResolvedValueOnce({ messages: session1Messages })
      .mockResolvedValueOnce({ messages: session2Messages });

    const { result, rerender } = renderHook(
      ({ sessionId }: { sessionId: string | null }) => useChat(sessionId),
      { initialProps: { sessionId: "session-1" } }
    );

    await waitFor(() => {
      expect(result.current.messages).toEqual(session1Messages);
    });

    // Switch to session 2
    rerender({ sessionId: "session-2" });

    await waitFor(() => {
      expect(result.current.messages).toEqual(session2Messages);
    });
  });

  it("should trim whitespace from message content", async () => {
    const { result } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    act(() => {
      result.current.sendMessage("  Hello World  ");
    });

    expect(result.current.messages[0].content).toBe("Hello World");
    expect(mockWSReturn.sendOrQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Hello World",
      })
    );
  });

  // TASK-311: 测试连接断开时重置 isLoading
  it("should reset isLoading when connection is lost (TASK-311 - Bug #3 fix)", async () => {
    // Start with connected status
    mockWSReturn.status = "connected";

    const { result, rerender } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Start streaming - simulate sending a message
    act(() => {
      result.current.sendMessage("Hello");
    });

    expect(result.current.isLoading).toBe(true);

    // Simulate stream start
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-123",
        });
      }
    });

    expect(result.current.streamingMessage).not.toBeNull();
    expect(result.current.isLoading).toBe(true);

    // Simulate connection loss
    mockWSReturn.status = "disconnected";
    rerender();

    // isLoading should be reset when connection is lost
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.streamingMessage).toBeNull();
    });
  });

  it("should reset isLoading when connection error occurs (TASK-311 - Bug #3 fix)", async () => {
    // Start with connected status
    mockWSReturn.status = "connected";

    const { result, rerender } = renderHook(() => useChat("session-1"));

    await waitFor(() => {
      expect(result.current.isLoadingHistory).toBe(false);
    });

    // Start streaming - simulate sending a message
    act(() => {
      result.current.sendMessage("Hello");
    });

    expect(result.current.isLoading).toBe(true);

    // Simulate stream start
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: "stream_start",
          message_id: "stream-456",
        });
      }
    });

    expect(result.current.streamingMessage).not.toBeNull();
    expect(result.current.isLoading).toBe(true);

    // Simulate connection error
    mockWSReturn.status = "error";
    rerender();

    // isLoading should be reset when connection error occurs
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.streamingMessage).toBeNull();
    });
  });
});
