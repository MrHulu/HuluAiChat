/**
 * useChat Hook
 * 聊天逻辑管理，包括消息状态和 WebSocket 通信
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWebSocket, ConnectionStatus } from "./useWebSocket";
import { Message, getSessionMessages, ImageContent, FileAttachment, deleteMessage as apiDeleteMessage, createChatWebSocket, generateSessionTitle } from "@/api/client";

export interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
}

export interface ToolCall {
  server_name: string;
  tool_name: string;
  status: "calling" | "success" | "error";
  result?: string;
  error?: string;
}

export interface ChatParameters {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface UseChatOptions {
  onTitleGenerated?: (title: string) => void;
}

export interface UseChatReturn {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  toolCalls: ToolCall[];
  connectionStatus: ConnectionStatus;
  sendMessage: (content: string, model?: string, params?: ChatParameters, images?: ImageContent[], files?: FileAttachment[], useMcp?: boolean) => void;
  regenerateMessage: (assistantMessageId: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  isLoading: boolean;
  isLoadingHistory: boolean;
  refreshMessages: () => void;
  generateTitle: () => Promise<void>;
}

// WebSocket 消息类型
interface WSMessage {
  type: "message" | "stream_start" | "stream_chunk" | "stream_end" | "error" | "history" | "tool_call";
  content?: string;
  message_id?: string;
  messages?: Message[];
  error?: string;
  // Tool call fields
  server_name?: string;
  tool_name?: string;
  status?: "calling" | "success" | "error";
  result?: string;
}

export function useChat(sessionId: string | null, options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const titleGeneratedRef = useRef(false); // Track if title was generated for this session

  // 使用 ref 保存 streamingMessage 的最新值，避免闭包陷阱
  const streamingMessageRef = useRef<StreamingMessage | null>(null);
  useEffect(() => {
    streamingMessageRef.current = streamingMessage;
  }, [streamingMessage]);

  const wsUrl = sessionId
    ? createChatWebSocket(sessionId).url
    : "";

  // 加载历史消息
  const loadHistory = useCallback(async (sid: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await getSessionMessages(sid);
      setMessages(response.messages);
    } catch (error) {
      console.error("Failed to load history:", error);
      setMessages([]);
      toast.error("Failed to load chat history", {
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleWSMessage = useCallback((data: unknown) => {
    const msg = data as WSMessage;

    switch (msg.type) {
      case "history":
        // 加载历史消息
        if (msg.messages) {
          setMessages(msg.messages);
        }
        break;

      case "message":
        // 完整消息（非流式）
        if (msg.message_id && msg.content) {
          const newMessage: Message = {
            id: msg.message_id,
            session_id: sessionId || "",
            role: "assistant",
            content: msg.content,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
        break;

      case "stream_start": {
        // 开始流式输出
        setIsLoading(true);
        // 总是创建新的 streamingMessage
        const streamId = msg.message_id || `stream-${Date.now()}`;
        setStreamingMessage({
          id: streamId,
          content: "",
          isStreaming: true,
        });
        break;
      }

      case "stream_chunk":
        // 流式内容块 - 使用 ref 检查当前状态
        if (streamingMessageRef.current && msg.content) {
          setStreamingMessage((prev) =>
            prev ? { ...prev, content: prev.content + msg.content } : null
          );
        }
        break;

      case "stream_end": {
        // 流式结束
        setIsLoading(false);
        // 使用 ref 获取最新值
        const currentStreaming = streamingMessageRef.current;
        if (currentStreaming) {
          const newMessage: Message = {
            id: currentStreaming.id,
            session_id: sessionId || "",
            role: "assistant",
            content: currentStreaming.content,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            // Auto-generate title after first AI response
            if (updated.length === 2 && !titleGeneratedRef.current && sessionId) {
              // First user + assistant exchange complete
              titleGeneratedRef.current = true;
              generateSessionTitle(sessionId).then((result) => {
                if (result.title && options?.onTitleGenerated) {
                  options.onTitleGenerated(result.title);
                }
              }).catch((error) => {
                console.error("Failed to generate title:", error);
              });
            }
            return updated;
          });
          setStreamingMessage(null);
        }
        // Clear tool calls when stream ends
        setToolCalls([]);
        break;
      }

      case "tool_call": {
        // Handle tool call status updates
        if (msg.server_name && msg.tool_name && msg.status) {
          const toolCall: ToolCall = {
            server_name: msg.server_name,
            tool_name: msg.tool_name,
            status: msg.status,
            result: msg.result,
            error: msg.error,
          };
          setToolCalls((prev) => {
            // Update existing or add new
            const existingIndex = prev.findIndex(
              (tc) => tc.server_name === toolCall.server_name && tc.tool_name === toolCall.tool_name
            );
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = toolCall;
              return updated;
            }
            return [...prev, toolCall];
          });
        }
        break;
      }

      case "error":
        console.error("WebSocket error:", msg.error);
        setIsLoading(false);
        setStreamingMessage(null);
        // 显示错误通知
        toast.error("AI Response Error", {
          description: msg.error || "An error occurred while processing your message",
        });
        break;
    }
  }, [sessionId]); // 移除 streamingMessage 依赖，使用 ref 替代

  const { status: connectionStatus, send } = useWebSocket({
    url: wsUrl,
    onMessage: handleWSMessage,
    reconnectAttempts: 10,
    reconnectInterval: 2000,
  });

  // 当 sessionId 变化时加载历史消息
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionIdRef.current) {
      currentSessionIdRef.current = sessionId;
      setStreamingMessage(null);
      setIsLoading(false);
      titleGeneratedRef.current = false; // Reset title generation flag
      // 加载该会话的历史消息
      loadHistory(sessionId);
    } else if (!sessionId) {
      // 没有选中会话时清空消息
      currentSessionIdRef.current = null;
      setMessages([]);
      setStreamingMessage(null);
      setIsLoading(false);
      titleGeneratedRef.current = false;
    }
  }, [sessionId, loadHistory]);

  const sendMessage = useCallback(
    (content: string, model?: string, params?: ChatParameters, images?: ImageContent[], files?: FileAttachment[], useMcp?: boolean) => {
      // Allow empty content if images or files are provided
      if ((!content.trim() && !images?.length && !files?.length) || connectionStatus !== "connected") {
        return;
      }

      // 添加用户消息
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: sessionId || "",
        role: "user",
        content: content.trim(),
        images: images,
        files: files,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Clear previous tool calls
      setToolCalls([]);

      // 发送到后端（包含可选的模型参数、图片和文件）
      send({
        type: "message",
        content: content.trim(),
        images: images,
        files: files,
        model: model,
        temperature: params?.temperature,
        top_p: params?.top_p,
        max_tokens: params?.max_tokens,
        use_mcp: useMcp !== false, // Default to true
      });

      setIsLoading(true);
    },
    [connectionStatus, send, sessionId]
  );

  // 刷新消息列表
  const refreshMessages = useCallback(() => {
    if (sessionId) {
      loadHistory(sessionId);
    }
  }, [sessionId, loadHistory]);

  // 重新生成 AI 消息
  const regenerateMessage = useCallback(
    (assistantMessageId: string) => {
      // 找到 AI 消息的索引
      const assistantIndex = messages.findIndex((m) => m.id === assistantMessageId);
      if (assistantIndex === -1) return;

      // 找到该 AI 消息之前的用户消息
      for (let i = assistantIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          const userMessage = messages[i];
          // 删除从用户消息之后的所有消息（包括该 AI 消息）
          setMessages((prev) => prev.slice(0, i));
          // 重新发送用户消息，告诉后端删除该消息之后的所有消息
          send({
            type: "message",
            content: userMessage.content.trim(),
            images: userMessage.images,
            files: userMessage.files,
            regenerate: true,
            // 告诉后端删除该用户消息之后的所有消息（包括 AI 消息）
            delete_from_message_id: userMessage.id,
          });
          setIsLoading(true);
          break;
        }
      }
    },
    [messages, send]
  );

  // 删除消息
  const deleteMessageHandler = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;

      try {
        await apiDeleteMessage(sessionId, messageId);
        // 从本地状态移除消息
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted");
      } catch (error) {
        console.error("Failed to delete message:", error);
        toast.error("Failed to delete message", {
          description: "Please try again",
        });
      }
    },
    [sessionId]
  );

  // 手动触发生成标题
  const generateTitle = useCallback(async () => {
    if (!sessionId) return;

    try {
      const result = await generateSessionTitle(sessionId);
      if (result.title && options?.onTitleGenerated) {
        options.onTitleGenerated(result.title);
      }
    } catch (error) {
      console.error("Failed to generate title:", error);
    }
  }, [sessionId, options]);

  return {
    messages,
    streamingMessage,
    toolCalls,
    connectionStatus,
    sendMessage,
    regenerateMessage,
    deleteMessage: deleteMessageHandler,
    isLoading,
    isLoadingHistory,
    refreshMessages,
    generateTitle,
  };
}
