/**
 * SessionItem Component
 * 单个会话项
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer",
        "transition-colors duration-150",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50 text-foreground"
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
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary",
                isExporting && "opacity-50 cursor-wait"
              )}
              title={t("sessionItem.exportSession")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleExport("markdown")}>
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
                {t("sessionItem.markdown")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("json")}>
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
                {t("sessionItem.json")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("txt")}>
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
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
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                )}
                title={t("sessionItem.moveToFolder")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleMoveToFolder(null)}>
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    {folder.name}
                    {session.folder_id === folder.id && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ml-auto text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
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
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          )}
          title={t("sessionItem.deleteSession")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
