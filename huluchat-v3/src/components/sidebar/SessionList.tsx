/**
 * SessionList Component
 * 会话列表侧边栏
 */
import { Session } from "@/api/client";
import { SessionItem } from "./SessionItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SessionList({
  sessions,
  currentSessionId,
  isLoading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isCollapsed = false,
  onToggleCollapse,
}: SessionListProps) {
  if (isCollapsed) {
    return (
      <div className="w-14 flex flex-col items-center py-4 border-r border-border bg-muted/30">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Expand sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 9 3 3-3 3" />
          </svg>
        </button>

        <button
          onClick={onCreateSession}
          className="mt-4 p-2 rounded-lg hover:bg-muted transition-colors"
          title="New chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full border-r border-border bg-muted/30",
      "transition-all duration-300 ease-in-out"
    )}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Chats</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Collapse sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 15-3-3 3-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* 新建按钮 */}
      <div className="p-3">
        <Button
          onClick={onCreateSession}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New Chat
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Create a new chat to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onClick={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
