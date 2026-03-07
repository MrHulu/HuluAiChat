/**
 * ChatView Component
 * 聊天主界面，整合消息列表和输入框
 */
import { useState } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { RAGPanel } from "@/components/rag";
import { useChat, useModel } from "@/hooks";
import { ConnectionStatus } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import { updateMessage, ImageContent, queryRAGDocuments, listRAGDocuments } from "@/api/client";
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

  // RAG Panel state
  const [isRAGPanelOpen, setIsRAGPanelOpen] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

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
        <div className="flex items-center gap-2">
          {/* RAG Toggle Button */}
          {sessionId && (
            <button
              onClick={handleRAGPanelToggle}
              aria-pressed={isRAGPanelOpen}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-colors",
                isRAGPanelOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
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
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        onEditMessage={handleEditMessage}
      />

      {/* RAG Panel（可展开） */}
      {isRAGPanelOpen && sessionId && (
        <div className="border-t border-border bg-muted/30 max-h-64 overflow-y-auto">
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
        placeholder={
          !sessionId
            ? t("chat.selectSessionToChat")
            : t("chat.typeMessage")
        }
      />
    </div>
  );
}
