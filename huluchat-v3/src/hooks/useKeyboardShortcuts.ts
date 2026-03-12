/**
 * useKeyboardShortcuts Hook
 * 全局键盘快捷键支持
 *
 * PRIVACY: Shortcut preferences read from localStorage only, no data sent to servers
 */
import { useEffect, useCallback, useMemo } from "react";

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
  onSwitchSession?: (index: number) => void;
  enabled?: boolean;
}

/**
 * 检测是否为 macOS
 */
function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Custom shortcut binding from settings
 */
interface CustomShortcutBinding {
  id: string;
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

const STORAGE_KEY = "huluchat_shortcut_settings";

/**
 * Load custom shortcuts from localStorage
 */
function loadCustomShortcuts(): Map<string, CustomShortcutBinding> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: CustomShortcutBinding[] = JSON.parse(stored);
      return new Map(parsed.map((s) => [s.id, s]));
    }
  } catch (e) {
    console.error("Failed to load custom shortcuts:", e);
  }
  return new Map();
}

/**
 * Check if a keyboard event matches a shortcut binding
 */
function matchesShortcut(
  event: KeyboardEvent,
  binding: CustomShortcutBinding,
  isMac: boolean
): boolean {
  // Check key code
  if (event.code !== binding.key) return false;

  // On Mac, metaKey is used; on Windows/Linux, ctrlKey is used
  const ctrlOrMeta = isMac ? binding.metaKey : binding.ctrlKey;
  const eventCtrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

  return (
    eventCtrlOrMeta === ctrlOrMeta &&
    event.shiftKey === binding.shiftKey &&
    event.altKey === binding.altKey
  );
}

/**
 * 全局键盘快捷键 Hook
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    onNewSession,
    onToggleSidebar,
    onOpenSettings,
    onSwitchSession,
    enabled = true,
  } = options;

  // Load custom shortcuts (memoized to avoid re-reading on every render)
  const customShortcuts = useMemo(() => loadCustomShortcuts(), []);

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

      const isMac = isMacOS();

      // Helper to check if event matches a shortcut ID
      const checkShortcut = (id: string): boolean => {
        const binding = customShortcuts.get(id);
        if (!binding) return false;
        return matchesShortcut(event, binding, isMac);
      };

      // New chat
      if (checkShortcut("newChat")) {
        event.preventDefault();
        onNewSession?.();
        return;
      }

      // Toggle sidebar
      if (checkShortcut("toggleSidebar")) {
        event.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Settings
      if (checkShortcut("settings")) {
        event.preventDefault();
        onOpenSettings?.();
        return;
      }

      // Switch session 1
      if (checkShortcut("switchSession1")) {
        event.preventDefault();
        onSwitchSession?.(0);
        return;
      }

      // Switch session 2
      if (checkShortcut("switchSession2")) {
        event.preventDefault();
        onSwitchSession?.(1);
        return;
      }

      // Switch session 3
      if (checkShortcut("switchSession3")) {
        event.preventDefault();
        onSwitchSession?.(2);
        return;
      }
    },
    [enabled, onNewSession, onToggleSidebar, onOpenSettings, onSwitchSession, customShortcuts]
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
    key: "Ctrl/Cmd + K",
    descriptionKey: "keyboard.commandPalette",
    mac: "⌘K",
    windows: "Ctrl+K",
  },
  {
    key: "Ctrl/Cmd + N",
    descriptionKey: "keyboard.newChat",
    mac: "⌘N",
    windows: "Ctrl+N",
  },
  {
    key: "Ctrl/Cmd + F",
    descriptionKey: "keyboard.searchInChat",
    mac: "⌘F",
    windows: "Ctrl+F",
  },
  {
    key: "Ctrl/Cmd + B",
    descriptionKey: "keyboard.toggleSidebar",
    mac: "⌘B",
    windows: "Ctrl+B",
  },
  {
    key: "Ctrl/Cmd + 1/2/3",
    descriptionKey: "keyboard.switchSession",
    mac: "⌘1/2/3",
    windows: "Ctrl+1/2/3",
  },
  {
    key: "Ctrl/Cmd + ,",
    descriptionKey: "keyboard.settings",
    mac: "⌘,",
    windows: "Ctrl+,",
  },
  {
    key: "? / F1",
    descriptionKey: "keyboard.showHelp",
    mac: "? / F1",
    windows: "? / F1",
  },
  {
    key: "Escape",
    descriptionKey: "keyboard.close",
    mac: "Esc",
    windows: "Esc",
  },
];
