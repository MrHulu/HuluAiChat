/**
 * SessionItem Component
 * 单个会话项
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
} from "lucide-react";
import { Session, Folder, ExportFormat } from "@/api/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}: SessionItemProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

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
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={t("sessionItem.selectSession", { title: session.title || t("sessionItem.newChat") })}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer",
        "transition-all duration-200 ease-out",
        "list-item-enter",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50 text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "active:scale-[0.98]"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {session.title || t("sessionItem.newChat")}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {formatDate(session.updated_at)}
        </div>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
            {tags.slice(0, 3).map((tag) => (
              <SessionTag
                key={tag}
                name={tag}
                size="xs"
                onClick={() => onTagClick?.(tag)}
              />
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Export button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              disabled={isExporting}
              aria-label={t("sessionItem.exportSession")}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-all duration-150",
                "p-1.5 rounded-md",
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isExporting && "opacity-50 cursor-wait"
              )}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleExport("markdown")}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                {t("sessionItem.markdown")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("json")}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                {t("sessionItem.json")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("txt")}>
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                {t("sessionItem.plainText")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Move to folder submenu */}
        {folders.length > 0 && onMoveToFolder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                aria-label={t("sessionItem.moveToFolder")}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-all duration-150",
                  "p-1.5 rounded-md",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleMoveToFolder(null)}>
                <span className="flex items-center gap-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("sessionItem.uncategorized")}
                </span>
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={handleMoveToFolder(folder.id)}
                  className={session.folder_id === folder.id ? "bg-muted" : ""}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    {folder.name}
                    {session.folder_id === folder.id && (
                      <Check className="w-3 h-3 ml-auto text-primary" />
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          aria-label={t("sessionItem.deleteSession")}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-all duration-150",
            "p-1.5 rounded-md",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
