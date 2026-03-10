import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkPanel } from "./BookmarkPanel";

// Mock API client
vi.mock("@/api/client", () => ({
  getSessionBookmarks: vi.fn(),
  deleteBookmark: vi.fn(),
  exportBookmarksJSON: vi.fn(),
  exportBookmarksMarkdown: vi.fn(),
  downloadBlob: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  getSessionBookmarks,
  deleteBookmark,
  exportBookmarksJSON,
  exportBookmarksMarkdown,
  downloadBlob,
} from "@/api/client";
import { toast } from "sonner";

describe("BookmarkPanel", () => {
  const mockSessionId = "session-123";
  const mockBookmarks = [
    {
      id: "bookmark-1",
      message_id: "msg-1",
      session_id: mockSessionId,
      message_role: "user" as const,
      message_content: "Hello world, this is a test message",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "bookmark-2",
      message_id: "msg-2",
      session_id: mockSessionId,
      message_role: "assistant" as const,
      message_content: "This is a response",
      note: "Important note",
      created_at: "2024-01-01T00:01:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading state initially", async () => {
      vi.mocked(getSessionBookmarks).mockImplementation(
        () => new Promise(() => {})
      );

      render(<BookmarkPanel sessionId={mockSessionId} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has aria-live for loading state", async () => {
      vi.mocked(getSessionBookmarks).mockImplementation(
        () => new Promise(() => {})
      );

      render(<BookmarkPanel sessionId={mockSessionId} />);

      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("empty state", () => {
    it("shows empty state when no bookmarks", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce([]);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/no bookmarks/i)).toBeInTheDocument();
      });
    });
  });

  describe("bookmark list", () => {
    it("renders bookmarks when loaded", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
        expect(screen.getByText("This is a response")).toBeInTheDocument();
      });
    });

    it("shows bookmark count", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText("(2)")).toBeInTheDocument();
      });
    });

    it("renders note if present", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Important note/)).toBeInTheDocument();
      });
    });

    it("has list role with aria-label", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("list", { name: /bookmarks/i })
        ).toBeInTheDocument();
      });
    });

    it("has listitem role for each bookmark", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(2);
      });
    });
  });

  describe("navigation", () => {
    it("calls onJumpToMessage when bookmark is clicked", async () => {
      const user = userEvent.setup();
      const mockOnJumpToMessage = vi.fn();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(
        <BookmarkPanel
          sessionId={mockSessionId}
          onJumpToMessage={mockOnJumpToMessage}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      // Get the first listitem that contains "Hello world"
      const items = screen.getAllByRole("listitem");
      await user.click(items[0]);

      expect(mockOnJumpToMessage).toHaveBeenCalledWith("msg-1");
    });

    it("calls onJumpToMessage on Enter key", async () => {
      const user = userEvent.setup();
      const mockOnJumpToMessage = vi.fn();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(
        <BookmarkPanel
          sessionId={mockSessionId}
          onJumpToMessage={mockOnJumpToMessage}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const items = screen.getAllByRole("listitem");
      items[0].focus();
      await user.keyboard("{Enter}");

      expect(mockOnJumpToMessage).toHaveBeenCalledWith("msg-1");
    });

    it("calls onJumpToMessage on Space key", async () => {
      const user = userEvent.setup();
      const mockOnJumpToMessage = vi.fn();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(
        <BookmarkPanel
          sessionId={mockSessionId}
          onJumpToMessage={mockOnJumpToMessage}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const items = screen.getAllByRole("listitem");
      items[0].focus();
      await user.keyboard(" ");

      expect(mockOnJumpToMessage).toHaveBeenCalledWith("msg-1");
    });
  });

  describe("delete bookmark", () => {
    it("calls deleteBookmark when delete button is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/remove bookmark/i);
      await user.click(deleteButtons[0]);

      expect(deleteBookmark).toHaveBeenCalledWith("bookmark-1");
    });

    it("shows success toast on delete", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/remove bookmark/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("removes bookmark from list after delete", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/remove bookmark/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/Hello world/)).not.toBeInTheDocument();
      });
    });

    it("shows error toast on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(deleteBookmark).mockRejectedValueOnce(new Error("API Error"));

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/remove bookmark/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("export functionality", () => {
    it("shows export button", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });
    });

    it("opens export menu when clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByText(/json/i)).toBeInTheDocument();
        expect(screen.getByText(/markdown/i)).toBeInTheDocument();
      });
    });

    it("exports as JSON when option clicked", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["test"], { type: "application/json" });
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(exportBookmarksJSON).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "bookmarks.json",
      });

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByText(/json/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/json/i));

      await waitFor(() => {
        expect(exportBookmarksJSON).toHaveBeenCalled();
        expect(downloadBlob).toHaveBeenCalledWith(mockBlob, "bookmarks.json");
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("exports as Markdown when option clicked", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["test"], { type: "text/markdown" });
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(exportBookmarksMarkdown).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "bookmarks.md",
      });

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByText(/markdown/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/markdown/i));

      await waitFor(() => {
        expect(exportBookmarksMarkdown).toHaveBeenCalled();
        expect(downloadBlob).toHaveBeenCalledWith(mockBlob, "bookmarks.md");
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("shows error toast on export failure", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);
      vi.mocked(exportBookmarksJSON).mockRejectedValueOnce(
        new Error("Export error")
      );

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export/i }));

      await waitFor(() => {
        expect(screen.getByText(/json/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/json/i));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("animation", () => {
    it("has list enter animation on bookmark items", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        items.forEach((item) => {
          expect(item).toHaveClass("animate-list-enter");
        });
      });
    });

    it("has staggered animation delay on items", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        expect(items[0]).toHaveStyle({ animationDelay: "0ms" });
        expect(items[1]).toHaveStyle({ animationDelay: "50ms" });
      });
    });

    it("has staggered animation on export menu items", async () => {
      const user = userEvent.setup();
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export/i }));

      await waitFor(() => {
        const menuItems = document.querySelectorAll('[role="menuitem"]');
        expect(menuItems[0]).toHaveStyle({ animationDelay: "0ms" });
        expect(menuItems[1]).toHaveStyle({ animationDelay: "50ms" });
      });
    });
  });

  describe("accessibility", () => {
    it("bookmark items have tabIndex", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        items.forEach((item) => {
          expect(item).toHaveAttribute("tabIndex", "0");
        });
      });
    });

    it("bookmark items have focus visible styles", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        items.forEach((item) => {
          expect(item).toHaveClass(
            "focus-visible:outline-none",
            "focus-visible:ring-2"
          );
        });
      });
    });
  });

  describe("transitions", () => {
    it("bookmark items have transition classes", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        items.forEach((item) => {
          expect(item).toHaveClass("transition-all", "duration-200", "ease-out");
        });
      });
    });

    it("bookmark items have active scale", async () => {
      vi.mocked(getSessionBookmarks).mockResolvedValueOnce(mockBookmarks);

      render(<BookmarkPanel sessionId={mockSessionId} />);

      await waitFor(() => {
        const items = screen.getAllByRole("listitem");
        items.forEach((item) => {
          expect(item).toHaveClass("active:scale-[0.99]");
        });
      });
    });
  });
});
