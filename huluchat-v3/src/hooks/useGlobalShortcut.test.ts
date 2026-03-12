/**
 * useGlobalShortcut Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useGlobalShortcut,
  formatGlobalShortcut,
  checkSystemShortcutConflicts,
  validateShortcut,
  DEFAULT_GLOBAL_SHORTCUT,
} from "./useGlobalShortcut";
import { renderHook, act } from "@testing-library/react";

// Mock Tauri plugin
vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  register: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(undefined),
  isRegistered: vi.fn().mockResolvedValue(false),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock __TAURI__
Object.defineProperty(window, "__TAURI__", { value: {} });

describe("useGlobalShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct default shortcut", () => {
    expect(DEFAULT_GLOBAL_SHORTCUT).toBe("CommandOrControl+Shift+Space");
  });

  it("should initialize with default values", () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useGlobalShortcut({
        id: "test-shortcut",
        shortcut: DEFAULT_GLOBAL_SHORTCUT,
        handler,
      })
    );

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.currentShortcut).toBe(DEFAULT_GLOBAL_SHORTCUT);
  });

  it("should load custom shortcut from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("Ctrl+Alt+Q");

    const handler = vi.fn();
    const { result } = renderHook(() =>
      useGlobalShortcut({
        id: "test-shortcut",
        shortcut: DEFAULT_GLOBAL_SHORTCUT,
        handler,
      })
    );

    expect(result.current.currentShortcut).toBe("Ctrl+Alt+Q");
  });

  it("should provide registerShortcut function", () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useGlobalShortcut({
        id: "test-shortcut",
        shortcut: DEFAULT_GLOBAL_SHORTCUT,
        handler,
      })
    );

    expect(typeof result.current.registerShortcut).toBe("function");
  });

  it("should provide unregisterShortcut function", () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useGlobalShortcut({
        id: "test-shortcut",
        shortcut: DEFAULT_GLOBAL_SHORTCUT,
        handler,
      })
    );

    expect(typeof result.current.unregisterShortcut).toBe("function");
  });

  it("should provide updateShortcut function", async () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useGlobalShortcut({
        id: "test-shortcut",
        shortcut: DEFAULT_GLOBAL_SHORTCUT,
        handler,
      })
    );

    await act(async () => {
      await result.current.updateShortcut("Ctrl+Alt+P");
    });

    expect(result.current.currentShortcut).toBe("Ctrl+Alt+P");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "huluchat_global_shortcut",
      "Ctrl+Alt+P"
    );
  });
});

describe("formatGlobalShortcut", () => {
  it("should format shortcut for macOS", () => {
    const result = formatGlobalShortcut("CommandOrControl+Shift+Space", true);
    expect(result).toBe("Cmd Shift Space");
  });

  it("should format shortcut for Windows/Linux", () => {
    const result = formatGlobalShortcut("CommandOrControl+Shift+Space", false);
    expect(result).toBe("Ctrl+Shift+Space");
  });

  it("should handle Alt key", () => {
    expect(formatGlobalShortcut("Alt+Q", true)).toBe("Alt Q");
    expect(formatGlobalShortcut("Alt+Q", false)).toBe("Alt+Q");
  });
});

describe("checkSystemShortcutConflicts", () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    });
  });

  it("should detect Windows system shortcut conflicts", () => {
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });

    const conflicts = checkSystemShortcutConflicts("Ctrl+Alt+Del");
    expect(conflicts).toContain("Ctrl+Alt+Del");
  });

  it("should detect macOS system shortcut conflicts", () => {
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    });

    const conflicts = checkSystemShortcutConflicts("Cmd+Q");
    expect(conflicts).toContain("Cmd+Q");
  });

  it("should return empty array for non-conflicting shortcuts", () => {
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });

    const conflicts = checkSystemShortcutConflicts("Ctrl+Shift+Space");
    expect(conflicts).toHaveLength(0);
  });
});

describe("validateShortcut", () => {
  it("should validate a correct shortcut", () => {
    const result = validateShortcut("Ctrl+Shift+Space");
    expect(result.valid).toBe(true);
  });

  it("should reject empty shortcut", () => {
    const result = validateShortcut("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Shortcut cannot be empty");
  });

  it("should reject shortcut without modifier", () => {
    const result = validateShortcut("Space");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Shortcut must include at least one modifier key");
  });

  it("should reject shortcut with invalid modifier", () => {
    const result = validateShortcut("Invalid+Space");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid modifier");
  });

  it("should accept CommandOrControl modifier", () => {
    const result = validateShortcut("CommandOrControl+Space");
    expect(result.valid).toBe(true);
  });

  it("should accept multiple modifiers", () => {
    const result = validateShortcut("Ctrl+Shift+Alt+Space");
    expect(result.valid).toBe(true);
  });
});
