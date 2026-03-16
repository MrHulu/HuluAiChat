/**
 * useUndoDelete Hook
 * TASK-350: 会话删除撤销功能
 * 提供延迟删除和撤销能力
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PendingDeletion {
  id: string;
  title: string;
  timestamp: number;
}

export interface UseUndoDeleteOptions {
  /** 延迟删除时间（毫秒），默认 10 秒 */
  delay?: number;
  /** 实际删除回调 */
  onDelete: (id: string) => Promise<void>;
  /** 撤销后的回调 */
  onUndo?: (id: string) => void;
}

export interface UseUndoDeleteReturn {
  /** 待删除的项目列表 */
  pendingDeletions: PendingDeletion[];
  /** 请求删除（带撤销选项） */
  requestDelete: (id: string, title: string) => void;
  /** 撤销删除 */
  undoDelete: (id: string) => void;
  /** 立即执行删除（不等待延迟） */
  executeDelete: (id: string) => Promise<void>;
  /** 清除所有待删除项目 */
  clearPendingDeletions: () => void;
}

export function useUndoDelete({
  delay = 10000,
  onDelete,
  onUndo,
}: UseUndoDeleteOptions): UseUndoDeleteReturn {
  const { t } = useTranslation();
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 清理所有 timeout
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // 立即执行删除
  const executeDelete = useCallback(async (id: string) => {
    // 清除 timeout
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    // 从待删除列表移除
    setPendingDeletions((prev) => prev.filter((item) => item.id !== id));

    // 执行实际删除
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(t("sessionItem.deleteError"));
    }
  }, [onDelete, t]);

  // 撤销删除
  const undoDelete = useCallback((id: string) => {
    // 清除 timeout
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    // 从待删除列表移除
    setPendingDeletions((prev) => prev.filter((item) => item.id !== id));

    // 调用撤销回调
    onUndo?.(id);

    toast.success(t("sessionItem.deleteUndone"));
  }, [onUndo, t]);

  // 请求删除（显示带撤销的 toast）
  const requestDelete = useCallback((id: string, title: string) => {
    // 添加到待删除列表
    const pendingItem: PendingDeletion = {
      id,
      title,
      timestamp: Date.now(),
    };

    setPendingDeletions((prev) => [...prev, pendingItem]);

    // 设置延迟删除的 timeout
    const timeout = setTimeout(() => {
      executeDelete(id);
    }, delay);

    timeoutsRef.current.set(id, timeout);

    // 显示带撤销按钮的 toast
    toast(
      <div className="flex items-center justify-between gap-4 w-full">
        <span>{t("sessionItem.deleteToast", { title: title || t("sessionItem.newChat") })}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => undoDelete(id)}
          className="shrink-0"
        >
          <Undo2 className="w-3 h-3 mr-1" />
          {t("common.undo")}
        </Button>
      </div>,
      {
        duration: delay,
        id: `delete-${id}`,
      }
    );
  }, [delay, executeDelete, undoDelete, t]);

  // 清除所有待删除项目
  const clearPendingDeletions = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setPendingDeletions([]);
  }, []);

  return {
    pendingDeletions,
    requestDelete,
    undoDelete,
    executeDelete,
    clearPendingDeletions,
  };
}
