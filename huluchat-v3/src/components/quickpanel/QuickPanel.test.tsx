/**
 * QuickPanel Component Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickPanel } from "./QuickPanel";
import * as apiClient from "@/api/client";
import * as hooks from "@/hooks";

// Mock dependencies
vi.mock("@/api/client", () => ({
  createSession: vi.fn(),
  createChatWebSocket: vi.fn(() => ({
    url: "ws://localhost:8765/ws/chat/test-session",
  })),
  getChatWebSocketUrl: vi.fn(
    (sessionId: string) => `ws://localhost:8765/api/chat/ws/${sessionId}`
  ),
}));

// Mock Tauri clipboard API
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  readText: vi.fn().mockRejectedValue(new Error("Clipboard not available in test")),
}));

vi.mock("@/hooks", () => ({
  useModel: vi.fn(() => ({
    currentModel: "gpt-4o-mini",
    setModel: vi.fn(),
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "deepseek-chat", name: "DeepSeek Chat" },
    ],
  })),
  useWebSocket: vi.fn(() => ({
    status: "connected",
    send: vi.fn(),
  })),
  useClipboardHistory: vi.fn(() => ({
    history: [],
    addToHistory: vi.fn(),
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
    getItem: vi.fn(),
    isEmpty: true,
    count: 0,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "quickPanel.title": "Quick Question",
        "quickPanel.placeholder": "Type a quick question...",
        "quickPanel.hint": "Enter to send, Shift+Enter for new line, Esc to close",
        "quickPanel.send": "Send",
        "quickPanel.clear": "Clear",
        "quickPanel.copy": "Copy",
        "quickPanel.copied": "Copied!",
        "quickPanel.copyFailed": "Failed to copy",
        "quickPanel.sendError": "Failed to send message",
        "quickPanel.thinking": "Thinking...",
        "quickPanel.emptyResponse": "Response will appear here",
        "quickPanel.close": "Close panel",
      };
      return translations[key] || key;
    },
  }),
}));

describe("QuickPanel", () => {
  const mockOnClose = vi.fn();
  const mockCreateSession = vi.mocked(apiClient.createSession);
  const mockUseWebSocket = vi.mocked(hooks.useWebSocket);
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    mockUseWebSocket.mockReturnValue({
      status: "connected",
      send: mockSend,
    } as unknown as ReturnType<typeof hooks.useWebSocket>);
    mockCreateSession.mockResolvedValue({
      id: "test-session-id",
      title: "New Chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(<QuickPanel isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText("Quick Question")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText("Quick Question")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a quick question...")).toBeInTheDocument();
  });

  it("should display model selector", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    const modelSelect = screen.getByRole("combobox");
    expect(modelSelect).toBeInTheDocument();
    expect(modelSelect).toHaveValue("gpt-4o-mini");
  });

  it("should close when Escape key is pressed", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should clear input when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Type a quick question...");
    await user.type(input, "Some text");
    expect(input).toHaveValue("Some text");

    const clearButton = screen.getByText("Clear");
    await user.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("should initialize with initialText prop", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} initialText="Pasted text" />);
    const input = screen.getByPlaceholderText("Type a quick question...");
    expect(input).toHaveValue("Pasted text");
  });

  it("should show send button", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("should show placeholder text", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText("Type a quick question...")).toBeInTheDocument();
  });

  it("should show hint text", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText(/Enter to send/)).toBeInTheDocument();
  });

  it("should show empty response placeholder", () => {
    render(<QuickPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText("Response will appear here")).toBeInTheDocument();
  });
});
