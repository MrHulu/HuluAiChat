/**
 * useAccessibilityPermission Hook Tests
 *
 * Note: Tests that require Tauri API integration are simplified because
 * mocking the Tauri invoke function in tests is complex. The core
 * functionality is tested through integration tests.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAccessibilityPermission } from "./useAccessibilityPermission";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// Helper to mock platform
const mockPlatform = (platform: string) => {
  Object.defineProperty(navigator, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });
};

describe("useAccessibilityPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Default to Windows (no permission needed)
    mockPlatform("Win32");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Non-macOS platforms", () => {
    it("should not require permission on Windows", async () => {
      mockPlatform("Win32");

      const { result } = renderHook(() => useAccessibilityPermission());

      // On non-macOS, permission is not required
      expect(result.current.platformRequiresPermission).toBe(false);
      // showGuide should be false since permission is not required
      expect(result.current.showGuide).toBe(false);
    });

    it("should not require permission on Linux", async () => {
      mockPlatform("Linux x86_64");

      const { result } = renderHook(() => useAccessibilityPermission());

      expect(result.current.platformRequiresPermission).toBe(false);
      expect(result.current.showGuide).toBe(false);
    });
  });

  describe("macOS platform detection", () => {
    it("should detect macOS platform requires permission", () => {
      mockPlatform("MacIntel");

      const { result } = renderHook(() => useAccessibilityPermission());

      expect(result.current.platformRequiresPermission).toBe(true);
    });
  });

  describe("Guide dismissal", () => {
    beforeEach(() => {
      mockPlatform("MacIntel");
    });

    it("should dismiss guide for current session", () => {
      const { result } = renderHook(() => useAccessibilityPermission());

      act(() => {
        result.current.dismissGuide();
      });

      expect(result.current.showGuide).toBe(false);
      expect(result.current.isDismissed).toBe(true);
    });

    it("should dismiss guide permanently", () => {
      const { result } = renderHook(() => useAccessibilityPermission());

      act(() => {
        result.current.dismissPermanently();
      });

      expect(result.current.showGuide).toBe(false);
      expect(localStorageMock.getItem("huluchat-permission-guide-dismissed")).toBe("true");
    });

    it("should not show guide if previously dismissed permanently", () => {
      localStorageMock.setItem("huluchat-permission-guide-dismissed", "true");

      const { result } = renderHook(() => useAccessibilityPermission());

      expect(result.current.isDismissed).toBe(true);
      expect(result.current.showGuide).toBe(false);
    });

    it("should reset dismissed state", () => {
      localStorageMock.setItem("huluchat-permission-guide-dismissed", "true");

      const { result } = renderHook(() => useAccessibilityPermission());

      act(() => {
        result.current.resetDismissed();
      });

      expect(result.current.isDismissed).toBe(false);
      expect(localStorageMock.getItem("huluchat-permission-guide-dismissed")).toBeNull();
    });
  });

  describe("Return value structure", () => {
    it("should return all expected properties", () => {
      mockPlatform("Win32");

      const { result } = renderHook(() => useAccessibilityPermission());

      expect(result.current).toHaveProperty("status");
      expect(result.current).toHaveProperty("showGuide");
      expect(result.current).toHaveProperty("isDismissed");
      expect(result.current).toHaveProperty("openSettings");
      expect(result.current).toHaveProperty("checkPermission");
      expect(result.current).toHaveProperty("dismissGuide");
      expect(result.current).toHaveProperty("dismissPermanently");
      expect(result.current).toHaveProperty("resetDismissed");
      expect(result.current).toHaveProperty("platformRequiresPermission");
    });

    it("should return functions that can be called", () => {
      mockPlatform("Win32");

      const { result } = renderHook(() => useAccessibilityPermission());

      expect(typeof result.current.openSettings).toBe("function");
      expect(typeof result.current.checkPermission).toBe("function");
      expect(typeof result.current.dismissGuide).toBe("function");
      expect(typeof result.current.dismissPermanently).toBe("function");
      expect(typeof result.current.resetDismissed).toBe("function");
    });
  });
});
