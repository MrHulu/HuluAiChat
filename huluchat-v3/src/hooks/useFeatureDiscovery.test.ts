/**
 * useFeatureDiscovery Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFeatureDiscovery, DISCOVERABLE_FEATURES } from "./useFeatureDiscovery";

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

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useFeatureDiscovery Hook", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初始化", () => {
    it("应该返回所有功能配置", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      expect(result.current.features).toEqual(DISCOVERABLE_FEATURES);
      expect(result.current.features.length).toBe(7); // TASK-236: added model-regenerate
    });

    it("应该初始化所有功能为未使用状态", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      expect(result.current.featureUsage).toEqual({
        "command-palette": false,
        "knowledge-center": false,
        "document-chat": false,
        "session-export": false,
        "folder-management": false,
        "model-switch": false,
        "model-regenerate": false, // TASK-236
      });
    });

    it("应该从 localStorage 恢复使用状态", () => {
      localStorageMock.setItem(
        "huluchat-feature-usage",
        JSON.stringify({
          "command-palette": true,
          "knowledge-center": true,
          "document-chat": false,
          "session-export": false,
          "folder-management": false,
          "model-switch": false,
          "model-regenerate": false, // TASK-236
        })
      );

      const { result } = renderHook(() => useFeatureDiscovery());

      expect(result.current.featureUsage["command-palette"]).toBe(true);
      expect(result.current.featureUsage["knowledge-center"]).toBe(true);
      expect(result.current.featureUsage["document-chat"]).toBe(false);
    });

    it("应该检查提示是否被禁用", () => {
      localStorageMock.setItem("huluchat-feature-tips-disabled", "true");

      const { result } = renderHook(() => useFeatureDiscovery());

      expect(result.current.isTipsDisabled).toBe(true);
    });
  });

  describe("markFeatureUsed", () => {
    it("应该标记功能为已使用", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.markFeatureUsed("command-palette");
      });

      expect(result.current.featureUsage["command-palette"]).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "huluchat-feature-usage",
        JSON.stringify({
          "command-palette": true,
          "knowledge-center": false,
          "document-chat": false,
          "session-export": false,
          "folder-management": false,
          "model-switch": false,
          "model-regenerate": false, // TASK-236
        })
      );
    });

    it("不应该重复保存已使用的功能", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.markFeatureUsed("command-palette");
      });

      const callCount = localStorageMock.setItem.mock.calls.length;

      act(() => {
        result.current.markFeatureUsed("command-palette");
      });

      // 不应该再次调用 setItem
      expect(localStorageMock.setItem.mock.calls.length).toBe(callCount);
    });
  });

  describe("getUnusedFeatures", () => {
    it("应该返回所有未使用的功能", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      const unused = result.current.getUnusedFeatures();
      expect(unused.length).toBe(7); // TASK-236: added model-regenerate
    });

    it("应该排除已使用的功能", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.markFeatureUsed("command-palette");
        result.current.markFeatureUsed("knowledge-center");
      });

      const unused = result.current.getUnusedFeatures();
      expect(unused.length).toBe(5); // 7 - 2 = 5
      expect(unused.find((f) => f.id === "command-palette")).toBeUndefined();
      expect(unused.find((f) => f.id === "knowledge-center")).toBeUndefined();
    });
  });

  describe("getNextUnusedFeature", () => {
    it("应该返回第一个未使用的功能", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      const next = result.current.getNextUnusedFeature();
      expect(next).not.toBeNull();
      expect(next?.id).toBe("command-palette");
    });

    it("所有功能都已使用时应该返回 null", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        DISCOVERABLE_FEATURES.forEach((f) => {
          result.current.markFeatureUsed(f.id);
        });
      });

      const next = result.current.getNextUnusedFeature();
      expect(next).toBeNull();
    });
  });

  describe("disableTips / enableTips", () => {
    it("应该永久禁用提示", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.disableTips();
      });

      expect(result.current.isTipsDisabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "huluchat-feature-tips-disabled",
        "true"
      );
    });

    it("应该重新启用提示", () => {
      localStorageMock.setItem("huluchat-feature-tips-disabled", "true");

      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.enableTips();
      });

      expect(result.current.isTipsDisabled).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "huluchat-feature-tips-disabled"
      );
    });
  });

  describe("currentTip", () => {
    it("应该返回当前应该显示的提示", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      expect(result.current.currentTip).not.toBeNull();
      expect(result.current.currentTip?.id).toBe("command-palette");
    });

    it("禁用提示后不应该返回提示", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.disableTips();
      });

      expect(result.current.currentTip).toBeNull();
    });

    it("所有功能都已使用后不应该返回提示", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        DISCOVERABLE_FEATURES.forEach((f) => {
          result.current.markFeatureUsed(f.id);
        });
      });

      expect(result.current.currentTip).toBeNull();
    });

    it("关闭提示后不应该再显示同一提示", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.dismissCurrentTip();
      });

      expect(result.current.currentTip).toBeNull();
    });
  });

  describe("隐私约束", () => {
    it("只应该存储布尔值，不存储使用次数", () => {
      const { result } = renderHook(() => useFeatureDiscovery());

      act(() => {
        result.current.markFeatureUsed("command-palette");
      });

      // 检查存储的是布尔值
      const stored = JSON.parse(
        localStorageMock.getItem("huluchat-feature-usage") || "{}"
      );
      expect(typeof stored["command-palette"]).toBe("boolean");
    });
  });
});
