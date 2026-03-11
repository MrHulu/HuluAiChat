/**
 * MessageList Component
 * 消息列表展示，支持流式消息和虚拟列表优化
 */
import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Message } from "@/api/client";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "@/hooks/useChat";
import { ThinkingLoaderImmersive } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
  // Suggestion hints props
  onSuggestionClick?: (suggestion: string) => void;
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

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList(
  { messages, streamingMessage, isLoading, onEditMessage, bookmarkedMessages, onBookmarkToggle, onSuggestionClick },
  ref
) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      return estimateMessageHeight(messages[index]?.content || "");
    }, [messages]),
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
          const message = messages[virtualItem.index];
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
              />
            </div>
          );
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
    </div>
  );
});
