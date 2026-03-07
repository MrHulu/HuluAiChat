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
import { updateMessage, ImageContent } from "@/api/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ChatViewProps {
  sessionId: string | null;
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const { t } = useTranslation();

  const statusConfig = {
    connecting: { color: "bg-yellow-500", text: t("chat.connecting") },
    connected: { color: "bg-green-500", text: t("chat.connected") },
    disconnected: { color: "bg-red-500", text: t("chat.disconnected") },
    error: { color: "bg-red-500", text: t("chat.connectionError") },
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
  const { t } = useTranslation();
  const { messages, streamingMessage, connectionStatus, sendMessage, isLoading, refreshMessages } =
    useChat(sessionId);
  const { currentModel, models, setModel, isLoading: isLoadingModels, parameters } = useModel();

  const isDisabled = connectionStatus !== "connected" || isLoading;

  const handleSend = (content: string, images?: ImageContent[]) => {
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-foreground">
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
        <ConnectionIndicator status={connectionStatus} />
      </div>

      {/* 消息列表 */}
      <MessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        onEditMessage={handleEditMessage}
      />

      {/* 输入框 */}
      <ChatInput
        onSend={handleSend}
        disabled={isDisabled || !sessionId}
        placeholder={
          !sessionId
            ? t("chat.selectSessionToChat")
            : t("chat.typeMessage")
        }
      />
    </div>
  );
}
