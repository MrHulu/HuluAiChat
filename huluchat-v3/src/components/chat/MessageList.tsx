/**
 * MessageList Component
 * 消息列表展示，支持流式消息和虚拟列表优化
 */
import { useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Message } from "@/api/client";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "@/hooks/useChat";

export interface MessageListProps {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  isLoading: boolean;
}

/**
 * 估算消息高度（基于内容长度）
 * 用于虚拟列表的初始高度估算
 */
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

export function MessageList({ messages, streamingMessage, isLoading }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Send a message to begin chatting with AI</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
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
          return (
            <div
              key={message.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem message={message} />
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

      {/* 加载指示器 */}
      {isLoading && !streamingMessage && (
        <div className="flex justify-start mb-4">
          <div className="bg-muted rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      {/* 滚动锚点 */}
      <div ref={bottomRef} />
    </div>
  );
}
