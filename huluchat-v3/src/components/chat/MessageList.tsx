/**
 * MessageList Component
 * 消息列表展示，支持流式消息、虚拟列表优化和日期分组
 */
import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Message, ModelInfo, OllamaModel } from "@/api/client";
import { MessageItem } from "./MessageItem";
import { DateSeparator } from "./DateSeparator";
import { StreamingMessage } from "@/hooks/useChat";
import { ThinkingLoaderImmersive } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

export interface MessageListRef {
  scrollToMessage: (messageId: string) => void;
}

export interface MessageListProps {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  isLoading: boolean;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  // Bookmark props
  bookmarkedMessages?: Map<string, string>; // messageId -> bookmarkId
  onBookmarkToggle?: (messageId: string, isBookmarked: boolean, bookmarkId?: string) => void;
  // Regenerate props
  onRegenerate?: (messageId: string, model?: string) => void;
  isRegenerating?: boolean;
  // Model selection props - TASK-233 Phase 5
  availableModels?: ModelInfo[];
  currentModel?: string;
  ollamaModels?: OllamaModel[];
  ollamaAvailable?: boolean;
  recommendedModel?: string | null;
  // Suggestion hints props
  onSuggestionClick?: (suggestion: string) => void;
  // Quote props - Cycle #145
  onQuote?: (message: Message) => void;
  // Delete props
  onDelete?: (messageId: string) => void;
  // Selection props - TASK-175
  isSelectionMode?: boolean;
  selectedMessageIds?: Set<string>;
  onMessageSelect?: (messageId: string, selected: boolean) => void;
  // Search highlight props - TASK-202
  searchMatchIds?: Set<string>; // IDs of messages that match search
  currentMatchId?: string; // Current highlighted match
}

/**
 * 估算消息高度（基于内容长度）
 * 用于虚拟列表的初始高度估算
 */
// eslint-disable-next-line react-refresh/only-export-components
export function estimateMessageHeight(content: string): number {
  // 基础高度：头像 + padding + 内容
  const baseHeight = 60;
  // 每行约 24px，假设每行约 60 个字符
  const lines = Math.ceil(content.length / 60);
  // 代码块额外高度
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const codeHeight = codeBlocks * 100;

  return baseHeight + lines * 24 + codeHeight;
}

/**
 * 获取消息的日期键（用于分组）
 */
function getMessageDateKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * 虚拟列表项类型
 */
type VirtualItem =
  | { type: "message"; message: Message; index: number }
  | { type: "separator"; date: string };

/**
 * 构建虚拟列表项（包含日期分隔符）
 */
