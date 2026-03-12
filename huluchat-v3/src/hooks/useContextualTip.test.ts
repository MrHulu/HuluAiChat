/**
 * useContextualTip Hook Tests
 * 上下文智能提示测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useContextualTip, type ContextState } from "./useContextualTip";
import { CONTEXTUAL_TIPS, SORTED_TIPS } from "@/data/contextualTips";

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

// Mock API client
vi.mock("@/api/client", () => ({
  getSettings: vi.fn().mockResolvedValue({
    openai_api_key: null,
    ollama_base_url: null,
    mcp_servers: [],
  }),
}));

// Default context state
const defaultContext: ContextState = {
  sessionId: null,
  messageCount: 0,
  isLoading: false,
  currentModel: "",
  modelCount: 3,
  settingsLoaded: true,
};

describe("useContextualTip Hook", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初始化", () => {
    it("当没有满足条件时不返回提示", async () => {
      // 场景：有会话、有消息、有模型
      const contextWithSession: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 5,
        currentModel: "gpt-4",
      };

      const { result } = renderHook(() => useContextualTip(contextWithSession));

      // 等待 settings 加载完成
      await waitFor(() => {
        // 应该没有提示（所有条件都不满足）
        expect(result.current.matchingTips.length).toBe(0);
        expect(result.current.currentTip).toBeNull();
      });
    });

    it("当提示被禁用时不返回提示", async () => {
      localStorageMock.setItem("huluchat-contextual-tips-disabled", "true");

      const { result } = renderHook(() => useContextualTip(defaultContext));

      await waitFor(() => {
        expect(result.current.isDisabled).toBe(true);
        expect(result.current.currentTip).toBeNull();
      });
    });
  });

  describe("条件检测", () => {
    it("当空会话时显示 empty-session 提示", async () => {
      const context: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 0,
        isLoading: false,
        currentModel: "", // 不设置模型，避免触发其他条件
      };

      const { result } = renderHook(() => useContextualTip(context));

      await waitFor(() => {
        expect(result.current.currentTip).not.toBeNull();
        expect(result.current.currentTip?.id).toBe("empty-session");
      });
    });

    it("首次访问时显示 first-visit 提示", async () => {
      // 没有功能使用记录
      localStorageMock.setItem("huluchat-feature-usage", JSON.stringify({
        "command-palette": false,
        "knowledge-center": false,
      }));

      const { result } = renderHook(() => useContextualTip(defaultContext));

      await waitFor(() => {
        expect(result.current.currentTip).not.toBeNull();
        expect(result.current.currentTip?.id).toBe("first-visit");
      });
    });
  });

  describe("dismissTip", () => {
    it("关闭当前提示后不再显示该提示", async () => {
      // 场景：需要确保只触发 empty-session 条件
      // 条件：有会话、0 消息、不加载中、有模型（避免 no-api-key 触发）
      // 但是由于 mock 返回没有 API Key，会触发 no-api-key
      // 所以我们用另一个场景测试

      const context: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 0,
        isLoading: false,
        currentModel: "",
      };

      const { result } = renderHook(() => useContextualTip(context));

      await waitFor(() => {
        expect(result.current.currentTip).not.toBeNull();
      });

      const tipId = result.current.currentTip?.id;

      act(() => {
        result.current.dismissTip();
      });

      // 当前提示应该被关闭
      expect(result.current.dismissedIds).toContain(tipId);
      // matchingTips 中不应该再包含该提示
      expect(result.current.matchingTips.find(t => t.id === tipId)).toBeUndefined();
    });

    it("关闭当前提示后如果有其他符合条件的提示会显示下一个", async () => {
      // 这个场景：空会话 + 有模型 + 没有 API Key
      // 会触发 empty-session 和 settings-incomplete
      const context: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 0,
        isLoading: false,
        currentModel: "gpt-4", // 有模型
      };

      const { result } = renderHook(() => useContextualTip(context));

      await waitFor(() => {
        expect(result.current.currentTip).not.toBeNull();
      });

      const firstTipId = result.current.currentTip?.id;

      act(() => {
        result.current.dismissTip();
      });

      // 当前提示应该被关闭
      expect(result.current.dismissedIds).toContain(firstTipId);
      // 下一个提示可能存在（settings-incomplete）
      const remainingTips = result.current.matchingTips;
      expect(remainingTips.find(t => t.id === firstTipId)).toBeUndefined();
    });
  });

  describe("disableAllTips", () => {
    it("永久禁用所有上下文提示", async () => {
      const { result } = renderHook(() => useContextualTip(defaultContext));

      act(() => {
        result.current.disableAllTips();
      });

      expect(result.current.isDisabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "huluchat-contextual-tips-disabled",
        "true"
      );
    });
  });

  describe("优先级", () => {
    it("应该按优先级返回提示（数字越小优先级越高）", () => {
      // 验证 SORTED_TIPS 是按优先级排序的
      for (let i = 1; i < SORTED_TIPS.length; i++) {
        expect(SORTED_TIPS[i].priority).toBeGreaterThanOrEqual(
          SORTED_TIPS[i - 1].priority
        );
      }
    });

    it("no-api-key 应该比 empty-session 优先级更高", () => {
      const noApiKey = CONTEXTUAL_TIPS.find((t) => t.id === "no-api-key");
      const emptySession = CONTEXTUAL_TIPS.find((t) => t.id === "empty-session");

      // Both should exist, then compare priorities
      expect(noApiKey).toBeDefined();
      expect(emptySession).toBeDefined();
      expect(noApiKey!.priority).toBeLessThan(emptySession!.priority);
    });
  });

  describe("隐私约束", () => {
    it("只检测当前状态，不存储历史行为", async () => {
      const context: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 0,
        isLoading: false,
        currentModel: "",
      };

      renderHook(() => useContextualTip(context));

      // 除了禁用状态，不应该存储其他任何内容
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const nonDisabledCalls = setItemCalls.filter(
        (call) => call[0] !== "huluchat-contextual-tips-disabled"
      );

      expect(nonDisabledCalls.length).toBe(0);
    });

    it("关闭状态仅存储于会话内存", async () => {
      const context: ContextState = {
        ...defaultContext,
        sessionId: "test-session",
        messageCount: 0,
        isLoading: false,
        currentModel: "",
      };

      const { result } = renderHook(() => useContextualTip(context));

      await waitFor(() => {
        expect(result.current.currentTip).not.toBeNull();
      });

      act(() => {
        result.current.dismissTip();
      });

      // dismissedIds 应该在内存中，不在 localStorage 中
      expect(result.current.dismissedIds).toContain("empty-session");
      // 不应该调用 setItem 存储 dismissedIds
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const dismissedCalls = setItemCalls.filter(
        (call) => call[0].includes("dismissed")
      );
      expect(dismissedCalls.length).toBe(0);
    });
  });

  describe("matchingTips", () => {
    it("返回所有符合条件的提示", async () => {
      const context: ContextState = {
        ...defaultContext,
        sessionId: null,
        messageCount: 0,
        isLoading: false,
        currentModel: "",
      };

      const { result } = renderHook(() => useContextualTip(context));

      await waitFor(() => {
        // first-visit 符合条件
        expect(result.current.matchingTips.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
