/**
 * SessionItem Component
 * 单个会话项，支持批量选择模式
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  FileText,
  FolderOpen,
  ChevronLeft,
  Check,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Session, Folder, ExportFormat } from "@/api/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionTag } from "./SessionTag";

export interface SessionItemProps {
  session: Session;
  folders?: Folder[];
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onExport?: (sessionId: string, format: ExportFormat) => void;
  onMoveToFolder?: (sessionId: string, folderId: string | null) => void;
  tags?: string[];
  onTagClick?: (tag: string) => void;
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function SessionItem({
  session,
  folders = [],
  isActive,
  onClick,
  onDelete,
  onExport,
  onMoveToFolder,
  tags = [],
  onTagClick,
  isBatchMode = false,
  isSelected = false,
  onToggleSelection,
}: SessionItemProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return t("sessionItem.today");
    } else if (days === 1) {
      return t("sessionItem.yesterday");
    } else if (days < 7) {
      return t("sessionItem.daysAgo", { count: days });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const handleExport = (format: ExportFormat) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting || !onExport) return;

    setIsExporting(true);
    try {
      onExport(session.id, format);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const handleMoveToFolder = (folderId: string | null) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToFolder?.(session.id, folderId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isBatchMode && onToggleSelection) {
        onToggleSelection();
      } else {
        onClick();
      }
    }
  };

  const handleClick = () => {
    if (isBatchMode && onToggleSelection) {
      onToggleSelection();
    } else {
      onClick();
    }
  };

  return (
    <div
      role="listitem"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={t("sessionItem.selectSession", { title: session.title || t("sessionItem.newChat") })}
        aria-current={isActive ? "true" : undefined}
        aria-selected={isBatchMode ? isSelected : undefined}
        className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer",
        "transition-all duration-200 ease-out",
        isActive && !isBatchMode
          ? "bg-accent text-accent-foreground shadow-sm dark:shadow-lg dark:shadow-accent/20"
          : "hover:bg-muted/60 hover:shadow-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "active:scale-[0.98] active:bg-accent/80",
        // Dark mode enhancements
        "dark:hover:bg-muted/40 dark:hover:shadow-none",
        // Dark mode active session glow (Cycle #193)
        isActive && !isBatchMode && "dark:bg-accent/80 dark:border-l-2 dark:border-primary/50 dark:shadow-[0_0_16px_oklch(0.5_0.15_264/0.15),inset_0_1px_0_oklch(1_0_0/0.05)]",
        // Batch selection highlight
        isBatchMode && isSelected && "bg-primary/10 dark:bg-primary/20 border border-primary/30"
      )}
    >
      {/* Checkbox for batch mode */}
      {isBatchMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection?.();
          }}
          className={cn(
            "mr-2 p-0.5 rounded transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
          aria-label={isSelected ? t("batch.deselect") : t("batch.select")}
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Square className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {session.title || t("sessionItem.newChat")}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {formatDate(session.updated_at)}
        </div>
        {/* Tags */}
        {tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1 mt-1"
            onClick={(e) => e.stopPropagation()}
            role="group"
            aria-label={t("sessionItem.tags")}
          >
            {tags.slice(0, 3).map((tag) => (
              <SessionTag
                key={tag}
                name={tag}
                size="xs"
                onClick={() => onTagClick?.(tag)}
              />
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground" aria-label={t("sessionItem.moreTags", { count: tags.length - 3 })}>
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Export button - Cycle #204 icon micro-interaction */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              disabled={isExporting}
              aria-label={t("sessionItem.exportSession")}
              aria-busy={isExporting}
              className={cn(
                "group/export opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out",
                "p-1.5 rounded-md",
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "focus-visible:opacity-100",
                "active:scale-90",
                isExporting && "opacity-50 cursor-wait"
              )}
            >
              <Download className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/export:translate-y-0.5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleExport("markdown")} className="animate-list-enter" style={{ animationDelay: "0ms" }}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                {t("sessionItem.markdown")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("json")} className="animate-list-enter" style={{ animationDelay: "50ms" }}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                {t("sessionItem.json")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("txt")} className="animate-list-enter" style={{ animationDelay: "100ms" }}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                {t("sessionItem.plainText")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Move to folder submenu - Cycle #204 icon micro-interaction */}
        {folders.length > 0 && onMoveToFolder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                aria-label={t("sessionItem.moveToFolder")}
                className={cn(
                  "group/folder opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out",
                  "p-1.5 rounded-md",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "focus-visible:opacity-100",
                  "active:scale-90"
                )}
              >
                <FolderOpen className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/folder:scale-110" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleMoveToFolder(null)} className="animate-list-enter" style={{ animationDelay: "0ms" }}>
                <span className="flex items-center gap-2">
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  {t("sessionItem.uncategorized")}
                </span>
              </DropdownMenuItem>
              {folders.map((folder, index) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={handleMoveToFolder(folder.id)}
                  className={cn(
                    "animate-list-enter",
                    session.folder_id === folder.id ? "bg-muted" : ""
                  )}
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    {folder.name}
                    {session.folder_id === folder.id && (
                      <Check className="w-3 h-3 ml-auto text-primary" aria-hidden="true" />
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete button - Cycle #204 icon micro-interaction */}
        <button
          onClick={handleDelete}
          aria-label={t("sessionItem.deleteSession")}
          className={cn(
            "group/delete opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out",
            "p-1.5 rounded-md",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "focus-visible:opacity-100",
            "active:scale-90"
          )}
        >
          <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/delete:rotate-6" aria-hidden="true" />
        </button>
      </div>
    </div>

    {/* Delete Confirmation Dialog - Cycle #139 */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("sessionItem.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("sessionItem.confirmDeleteDescription", { title: session.title || t("sessionItem.newChat") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
            {t("sessionItem.deleteSession")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
}
