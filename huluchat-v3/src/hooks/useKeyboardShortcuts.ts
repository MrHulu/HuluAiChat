/**
 * useKeyboardShortcuts Hook
 * 全局键盘快捷键支持
 */
import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  onNewSession?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  enabled?: boolean;
}

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * 全局键盘快捷键 Hook
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    onNewSession,
    onToggleSidebar,
    onOpenSettings,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // 忽略输入框中的快捷键（除非是 Escape）
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape 键始终有效
      if (event.key === "Escape") {
        // 如果有打开的对话框，Escape 会由对话框自己处理
        // 这里不做任何事，让事件冒泡
        return;
      }

      // 输入框中不响应其他快捷键
      if (isInputFocused) return;

      // Ctrl/Cmd + N: 新建会话
      if (
        event.key.toLowerCase() === "n" &&
        ((isMacOS() && event.metaKey) || (!isMacOS() && event.ctrlKey))
      ) {
        event.preventDefault();
        onNewSession?.();
        return;
      }

      // Ctrl/Cmd + B: 切换侧边栏
      if (
        event.key.toLowerCase() === "b" &&
        ((isMacOS() && event.metaKey) || (!isMacOS() && event.ctrlKey))
      ) {
        event.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Ctrl/Cmd + ,: 打开设置
      if (
        event.key === "," &&
        ((isMacOS() && event.metaKey) || (!isMacOS() && event.ctrlKey))
      ) {
        event.preventDefault();
        onOpenSettings?.();
        return;
      }
    },
    [enabled, onNewSession, onToggleSidebar, onOpenSettings]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * 快捷键列表（用于显示帮助）
 */
export const KEYBOARD_SHORTCUTS = [
  {
    key: "Ctrl/Cmd + N",
    description: "新建会话",
    mac: "⌘N",
    windows: "Ctrl+N",
  },
  {
    key: "Ctrl/Cmd + B",
    description: "切换侧边栏",
    mac: "⌘B",
    windows: "Ctrl+B",
  },
  {
    key: "Ctrl/Cmd + ,",
    description: "打开设置",
    mac: "⌘,",
    windows: "Ctrl+,",
  },
  {
    key: "? / F1",
    description: "显示快捷键帮助",
    mac: "? / F1",
    windows: "? / F1",
  },
  {
    key: "Escape",
    description: "关闭对话框",
    mac: "Esc",
    windows: "Esc",
  },
];