function buildVirtualItems(messages: Message[]): VirtualItem[] {
  const items: VirtualItem[] = [];
  let lastDateKey: string | null = null;

  messages.forEach((message, index) => {
    const dateKey = getMessageDateKey(message.created_at);

    // 如果日期变化，插入分隔符
    if (dateKey !== lastDateKey) {
      items.push({ type: "separator", date: message.created_at });
      lastDateKey = dateKey;
    }

    items.push({ type: "message", message, index });
  });

  return items;
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList(
  { messages, streamingMessage, isLoading, onEditMessage, bookmarkedMessages, onBookmarkToggle, onRegenerate, isRegenerating, availableModels, currentModel, ollamaModels, ollamaAvailable, recommendedModel, onSuggestionClick, onQuote, onDelete, isSelectionMode, selectedMessageIds, onMessageSelect, searchMatchIds, currentMatchId },
  ref
) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 构建虚拟列表项（包含日期分隔符）
  const virtualItems = useMemo(() => buildVirtualItems(messages), [messages]);

  // Expose scrollToMessage method via ref
  useImperativeHandle(ref, () => ({
    scrollToMessage: (messageId: string) => {
      const messageElement = messageRefs.current.get(messageId);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight effect
        messageElement.classList.add("ring-2", "ring-primary", "ring-opacity-50");
        setTimeout(() => {
          messageElement.classList.remove("ring-2", "ring-primary", "ring-opacity-50");
        }, 2000);
      }
    },
  }), []);

  // 虚拟列表配置
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const item = virtualItems[index];
      if (item?.type === "separator") {
        return 48; // 日期分隔符高度
      }
      if (item?.type === "message") {
        return estimateMessageHeight(item.message.content);
      }
      return 60;
    }, [virtualItems]),
    overscan: 5, // 预渲染 5 条消息
  });

  // 自动滚动到底部（新消息或流式消息更新时）
  useEffect(() => {
    if (messages.length > 0 || streamingMessage) {
      // 使用 scrollIntoView 确保滚动到底部
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, streamingMessage?.content]);

  // 监听滚动，显示/隐藏滚动到底部按钮 - Cycle #139
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // 距离底部超过 150px 时显示按钮
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollToBottom(!isNearBottom);
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // 初始检查

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 滚动到底部 - Cycle #139
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 空状态
  if (messages.length === 0 && !streamingMessage) {
    // Get suggestion hints from i18n
    const suggestionHints = t("chat.suggestionHints", { returnObjects: true }) as string[];

    return (
      <div className="flex-1 flex items-center justify-center" role="status">
        <EmptyState
          icon="💬"
          title={t("chat.startConversation")}
          description={t("chat.startConversationHint")}
          size="lg"
          animated={true}
          hints={onSuggestionClick ? suggestionHints : undefined}
          onHintClick={onSuggestionClick}
        />
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto p-4 scrollbar-thin"
      role="log"
      aria-label={t("chat.messageList")}
      aria-live="polite"
    >
      {/* 虚拟列表容器 */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = virtualItems[virtualItem.index];

          // 渲染日期分隔符
          if (item?.type === "separator") {
            return (
              <div
                key={`separator-${virtualItem.index}`}
                data-index={virtualItem.index}
                ref={(el) => virtualizer.measureElement(el)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <DateSeparator date={item.date} />
              </div>
            );
          }

          // 渲染消息
          if (item?.type === "message") {
            const message = item.message;
            const bookmarkId = bookmarkedMessages?.get(message.id);
            const isBookmarked = bookmarkId !== undefined;
            return (
              <div
                key={message.id}
                data-index={virtualItem.index}
                ref={(el) => {
                  // Store ref for scroll-to-message
                  if (el) {
                    messageRefs.current.set(message.id, el);
                  } else {
                    messageRefs.current.delete(message.id);
                  }
                  // Also pass to virtualizer for measurement
                  virtualizer.measureElement(el);
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                  transition: "ring 0.3s ease",
                }}
                className="rounded-lg"
              >
                <MessageItem
                  message={message}
                  onEdit={onEditMessage}
                  isBookmarked={isBookmarked}
                  bookmarkId={bookmarkId}
                  onBookmarkToggle={onBookmarkToggle}
                  onRegenerate={onRegenerate}
                  isRegenerating={isRegenerating}
                  availableModels={availableModels}
                  currentModel={currentModel}
                  ollamaModels={ollamaModels}
                  ollamaAvailable={ollamaAvailable}
                  recommendedModel={recommendedModel}
                  onQuote={onQuote}
                  onDelete={onDelete}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedMessageIds?.has(message.id)}
                  onSelect={onMessageSelect}
                  isSearchMatch={searchMatchIds?.has(message.id)}
                  isCurrentMatch={currentMatchId === message.id}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* 流式消息（不虚拟化，始终显示） */}
      {streamingMessage && (
        <MessageItem
          message={{
            id: streamingMessage.id,
            session_id: "",
            role: "assistant",
            content: streamingMessage.content,
            created_at: new Date().toISOString(),
          }}
          isStreaming={true}
        />
      )}

      {/* 加载指示器 - 使用沉浸式思考动画 */}
      {isLoading && !streamingMessage && (
        <div
          className="flex justify-start mb-4 animate-slide-up"
          role="status"
          aria-live="polite"
          aria-label={t("chat.thinking")}
        >
          <div className={cn(
            "bg-muted/80 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-sm transition-all duration-200",
            "hover:shadow-md",
            // Dark mode enhancements - Cycle #194
            "dark:bg-muted/70",
            "dark:border dark:border-white/10",
            "dark:shadow-[0_4px_16px_oklch(0_0_0/0.25),0_0_24px_oklch(0.488_0.243_264.376/0.08)]",
            "dark:hover:shadow-[0_6px_20px_oklch(0_0_0/0.3),0_0_32px_oklch(0.488_0.243_264.376/0.12)]",
            "dark:hover:border-primary/20"
          )}>
            <ThinkingLoaderImmersive size="md" text={t("chat.thinking")} />
          </div>
        </div>
      )}

      {/* 滚动锚点 */}
      <div ref={bottomRef} />

      {/* 滚动到底部按钮 - Cycle #139 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          aria-label={t("chat.scrollToBottom")}
          className={cn(
            "absolute bottom-6 right-6 z-10",
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-primary text-primary-foreground shadow-lg",
            "hover:bg-primary/90 hover:scale-110",
            "active:scale-95",
            "transition-all duration-200 ease-out",
            "animate-in fade-in zoom-in duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // Dark mode enhancements
            "dark:shadow-[0_4px_20px_oklch(0.488_0.243_264.376/0.4)]"
          )}
        >
          <ArrowDown className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
