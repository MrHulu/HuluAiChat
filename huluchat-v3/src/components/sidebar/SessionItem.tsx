/**
 * SessionItem Component
 * 单个会话项
 */
import { useState } from "react";
import { Session, ExportFormat } from "@/api/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onExport?: (sessionId: string, format: ExportFormat) => void;
}

export function SessionItem({ session, isActive, onClick, onDelete, onExport }: SessionItemProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
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
          {session.title || "New Chat"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {formatDate(session.updated_at)}
        </div>
      </div>

      {/* 操作按钮组 */}
      <div className="flex items-center gap-1">
        {/* 导出按钮 */}
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
              title="Export session"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
                Markdown (.md)
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("json")}>
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
                JSON (.json)
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport("txt")}>
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
                Plain Text (.txt)
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 删除按钮 */}
        <button
          onClick={handleDelete}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          )}
          title="Delete session"
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
