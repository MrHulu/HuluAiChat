/**
 * MessageList Component
 * 消息列表展示，支持流式消息
 */
import { useEffect, useRef } from "react";
import { Message } from "@/api/client";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "@/hooks/useChat";

export interface MessageListProps {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  isLoading: boolean;
}

export function MessageList({ messages, streamingMessage, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage?.content]);

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
    <div className="flex-1 overflow-y-auto p-4">
      {/* 历史消息 */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {/* 流式消息 */}
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
