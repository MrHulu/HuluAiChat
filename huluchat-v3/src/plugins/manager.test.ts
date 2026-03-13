/**
 * Plugin Manager Tests - TASK-329
 * Tests for async hooks with timeout protection, error isolation, and return value validation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PluginManagerImpl, getPluginManager } from "./manager";
import type { Message, MessageHandler } from "./types";

// Mock Tauri environment
vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn().mockResolvedValue(false),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readTextFile: vi.fn().mockResolvedValue(""),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  readDir: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
  BaseDirectory: { AppData: 0 },
}));

// Helper to create test messages
function createTestMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "test-msg-1",
    session_id: "test-session",
    role: "user",
    content: "Hello world",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("PluginManager Async Hooks (TASK-329)", () => {
  let manager: PluginManagerImpl;

  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new PluginManagerImpl();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("processBeforeSendAsync", () => {
    it("should return original message when no handlers are registered", async () => {
      const message = createTestMessage();
      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(true);
      expect(result.message).toEqual(message);
      expect(result.error).toBeUndefined();
    });

    it("should process message through sync handler", async () => {
      const message = createTestMessage();
      const handler: MessageHandler = vi.fn((msg) => ({
        ...msg,
        content: `${msg.content} - modified`,
      }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("Hello world - modified");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should process message through async handler", async () => {
      const message = createTestMessage();
      const handler: MessageHandler = vi.fn(async (msg) => ({
        ...msg,
        content: `${msg.content} - async modified`,
      }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const resultPromise = manager.processBeforeSendAsync(message);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("Hello world - async modified");
    });

    it("should cancel message when handler returns null", async () => {
      const message = createTestMessage();
      const handler: MessageHandler = vi.fn(() => null);

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(true);
      expect(result.message).toBeNull();
    });

    it("should continue processing through multiple handlers", async () => {
      const message = createTestMessage();

      const handler1: MessageHandler = vi.fn((msg) => ({ ...msg, content: `${msg.content} - h1` }));
      const handler2: MessageHandler = vi.fn((msg) => ({ ...msg, content: `${msg.content} - h2` }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler1, handler2);

      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("Hello world - h1 - h2");
    });

    it("should timeout handler that takes too long", async () => {
      const message = createTestMessage();

      // Handler that never resolves
      const slowHandler: MessageHandler = vi.fn(
        () =>
          new Promise(() => {
            // Never resolves
          })
      );

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(slowHandler);

      const resultPromise = manager.processBeforeSendAsync(message, { timeout: 1000 });

      // Fast forward past timeout
      await vi.advanceTimersByTimeAsync(1500);

      const result = await resultPromise;

      expect(result.success).toBe(false); // Has error (timeout)
      expect(result.message).toEqual(message); // Original message returned on timeout
      expect(result.error).toContain("timed out");
    });

    it("should isolate errors - continue with next handler on error", async () => {
      const message = createTestMessage();

      const errorHandler: MessageHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const goodHandler: MessageHandler = vi.fn((msg) => ({ ...msg, content: `${msg.content} - good` }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(errorHandler, goodHandler);

      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(false); // Has errors
      expect(result.message?.content).toBe("Hello world - good"); // Second handler still processed
      expect(result.error).toContain("Handler error");
    });

    it("should stop on error when continueOnError is false", async () => {
      const message = createTestMessage();

      const errorHandler: MessageHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const goodHandler: MessageHandler = vi.fn((msg) => ({ ...msg, content: `${msg.content} - good` }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(errorHandler, goodHandler);

      const result = await manager.processBeforeSendAsync(message, { continueOnError: false });

      expect(result.success).toBe(false);
      expect(result.message).toEqual(message); // Original message
      expect(goodHandler).not.toHaveBeenCalled();
    });

    it("should validate return value when validateReturn is true", async () => {
      const message = createTestMessage();

      // Returns invalid object (missing required fields)
      const invalidHandler: MessageHandler = vi.fn(() => ({ foo: "bar" }) as unknown as Message);

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(invalidHandler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain("valid");
    });

    it("should skip validation when validateReturn is false", async () => {
      const message = createTestMessage();

      // Returns invalid object
      const invalidHandler: MessageHandler = vi.fn(() => ({ foo: "bar" }) as unknown as Message);

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(invalidHandler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: false });

      expect(result.success).toBe(true); // No validation
      expect(result.message).toEqual({ foo: "bar" });
    });
  });

  describe("processAfterReceiveAsync", () => {
    it("should return original message when no handlers are registered", async () => {
      const message = createTestMessage({ role: "assistant" });
      const result = await manager.processAfterReceiveAsync(message);

      expect(result.success).toBe(true);
      expect(result.message).toEqual(message);
    });

    it("should process message through handler", async () => {
      const message = createTestMessage({ role: "assistant" });
      const handler: MessageHandler = vi.fn((msg) => ({
        ...msg,
        content: `AI: ${msg.content}`,
      }));

      (manager as unknown as { afterReceiveHandlers: MessageHandler[] }).afterReceiveHandlers.push(handler);

      const result = await manager.processAfterReceiveAsync(message);

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe("AI: Hello world");
    });

    it("should filter message when handler returns null (skip message)", async () => {
      const message = createTestMessage({ role: "assistant" });
      const handler: MessageHandler = vi.fn(() => null);

      (manager as unknown as { afterReceiveHandlers: MessageHandler[] }).afterReceiveHandlers.push(handler);

      const result = await manager.processAfterReceiveAsync(message);

      expect(result.message).toBeNull();
    });

    it("should timeout slow handler", async () => {
      const message = createTestMessage({ role: "assistant" });

      const slowHandler: MessageHandler = vi.fn(
        () =>
          new Promise(() => {
            // Never resolves
          })
      );

      (manager as unknown as { afterReceiveHandlers: MessageHandler[] }).afterReceiveHandlers.push(slowHandler);

      const resultPromise = manager.processAfterReceiveAsync(message, { timeout: 1000 });
      await vi.advanceTimersByTimeAsync(1500);
      const result = await resultPromise;

      expect(result.success).toBe(false); // Has error (timeout)
      expect(result.message).toEqual(message);
      expect(result.error).toContain("timed out");
    });
  });

  describe("Hook Options", () => {
    it("should use default timeout of 5000ms", async () => {
      const message = createTestMessage();

      const slowHandler: MessageHandler = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(message), 6000);
          })
      );

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(slowHandler);

      const resultPromise = manager.processBeforeSendAsync(message);
      await vi.advanceTimersByTimeAsync(5500);
      const result = await resultPromise;

      expect(result.error).toContain("timed out");
    });

    it("should use custom timeout", async () => {
      const message = createTestMessage();

      const slowHandler: MessageHandler = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(message), 3000);
          })
      );

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(slowHandler);

      // Custom timeout of 2000ms
      const resultPromise = manager.processBeforeSendAsync(message, { timeout: 2000 });
      await vi.advanceTimersByTimeAsync(2500);
      const result = await resultPromise;

      expect(result.error).toContain("timed out");
    });
  });

  describe("Return Value Validation", () => {
    it("should accept valid Message object", async () => {
      const message = createTestMessage();
      const validMessage: Message = {
        id: "new-id",
        session_id: "new-session",
        role: "user",
        content: "Valid content",
        created_at: new Date().toISOString(),
      };

      const handler: MessageHandler = vi.fn(() => validMessage);
      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: true });

      expect(result.success).toBe(true);
      expect(result.message).toEqual(validMessage);
    });

    it("should reject message without id", async () => {
      const message = createTestMessage();
      const invalidMessage = {
        session_id: "test",
        role: "user",
        content: "test",
        created_at: new Date().toISOString(),
      } as Message;

      const handler: MessageHandler = vi.fn(() => invalidMessage);
      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain("id");
    });

    it("should reject message without role", async () => {
      const message = createTestMessage();
      const invalidMessage = {
        id: "test",
        session_id: "test",
        content: "test",
        created_at: new Date().toISOString(),
      } as Message;

      const handler: MessageHandler = vi.fn(() => invalidMessage);
      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain("role");
    });

    it("should reject message without content", async () => {
      const message = createTestMessage();
      const invalidMessage = {
        id: "test",
        session_id: "test",
        role: "user",
        created_at: new Date().toISOString(),
      } as Message;

      const handler: MessageHandler = vi.fn(() => invalidMessage);
      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler);

      const result = await manager.processBeforeSendAsync(message, { validateReturn: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain("content");
    });
  });

  describe("Error Isolation", () => {
    it("should isolate errors between handlers and continue processing", async () => {
      const message = createTestMessage();

      const handler1: MessageHandler = vi.fn(() => {
        throw new Error("Error 1");
      });
      const handler2: MessageHandler = vi.fn(() => {
        throw new Error("Error 2");
      });
      const handler3: MessageHandler = vi.fn((msg) => ({ ...msg, content: "Success" }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(handler1, handler2, handler3);

      const result = await manager.processBeforeSendAsync(message);

      expect(result.success).toBe(false);
      expect(result.message?.content).toBe("Success");
      expect(result.error).toContain("Error 1");
      expect(result.error).toContain("Error 2");
      expect(handler3).toHaveBeenCalled();
    });

    it("should handle async errors gracefully", async () => {
      const message = createTestMessage();

      const asyncErrorHandler: MessageHandler = vi.fn(async () => {
        throw new Error("Async error");
      });
      const goodHandler: MessageHandler = vi.fn((msg) => ({ ...msg, content: "OK" }));

      (manager as unknown as { beforeSendHandlers: MessageHandler[] }).beforeSendHandlers.push(asyncErrorHandler, goodHandler);

      const resultPromise = manager.processBeforeSendAsync(message);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.message?.content).toBe("OK");
      expect(result.error).toContain("Async error");
    });
  });
});

describe("getPluginManager singleton", () => {
  it("should return the same instance", () => {
    const instance1 = getPluginManager();
    const instance2 = getPluginManager();

    expect(instance1).toBe(instance2);
  });
});
