/**
 * ClipboardHistoryPanel - Clipboard history management panel
 *
 * Displays clipboard processing history and allows reusing content
 *
 * PRIVACY: All data stays local, no analytics
 */
import { useTranslation } from "react-i18next";
import { History, Trash2, X, Copy, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ClipboardHistoryItem } from "@/hooks/useClipboardHistory";

interface ClipboardHistoryPanelProps {
  /** List of history items */
  history: ClipboardHistoryItem[];
  /** Callback to remove an item */
  onRemove: (id: string) => void;
  /** Callback to clear all history */
  onClear: () => void;
  /** Callback when user wants to reuse just the content */
  onReuseContent: (content: string) => void;
  /** Whether the panel is compact (limited height) */
  compact?: boolean;
}

/**
 * Format relative time
 */
function formatRelativeTime(
  timestamp: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return t("clipboardHistory.justNow");
  } else if (minutes < 60) {
    return t("clipboardHistory.minutesAgo", { count: minutes });
  } else if (hours < 24) {
    return t("clipboardHistory.hoursAgo", { count: hours });
  } else if (days < 7) {
    return t("clipboardHistory.daysAgo", { count: days });
  } else {
    // Format as date
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * ClipboardHistoryPanel Component
 */
export function ClipboardHistoryPanel({
  history,
  onRemove,
  onClear,
  onReuseContent,
  compact = false,
}: ClipboardHistoryPanelProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">{t("clipboardHistory.empty")}</p>
        <p className="text-xs mt-1 opacity-70">{t("clipboardHistory.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t("clipboardHistory.title", { count: history.length })}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t("clipboardHistory.clearAll")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("clipboardHistory.clearConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("clipboardHistory.clearConfirmDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t("clipboardHistory.clear")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* History list */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          compact ? "max-h-[200px]" : "max-h-[300px]"
        )}
      >
        {history.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group px-3 py-2 border-b border-border/30",
              "hover:bg-muted/30 transition-colors"
            )}
          >
            {/* Content preview */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {truncateText(item.content, 50)}
                </p>
                {item.action && (
                  <span className="inline-block text-xs text-primary/70 mt-0.5">
                    {item.action}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(item.timestamp, t)}
              </span>
            </div>

            {/* Response preview */}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {truncateText(item.response, 80)}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onReuseContent(item.content)}
                className="h-6 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("clipboardHistory.reuseContent")}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(item.response);
                }}
                className="h-6 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {t("clipboardHistory.copyResponse")}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onRemove(item.id)}
                className="h-6 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClipboardHistoryPanel;
