/**
 * Tests for useClipboardHistory hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useClipboardHistory } from "./useClipboardHistory";

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

describe("useClipboardHistory", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should initialize with empty history", () => {
    const { result } = renderHook(() => useClipboardHistory());

    expect(result.current.history).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.count).toBe(0);
  });

  it("should load history from localStorage", () => {
    const storedHistory = [
      {
        id: "test-1",
        content: "Hello",
        response: "Hi there!",
        timestamp: Date.now() - 1000,
      },
    ];
    localStorageMock.setItem(
      "huluchat_clipboard_history",
      JSON.stringify(storedHistory)
    );

    const { result } = renderHook(() => useClipboardHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].content).toBe("Hello");
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.count).toBe(1);
  });

  it("should add item to history", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "Test content",
        response: "Test response",
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].content).toBe("Test content");
    expect(result.current.history[0].response).toBe("Test response");
    expect(result.current.history[0].id).toBeDefined();
    expect(result.current.history[0].timestamp).toBeDefined();
    expect(result.current.isEmpty).toBe(false);
  });

  it("should add item with action and model", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "Test",
        action: "Translate",
        response: "Translated",
        model: "gpt-4o",
      });
    });

    expect(result.current.history[0].action).toBe("Translate");
    expect(result.current.history[0].model).toBe("gpt-4o");
  });

  it("should add items at the beginning (most recent first)", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "First",
        response: "Response 1",
      });
    });

    act(() => {
      result.current.addToHistory({
        content: "Second",
        response: "Response 2",
      });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].content).toBe("Second");
    expect(result.current.history[1].content).toBe("First");
  });

  it("should limit history to 50 items", () => {
    const { result } = renderHook(() => useClipboardHistory());

    // Add 60 items
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addToHistory({
          content: `Content ${i}`,
          response: `Response ${i}`,
        });
      }
    });

    expect(result.current.history).toHaveLength(50);
    // Most recent should be first
    expect(result.current.history[0].content).toBe("Content 59");
    // Oldest should be removed
    expect(result.current.history.find((h) => h.content === "Content 0")).toBeUndefined();
  });

  it("should remove item from history", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "To remove",
        response: "Response",
      });
    });

    const itemId = result.current.history[0].id;

    act(() => {
      result.current.removeFromHistory(itemId);
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it("should clear all history", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "Item 1",
        response: "Response 1",
      });
      result.current.addToHistory({
        content: "Item 2",
        response: "Response 2",
      });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("huluchat_clipboard_history");
  });

  it("should get item by ID", () => {
    const { result } = renderHook(() => useClipboardHistory());

    act(() => {
      result.current.addToHistory({
        content: "Find me",
        response: "Found!",
      });
    });

    const itemId = result.current.history[0].id;
    const item = result.current.getItem(itemId);

    expect(item).toBeDefined();
    expect(item?.content).toBe("Find me");
  });

  it("should return undefined for non-existent ID", () => {
    const { result } = renderHook(() => useClipboardHistory());

    const item = result.current.getItem("non-existent");

    expect(item).toBeUndefined();
  });

  it("should sort history by timestamp (most recent first)", () => {
    // Pre-populate with out-of-order timestamps
    const now = Date.now();
    const storedHistory = [
      {
        id: "old",
        content: "Old",
        response: "Old response",
        timestamp: now - 2000,
      },
      {
        id: "new",
        content: "New",
        response: "New response",
        timestamp: now - 1000,
      },
    ];
    localStorageMock.setItem(
      "huluchat_clipboard_history",
      JSON.stringify(storedHistory)
    );

    const { result } = renderHook(() => useClipboardHistory());

    expect(result.current.history[0].id).toBe("new");
    expect(result.current.history[1].id).toBe("old");
  });

  it("should filter invalid items from stored history", () => {
    const storedHistory = [
      {
        id: "valid",
        content: "Valid",
        response: "Response",
        timestamp: Date.now(),
      },
      {
        id: "missing-response",
        content: "No response",
        // missing response
        timestamp: Date.now(),
      },
      {
        // missing id
        content: "No id",
        response: "Response",
        timestamp: Date.now(),
      },
    ];
    localStorageMock.setItem(
      "huluchat_clipboard_history",
      JSON.stringify(storedHistory)
    );

    const { result } = renderHook(() => useClipboardHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe("valid");
  });

  it("should handle corrupted localStorage data", () => {
    localStorageMock.setItem("huluchat_clipboard_history", "invalid json");

    const { result } = renderHook(() => useClipboardHistory());

    expect(result.current.history).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });
});
