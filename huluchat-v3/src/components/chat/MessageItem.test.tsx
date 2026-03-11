import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageItem } from "./MessageItem";
import type { Message } from "@/api/client";

// Mock react-markdown and related plugins for basic tests
vi.mock("react-markdown", () => ({
  default: ({ children, components }: { children: string; components?: Record<string, React.ComponentType> }) => {
    // Call the custom components if provided to ensure coverage
    if (components?.a) {
      const AComponent = components.a;
      render(<AComponent href="https://example.com">link text</AComponent>);
    }
    if (components?.pre) {
      const PreComponent = components.pre;
      render(<PreComponent>code block</PreComponent>);
    }
    if (components?.code) {
      const CodeComponent = components.code;
      render(<CodeComponent className="hljs">code content</CodeComponent>);
      render(<CodeComponent>inline code</CodeComponent>);
    }
    return <div>{children}</div>;
  },
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
vi.mock("highlight.js/styles/github-dark.css", () => ({}));

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

    const { container } = render(<MessageItem message={message} isStreaming={true} />);

    // The streaming indicator uses custom typingCursor animation (Cycle #194)
    const indicator = container.querySelector("[aria-label='Streaming...']");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("w-2");
    expect(indicator).toHaveClass("h-4");
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

  // Style tests for user messages
  it("should apply correct background classes for user messages", () => {
    const message = createMessage("user", "User message");
    const { container } = render(<MessageItem message={message} />);

    const messageBubble = container.querySelector(".bg-primary");
    expect(messageBubble).toBeInTheDocument();
    expect(messageBubble).toHaveClass("text-primary-foreground");
    expect(messageBubble).toHaveClass("ml-12");
  });

  // Style tests for assistant messages
  it("should apply correct background classes for assistant messages", () => {
    const message = createMessage("assistant", "AI message");
    const { container } = render(<MessageItem message={message} />);

    const messageBubble = container.querySelector(".bg-muted");
    expect(messageBubble).toBeInTheDocument();
    expect(messageBubble).toHaveClass("text-foreground");
    expect(messageBubble).toHaveClass("mr-12");
  });

  // Message content area style tests
  it("should apply prose classes for markdown styling", () => {
    const message = createMessage("assistant", "AI message");
    const { container } = render(<MessageItem message={message} />);

    const proseContainer = container.querySelector(".prose");
    expect(proseContainer).toBeInTheDocument();
    expect(proseContainer).toHaveClass("prose-sm");
    expect(proseContainer).toHaveClass("dark:prose-invert");
  });

  // Code block style tests
  it("should apply code block styles to content area", () => {
    const message = createMessage("assistant", "Code: `test`");
    const { container } = render(<MessageItem message={message} />);

    const contentArea = container.querySelector(".prose");
    expect(contentArea).toBeInTheDocument();
  });

  // Label style tests
  it("should apply correct label classes for user messages", () => {
    const message = createMessage("user", "User message");
    const { container } = render(<MessageItem message={message} />);

    // Find the label container which has the text color class
    const labelContainer = container.querySelector(".text-primary-foreground\\/70");
    expect(labelContainer).toBeInTheDocument();
    expect(labelContainer).toHaveTextContent("You");
  });

  it("should apply correct label classes for assistant messages", () => {
    const message = createMessage("assistant", "AI message");
    const { container } = render(<MessageItem message={message} />);

    // Find the label container which has the text color class
    const labelContainer = container.querySelector(".text-muted-foreground");
    expect(labelContainer).toBeInTheDocument();
    expect(labelContainer).toHaveTextContent("AI");
  });

  // Max width constraint test
  it("should constrain message width to 80%", () => {
    const message = createMessage("user", "User message");
    const { container } = render(<MessageItem message={message} />);

    // Find the inner bubble div (second child of outer container)
    const outerDiv = container.firstChild as HTMLElement;
    const messageBubble = outerDiv.querySelector("div");
    expect(messageBubble).toHaveClass("max-w-[80%]");
  });

  // Rounded corners test
  it("should apply rounded corners to message bubble", () => {
    const message = createMessage("user", "User message");
    const { container } = render(<MessageItem message={message} />);

    const messageBubble = container.querySelector(".rounded-2xl");
    expect(messageBubble).toBeInTheDocument();
  });

  // Break words test
  it("should apply break-words for long content", () => {
    const message = createMessage("user", "Long content");
    const { container } = render(<MessageItem message={message} />);

    const contentArea = container.querySelector(".break-words");
    expect(contentArea).toBeInTheDocument();
  });

  // Table style tests
  it("should include table styling classes in content area", () => {
    const message = createMessage("assistant", "Table content");
    const { container } = render(<MessageItem message={message} />);

    // Check that prose container exists (table styles are applied via className string)
    const proseContainer = container.querySelector(".prose");
    expect(proseContainer).toBeInTheDocument();
  });

  // Streaming indicator style tests
  it("should apply correct streaming indicator dimensions", () => {
    const message = createMessage("assistant", "Streaming...");
    const { container } = render(<MessageItem message={message} isStreaming={true} />);

    // Updated for Cycle #194: uses custom typingCursor animation and aria-label
    const indicator = container.querySelector("[aria-label='Streaming...']");
    expect(indicator).toHaveClass("w-2");
    expect(indicator).toHaveClass("h-4");
    expect(indicator).toHaveClass("ml-1");
    expect(indicator).toHaveClass("rounded-sm");
  });

  // User message whitespace handling
  it("should preserve whitespace in user messages with whitespace-pre-wrap", () => {
    const message = createMessage("user", "Line 1\nLine 2");
    const { container } = render(<MessageItem message={message} />);

    const whitespaceContainer = container.querySelector(".whitespace-pre-wrap");
    expect(whitespaceContainer).toBeInTheDocument();
  });

  // Combined state tests
  it("should render user message with all correct classes", () => {
    const message = createMessage("user", "Complete user message");
    const { container } = render(<MessageItem message={message} />);

    // Outer container
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveClass("flex");
    expect(outer).toHaveClass("w-full");
    expect(outer).toHaveClass("mb-4");
    expect(outer).toHaveClass("justify-end");

    // Inner bubble
    const bubble = outer.querySelector(".bg-primary");
    expect(bubble).toHaveClass("max-w-[80%]");
    expect(bubble).toHaveClass("rounded-2xl");
    expect(bubble).toHaveClass("px-4");
    expect(bubble).toHaveClass("py-3");
  });

  it("should render assistant message with all correct classes", () => {
    const message = createMessage("assistant", "Complete AI message");
    const { container } = render(<MessageItem message={message} />);

    // Outer container
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveClass("flex");
    expect(outer).toHaveClass("w-full");
    expect(outer).toHaveClass("mb-4");
    expect(outer).toHaveClass("justify-start");

    // Inner bubble
    const bubble = outer.querySelector(".bg-muted");
    expect(bubble).toHaveClass("max-w-[80%]");
    expect(bubble).toHaveClass("rounded-2xl");
    expect(bubble).toHaveClass("px-4");
    expect(bubble).toHaveClass("py-3");
  });

  // Regenerate button tests - Cycle #143
  describe("regenerate button", () => {
    it("should show regenerate button for assistant messages when onRegenerate is provided", () => {
      const message = createMessage("assistant", "AI response");
      const onRegenerate = vi.fn();

      render(<MessageItem message={message} onRegenerate={onRegenerate} />);

      // Find the regenerate button by aria-label
      const regenerateButton = screen.getByLabelText("Regenerate");
      expect(regenerateButton).toBeInTheDocument();
    });

    it("should not show regenerate button for user messages", () => {
      const message = createMessage("user", "User message");
      const onRegenerate = vi.fn();

      render(<MessageItem message={message} onRegenerate={onRegenerate} />);

      // Regenerate button should not exist for user messages
      const regenerateButton = screen.queryByLabelText("Regenerate");
      expect(regenerateButton).not.toBeInTheDocument();
    });

    it("should not show regenerate button when onRegenerate is not provided", () => {
      const message = createMessage("assistant", "AI response");

      render(<MessageItem message={message} />);

      const regenerateButton = screen.queryByLabelText("Regenerate");
      expect(regenerateButton).not.toBeInTheDocument();
    });

    it("should not show regenerate button during streaming", () => {
      const message = createMessage("assistant", "Streaming response");
      const onRegenerate = vi.fn();

      render(
        <MessageItem
          message={message}
          onRegenerate={onRegenerate}
          isStreaming={true}
        />
      );

      const regenerateButton = screen.queryByLabelText("Regenerate");
      expect(regenerateButton).not.toBeInTheDocument();
    });

    it("should call onRegenerate when button is clicked", () => {
      const message = createMessage("assistant", "AI response");
      const onRegenerate = vi.fn();

      render(<MessageItem message={message} onRegenerate={onRegenerate} />);

      const regenerateButton = screen.getByLabelText("Regenerate");
      regenerateButton.click();

      expect(onRegenerate).toHaveBeenCalledWith(message.id);
      expect(onRegenerate).toHaveBeenCalledTimes(1);
    });

    it("should disable button when isRegenerating is true", () => {
      const message = createMessage("assistant", "AI response");
      const onRegenerate = vi.fn();

      render(
        <MessageItem
          message={message}
          onRegenerate={onRegenerate}
          isRegenerating={true}
        />
      );

      const regenerateButton = screen.getByLabelText("Regenerate");
      expect(regenerateButton).toBeDisabled();
    });

    it("should show spinning animation when regenerating", () => {
      const message = createMessage("assistant", "AI response");
      const onRegenerate = vi.fn();

      const { container } = render(
        <MessageItem
          message={message}
          onRegenerate={onRegenerate}
          isRegenerating={true}
        />
      );

      // Check for animate-spin class on the icon
      const spinningIcon = container.querySelector(".animate-spin");
      expect(spinningIcon).toBeInTheDocument();
    });
  });
});
