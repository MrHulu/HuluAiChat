import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatView } from "./ChatView";
import type { Message, Model } from "@/api/client";
import type { ConnectionStatus } from "@/hooks/useWebSocket";

// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Mock hooks
const mockSendMessage = vi.fn();
const mockSetModel = vi.fn();

let mockConnectionStatus: ConnectionStatus = "connected";
let mockIsLoading = false;
let mockMessages: Message[] = [];
let mockStreamingMessage: { id: string; content: string } | null = null;
let mockCurrentModel = "gpt-4";
let mockModels: Model[] = [];
let mockIsLoadingModels = false;

vi.mock("@/hooks", () => ({
  useChat: vi.fn(() => ({
    messages: mockMessages,
    streamingMessage: mockStreamingMessage,
    connectionStatus: mockConnectionStatus,
    sendMessage: mockSendMessage,
    isLoading: mockIsLoading,
  })),
  useModel: vi.fn(() => ({
    currentModel: mockCurrentModel,
    models: mockModels,
    setModel: mockSetModel,
    isLoading: mockIsLoadingModels,
    parameters: { temperature: 0.7, top_p: 1.0, max_tokens: 4096 },
  })),
}));

// Mock @tanstack/react-virtual (used by MessageList)
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => []),
    getTotalSize: vi.fn(() => 0),
    measureElement: vi.fn(),
  })),
}));

// Mock react-markdown and related plugins (used by MessageItem)
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: vi.fn(),
}));

vi.mock("rehype-highlight", () => ({
  default: vi.fn(),
}));

vi.mock("highlight.js/lib/core", () => ({
  default: {
    registerLanguage: vi.fn(),
  },
}));

vi.mock("highlight.js/lib/languages/javascript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/typescript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/python", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/json", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/bash", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/css", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/sql", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/markdown", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/xml", () => ({ default: {} }));

// Mock RAG components
vi.mock("@/components/rag", () => ({
  RAGPanel: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="rag-panel" data-disabled={disabled}>
      Upload a document
    </div>
  ),
}));

const createMessage = (
  role: "user" | "assistant",
  content: string,
  id = "msg-1"
): Message => ({
  id,
  session_id: "session-1",
  role,
  content,
  created_at: "2024-01-01T00:00:00Z",
});

const createModel = (id: string, name: string): Model => ({
  id,
  name,
  provider: "openai",
});

