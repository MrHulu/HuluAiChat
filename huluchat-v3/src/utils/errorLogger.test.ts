/**
 * Error Logger Utility Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  logError,
  getErrorLogs,
  clearErrorLogs,
  exportErrorLogs,
  getErrorSummary,
} from "./errorLogger";

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

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("errorLogger", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("logError", () => {
    it("logs an error to localStorage", () => {
      const error = new Error("Test error");
      logError(error);

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Test error");
    });

    it("includes component stack when provided", () => {
      const error = new Error("Component error");
      const componentStack = "    at Component\n    at App";
      logError(error, componentStack);

      const logs = getErrorLogs();
      expect(logs[0].componentStack).toBe(componentStack);
    });

    it("includes timestamp", () => {
      const error = new Error("Timestamp test");
      logError(error);

      const logs = getErrorLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(new Date(logs[0].timestamp).toISOString()).toBe(logs[0].timestamp);
    });

    it("includes url and userAgent", () => {
      const error = new Error("Metadata test");
      logError(error);

      const logs = getErrorLogs();
      expect(logs[0].url).toBe(window.location.href);
      expect(logs[0].userAgent).toBe(navigator.userAgent);
    });

    it("prepends new errors to existing logs", () => {
      logError(new Error("First error"));
      logError(new Error("Second error"));

      const logs = getErrorLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe("Second error");
      expect(logs[1].message).toBe("First error");
    });

    it("limits logs to MAX_LOG_ENTRIES (50)", () => {
      // Add 55 errors
      for (let i = 0; i < 55; i++) {
        logError(new Error(`Error ${i}`));
      }

      const logs = getErrorLogs();
      expect(logs).toHaveLength(50);
      // Most recent should be first
      expect(logs[0].message).toBe("Error 54");
    });
  });

  describe("getErrorLogs", () => {
    it("returns empty array when no logs", () => {
      const logs = getErrorLogs();
      expect(logs).toEqual([]);
    });

    it("returns parsed logs from localStorage", () => {
      logError(new Error("Test"));
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
    });
  });

  describe("clearErrorLogs", () => {
    it("clears all error logs", () => {
      logError(new Error("Test 1"));
      logError(new Error("Test 2"));

      clearErrorLogs();

      const logs = getErrorLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe("exportErrorLogs", () => {
    it("exports logs as formatted JSON string", () => {
      logError(new Error("Export test"));

      const exported = exportErrorLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe("Export test");
    });
  });

  describe("getErrorSummary", () => {
    it("returns summary with total and lastError", () => {
      logError(new Error("Summary test"));

      const summary = getErrorSummary();

      expect(summary.total).toBe(1);
      expect(summary.lastError?.message).toBe("Summary test");
    });

    it("returns null lastError when no logs", () => {
      const summary = getErrorSummary();

      expect(summary.total).toBe(0);
      expect(summary.lastError).toBeNull();
    });

    it("counts recent errors (last 24 hours)", () => {
      // Add recent error
      logError(new Error("Recent error"));

      // Manually add an old error
      const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const logs = getErrorLogs();
      logs.push({
        timestamp: oldTimestamp,
        message: "Old error",
        url: "http://test",
        userAgent: "test",
      });
      localStorageMock.setItem("huluchat-error-log", JSON.stringify(logs));

      const summary = getErrorSummary();

      expect(summary.total).toBe(2);
      expect(summary.recentCount).toBe(1);
    });
  });
});
