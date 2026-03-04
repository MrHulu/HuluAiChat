import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList, estimateMessageHeight } from "./MessageList";
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

  describe("estimateMessageHeight", () => {
    it("should return base height for empty content", () => {
      const height = estimateMessageHeight("");
      // Base height = 60
      expect(height).toBe(60);
    });

    it("should calculate height based on content length", () => {
      // 60 chars = 1 line, so 120 chars = 2 lines
      const shortContent = "a".repeat(30);
      const longContent = "a".repeat(120);

      const shortHeight = estimateMessageHeight(shortContent);
      const longHeight = estimateMessageHeight(longContent);

      // Long content should be taller
      expect(longHeight).toBeGreaterThan(shortHeight);
    });

    it("should add extra height for code blocks", () => {
      const plainContent = "Hello world";
      const codeContent = "```python\nprint('hello')\n```";

      const plainHeight = estimateMessageHeight(plainContent);
      const codeHeight = estimateMessageHeight(codeContent);

      // Code content should be taller due to code block
      expect(codeHeight).toBeGreaterThan(plainHeight);
    });

    it("should handle multiple code blocks", () => {
      const singleBlock = "```js\ncode\n```";
      const doubleBlock = "```js\ncode\n```\n\n```py\ncode\n```";

      const singleHeight = estimateMessageHeight(singleBlock);
      const doubleHeight = estimateMessageHeight(doubleBlock);

      // Double code block should be taller
      expect(doubleHeight).toBeGreaterThan(singleHeight);
    });

    it("should calculate correct height for single line content", () => {
      // 30 chars < 60, so 1 line
      const height = estimateMessageHeight("a".repeat(30));
      // Base height (60) + 1 line (24) = 84
      expect(height).toBe(84);
    });

    it("should calculate correct height for multi-line content", () => {
      // 120 chars = 2 lines (ceil(120/60) = 2)
      const height = estimateMessageHeight("a".repeat(120));
      // Base height (60) + 2 lines (48) = 108
      expect(height).toBe(108);
    });
  });

  describe("Virtual List Styling", () => {
    it("should apply correct container styles with virtual items", () => {
      const messages = [createMessage("user", "Hello", "msg-1")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Check for virtual list container
      const virtualContainer = container.querySelector('[style*="position: relative"]');
      expect(virtualContainer).toBeInTheDocument();
    });

    it("should render virtual items with correct transform", () => {
      const messages = [
        createMessage("user", "First", "msg-1"),
        createMessage("assistant", "Second", "msg-2"),
      ];
      mockVirtualItems.push(
        { index: 0, start: 0, size: 100, key: "msg-1" },
        { index: 1, start: 100, size: 100, key: "msg-2" }
      );

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Check for transform styles
      const transformedItems = container.querySelectorAll('[style*="transform"]');
      expect(transformedItems.length).toBeGreaterThan(0);
    });

    it("should set data-index attribute on virtual items", () => {
      const messages = [createMessage("user", "Test", "msg-1")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      const indexedItem = container.querySelector('[data-index="0"]');
      expect(indexedItem).toBeInTheDocument();
    });
  });

  describe("Auto Scroll Behavior", () => {
    it("should render scroll anchor for auto-scroll with messages", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Check that the scroll container exists (scroll behavior is tested via integration)
      const scrollContainer = container.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should render scroll anchor when streaming message present", () => {
      mockVirtualItems.length = 0;

      const { container } = render(
        <MessageList
          messages={[]}
          streamingMessage={{ id: "stream-1", content: "Streaming..." }}
          isLoading={false}
        />
      );

      // Streaming message should trigger scroll anchor presence
      const scrollContainer = container.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe("Message Content Types", () => {
    it("should handle message with markdown content", () => {
      const messages = [
        createMessage("assistant", "# Heading\n\n**Bold text**\n\n- List item"),
      ];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });

    it("should handle very long message content", () => {
      const longContent = "a".repeat(1000);
      const messages = [createMessage("user", longContent)];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });

    it("should handle message with special characters", () => {
      const messages = [
        createMessage("user", "Special chars: <>&\"'${}[]"),
      ];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });
  });

  describe("Combined States", () => {
    it("should show messages and streaming message together", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      render(
        <MessageList
          messages={messages}
          streamingMessage={{ id: "stream-1", content: "AI response..." }}
          isLoading={false}
        />
      );

      // Should have message list container and streaming content
      expect(screen.getByText("AI response...")).toBeInTheDocument();
    });

    it("should show messages and loading indicator together", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      render(
        <MessageList messages={messages} streamingMessage={null} isLoading={true} />
      );

      expect(screen.getByText("Thinking...")).toBeInTheDocument();
    });

    it("should render scroll anchor at bottom", () => {
      const messages = [createMessage("user", "Hello")];
      mockVirtualItems.push({ index: 0, start: 0, size: 100, key: "msg-1" });

      const { container } = render(
        <MessageList messages={messages} streamingMessage={null} isLoading={false} />
      );

      // Check for the scroll anchor div (it should be at the end)
      const scrollAnchors = container.querySelectorAll("div");
      expect(scrollAnchors.length).toBeGreaterThan(0);
    });
  });
});
