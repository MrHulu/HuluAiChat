/**
 * SessionItem Component
 * 单个会话项
 */
import { Session } from "@/api/client";
import { cn } from "@/lib/utils";

export interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
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
  );
}
