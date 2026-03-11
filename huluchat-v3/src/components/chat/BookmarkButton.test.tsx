import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkButton } from "./BookmarkButton";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "chat.addBookmark": "Add bookmark",
        "chat.removeBookmark": "Remove bookmark",
        "chat.bookmarkAdded": "Bookmark added",
        "chat.bookmarkRemoved": "Bookmark removed",
        "chat.bookmarkError": "Failed to update bookmark",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock API client
vi.mock("@/api/client", () => ({
  createBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createBookmark, deleteBookmark } from "@/api/client";
import { toast } from "sonner";

describe("BookmarkButton", () => {
  const mockMessageId = "msg-123";
  const mockSessionId = "session-456";
  const mockBookmarkId = "bookmark-789";
  const mockOnBookmarkChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders unbookmarked state by default", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Add bookmark");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("renders bookmarked state when isBookmarked is true", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Remove bookmark");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("is hidden by default when not bookmarked", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-0");
    });

    it("is visible when bookmarked", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-100");
    });
  });

  describe("adding bookmark", () => {
    it("calls createBookmark when clicked on unbookmarked message", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockResolvedValueOnce({ id: mockBookmarkId });

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      await user.click(screen.getByRole("button"));

      expect(createBookmark).toHaveBeenCalledWith(mockMessageId, mockSessionId);
    });

    it("calls onBookmarkChange with true when bookmark is added", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockResolvedValueOnce({ id: mockBookmarkId });

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          onBookmarkChange={mockOnBookmarkChange}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockOnBookmarkChange).toHaveBeenCalledWith(true, mockBookmarkId);
      });
    });

    it("shows success toast when bookmark is added", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockResolvedValueOnce({ id: mockBookmarkId });

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Bookmark added");
      });
    });

    it("updates aria-pressed to true after adding bookmark", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockResolvedValueOnce({ id: mockBookmarkId });

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-pressed", "true");
      });
    });
  });

  describe("removing bookmark", () => {
    it("calls deleteBookmark when clicked on bookmarked message", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      await user.click(screen.getByRole("button"));

      expect(deleteBookmark).toHaveBeenCalledWith(mockBookmarkId);
    });

    it("calls onBookmarkChange with false when bookmark is removed", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
          onBookmarkChange={mockOnBookmarkChange}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockOnBookmarkChange).toHaveBeenCalledWith(false);
      });
    });

    it("shows success toast when bookmark is removed", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Bookmark removed");
      });
    });

    it("updates aria-pressed to false after removing bookmark", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteBookmark).mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-pressed", "false");
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast when createBookmark fails", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockRejectedValueOnce(new Error("API Error"));

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update bookmark");
      });
    });

    it("shows error toast when deleteBookmark fails", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteBookmark).mockRejectedValueOnce(new Error("API Error"));

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update bookmark");
      });
    });

    it("does not change state when API fails", async () => {
      const user = userEvent.setup();
      vi.mocked(createBookmark).mockRejectedValueOnce(new Error("API Error"));

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // State should remain unchanged
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("loading state", () => {
    it("disables button during loading", async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: unknown) => void;
      vi.mocked(createBookmark).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Button should be disabled during loading
      expect(button).toBeDisabled();

      // Resolve the promise
      resolveCreate!({ id: mockBookmarkId });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it("sets aria-busy during loading", async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: unknown) => void;
      vi.mocked(createBookmark).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button).toHaveAttribute("aria-busy", "true");

      resolveCreate!({ id: mockBookmarkId });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-busy", "false");
      });
    });

    it("has loading styles during loading", async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: unknown) => void;
      vi.mocked(createBookmark).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button).toHaveClass("opacity-50", "cursor-wait");

      resolveCreate!({ id: mockBookmarkId });

      await waitFor(() => {
        expect(button).not.toHaveClass("cursor-wait");
      });
    });
  });

  describe("animation", () => {
    it("has bounce animation on bookmarked icon", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveClass("animate-bounce-in");
    });

    it("has scale animation on unbookmarked icon", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveClass("animate-scale-in");
    });

    it("has active scale on button", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("active:scale-90");
    });
  });

  describe("accessibility", () => {
    it("has focus visible styles", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    });

    it("icon has aria-hidden", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("stops propagation on click", async () => {
      const user = userEvent.setup();
      const handleParentClick = vi.fn();
      vi.mocked(createBookmark).mockResolvedValueOnce({ id: mockBookmarkId });

      render(
        <div onClick={handleParentClick}>
          <BookmarkButton
            messageId={mockMessageId}
            sessionId={mockSessionId}
          />
        </div>
      );

      await user.click(screen.getByRole("button"));

      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });

  describe("dark mode styles", () => {
    it("has dark mode glow when bookmarked", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
          isBookmarked
          bookmarkId={mockBookmarkId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("dark:shadow-[0_0_8px_oklch(0.6_0.2_264/0.4)]");
    });

    it("has dark mode focus visible ring", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("dark:focus-visible:ring-ring/70");
    });
  });

  describe("transitions", () => {
    it("has transition classes", () => {
      render(
        <BookmarkButton
          messageId={mockMessageId}
          sessionId={mockSessionId}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all", "duration-200", "ease-out");
    });
  });
});
