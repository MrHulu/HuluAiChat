/**
 * BookmarkPanel Component
 * Display list of bookmarks for current session with click-to-navigate
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, MessageSquare, X, ChevronRight, Download, FileJson, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSessionBookmarks,
  deleteBookmark,
  exportBookmarksJSON,
  exportBookmarksMarkdown,
  downloadBlob,
  BookmarkWithMessage,
} from "@/api/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface BookmarkPanelProps {
  sessionId: string;
  onJumpToMessage?: (messageId: string) => void;
  className?: string;
}

export function BookmarkPanel({
  sessionId,
  onJumpToMessage,
  className,
}: BookmarkPanelProps) {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = useState<BookmarkWithMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSessionBookmarks(sessionId);
      setBookmarks(data);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      toast.error(t("chat.bookmarkLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleDelete = async (bookmarkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      toast.success(t("chat.bookmarkRemoved"));
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      toast.error(t("chat.bookmarkError"));
    }
  };

  const handleJump = (messageId: string) => {
    onJumpToMessage?.(messageId);
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const { blob, filename } = await exportBookmarksJSON();
      downloadBlob(blob, filename);
      toast.success(t("chat.exportSuccess"));
    } catch (error) {
      console.error("Failed to export bookmarks:", error);
      toast.error(t("chat.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      setIsExporting(true);
      const { blob, filename } = await exportBookmarksMarkdown();
      downloadBlob(blob, filename);
      toast.success(t("chat.exportSuccess"));
    } catch (error) {
      console.error("Failed to export bookmarks:", error);
      toast.error(t("chat.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-3 text-center text-muted-foreground text-sm", className)}>
        {t("common.loading")}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className={cn("p-3 text-center text-muted-foreground text-sm", className)}>
        <Bookmark className="w-5 h-5 mx-auto mb-2 opacity-50" />
        <p>{t("chat.noBookmarks")}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bookmark className="w-4 h-4 text-primary" />
          <span>{t("chat.bookmarks")}</span>
          <span className="text-xs text-muted-foreground">({bookmarks.length})</span>
        </div>

        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isExporting || bookmarks.length === 0}
            >
              <Download className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              {t("chat.exportJSON")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMarkdown}>
              <FileText className="h-4 w-4 mr-2" />
              {t("chat.exportMarkdown")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bookmark List */}
      <div className="flex-1 overflow-y-auto max-h-48">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            onClick={() => handleJump(bookmark.message_id)}
            className={cn(
              "group flex items-start gap-2 px-3 py-2 cursor-pointer",
              "hover:bg-accent/50 transition-colors border-b border-border/50 last:border-b-0"
            )}
          >
            {/* Role indicator */}
            <MessageSquare
              className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                bookmark.message_role === "user"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {bookmark.message_content}
              </p>
              {bookmark.note && (
                <p className="text-xs text-primary mt-1 truncate">
                  📝 {bookmark.note}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={(e) => handleDelete(bookmark.id, e)}
                className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                aria-label={t("chat.removeBookmark")}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
