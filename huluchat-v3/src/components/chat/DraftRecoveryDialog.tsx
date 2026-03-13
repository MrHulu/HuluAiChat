/**
 * DraftRecoveryDialog Component
 * 草稿恢复提示对话框
 *
 * TASK-326: Context Recovery
 * - 显示检测到的未发送草稿
 * - 提供恢复或忽略选项
 */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Clock, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftData } from "@/hooks/useDraftRecovery";

export interface DraftRecoveryDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Drafts available for recovery */
  drafts: DraftData[];
  /** Callback when user chooses to recover a draft */
  onRecover: (sessionId: string) => void;
  /** Callback when user dismisses a draft */
  onDismiss: (sessionId: string) => void;
  /** Callback when user dismisses all drafts */
  onDismissAll: () => void;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(dateString: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return t("draftRecovery.justNow");
  } else if (diffMins < 60) {
    return t("draftRecovery.minutesAgo", { count: diffMins });
  } else if (diffHours < 24) {
    return t("draftRecovery.hoursAgo", { count: diffHours });
  } else if (diffDays < 7) {
    return t("draftRecovery.daysAgo", { count: diffDays });
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Truncate content for preview
 */
function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

export const DraftRecoveryDialog = memo(function DraftRecoveryDialog({
  open,
  onOpenChange,
  drafts,
  onRecover,
  onDismiss,
  onDismissAll,
}: DraftRecoveryDialogProps) {
  const { t } = useTranslation();

  if (drafts.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("draftRecovery.title")}
          </DialogTitle>
          <DialogDescription>
            {t("draftRecovery.description", { count: drafts.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto pr-2">
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.sessionId}
                className={cn(
                  "p-3 rounded-lg border border-border",
                  "bg-muted/30 dark:bg-muted/20",
                  "hover:bg-muted/50 dark:hover:bg-muted/30",
                  "transition-colors duration-200"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {draft.sessionTitle || t("draftRecovery.untitledSession")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{formatRelativeTime(draft.savedAt, t)}</span>
                      {(draft.images?.length ?? 0) > 0 && (
                        <span className="ml-2">
                          {t("draftRecovery.images", { count: draft.images!.length })}
                        </span>
                      )}
                      {(draft.files?.length ?? 0) > 0 && (
                        <span className="ml-2">
                          {t("draftRecovery.files", { count: draft.files!.length })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {draft.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {truncateContent(draft.content)}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onRecover(draft.sessionId);
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {t("draftRecovery.recover")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(draft.sessionId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only">{t("draftRecovery.dismiss")}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDismissAll();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto text-muted-foreground"
          >
            {t("draftRecovery.dismissAll")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t("draftRecovery.continueWithout")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
