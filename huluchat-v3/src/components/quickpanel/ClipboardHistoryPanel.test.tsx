/**
 * ClipboardHistoryPanel Tests
 *
 * Tests for clipboard history panel component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClipboardHistoryPanel } from "./ClipboardHistoryPanel";
import type { ClipboardHistoryItem } from "@/hooks/useClipboardHistory";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "clipboardHistory.empty": "No clipboard history",
        "clipboardHistory.emptyHint": "Copy some text to get started",
        "clipboardHistory.title": `Clipboard History (${options?.count ?? 0})`,
        "clipboardHistory.clearAll": "Clear All",
        "clipboardHistory.clearConfirm": "Clear all history?",
        "clipboardHistory.clearConfirmDesc": "This action cannot be undone",
        "clipboardHistory.clear": "Clear",
        "clipboardHistory.justNow": "Just now",
        "clipboardHistory.minutesAgo": `${options?.count ?? 0} min ago`,
        "clipboardHistory.hoursAgo": `${options?.count ?? 0}h ago`,
        "clipboardHistory.daysAgo": `${options?.count ?? 0}d ago`,
        "clipboardHistory.reuseContent": "Reuse",
        "clipboardHistory.copyResponse": "Copy",
        "common.cancel": "Cancel",
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock clipboard API
const mockClipboardWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockClipboardWriteText,
  },
});

describe("ClipboardHistoryPanel", () => {
  const mockHistory: ClipboardHistoryItem[] = [
    {
      id: "1",
      content: "Test content 1",
      response: "Test response 1",
      action: "Summarize",
      timestamp: Date.now(),
    },
    {
      id: "2",
      content: "Test content 2 that is quite long and should be truncated when displayed",
      response: "Test response 2",
      timestamp: Date.now() - 3600000, // 1 hour ago
    },
  ];

  const defaultProps = {
    history: mockHistory,
    onRemove: vi.fn(),
    onClear: vi.fn(),
    onReuseContent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty state", () => {
    it("should show empty state when no history", () => {
      render(<ClipboardHistoryPanel {...defaultProps} history={[]} />);
      expect(screen.getByText("No clipboard history")).toBeInTheDocument();
      expect(screen.getByText("Copy some text to get started")).toBeInTheDocument();
    });
  });

  describe("history list", () => {
    it("should render history items", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText("Test content 1")).toBeInTheDocument();
      expect(screen.getByText("Test response 1")).toBeInTheDocument();
    });

    it("should show action label when present", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText("Summarize")).toBeInTheDocument();
    });

    it("should display history count in title", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText(/Clipboard History \(2\)/)).toBeInTheDocument();
    });

    it("should truncate long content", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      // Content should be truncated to 50 chars
      expect(screen.getByText(/Test content 2 that is quite long/)).toBeInTheDocument();
    });
  });

  describe("time formatting", () => {
    it("should show just now for recent items", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("should show hours ago for older items", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText("1h ago")).toBeInTheDocument();
    });

    it("should show minutes ago for items minutes old", () => {
      const historyWithMins: ClipboardHistoryItem[] = [
        {
          id: "3",
          content: "Recent content",
          response: "Recent response",
          timestamp: Date.now() - 1800000, // 30 min ago
        },
      ];
      render(<ClipboardHistoryPanel {...defaultProps} history={historyWithMins} />);
      expect(screen.getByText("30 min ago")).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("should call onReuseContent when reuse button clicked", async () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);

      const reuseButtons = screen.getAllByText("Reuse");
      fireEvent.click(reuseButtons[0]);

      expect(defaultProps.onReuseContent).toHaveBeenCalledWith("Test content 1");
    });

    it("should copy response to clipboard when copy button clicked", async () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);

      const copyButtons = screen.getAllByText("Copy");
      fireEvent.click(copyButtons[0]);

      expect(mockClipboardWriteText).toHaveBeenCalledWith("Test response 1");
    });

    it("should call onRemove when remove button clicked", async () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);

      // Find X buttons (they only have an icon, no text)
      const removeButtons = screen.getAllByRole("button").filter(
        (btn) => btn.querySelector("svg.lucide-x")
      );
      fireEvent.click(removeButtons[0]);

      expect(defaultProps.onRemove).toHaveBeenCalledWith("1");
    });

    it("should show clear all button", () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("should open confirm dialog when clear all clicked", async () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Clear All"));

      await waitFor(() => {
        expect(screen.getByText("Clear all history?")).toBeInTheDocument();
      });
    });

    it("should call onClear when confirm clear clicked", async () => {
      render(<ClipboardHistoryPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Clear All"));

      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Clear"));

      expect(defaultProps.onClear).toHaveBeenCalled();
    });
  });

  describe("compact mode", () => {
    it("should apply compact class when compact prop is true", () => {
      const { container } = render(<ClipboardHistoryPanel {...defaultProps} compact />);
      expect(container.querySelector(".max-h-\\[200px\\]")).toBeInTheDocument();
    });

    it("should use normal height when compact is false", () => {
      const { container } = render(<ClipboardHistoryPanel {...defaultProps} compact={false} />);
      expect(container.querySelector(".max-h-\\[300px\\]")).toBeInTheDocument();
    });
  });
});
