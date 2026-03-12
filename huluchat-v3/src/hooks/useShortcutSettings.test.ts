/**
 * Tests for useShortcutSettings hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useShortcutSettings,
  DEFAULT_SHORTCUTS,
  formatShortcut,
  detectConflicts,
  isMacOSPlatform,
} from "./useShortcutSettings";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock navigator.platform
const mockPlatform = (platform: string) => {
  Object.defineProperty(navigator, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
};

describe("useShortcutSettings", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return default shortcuts when localStorage is empty", () => {
      const { result } = renderHook(() => useShortcutSettings());

      expect(result.current.shortcuts).toEqual(DEFAULT_SHORTCUTS);
    });

    it("should load custom shortcuts from localStorage", () => {
      const customShortcuts = [
        { id: "newChat", key: "KeyT", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(customShortcuts));

      const { result } = renderHook(() => useShortcutSettings());

      const newChatShortcut = result.current.shortcuts.find((s) => s.id === "newChat");
      expect(newChatShortcut?.key).toBe("KeyT");
    });

    it("should merge custom shortcuts with defaults", () => {
      const partialCustom = [
        { id: "newChat", key: "KeyT", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(partialCustom));

      const { result } = renderHook(() => useShortcutSettings());

      // Should have all default shortcuts
      expect(result.current.shortcuts.length).toBe(DEFAULT_SHORTCUTS.length);
      // But newChat should be customized
      const newChatShortcut = result.current.shortcuts.find((s) => s.id === "newChat");
      expect(newChatShortcut?.key).toBe("KeyT");
    });
  });

  describe("updateShortcut", () => {
    it("should update a specific shortcut", () => {
      const { result } = renderHook(() => useShortcutSettings());

      act(() => {
        result.current.updateShortcut("newChat", { key: "KeyT" });
      });

      const newChatShortcut = result.current.shortcuts.find((s) => s.id === "newChat");
      expect(newChatShortcut?.key).toBe("KeyT");
    });

    it("should save to localStorage when updated", () => {
      const { result } = renderHook(() => useShortcutSettings());

      act(() => {
        result.current.updateShortcut("newChat", { key: "KeyT" });
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe("resetShortcut", () => {
    it("should reset a specific shortcut to default", () => {
      const { result } = renderHook(() => useShortcutSettings());

      // First update
      act(() => {
        result.current.updateShortcut("newChat", { key: "KeyT" });
      });

      // Then reset
      act(() => {
        result.current.resetShortcut("newChat");
      });

      const newChatShortcut = result.current.shortcuts.find((s) => s.id === "newChat");
      const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.id === "newChat");
      expect(newChatShortcut?.key).toBe(defaultShortcut?.key);
    });
  });

  describe("resetAllShortcuts", () => {
    it("should reset all shortcuts to defaults", () => {
      const { result } = renderHook(() => useShortcutSettings());

      // Update multiple shortcuts
      act(() => {
        result.current.updateShortcut("newChat", { key: "KeyT" });
        result.current.updateShortcut("toggleSidebar", { key: "KeyS" });
      });

      // Reset all
      act(() => {
        result.current.resetAllShortcuts();
      });

      expect(result.current.shortcuts).toEqual(DEFAULT_SHORTCUTS);
    });
  });

  describe("checkConflict", () => {
    it("should detect conflicts between shortcuts", () => {
      const { result } = renderHook(() => useShortcutSettings());

      // Try to set newChat to the same key as toggleSidebar
      const toggleSidebar = result.current.shortcuts.find((s) => s.id === "toggleSidebar");
      const conflictIds = result.current.checkConflict("newChat", toggleSidebar!);

      expect(conflictIds).toContain("toggleSidebar");
    });

    it("should return empty array when no conflict", () => {
      const { result } = renderHook(() => useShortcutSettings());

      const newBinding = { id: "newChat", key: "KeyZ", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
      const conflictIds = result.current.checkConflict("newChat", newBinding);

      expect(conflictIds).toHaveLength(0);
    });
  });

  describe("getShortcut", () => {
    it("should return a shortcut by ID", () => {
      const { result } = renderHook(() => useShortcutSettings());

      const shortcut = result.current.getShortcut("newChat");

      expect(shortcut?.id).toBe("newChat");
    });

    it("should return undefined for unknown ID", () => {
      const { result } = renderHook(() => useShortcutSettings());

      const shortcut = result.current.getShortcut("unknown");

      expect(shortcut).toBeUndefined();
    });
  });
});

describe("formatShortcut", () => {
  it("should format shortcut for Windows", () => {
    const binding = { id: "test", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    expect(formatShortcut(binding, false)).toBe("Ctrl+K");
  });

  it("should format shortcut for macOS", () => {
    const binding = { id: "test", key: "KeyK", ctrlKey: false, metaKey: true, shiftKey: false, altKey: false };
    expect(formatShortcut(binding, true)).toBe("⌘K");
  });

  it("should format shortcut with shift", () => {
    const binding = { id: "test", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: true, altKey: false };
    expect(formatShortcut(binding, false)).toBe("Ctrl+Shift+K");
  });

  it("should format shortcut with alt", () => {
    const binding = { id: "test", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: true };
    expect(formatShortcut(binding, false)).toBe("Ctrl+Alt+K");
  });

  it("should format comma key", () => {
    const binding = { id: "test", key: "Comma", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    expect(formatShortcut(binding, false)).toBe("Ctrl+,");
  });

  it("should format digit key", () => {
    const binding = { id: "test", key: "Digit1", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    expect(formatShortcut(binding, false)).toBe("Ctrl+1");
  });
});

describe("detectConflicts", () => {
  it("should detect no conflicts with unique shortcuts", () => {
    const conflicts = detectConflicts(DEFAULT_SHORTCUTS);
    expect(conflicts.size).toBe(0);
  });

  it("should detect conflicts with duplicate shortcuts", () => {
    const shortcuts = [
      { id: "a", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      { id: "b", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
    ];

    mockPlatform("Win32");
    const conflicts = detectConflicts(shortcuts);

    expect(conflicts.size).toBe(2);
    expect(conflicts.get("a")).toContain("b");
    expect(conflicts.get("b")).toContain("a");
  });
});

describe("isMacOSPlatform", () => {
  it("should return true for Mac platform", () => {
    mockPlatform("MacIntel");
    expect(isMacOSPlatform()).toBe(true);
  });

  it("should return false for Windows platform", () => {
    mockPlatform("Win32");
    expect(isMacOSPlatform()).toBe(false);
  });
});
