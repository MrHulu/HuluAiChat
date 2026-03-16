/**
 * useUndoDelete Hook Tests
 * TASK-350: 会话删除撤销功能测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoDelete } from "./useUndoDelete";

// Mock toast
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "sessionItem.deleteToast": `Session "${options?.title || "New Chat"}" will be deleted`,
        "sessionItem.deleteUndone": "Deletion cancelled",
        "sessionItem.deleteError": "Failed to delete",
        "sessionItem.newChat": "New Chat",
        "common.undo": "Undo",
      };
      return translations[key] || key;
    },
  }),
}));

describe("useUndoDelete", () => {
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnUndo = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnDelete.mockClear();
    mockOnUndo.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with empty pending deletions", () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
      })
    );

    expect(result.current.pendingDeletions).toEqual([]);
  });

  it("should add item to pending deletions when requestDelete is called", () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test Session");
    });

    expect(result.current.pendingDeletions).toHaveLength(1);
    expect(result.current.pendingDeletions[0].id).toBe("session-1");
    expect(result.current.pendingDeletions[0].title).toBe("Test Session");
  });

  it("should execute delete after delay", async () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
        delay: 10000,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test Session");
    });

    expect(result.current.pendingDeletions).toHaveLength(1);

    // Fast forward 10 seconds
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockOnDelete).toHaveBeenCalledWith("session-1");
    expect(result.current.pendingDeletions).toHaveLength(0);
  });

  it("should cancel deletion when undoDelete is called", async () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
        delay: 10000,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test Session");
    });

    expect(result.current.pendingDeletions).toHaveLength(1);

    // Undo before delay
    act(() => {
      result.current.undoDelete("session-1");
    });

    expect(result.current.pendingDeletions).toHaveLength(0);
    expect(mockOnUndo).toHaveBeenCalledWith("session-1");

    // Fast forward to verify delete was not called
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should execute delete immediately when executeDelete is called", async () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
        delay: 10000,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test Session");
    });

    expect(result.current.pendingDeletions).toHaveLength(1);

    // Execute immediately
    await act(async () => {
      await result.current.executeDelete("session-1");
    });

    expect(mockOnDelete).toHaveBeenCalledWith("session-1");
    expect(result.current.pendingDeletions).toHaveLength(0);
  });

  it("should clear all pending deletions", () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test 1");
      result.current.requestDelete("session-2", "Test 2");
    });

    expect(result.current.pendingDeletions).toHaveLength(2);

    act(() => {
      result.current.clearPendingDeletions();
    });

    expect(result.current.pendingDeletions).toHaveLength(0);
  });

  it("should handle multiple deletions independently", async () => {
    const { result } = renderHook(() =>
      useUndoDelete({
        onDelete: mockOnDelete,
        onUndo: mockOnUndo,
        delay: 10000,
      })
    );

    act(() => {
      result.current.requestDelete("session-1", "Test 1");
    });

    // Wait a bit before adding second
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.requestDelete("session-2", "Test 2");
    });

    expect(result.current.pendingDeletions).toHaveLength(2);

    // Undo first session
    act(() => {
      result.current.undoDelete("session-1");
    });

    expect(result.current.pendingDeletions).toHaveLength(1);
    expect(result.current.pendingDeletions[0].id).toBe("session-2");

    // Fast forward to second deletion (10s from when session-2 was added)
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockOnDelete).toHaveBeenCalledWith("session-2");
    expect(mockOnDelete).not.toHaveBeenCalledWith("session-1");
  });
});
