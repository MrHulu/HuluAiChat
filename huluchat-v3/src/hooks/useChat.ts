/**
 * useChat Hook
 * 聊天逻辑管理，包括消息状态和 WebSocket 通信
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWebSocket, ConnectionStatus } from "./useWebSocket";
import { Message, getSessionMessages, ImageContent, FileAttachment } from "@/api/client";

export interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
}

export interface ChatParameters {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface UseChatReturn {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  connectionStatus: ConnectionStatus;
  sendMessage: (content: string, model?: string, params?: ChatParameters, images?: ImageContent[], files?: FileAttachment[]) => void;
  regenerateMessage: (assistantMessageId: string) => void;
  isLoading: boolean;
  isLoadingHistory: boolean;
  refreshMessages: () => void;
}

// WebSocket 消息类型
interface WSMessage {
  type: "message" | "stream_start" | "stream_chunk" | "stream_end" | "error" | "history";
  content?: string;
  message_id?: string;
  messages?: Message[];
  error?: string;
}

export function useChat(sessionId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const currentSessionIdRef = useRef<string | null>(null);

  // 使用 ref 保存 streamingMessage 的最新值，避免闭包陷阱
  const streamingMessageRef = useRef<StreamingMessage | null>(null);
  useEffect(() => {
    streamingMessageRef.current = streamingMessage;
  }, [streamingMessage]);

  const wsUrl = sessionId
    ? `ws://127.0.0.1:8765/api/chat/ws/${sessionId}`
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
          setMessages((prev) => [...prev, newMessage]);
          setStreamingMessage(null);
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
      // 加载该会话的历史消息
      loadHistory(sessionId);
    } else if (!sessionId) {
      // 没有选中会话时清空消息
      currentSessionIdRef.current = null;
      setMessages([]);
      setStreamingMessage(null);
      setIsLoading(false);
    }
  }, [sessionId, loadHistory]);

  const sendMessage = useCallback(
    (content: string, model?: string, params?: ChatParameters, images?: ImageContent[], files?: FileAttachment[]) => {
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
          // 重新发送用户消息
          send({
            type: "message",
            content: userMessage.content.trim(),
            images: userMessage.images,
            files: userMessage.files,
            regenerate: true,
          });
          setIsLoading(true);
          break;
        }
      }
    },
    [messages, send]
  );

  return {
    messages,
    streamingMessage,
    connectionStatus,
    sendMessage,
    regenerateMessage,
    isLoading,
    isLoadingHistory,
    refreshMessages,
  };
}
