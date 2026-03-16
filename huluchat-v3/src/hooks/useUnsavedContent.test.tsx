/**
 * useUnsavedContent Hook Tests
 * TASK-351: 输入内容丢失警告测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedContent } from "./useUnsavedContent";

describe("useUnsavedContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with no unsaved content", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    expect(result.current.hasUnsavedContent).toBe(false);
    expect(result.current.getUnsavedContent()).toBe(null);
  });

  it("should track unsaved content", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    act(() => {
      result.current.updateUnsavedContent("Hello world");
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    const content = result.current.getUnsavedContent();
    expect(content).not.toBe(null);
    expect(content?.content).toBe("Hello world");
    expect(content?.sessionId).toBe("session-1");
  });

  it("should track unsaved content with images", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    const mockImages = [{ type: "image_url" as const, image_url: { url: "data:image/png;base64,test" } }];

    act(() => {
      result.current.updateUnsavedContent("", mockImages);
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    const content = result.current.getUnsavedContent();
    expect(content?.images).toHaveLength(1);
  });

  it("should track unsaved content with files", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    const mockFiles = [{ id: "file-1", name: "test.pdf", type: "application/pdf", content: "base64content" }];

    act(() => {
      result.current.updateUnsavedContent("", undefined, mockFiles);
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    const content = result.current.getUnsavedContent();
    expect(content?.files).toHaveLength(1);
  });

  it("should clear unsaved content", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    act(() => {
      result.current.updateUnsavedContent("Test content");
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    act(() => {
      result.current.clearUnsavedContent();
    });

    expect(result.current.hasUnsavedContent).toBe(false);
    expect(result.current.getUnsavedContent()).toBe(null);
  });

  it("should clear session unsaved content by session id", () => {
    const { result } = renderHook(({ sessionId }: { sessionId: string }) =>
      useUnsavedContent({
        currentSessionId: sessionId,
      })
    , { initialProps: { sessionId: "session-1" } });

    act(() => {
      result.current.updateUnsavedContent("Test content");
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    act(() => {
      result.current.clearSessionUnsavedContent("session-1");
    });

    expect(result.current.hasUnsavedContent).toBe(false);
  });

  it("should not have unsaved content when session id is null", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: null,
      })
    );

    expect(result.current.hasUnsavedContent).toBe(false);
  });

  it("should handle session switch", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    // Add content in session-1
    act(() => {
      result.current.updateUnsavedContent("Content in session 1");
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    // Content should be tracked in session-1
    const content = result.current.getUnsavedContent();
    expect(content?.sessionId).toBe("session-1");
    expect(content?.content).toBe("Content in session 1");
  });

  it("should clear content when empty string is passed", () => {
    const { result } = renderHook(() =>
      useUnsavedContent({
        currentSessionId: "session-1",
      })
    );

    act(() => {
      result.current.updateUnsavedContent("Test content");
    });

    expect(result.current.hasUnsavedContent).toBe(true);

    act(() => {
      result.current.updateUnsavedContent("");
    });

    expect(result.current.hasUnsavedContent).toBe(false);
  });
});
