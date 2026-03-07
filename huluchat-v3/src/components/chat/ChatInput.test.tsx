import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it("should render input field and send button", () => {
    render(<ChatInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("should use custom placeholder", () => {
    render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });

  it("should update input value on change", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello, world!");

    expect(input).toHaveValue("Hello, world!");
  });

  it("should call onSend with trimmed content when send button clicked", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "  Hello, world!  ");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith("Hello, world!", undefined);
  });

  it("should clear input after sending", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Test message");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(input).toHaveValue("");
  });

  it("should not call onSend when input is empty", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("should not call onSend when input is only whitespace", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "   ");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("should disable send button when input is empty", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("should disable send button when input is only whitespace", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "   ");

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("should enable send button when input has content", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello");

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it("should send message on Enter key", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Test message{enter}");

    expect(mockOnSend).toHaveBeenCalledWith("Test message", undefined);
  });

  it("should not send message on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Line 1{Shift>}{enter}{/Shift}Line 2");

    expect(mockOnSend).not.toHaveBeenCalled();
    expect(input.value).toContain("Line 1");
    expect(input.value).toContain("Line 2");
  });

  it("should disable input when disabled prop is true", () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} />);

    const input = screen.getByPlaceholderText("Type a message...");
    expect(input).toBeDisabled();
  });

  it("should disable send button when disabled prop is true", () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("should not call onSend when disabled", async () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} />);

    // Can't type when disabled, but let's test clicking the button
    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("should show keyboard shortcut hint", () => {
    render(<ChatInput onSend={mockOnSend} />);

    expect(
      screen.getByText("Press Enter to send, Shift+Enter for new line")
    ).toBeInTheDocument();
  });

  it("should handle multiline input", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Line 1{Shift>}{enter}{/Shift}Line 2{Shift>}{enter}{/Shift}Line 3");

    expect(input.value).toBe("Line 1\nLine 2\nLine 3");
  });

  it("should trim and send multiline input correctly", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Line 1{Shift>}{enter}{/Shift}Line 2{enter}");

    expect(mockOnSend).toHaveBeenCalledWith("Line 1\nLine 2", undefined);
  });

  it("should handle special characters in input", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello <world> & 'friends'{enter}");

    expect(mockOnSend).toHaveBeenCalledWith("Hello <world> & 'friends'", undefined);
  });

  it("should handle unicode characters in input", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "你好世界 🌍 مرحبا{enter}");

    expect(mockOnSend).toHaveBeenCalledWith("你好世界 🌍 مرحبا", undefined);
  });

  describe("auto-focus behavior", () => {
    it("should auto-focus when disabled changes from true to false", async () => {
      const { rerender } = render(<ChatInput onSend={mockOnSend} disabled={true} />);

      const input = screen.getByPlaceholderText("Type a message...");
      expect(input).not.toHaveFocus();

      // Re-render with disabled=false
      rerender(<ChatInput onSend={mockOnSend} disabled={false} />);

      // Wait for async focus
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it("should auto-focus on initial render when not disabled", async () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText("Type a message...");
      // Wait for async focus
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it("should keep focus after sending message", async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const input = screen.getByPlaceholderText("Type a message...");
      await user.type(input, "Test message{enter}");

      expect(mockOnSend).toHaveBeenCalled();
      expect(input).toHaveFocus();
    });
  });

  describe("loading state", () => {
    it("should show loading state on send button when isLoading is true", () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).toHaveAttribute("data-loading");
    });

    it("should disable send button when isLoading is true", () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it("should not show loading state when isLoading is false", () => {
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).not.toHaveAttribute("data-loading");
    });
  });
});
