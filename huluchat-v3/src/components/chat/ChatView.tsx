/**
 * ChatView Component
 * 聊天主界面，整合消息列表和输入框
 */
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { MessageList, MessageListRef } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatSearch } from "./ChatSearch";
import { ModelSelector } from "./ModelSelector";
import { RAGPanel } from "@/components/rag";
import { BookmarkPanel } from "./BookmarkPanel";
import { useChat, useModel } from "@/hooks";
import { ConnectionStatus } from "@/hooks/useWebSocket";
import { ToolCall } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { findMatchingMessages } from "@/utils/search";
import {
  updateMessage,
  ImageContent,
  FileAttachment,
  Message,
  queryRAGDocuments,
  listRAGDocuments,
  getSessionBookmarks,
  createBookmark,
  deleteBookmark,
  exportMessages,
  ExportFormat,
} from "@/api/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Bookmark, CheckCircle, XCircle, Loader2, ListChecks, Download, X, Search } from "lucide-react";

export interface ChatViewProps {
  sessionId: string | null;
  onSessionUpdated?: () => void;  // Called when session title is updated
}

/**
 * ChatView ref interface - exposes methods for parent components
 */
export interface ChatViewRef {
  scrollToMessage: (messageId: string) => void;
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
      className="flex items-center gap-2 text-xs text-muted-foreground transition-all duration-200 ease-out"
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

function ToolCallsIndicator({ toolCalls }: { toolCalls: ToolCall[] }) {
  const { t } = useTranslation();

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-muted/30">
      <div className="space-y-1.5">
        {toolCalls.map((tc, index) => (
          <div
            key={`${tc.server_name}-${tc.tool_name}-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            {tc.status === "calling" && (
              <>
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                <span className="text-muted-foreground">
                  {t("chat.toolCalling", { server: tc.server_name, tool: tc.tool_name })}
                </span>
              </>
            )}
            {tc.status === "success" && (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-muted-foreground">
                  {t("chat.toolSuccess", { server: tc.server_name, tool: tc.tool_name })}
                </span>
              </>
            )}
            {tc.status === "error" && (
              <>
                <XCircle className="h-3.5 w-3.5 text-error" />
                <span className="text-muted-foreground">
                  {t("chat.toolError", { server: tc.server_name, tool: tc.tool_name })}
                </span>
                {tc.error && (
                  <span className="text-error truncate max-w-[200px]" title={tc.error}>
                    : {tc.error}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const ChatView = forwardRef<ChatViewRef, ChatViewProps>(function ChatView(
  { sessionId, onSessionUpdated },
  ref
) {
  const { t } = useTranslation();
  const { messages, streamingMessage, toolCalls, connectionStatus, sendMessage, regenerateMessage, deleteMessage, isLoading } =
    useChat(sessionId, { onTitleGenerated: onSessionUpdated });
  const { currentModel, models, setModel, isLoading: isLoadingModels, parameters, recommendedModel } = useModel();

  // Refs
  const messageListRef = useRef<MessageListRef>(null);

  // Expose scrollToMessage via ref for bookmark jump feature
  useImperativeHandle(ref, () => ({
    scrollToMessage: (messageId: string) => {
      messageListRef.current?.scrollToMessage(messageId);
    },
  }), []);

  // RAG Panel state
  const [isRAGPanelOpen, setIsRAGPanelOpen] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  // Bookmark state
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Map<string, string>>(new Map());

  // Quote state - Cycle #145
  const [quoteMessage, setQuoteMessage] = useState<Message | null>(null);

  // Search state - TASK-202
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Selection mode state - TASK-175
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

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

  // Quote handlers - Cycle #145
  const handleQuote = useCallback((message: Message) => {
    setQuoteMessage(message);
  }, []);

  const handleCancelQuote = useCallback(() => {
    setQuoteMessage(null);
  }, []);

  // Selection handlers - TASK-175
  const handleMessageSelect = useCallback((messageId: string, selected: boolean) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedMessageIds(new Set(messages.map((m) => m.id)));
  }, [messages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedMessageIds(new Set());
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  // Search handlers - TASK-202
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const ids = findMatchingMessages(messages, searchQuery, caseSensitive);
    return new Set(ids);
  }, [messages, searchQuery, caseSensitive]);

  const currentMatchId = useMemo(() => {
    const matchArray = Array.from(matchingMessageIds);
    if (matchArray.length === 0) return undefined;
    return matchArray[currentMatchIndex];
  }, [matchingMessageIds, currentMatchIndex]);

  const handleSearch = useCallback((query: string, isCaseSensitive: boolean) => {
    setSearchQuery(query);
    setCaseSensitive(isCaseSensitive);
    setCurrentMatchIndex(0);

    // Scroll to first match if exists
    if (query.trim()) {
      const ids = findMatchingMessages(messages, query, isCaseSensitive);
      if (ids.length > 0) {
        setTimeout(() => {
          messageListRef.current?.scrollToMessage(ids[0]);
        }, 100);
      }
    }
  }, [messages]);

  const handleSearchNavigate = useCallback((direction: "prev" | "next") => {
    const matchArray = Array.from(matchingMessageIds);
    if (matchArray.length === 0) return;

    let newIndex = currentMatchIndex;
    if (direction === "next") {
      newIndex = (currentMatchIndex + 1) % matchArray.length;
    } else {
      newIndex = (currentMatchIndex - 1 + matchArray.length) % matchArray.length;
    }

    setCurrentMatchIndex(newIndex);
    messageListRef.current?.scrollToMessage(matchArray[newIndex]);
  }, [matchingMessageIds, currentMatchIndex]);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  }, []);

  // Ctrl+F shortcut for search - TASK-202
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        if (sessionId) {
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionId]);

  const handleExportSelected = useCallback((format: ExportFormat) => {
    const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id));
    if (selectedMessages.length === 0) {
      toast.warning(t("chat.noMessagesSelected"));
      return;
    }

    try {
      const { blob, filename } = exportMessages(selectedMessages, format, undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("chat.exportSuccess", { count: selectedMessages.length }));
      handleExitSelectionMode();
    } catch (error) {
      console.error("Failed to export messages:", error);
      toast.error(t("chat.exportError"));
    }
  }, [messages, selectedMessageIds, t, handleExitSelectionMode]);

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

  const handleSend = async (content: string, images?: ImageContent[], files?: FileAttachment[]) => {
    // Get quote message ID before clearing - TASK-200
    const quotedMessageId = quoteMessage?.id;

    // Clear quote after sending - Cycle #145
    setQuoteMessage(null);

    // If RAG is enabled and we have documents, query for context
    if (isRAGPanelOpen && hasDocuments) {
      try {
        const ragResult = await queryRAGDocuments(content, 3);
        if (ragResult.success && ragResult.context) {
          // Prepend RAG context to the message
          const enhancedContent = `${t("rag.ragEnabled")}\n\n${ragResult.context}\n\n---\n\n${content}`;
          sendMessage(enhancedContent, currentModel, parameters, images, files, undefined, { quotedMessageId });
          return;
        }
      } catch (error) {
        console.error("RAG query failed:", error);
        // Fall through to send without RAG context
        toast.warning(t("rag.queryError"));
      }
    }
    sendMessage(content, currentModel, parameters, images, files, undefined, { quotedMessageId });
  };

  // Handle suggestion hint click
  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  // 编辑消息处理 - TASK-196
  // 编辑用户消息后，删除后续消息并触发 AI 重新回复
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!sessionId) return;

    try {
      // 找到被编辑的消息
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const editedMessage = messages[messageIndex];

      // 调用后端 API 更新消息并删除后续消息
      await updateMessage(sessionId, messageId, newContent, true);

      // 更新前端状态：删除该消息之后的所有消息
      // 后端已经处理了删除，我们只需要删除前端状态中的消息
      // 注意：不使用 refreshMessages() 因为会导致 UI 闪烁

      // 触发 AI 重新回复
      // 使用 skipLocalUserMessage 选项避免添加重复的用户消息到前端状态
      // 同时发送 regenerate 和 delete_from_message_id 参数让后端跳过保存用户消息
      sendMessage(
        newContent,
        currentModel,
        parameters,
        editedMessage.images,
        editedMessage.files,
        undefined, // useMcp - use default
        { skipLocalUserMessage: true, editMessageId: messageId }, // 跳过添加用户消息到前端状态
      );

      toast.success(t("chat.messageUpdated"));
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error(t("chat.messageUpdateFailed"));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-b from-background/80 to-background/50 backdrop-blur-sm dark:from-background/90 dark:to-background/70 dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-foreground transition-all duration-200 dark:text-foreground/95">
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
              recommendedModel={recommendedModel}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search Button - TASK-202 */}
          {sessionId && messages.length > 0 && (
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label={t("chat.searchInConversation")}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out flex items-center gap-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "hover:scale-105 active:scale-95",
                isSearchOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent hover:border-accent border-border"
              )}
            >
              <Search className="w-3 h-3" />
              {t("chat.search")}
            </button>
          )}
          {/* Selection Mode Toggle Button - TASK-175 */}
          {sessionId && messages.length > 0 && !isSelectionMode && (
            <button
              onClick={() => setIsSelectionMode(true)}
              aria-label={t("chat.enterSelectionMode")}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out flex items-center gap-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "hover:scale-105 active:scale-95",
                "bg-background hover:bg-accent hover:border-accent border-border"
              )}
            >
              <ListChecks className="w-3 h-3" />
              {t("chat.select")}
            </button>
          )}
          {/* Selection Mode Actions - TASK-175 */}
          {isSelectionMode && (
            <>
              <span className="text-xs text-muted-foreground">
                {t("chat.selectedCount", { count: selectedMessageIds.size })}
              </span>
              <button
                onClick={handleSelectAll}
                aria-label={t("chat.selectAll")}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  "bg-background hover:bg-accent hover:border-accent border-border"
                )}
              >
                {t("chat.selectAll")}
              </button>
              <button
                onClick={handleDeselectAll}
                aria-label={t("chat.deselectAll")}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  "bg-background hover:bg-accent hover:border-accent border-border"
                )}
              >
                {t("chat.deselectAll")}
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                onClick={() => handleExportSelected("markdown")}
                aria-label={t("chat.exportMarkdown")}
                disabled={selectedMessageIds.size === 0}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-all duration-200 ease-out flex items-center gap-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  selectedMessageIds.size === 0
                    ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Download className="w-3 h-3" />
                {t("chat.exportMarkdown")}
              </button>
              <button
                onClick={() => handleExportSelected("json")}
                aria-label={t("chat.exportJSON")}
                disabled={selectedMessageIds.size === 0}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-all duration-200 ease-out flex items-center gap-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  selectedMessageIds.size === 0
                    ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Download className="w-3 h-3" />
                JSON
              </button>
              <button
                onClick={() => handleExportSelected("txt")}
                aria-label={t("chat.exportTxt")}
                disabled={selectedMessageIds.size === 0}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-all duration-200 ease-out flex items-center gap-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  selectedMessageIds.size === 0
                    ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Download className="w-3 h-3" />
                TXT
              </button>
              <button
                onClick={handleExitSelectionMode}
                aria-label={t("chat.exitSelectionMode")}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:scale-105 active:scale-95",
                  "bg-background hover:bg-accent hover:border-accent border-border"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
          {/* Bookmark Toggle Button */}
          {sessionId && (
            <button
              onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)}
              aria-pressed={isBookmarkPanelOpen}
              aria-label={t("chat.bookmarks")}
              className={cn(
                "group/bookmark px-2 py-1 text-xs rounded-md border transition-all duration-200 ease-out flex items-center gap-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "hover:scale-105 active:scale-95",
                isBookmarkPanelOpen
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background hover:bg-accent hover:border-accent border-border"
              )}
            >
              <Bookmark className={cn(
                "w-3 h-3 transition-transform duration-200 ease-out",
                "group-hover/bookmark:scale-110",
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

      {/* Search Bar - TASK-202 */}
      <ChatSearch
        isOpen={isSearchOpen}
        onClose={handleSearchClose}
        onSearch={handleSearch}
        onNavigate={handleSearchNavigate}
        matchCount={matchingMessageIds.size}
        currentMatch={currentMatchIndex}
      />

      {/* 消息列表 */}
      <MessageList
        ref={messageListRef}
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        onEditMessage={handleEditMessage}
        bookmarkedMessages={bookmarkedMessages}
        onBookmarkToggle={handleBookmarkToggle}
        onRegenerate={regenerateMessage}
        isRegenerating={isLoading}
        onSuggestionClick={handleSuggestionClick}
        onQuote={handleQuote}
        onDelete={deleteMessage}
        isSelectionMode={isSelectionMode}
        selectedMessageIds={selectedMessageIds}
        onMessageSelect={handleMessageSelect}
        searchMatchIds={matchingMessageIds}
        currentMatchId={currentMatchId}
      />

      {/* Tool Calls Indicator */}
      <ToolCallsIndicator toolCalls={toolCalls} />

      {/* Bookmark Panel - with slide-in animation */}
      {isBookmarkPanelOpen && sessionId && (
        <div className="border-t border-border bg-muted/30 animate-slide-down">
          <BookmarkPanel
            sessionId={sessionId}
            onJumpToMessage={handleJumpToMessage}
          />
        </div>
      )}

      {/* RAG Panel（可展开）- with slide-in animation */}
      {isRAGPanelOpen && sessionId && (
        <div className="border-t border-border bg-muted/30 max-h-64 overflow-y-auto animate-slide-down">
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
        quoteMessage={quoteMessage}
        onCancelQuote={handleCancelQuote}
      />
    </div>
  );
});
