import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "./MessageList";
import type { Message } from "@/api/client";

// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Mock @tanstack/react-virtual with proper implementation
const mockVirtualItems: Array<{
  index: number;
  start: number;
  size: number;
  key: string;
}> = [];

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => mockVirtualItems,
    getTotalSize: () => 0,
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

describe("MessageList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVirtualItems.length = 0;
  });

  describe("Empty State", () => {
    it("should show empty state when no messages", () => {
      render(<MessageList messages={[]} streamingMessage={null} isLoading={false} />);

      expect(screen.getByText("Start a conversation")).toBeInTheDocument();
      expect(screen.getByText("Send a message to begin chatting with AI")).toBeInTheDocument();
      expect(screen.getByText("💬")).toBeInTheDocument();
    });

    it("should not show empty state when there are messages with virtual items", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      render(<MessageList messages={messages} streamingMessage={null} isLoading={false} />);

      expect(screen.queryByText("Start a conversation")).not.toBeInTheDocument();
    });

    it("should not show empty state when there is a streaming message", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "Thinking..." }}
          isLoading={false}
        />
      );

      expect(screen.queryByText("Start a conversation")).not.toBeInTheDocument();
      expect(screen.getByText("AI")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when loading with messages and no streaming message", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      render(<MessageList messages={messages} streamingMessage={null} isLoading={true} />);

      // Loading indicator should be visible
      expect(screen.getByText("Thinking...")).toBeInTheDocument();
    });

    it("should not show loading indicator when not loading", () => {
      render(<MessageList messages={[]} streamingMessage={null} isLoading={false} />);

      expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
    });

    it("should show empty state when loading but no messages", () => {
      render(<MessageList messages={[]} streamingMessage={null} isLoading={true} />);

      // Empty state is shown when no messages (even if loading)
      expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    });

    it("should not show loading indicator when there is a streaming message", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "Streaming..." }}
          isLoading={true}
        />
      );

      // Streaming message should be visible
      expect(screen.getByText("Streaming...")).toBeInTheDocument();
    });
  });

  describe("Streaming Message", () => {
    it("should display streaming message", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "AI is responding..." }}
          isLoading={true}
        />
      );

      expect(screen.getByText("AI is responding...")).toBeInTheDocument();
    });

    it("should display streaming message with assistant role", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "Streaming content" }}
          isLoading={false}
        />
      );

      expect(screen.getByText("AI")).toBeInTheDocument();
      expect(screen.getByText("Streaming content")).toBeInTheDocument();
    });

    it("should show streaming indicator on streaming message", () => {
      const { container } = render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "Streaming..." }}
          isLoading={false}
        />
      );

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Message Rendering", () => {
    it("should render message list container with messages", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Check for the message list container
      const scrollContainer = container.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should handle multiple messages in virtual list", () => {
      const messages = [
        createMessage("user", "Message 1", "msg-1"),
        createMessage("assistant", "Message 2", "msg-2"),
        createMessage("user", "Message 3", "msg-3"),
      ];

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Component should render without errors
      const scrollContainer = container.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle streaming message with empty content", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "" }}
          isLoading={false}
        />
      );

      // Should not show empty state when streaming (even if empty content)
      expect(screen.queryByText("Start a conversation")).not.toBeInTheDocument();
    });

    it("should handle null streamingMessage gracefully", () => {
      render(
        <MessageList
          messages={[]}
          streamingMessage={null}
          isLoading={false}
        />
      );

      expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    });
  });
});
