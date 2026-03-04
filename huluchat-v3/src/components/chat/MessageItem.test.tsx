import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageItem } from "./MessageItem";
import type { Message } from "@/api/client";

// Mock react-markdown and related plugins
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: vi.fn(),
}));

vi.mock("rehype-highlight", () => ({
  default: vi.fn(),
}));

// Mock highlight.js
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

describe("MessageItem", () => {
  it("should render user message with correct styling", () => {
    const message = createMessage("user", "Hello, AI!");

    render(<MessageItem message={message} />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Hello, AI!")).toBeInTheDocument();
  });

  it("should render assistant message with correct styling", () => {
    const message = createMessage("assistant", "Hello, human!");

    render(<MessageItem message={message} />);

    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Hello, human!")).toBeInTheDocument();
  });

  it("should display user message content as plain text", () => {
    const message = createMessage("user", "Hello **world**");

    render(<MessageItem message={message} />);

    // User messages should not parse markdown
    expect(screen.getByText("Hello **world**")).toBeInTheDocument();
  });

  it("should render assistant message through markdown", () => {
    const message = createMessage("assistant", "Hello **world**");

    render(<MessageItem message={message} />);

    // Assistant messages go through react-markdown (mocked)
    expect(screen.getByText("Hello **world**")).toBeInTheDocument();
  });

  it("should show streaming indicator when isStreaming is true", () => {
    const message = createMessage("assistant", "Thinking...");

    render(<MessageItem message={message} isStreaming={true} />);

    // The streaming indicator is a span with animate-pulse class
    const container = screen.getByText("Thinking...").parentElement;
    expect(container?.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should not show streaming indicator when isStreaming is false", () => {
    const message = createMessage("assistant", "Response complete");

    render(<MessageItem message={message} isStreaming={false} />);

    const container = screen.getByText("Response complete").parentElement;
    expect(container?.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("should not show streaming indicator by default", () => {
    const message = createMessage("assistant", "Default response");

    render(<MessageItem message={message} />);

    const container = screen.getByText("Default response").parentElement;
    expect(container?.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("should handle empty content", () => {
    const message = createMessage("user", "");

    render(<MessageItem message={message} />);

    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("should handle multiline content", () => {
    const message = createMessage("user", "Line 1\nLine 2\nLine 3");

    render(<MessageItem message={message} />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it("should handle special characters in content", () => {
    const message = createMessage("user", "<script>alert('xss')</script>");

    render(<MessageItem message={message} />);

    // Should render as text, not execute as HTML
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
  });

  it("should handle code blocks in assistant message", () => {
    const message = createMessage(
      "assistant",
      "Here is code:\n```javascript\nconsole.log('hello');\n```"
    );

    render(<MessageItem message={message} />);

    // With mocked react-markdown, just check content is present
    expect(
      screen.getByText(/Here is code/)
    ).toBeInTheDocument();
  });

  it("should apply justify-end class for user messages", () => {
    const message = createMessage("user", "User message");
    const { container } = render(<MessageItem message={message} />);

    expect(container.firstChild).toHaveClass("justify-end");
  });

  it("should apply justify-start class for assistant messages", () => {
    const message = createMessage("assistant", "AI message");
    const { container } = render(<MessageItem message={message} />);

    expect(container.firstChild).toHaveClass("justify-start");
  });

  it("should handle very long content", () => {
    const longContent = "A".repeat(1000);
    const message = createMessage("user", longContent);

    render(<MessageItem message={message} />);

    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it("should handle unicode characters", () => {
    const message = createMessage("user", "你好世界 🌍 مرحبا");

    render(<MessageItem message={message} />);

    expect(screen.getByText("你好世界 🌍 مرحبا")).toBeInTheDocument();
  });
});
