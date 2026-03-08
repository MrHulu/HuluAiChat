/**
 * ChatView Component
 * 聊天主界面，整合消息列表和输入框
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageList, MessageListRef } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { RAGPanel } from "@/components/rag";
import { BookmarkPanel } from "./BookmarkPanel";
import { useChat, useModel } from "@/hooks";
import { ConnectionStatus } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import {
  updateMessage,
  ImageContent,
  queryRAGDocuments,
  listRAGDocuments,
  getSessionBookmarks,
  createBookmark,
  deleteBookmark,
} from "@/api/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react";

export interface ChatViewProps {
  sessionId: string | null;
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const { t } = useTranslation();

  const statusConfig = {
    connecting: { color: "bg-warning", ring: "ring-warning/30", text: t("chat.connecting"), animate: true },
    connected: { color: "bg-success", ring: "ring-success/30", text: t("chat.connected"), animate: false },
    disconnected: { color: "bg-error", ring: "ring-error/30", text: t("chat.disconnected"), animate: false },
    error: { color: "bg-error", ring: "ring-error/30", text: t("chat.connectionError"), animate: true },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-label={config.text}
    >
      <span className="relative flex h-2 w-2">
        {/* Pulse ring for connecting/error states */}
        {config.animate && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              config.color,
              "animate-ping"
            )}
          />
        )}
        {/* Core indicator */}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            config.color,
            "transition-all duration-300",
            status === "connected" && "ring-2 ring-offset-1 ring-offset-background",
            status === "connected" && config.ring
          )}
        />
      </span>
      <span className="transition-opacity duration-200">{config.text}</span>
    </div>
  );
}

