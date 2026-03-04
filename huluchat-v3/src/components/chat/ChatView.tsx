/**
 * ChatView Component
 * 聊天主界面，整合消息列表和输入框
 */
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { useChat, useModel } from "@/hooks";
import { ConnectionStatus } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";

export interface ChatViewProps {
  sessionId: string | null;
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const statusConfig = {
    connecting: { color: "bg-yellow-500", text: "Connecting..." },
    connected: { color: "bg-green-500", text: "Connected" },
    disconnected: { color: "bg-red-500", text: "Disconnected" },
    error: { color: "bg-red-500", text: "Connection Error" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn("w-2 h-2 rounded-full", config.color)} />
      <span>{config.text}</span>
    </div>
  );
}

export function ChatView({ sessionId }: ChatViewProps) {
  const { messages, streamingMessage, connectionStatus, sendMessage, isLoading } =
    useChat(sessionId);
  const { currentModel, models, setModel, isLoading: isLoadingModels } = useModel();

  const isDisabled = connectionStatus !== "connected" || isLoading;

  const handleSend = (content: string) => {
    sendMessage(content, currentModel);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-foreground">
            {sessionId ? "Chat" : "Select or create a session"}
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
        <ConnectionIndicator status={connectionStatus} />
      </div>

      {/* 消息列表 */}
      <MessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
      />

      {/* 输入框 */}
      <ChatInput
        onSend={handleSend}
        disabled={isDisabled || !sessionId}
        placeholder={
          !sessionId
            ? "Select a session to start chatting..."
            : "Type a message..."
        }
      />
    </div>
  );
}
