/**
 * BookmarkJumpDialog Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BookmarkJumpDialog } from "./BookmarkJumpDialog";

// Mock API
const mockListAllBookmarks = vi.fn();
vi.mock("@/api/client", () => ({
  listAllBookmarks: () => mockListAllBookmarks(),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "bookmark.jumpTitle": "Jump to Bookmark",
        "bookmark.jumpDescription": "Select a bookmark to jump to that message",
        "bookmark.searchPlaceholder": "Search bookmarks...",
        "bookmark.searchLabel": "Search bookmarks",
        "bookmark.noResults": "No bookmarks found",
        "bookmark.noBookmarks": "No bookmarks yet",
        "bookmark.listLabel": "Bookmark list",
        "common.loading": "Loading...",
      };
      return translations[key] || key;
    },
  }),
}));

const mockBookmarks = [
  {
    id: "bm-1",
    message_id: "msg-1",
    session_id: "sess-1",
    message_content: "This is a test message content for bookmark 1",
    message_role: "user" as const,
    note: "Test note 1",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "bm-2",
    message_id: "msg-2",
    session_id: "sess-1",
    message_content: "This is another test message content for bookmark 2",
    message_role: "assistant" as const,
    note: "Second note",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "bm-3",
    message_id: "msg-3",
    session_id: "sess-2",
    message_content: "Message in another session",
    message_role: "user" as const,
    note: "Important note",
    created_at: "2024-01-03T00:00:00Z",
  },
];

describe("BookmarkJumpDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnJumpToBookmark = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    mockListAllBookmarks.mockResolvedValue([]);
    render(
      <BookmarkJumpDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    expect(screen.queryByText("Jump to Bookmark")).not.toBeInTheDocument();
  });

  it("renders dialog when open", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Jump to Bookmark")).toBeInTheDocument();
    });
    expect(screen.getByText("Select a bookmark to jump to that message")).toBeInTheDocument();
  });

  it("shows loading state", async () => {
    mockListAllBookmarks.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays bookmarks after loading", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/This is a test message content/)).toBeInTheDocument();
    });

    // Check message previews are displayed
    // Notes are displayed with emoji prefix
    expect(screen.getByText(/Test note 1/)).toBeInTheDocument();
    expect(screen.getByText(/Important note/)).toBeInTheDocument();
  });

  it("filters bookmarks by search query", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/This is a test message content/)).toBeInTheDocument();
    });

    // Search for "another session"
    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, { target: { value: "another session" } });

    // Should show message from another session
    await waitFor(() => {
      expect(screen.getByText(/Message in another session/)).toBeInTheDocument();
    });

    // Should not show "Test note 1" (from first bookmark)
    expect(screen.queryByText(/Test note 1/)).not.toBeInTheDocument();
  });

  it("shows no results message when search has no matches", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/This is a test message content/)).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText("No bookmarks found")).toBeInTheDocument();
    });
  });

  it("shows no bookmarks message when list is empty", async () => {
    mockListAllBookmarks.mockResolvedValue([]);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No bookmarks yet")).toBeInTheDocument();
    });
  });

  it("calls onJumpToBookmark when bookmark is selected", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Test note 1/)).toBeInTheDocument();
    });

    // Click on first bookmark
    const bookmarkButton = screen.getByText(/Test note 1/).closest("button");
    if (bookmarkButton) {
      fireEvent.click(bookmarkButton);
    }

    expect(mockOnJumpToBookmark).toHaveBeenCalledWith("sess-1", "msg-1");
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("searches in note content", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/This is a test message content/)).toBeInTheDocument();
    });

    // Search for "important" (in note)
    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, { target: { value: "important" } });

    await waitFor(() => {
      expect(screen.getByText(/Important note/)).toBeInTheDocument();
    });

    // Should not show bookmarks without "important"
    expect(screen.queryByText(/Test note 1/)).not.toBeInTheDocument();
  });

  it("searches in message content", async () => {
    mockListAllBookmarks.mockResolvedValue(mockBookmarks);
    render(
      <BookmarkJumpDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onJumpToBookmark={mockOnJumpToBookmark}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/This is a test message content/)).toBeInTheDocument();
    });

    // Search for message content
    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, { target: { value: "another session" } });

    await waitFor(() => {
      expect(screen.getByText(/Message in another session/)).toBeInTheDocument();
    });

    // Should not show bookmarks from other sessions
    expect(screen.queryByText(/Test note 1/)).not.toBeInTheDocument();
  });
});