export function ChatView({ sessionId }: ChatViewProps) {
  const { t } = useTranslation();
  const { messages, streamingMessage, connectionStatus, sendMessage, isLoading, refreshMessages } =
    useChat(sessionId);
  const { currentModel, models, setModel, isLoading: isLoadingModels, parameters } = useModel();

  // Refs
  const messageListRef = useRef<MessageListRef>(null);

  // RAG Panel state
  const [isRAGPanelOpen, setIsRAGPanelOpen] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  // Bookmark state
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Map<string, string>>(new Map());

  // Load bookmarks when session changes
  const loadBookmarks = useCallback(async () => {
    if (!sessionId) return;
    try {
      const bookmarks = await getSessionBookmarks(sessionId);
      const map = new Map<string, string>();
      bookmarks.forEach((b) => map.set(b.message_id, b.id));
      setBookmarkedMessages(map);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadBookmarks();
    } else {
      setBookmarkedMessages(new Map());
    }
  }, [sessionId, loadBookmarks]);

  const handleBookmarkToggle = async (
    messageId: string,
    isBookmarked: boolean,
    bookmarkId?: string
  ) => {
    try {
      if (isBookmarked && bookmarkId) {
        await deleteBookmark(bookmarkId);
        setBookmarkedMessages((prev) => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
        toast.success(t("chat.bookmarkRemoved"));
      } else {
        const bookmark = await createBookmark(messageId, sessionId!);
        setBookmarkedMessages((prev) => {
          const next = new Map(prev);
          next.set(messageId, bookmark.id);
          return next;
        });
        toast.success(t("chat.bookmarkAdded"));
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      toast.error(t("chat.bookmarkError"));
    }
  };

  const handleJumpToMessage = (messageId: string) => {
    messageListRef.current?.scrollToMessage(messageId);
  };

  // Check for documents when RAG panel opens
  const checkDocuments = async () => {
    try {
      const result = await listRAGDocuments();
      setHasDocuments(result.documents.length > 0);
    } catch (error) {
      console.error("Failed to check documents:", error);
      setHasDocuments(false);
    }
  };

  // Update document status when panel state changes
  const handleRAGPanelToggle = () => {
    const newState = !isRAGPanelOpen;
    setIsRAGPanelOpen(newState);
    if (newState) {
      checkDocuments();
    }
  };

  const isDisabled = connectionStatus !== "connected" || isLoading;

  const handleSend = async (content: string, images?: ImageContent[]) => {
    // If RAG is enabled and we have documents, query for context
    if (isRAGPanelOpen && hasDocuments) {
      try {
        const ragResult = await queryRAGDocuments(content, 3);
        if (ragResult.success && ragResult.context) {
          // Prepend RAG context to the message
          const enhancedContent = `${t("rag.ragEnabled")}\n\n${ragResult.context}\n\n---\n\n${content}`;
          sendMessage(enhancedContent, currentModel, parameters, images);
          return;
        }
      } catch (error) {
        console.error("RAG query failed:", error);
        // Fall through to send without RAG context
        toast.warning(t("rag.queryError"));
      }
    }
    sendMessage(content, currentModel, parameters, images);
  };

  // 编辑消息处理
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!sessionId) return;

    try {
      await updateMessage(sessionId, messageId, newContent);
      refreshMessages?.();
      toast.success(t("chat.messageUpdated"));
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error(t("chat.messageUpdateFailed"));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-b from-background/80 to-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-foreground transition-all duration-200">
            {sessionId ? t("chat.title") : t("chat.selectSession")}
          </div>
          {/* 模型选择器 */}
          {sessionId && (
            <ModelSelector
              value={currentModel}
              models={models}
              onChange={setModel}
              isLoading={isLoadingModels}
              disabled={isLoading}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Bookmark Toggle Button */}
          {sessionId && (
            <button
              onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)}
              aria-pressed={isBookmarkPanelOpen}
              aria-label={t("chat.bookmarks")}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out flex items-center gap-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "hover:scale-105 active:scale-95",
                isBookmarkPanelOpen
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background hover:bg-accent hover:border-accent border-border"
              )}
            >
              <Bookmark className={cn(
                "w-3 h-3 transition-transform duration-200",
                isBookmarkPanelOpen && "scale-110"
              )} />
              {bookmarkedMessages.size > 0 && (
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isBookmarkPanelOpen ? "text-primary-foreground" : "text-primary"
                )}>{bookmarkedMessages.size}</span>
              )}
            </button>
          )}
          {/* RAG Toggle Button */}
          {sessionId && (
            <button
              onClick={handleRAGPanelToggle}
              aria-pressed={isRAGPanelOpen}
              aria-label={t("rag.documents")}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "hover:scale-105 active:scale-95",
                isRAGPanelOpen
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background hover:bg-accent hover:border-accent border-border"
              )}
            >
              {t("rag.title")}
            </button>
          )}
          <ConnectionIndicator status={connectionStatus} />
        </div>
      </div>

      {/* 消息列表 */}
      <MessageList
        ref={messageListRef}
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        onEditMessage={handleEditMessage}
        bookmarkedMessages={bookmarkedMessages}
        onBookmarkToggle={handleBookmarkToggle}
      />

      {/* Bookmark Panel - with slide-in animation */}
      {isBookmarkPanelOpen && sessionId && (
        <div className="border-t border-border bg-muted/30 animate-in slide-in-from-top-2 duration-200">
          <BookmarkPanel
            sessionId={sessionId}
            onJumpToMessage={handleJumpToMessage}
          />
        </div>
      )}

      {/* RAG Panel（可展开）- with slide-in animation */}
      {isRAGPanelOpen && sessionId && (
        <div className="border-t border-border bg-muted/30 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <RAGPanel
            disabled={isLoading}
            onDocumentChange={() => checkDocuments()}
          />
        </div>
      )}

      {/* 输入框 */}
      <ChatInput
        onSend={handleSend}
        disabled={isDisabled || !sessionId}
        isLoading={isLoading}
        placeholder={
          !sessionId
            ? t("chat.selectSessionToChat")
            : t("chat.typeMessage")
        }
      />
    </div>
  );
}
