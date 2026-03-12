/**
 * useShortcutSettings Hook
 * Manages custom keyboard shortcuts with localStorage persistence
 *
 * PRIVACY: All shortcut preferences stored locally, no data sent to servers
 */
import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Represents a keyboard shortcut binding
 */
export interface ShortcutBinding {
  /** Unique identifier for the action */
  id: string;
  /** Key code (e.g., 'KeyK', 'KeyN', 'Escape') */
  key: string;
  /** Ctrl key required */
  ctrlKey: boolean;
  /** Meta/Command key required (macOS) */
  metaKey: boolean;
  /** Shift key required */
  shiftKey: boolean;
  /** Alt/Option key required */
  altKey: boolean;
}

/**
 * Default shortcut bindings
 */
export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: "commandPalette", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "newChat", key: "KeyN", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "searchInChat", key: "KeyF", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "toggleSidebar", key: "KeyB", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "switchSession1", key: "Digit1", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "switchSession2", key: "Digit2", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "switchSession3", key: "Digit3", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
  { id: "settings", key: "Comma", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
];

/**
 * Shortcut metadata for display
 */
export const SHORTCUT_META: Record<string, { descriptionKey: string; group: string }> = {
  commandPalette: { descriptionKey: "keyboard.commandPalette", group: "navigation" },
  newChat: { descriptionKey: "keyboard.newChat", group: "actions" },
  searchInChat: { descriptionKey: "keyboard.searchInChat", group: "navigation" },
  toggleSidebar: { descriptionKey: "keyboard.toggleSidebar", group: "navigation" },
  switchSession1: { descriptionKey: "keyboard.switchSession1", group: "navigation" },
  switchSession2: { descriptionKey: "keyboard.switchSession2", group: "navigation" },
  switchSession3: { descriptionKey: "keyboard.switchSession3", group: "navigation" },
  settings: { descriptionKey: "keyboard.settings", group: "navigation" },
};

const STORAGE_KEY = "huluchat_shortcut_settings";

/**
 * Formats a shortcut binding for display
 */
export function formatShortcut(binding: ShortcutBinding, isMac: boolean): string {
  const parts: string[] = [];

  if (binding.ctrlKey || binding.metaKey) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (binding.shiftKey) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (binding.altKey) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  // Format key
  let keyDisplay = binding.key.replace("Key", "").replace("Digit", "");
  if (keyDisplay === "Comma") keyDisplay = ",";
  if (keyDisplay === "Period") keyDisplay = ".";
  if (keyDisplay === "Slash") keyDisplay = "/";
  if (keyDisplay === "Space") keyDisplay = "Space";

  parts.push(keyDisplay);

  return parts.join(isMac ? "" : "+");
}

/**
 * Detects if running on macOS
 */
export function isMacOSPlatform(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Creates a binding key for comparison
 */
function createBindingKey(binding: ShortcutBinding, isMac: boolean): string {
  const ctrlOrMeta = isMac ? binding.metaKey : binding.ctrlKey;
  return `${ctrlOrMeta}:${binding.shiftKey}:${binding.altKey}:${binding.key}`;
}

/**
 * Detects conflicts between shortcuts
 */
export function detectConflicts(
  bindings: ShortcutBinding[]
): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const isMac = isMacOSPlatform();
  const keyMap = new Map<string, string[]>();

  for (const binding of bindings) {
    const key = createBindingKey(binding, isMac);
    const existing = keyMap.get(key) || [];
    existing.push(binding.id);
    keyMap.set(key, existing);
  }

  for (const [, ids] of keyMap) {
    if (ids.length > 1) {
      for (const id of ids) {
        conflicts.set(id, ids.filter((i) => i !== id));
      }
    }
  }

  return conflicts;
}

/**
 * Hook for managing custom shortcut settings
 */
export function useShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all shortcuts exist
        return DEFAULT_SHORTCUTS.map((def) => {
          const custom = parsed.find((s: ShortcutBinding) => s.id === def.id);
          return custom || def;
        });
      }
    } catch (e) {
      console.error("Failed to load shortcut settings:", e);
    }
    return DEFAULT_SHORTCUTS;
  });

  const isMac = useMemo(() => isMacOSPlatform(), []);
  const conflicts = useMemo(() => detectConflicts(shortcuts), [shortcuts]);

  // Save to localStorage when shortcuts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch (e) {
      console.error("Failed to save shortcut settings:", e);
    }
  }, [shortcuts]);

  /**
   * Update a specific shortcut binding
   */
  const updateShortcut = useCallback((id: string, binding: Partial<ShortcutBinding>) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...binding } : s))
    );
  }, []);

  /**
   * Reset a specific shortcut to default
   */
  const resetShortcut = useCallback((id: string) => {
    const defaultBinding = DEFAULT_SHORTCUTS.find((s) => s.id === id);
    if (defaultBinding) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === id ? defaultBinding : s))
      );
    }
  }, []);

  /**
   * Reset all shortcuts to defaults
   */
  const resetAllShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
  }, []);

  /**
   * Get a shortcut binding by ID
   */
  const getShortcut = useCallback(
    (id: string): ShortcutBinding | undefined => {
      return shortcuts.find((s) => s.id === id);
    },
    [shortcuts]
  );

  /**
   * Check if a binding conflicts with existing shortcuts
   */
  const checkConflict = useCallback(
    (
      id: string,
      binding: ShortcutBinding
    ): string[] => {
      const isMacLocal = isMacOSPlatform();
      const testBinding: ShortcutBinding = { ...binding, id };
      const testKey = createBindingKey(testBinding, isMacLocal);

      const conflictingIds: string[] = [];
      for (const s of shortcuts) {
        if (s.id !== id) {
          const existingKey = createBindingKey(s, isMacLocal);
          if (existingKey === testKey) {
            conflictingIds.push(s.id);
          }
        }
      }
      return conflictingIds;
    },
    [shortcuts]
  );

  return {
    shortcuts,
    conflicts,
    isMac,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    getShortcut,
    checkConflict,
    formatShortcut: useCallback(
      (binding: ShortcutBinding) => formatShortcut(binding, isMac),
      [isMac]
    ),
  };
}