describe("ChatView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectionStatus = "connected";
    mockIsLoading = false;
    mockMessages = [];
    mockStreamingMessage = null;
    mockCurrentModel = "gpt-4";
    mockModels = [createModel("gpt-4", "GPT-4"), createModel("gpt-3.5-turbo", "GPT-3.5 Turbo")];
    mockIsLoadingModels = false;
  });

  describe("Connection Status Indicator", () => {
    it("should show 'Connected' when connected", () => {
      mockConnectionStatus = "connected";
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("should show 'Connecting...' when connecting", () => {
      mockConnectionStatus = "connecting";
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });

    it("should show 'Disconnected' when disconnected", () => {
      mockConnectionStatus = "disconnected";
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("should show 'Connection Error' on error status", () => {
      mockConnectionStatus = "error";
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Connection Error")).toBeInTheDocument();
    });
  });

  describe("Session State", () => {
    it("should show 'Select or create a session' when no session", () => {
      render(<ChatView sessionId={null} />);

      expect(screen.getByText("Select or create a session")).toBeInTheDocument();
    });

    it("should show 'Chat' when session is selected", () => {
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Chat")).toBeInTheDocument();
    });

    it("should show model name when session is selected", () => {
      render(<ChatView sessionId="session-1" />);

      // Model selector should show current model name
      expect(screen.getByText("GPT-4")).toBeInTheDocument();
    });

    it("should not show model selector when no session", () => {
      render(<ChatView sessionId={null} />);

      expect(screen.queryByText("GPT-4")).not.toBeInTheDocument();
    });
  });

  describe("Input State", () => {
    it("should disable input when no session", () => {
      render(<ChatView sessionId={null} />);

      const input = screen.getByPlaceholderText("Select a session to start chatting...");
      expect(input).toBeDisabled();
    });

    it("should show correct placeholder when no session", () => {
      render(<ChatView sessionId={null} />);

      expect(screen.getByPlaceholderText("Select a session to start chatting...")).toBeInTheDocument();
    });

    it("should show correct placeholder when session is selected", () => {
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    });

    it("should disable input when disconnected", () => {
      mockConnectionStatus = "disconnected";
      render(<ChatView sessionId="session-1" />);

      const input = screen.getByPlaceholderText("Type a message...");
      expect(input).toBeDisabled();
    });

    it("should disable input when loading", () => {
      mockIsLoading = true;
      render(<ChatView sessionId="session-1" />);

      const input = screen.getByPlaceholderText("Type a message...");
      expect(input).toBeDisabled();
    });

    it("should enable input when connected and not loading", () => {
      mockConnectionStatus = "connected";
      mockIsLoading = false;
      render(<ChatView sessionId="session-1" />);

      const input = screen.getByPlaceholderText("Type a message...");
      expect(input).not.toBeDisabled();
    });
  });

  describe("Message Sending", () => {
    it("should send message with current model when send button clicked", async () => {
      render(<ChatView sessionId="session-1" />);

      const input = screen.getByPlaceholderText("Type a message...");
      fireEvent.change(input, { target: { value: "Hello AI" } });

      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith("Hello AI", "gpt-4", {
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 4096,
      }, undefined);
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no messages", () => {
      mockMessages = [];
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    });
  });

  describe("Messages Display", () => {
    it("should render messages component when there are messages", () => {
      mockMessages = [
        createMessage("user", "Hello", "msg-1"),
        createMessage("assistant", "Hi there!", "msg-2"),
      ];
      const { container } = render(<ChatView sessionId="session-1" />);

      // Component should render the message list
      const messageList = container.querySelector(".flex-1.overflow-y-auto");
      expect(messageList).toBeInTheDocument();
    });

    it("should render streaming message component", () => {
      mockStreamingMessage = { id: "stream-1", content: "AI is thinking..." };
      const { container } = render(<ChatView sessionId="session-1" />);

      // Component should render the message list with streaming message
      const messageList = container.querySelector(".flex-1.overflow-y-auto");
      expect(messageList).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined models array", () => {
      mockModels = [];
      render(<ChatView sessionId="session-1" />);

      expect(screen.getByText("Chat")).toBeInTheDocument();
    });

    it("should handle session ID change", () => {
      const { rerender } = render(<ChatView sessionId="session-1" />);
      expect(screen.getByText("Chat")).toBeInTheDocument();

      rerender(<ChatView sessionId="session-2" />);
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });

    it("should handle transitioning from no session to session", () => {
      const { rerender } = render(<ChatView sessionId={null} />);
      expect(screen.getByText("Select or create a session")).toBeInTheDocument();

      rerender(<ChatView sessionId="session-1" />);
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });
  });

  describe("RAG Panel Integration", () => {
    it("should show RAG toggle button when session is selected", () => {
      render(<ChatView sessionId="session-1" />);

      // Button has aria-label="Documents"
      expect(screen.getByLabelText("Documents")).toBeInTheDocument();
    });

    it("should not show RAG toggle button when no session", () => {
      render(<ChatView sessionId={null} />);

      expect(screen.queryByLabelText("Documents")).not.toBeInTheDocument();
    });

    it("should toggle RAG panel when RAG button clicked", () => {
      render(<ChatView sessionId="session-1" />);

      const ragButton = screen.getByLabelText("Documents");

      // Initially RAG panel is hidden
      expect(screen.queryByTestId("rag-panel")).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(ragButton);

      // RAG panel should be visible
      expect(screen.getByTestId("rag-panel")).toBeInTheDocument();

      // Click to close
      fireEvent.click(ragButton);

      // RAG panel should be hidden again
      expect(screen.queryByTestId("rag-panel")).not.toBeInTheDocument();
    });

    it("should show RAG button as active when panel is open", () => {
      render(<ChatView sessionId="session-1" />);

      const ragButton = screen.getByLabelText("Documents");

      // Initially not active
      expect(ragButton).not.toHaveAttribute("aria-pressed", "true");

      // Click to open
      fireEvent.click(ragButton);

      // Now active
      expect(ragButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});
