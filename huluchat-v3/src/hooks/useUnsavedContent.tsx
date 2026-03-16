/**
 * useUnsavedContent Hook
 * TASK-351: 输入内容丢失警告
 * 跟踪当前会话的未保存输入内容，在切换会话/关闭时警告用户
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { ImageContent, FileAttachment } from "@/api/client";

export interface UnsavedContent {
  sessionId: string;
  content: string;
  images: ImageContent[];
  files: FileAttachment[];
}

export interface UseUnsavedContentOptions {
  /** 当前会话 ID */
  currentSessionId: string | null;
}

export interface UseUnsavedContentReturn {
  /** 当前是否有未保存内容 */
  hasUnsavedContent: boolean;
  /** 获取当前会话的未保存内容 */
  getUnsavedContent: () => UnsavedContent | null;
  /** 更新当前会话的未保存内容 */
  updateUnsavedContent: (content: string, images?: ImageContent[], files?: FileAttachment[]) => void;
  /** 清除当前会话的未保存内容 */
  clearUnsavedContent: () => void;
  /** 清除指定会话的未保存内容 */
  clearSessionUnsavedContent: (sessionId: string) => void;
}

export function useUnsavedContent({
  currentSessionId,
}: UseUnsavedContentOptions): UseUnsavedContentReturn {
  const [unsavedContents, setUnsavedContents] = useState<Map<string, UnsavedContent>>(new Map());
  const currentContentRef = useRef<UnsavedContent | null>(null);

  // 当会话切换时，保存当前内容到 map
  useEffect(() => {
    if (currentSessionId && currentContentRef.current) {
      const content = currentContentRef.current;
      // 只有有内容时才保存
      if (content.content || content.images.length > 0 || content.files.length > 0) {
        setUnsavedContents((prev) => {
          const next = new Map(prev);
          next.set(currentSessionId, content);
          return next;
        });
      }
    }
    // 切换会话后重置当前内容引用
    currentContentRef.current = null;
  }, [currentSessionId]);

  // 更新当前会话的未保存内容
  const updateUnsavedContent = useCallback((content: string, images?: ImageContent[], files?: FileAttachment[]) => {
    if (!currentSessionId) return;

    currentContentRef.current = {
      sessionId: currentSessionId,
      content,
      images: images || [],
      files: files || [],
    };

    // 同时更新到 map 中
    setUnsavedContents((prev) => {
      // 如果内容为空，从 map 中移除
      if (!content && (!images || images.length === 0) && (!files || files.length === 0)) {
        const next = new Map(prev);
        next.delete(currentSessionId);
        return next;
      }

      const next = new Map(prev);
      next.set(currentSessionId, {
        sessionId: currentSessionId,
        content,
        images: images || [],
        files: files || [],
      });
      return next;
    });
  }, [currentSessionId]);

  // 获取当前会话的未保存内容
  const getUnsavedContent = useCallback((): UnsavedContent | null => {
    if (!currentSessionId) return null;
    return unsavedContents.get(currentSessionId) || null;
  }, [currentSessionId, unsavedContents]);

  // 清除当前会话的未保存内容
  const clearUnsavedContent = useCallback(() => {
    if (!currentSessionId) return;

    currentContentRef.current = null;
    setUnsavedContents((prev) => {
      const next = new Map(prev);
      next.delete(currentSessionId);
      return next;
    });
  }, [currentSessionId]);

  // 清除指定会话的未保存内容
  const clearSessionUnsavedContent = useCallback((sessionId: string) => {
    if (currentSessionId === sessionId) {
      currentContentRef.current = null;
    }
    setUnsavedContents((prev) => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  }, [currentSessionId]);

  // 检查当前是否有未保存内容
  const hasUnsavedContent = currentSessionId ? unsavedContents.has(currentSessionId) : false;

  return {
    hasUnsavedContent,
    getUnsavedContent,
    updateUnsavedContent,
    clearUnsavedContent,
    clearSessionUnsavedContent,
  };
}
