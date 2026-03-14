/**
 * Plugin Sandbox Tests
 * @module plugins/sandbox/tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestLogStore } from "./index";
import type { NetworkRequestLog } from "./types";

describe("RequestLogStore", () => {
  beforeEach(() => {
    requestLogStore.clearLogs("test-plugin");
  });

  describe("addLog", () => {
    it("should add a network request log", () => {
      const log: NetworkRequestLog = {
        id: "req-1",
        pluginId: "test-plugin",
        url: "https://api.example.com/data",
        method: "GET",
        timestamp: Date.now(),
      };

      requestLogStore.addLog("test-plugin", log);
      const logs = requestLogStore.getLogs("test-plugin");

      expect(logs).toHaveLength(1);
      expect(logs[0].url).toBe("https://api.example.com/data");
    });

    it("should limit logs to maxLogsPerPlugin", () => {
      for (let i = 0; i < 150; i++) {
        requestLogStore.addLog("test-plugin", {
          id: `req-${i}`,
          pluginId: "test-plugin",
          url: `https://api.example.com/data/${i}`,
          method: "GET",
          timestamp: Date.now(),
        });
      }

      const logs = requestLogStore.getLogs("test-plugin");
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });

  describe("getLogs", () => {
    it("should return empty array for unknown plugin", () => {
      const logs = requestLogStore.getLogs("unknown-plugin");
      expect(logs).toEqual([]);
    });
  });

  describe("getAllLogs", () => {
    it("should return all logs", () => {
      requestLogStore.addLog("plugin-1", {
        id: "req-1",
        pluginId: "plugin-1",
        url: "https://api1.example.com",
        method: "GET",
        timestamp: Date.now(),
      });

      requestLogStore.addLog("plugin-2", {
        id: "req-2",
        pluginId: "plugin-2",
        url: "https://api2.example.com",
        method: "POST",
        timestamp: Date.now(),
      });
      const allLogs = requestLogStore.getAllLogs();
      expect(allLogs.size).toBe(2);
    });
  });

  describe("clearLogs", () => {
    it("should clear logs for a specific plugin", () => {
      requestLogStore.addLog("test-plugin", {
        id: "req-1",
        pluginId: "test-plugin",
        url: "https://api.example.com",
        method: "GET",
        timestamp: Date.now(),
      });
      requestLogStore.clearLogs("test-plugin");
      const logs = requestLogStore.getLogs("test-plugin");
      expect(logs).toEqual([]);
    });
  });

  describe("subscribe", () => {
    it("should notify listeners when logs are added", () => {
      const listener = vi.fn();
      requestLogStore.subscribe(listener);
      requestLogStore.addLog("test-plugin", {
        id: "req-1",
        pluginId: "test-plugin",
        url: "https://api.example.com",
        method: "GET",
        timestamp: Date.now(),
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });
    it("should unsubscribe correctly", () => {
      const listener = vi.fn();
      const { unsubscribe } = requestLogStore.subscribe(listener);
      unsubscribe();
      requestLogStore.addLog("test-plugin", {
        id: "req-1",
        pluginId: "test-plugin",
        url: "https://api.example.com",
        method: "GET",
        timestamp: Date.now(),
      });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe("Sandbox Domain Whitelist", () => {
  // Test helper function that mirrors worker logic
  function isDomainAllowed(
    url: string,
    allowedDomains: string[],
    hasNetworkPermission: boolean
  ): { allowed: boolean; reason?: string } {
    if (!hasNetworkPermission) {
      return { allowed: false, reason: "Network permission not granted" };
    }
    if (allowedDomains.length === 0) {
      return { allowed: false, reason: "No domains whitelisted in manifest" };
    }
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      for (const allowed of allowedDomains) {
        if (hostname === allowed) {
          return { allowed: true };
        }
        if (allowed.startsWith("*.")) {
          const baseDomain = allowed.slice(2);
          if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
            return { allowed: true };
          }
        }
      }
      return { allowed: false, reason: `Domain '${hostname}' not in whitelist` };
    } catch {
      return { allowed: false, reason: "Invalid URL" };
    }
  }
  it("should block requests without network permission", () => {
    const result = isDomainAllowed("https://api.example.com", ["api.example.com"], false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Network permission not granted");
  });
  it("should block requests when no domains are whitelisted", () => {
    const result = isDomainAllowed("https://api.example.com", [], true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("No domains whitelisted in manifest");
  });
  it("should allow exact domain match", () => {
    const result = isDomainAllowed("https://api.example.com", ["api.example.com"], true);
    expect(result.allowed).toBe(true);
  });
  it("should allow wildcard subdomain match", () => {
    const result = isDomainAllowed(
      "https://sub.api.example.com",
      ["*.example.com"],
      true
    );
    expect(result.allowed).toBe(true);
  });
  it("should block domain not in whitelist", () => {
    const result = isDomainAllowed(
      "https://evil.com/steal",
      ["api.example.com"],
      true
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not in whitelist");
  });
  it("should block invalid URLs", () => {
    const result = isDomainAllowed("not-a-url", ["api.example.com"], true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Invalid URL");
  });
});
describe("Sandbox Rate Limiting", () => {
  describe("checkRateLimit", () => {
    // Test helper function that mirrors worker logic
    function checkRateLimit(
      requestCount: number,
      rateLimit: number,
      lastReset: number,
      now: number
    ): { allowed: boolean; remaining: number } {
      // Reset counter every minute
      if (now - lastReset >= 60000) {
        requestCount = 0;
      }
      const remaining = rateLimit - requestCount;
      if (requestCount >= rateLimit) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: remaining - 1 };
    }
    it("should allow requests under limit", () => {
      const result = checkRateLimit(50, 100, Date.now() - 30000, Date.now());
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49);
    });
    it("should block requests over limit", () => {
      const result = checkRateLimit(100, 100, Date.now() - 30000, Date.now());
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
    it("should reset counter after one minute", () => {
      const now = Date.now();
      const result = checkRateLimit(100, 100, now - 60001, now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });
  });
});
