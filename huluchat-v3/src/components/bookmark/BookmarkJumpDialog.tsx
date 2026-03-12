/**
 * BookmarkJumpDialog Component
 * Dialog for selecting a bookmark and jumping to the message
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, MessageSquare, Search, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listAllBookmarks, BookmarkWithMessage } from "@/api/client";
import { EmptyStateCompact } from "@/components/ui/empty-state";

export interface BookmarkJumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJumpToBookmark: (sessionId: string, messageId: string) => void;
}

export function BookmarkJumpDialog({
  open,
  onOpenChange,
  onJumpToBookmark,
}: BookmarkJumpDialogProps) {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = useState<BookmarkWithMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load all bookmarks when dialog opens
  const loadBookmarks = useCallback(async () => {
    if (!open) return;
    try {
      setIsLoading(true);
      const data = await listAllBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Filter bookmarks by search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const query = searchQuery.toLowerCase();
    return bookmarks.filter(
      (bookmark) =>
        bookmark.message_content.toLowerCase().includes(query) ||
        (bookmark.note && bookmark.note.toLowerCase().includes(query))
    );
  }, [bookmarks, searchQuery]);

  // Handle bookmark selection
  const handleSelect = (bookmark: BookmarkWithMessage) => {
    onJumpToBookmark(bookmark.session_id, bookmark.message_id);
    onOpenChange(false);
  };

  // Format content preview
  const formatPreview = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("bookmark.jumpTitle")}
          </DialogTitle>
          <DialogDescription>{t("bookmark.jumpDescription")}</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("bookmark.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label={t("bookmark.searchLabel")}
          />
        </div>

        {/* Bookmark List */}
        <div className="h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <EmptyStateCompact
              icon={<Bookmark className="w-5 h-5 opacity-50" />}
              title={searchQuery ? t("bookmark.noResults") : t("bookmark.noBookmarks")}
              className="py-8"
            />
          ) : (
            <div className="space-y-1 pr-2" role="listbox" aria-label={t("bookmark.listLabel")}>
              {filteredBookmarks.map((bookmark, index) => (
                <button
                  key={bookmark.id}
                  onClick={() => handleSelect(bookmark)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md",
                    "flex items-start gap-3",
                    "transition-all duration-200 ease-out",
                    "hover:bg-accent/50 hover:translate-x-0.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "animate-list-enter",
                    "group"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  role="option"
                  aria-selected={false}
                >
                  {/* Role indicator */}
                  <MessageSquare
                    className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      bookmark.message_role === "user"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Message preview */}
                    <p className="text-sm text-foreground line-clamp-2">
                      {formatPreview(bookmark.message_content)}
                    </p>
                    {/* Note */}
                    {bookmark.note && (
                      <p className="text-xs text-primary mt-1 truncate">
                        📝 {bookmark.note}
                      </p>
                    )}
                  </div>

                  {/* Jump indicator */}
                  <ExternalLink
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
