/**
 * BookmarkButton Component
 * Button to toggle bookmark status on a message
 */
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createBookmark,
  deleteBookmark,
} from "@/api/client";
import { toast } from "sonner";

export interface BookmarkButtonProps {
  messageId: string;
  sessionId: string;
  isBookmarked?: boolean;
  bookmarkId?: string;
  onBookmarkChange?: (isBookmarked: boolean, bookmarkId?: string) => void;
  className?: string;
}

export function BookmarkButton({
  messageId,
  sessionId,
  isBookmarked = false,
  bookmarkId,
  onBookmarkChange,
  className,
}: BookmarkButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentBookmarkId, setCurrentBookmarkId] = useState(bookmarkId);

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (bookmarked && currentBookmarkId) {
        // Remove bookmark
        await deleteBookmark(currentBookmarkId);
        setBookmarked(false);
        setCurrentBookmarkId(undefined);
        onBookmarkChange?.(false);
        toast.success(t("chat.bookmarkRemoved"));
      } else {
        // Add bookmark
        const bookmark = await createBookmark(messageId, sessionId);
        setBookmarked(true);
        setCurrentBookmarkId(bookmark.id);
        onBookmarkChange?.(true, bookmark.id);
        toast.success(t("chat.bookmarkAdded"));
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      toast.error(t("chat.bookmarkError"));
    } finally {
      setIsLoading(false);
    }
  }, [bookmarked, currentBookmarkId, isLoading, messageId, sessionId, onBookmarkChange, t]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isLoading}
      aria-label={bookmarked ? t("chat.removeBookmark") : t("chat.addBookmark")}
      aria-pressed={bookmarked}
      aria-busy={isLoading}
      className={cn(
        "p-1.5 rounded-md transition-all duration-200 ease-out",
        "opacity-0 group-hover:opacity-100",
        bookmarked && "opacity-100",
        isLoading && "opacity-50 cursor-wait",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "active:scale-90",
        bookmarked
          ? "text-primary hover:bg-primary/10 dark:shadow-[0_0_8px_oklch(0.6_0.2_264/0.4)]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        // Dark mode enhancements - Cycle #182
        "dark:focus-visible:ring-ring/70",
        className
      )}
    >
      {bookmarked ? (
        <BookmarkCheck
          key="bookmarked"
          className="w-3.5 h-3.5 animate-in zoom-in-50 duration-200"
          aria-hidden="true"
        />
      ) : (
        <Bookmark
          key="unbookmarked"
          className="w-3.5 h-3.5 animate-in zoom-in-50 duration-200"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
