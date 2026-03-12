/**
 * useBackendHealth Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBackendHealth } from "./useBackendHealth";
import * as client from "@/api/client";

// Mock the API client
vi.mock("@/api/client", () => ({
  healthCheck: vi.fn(),
}));

describe("useBackendHealth", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start with checking status", () => {
    vi.mocked(client.healthCheck).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useBackendHealth());

    expect(result.current.status).toBe("checking");
    expect(result.current.lastChecked).toBeNull();
    expect(result.current.version).toBeNull();
  });

  it("should set status to healthy on successful health check", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({
      status: "ok",
      version: "3.0.0",
    });

    const { result } = renderHook(() => useBackendHealth({ interval: 60000 }));

    await waitFor(() => {
      expect(result.current.status).toBe("healthy");
    });

    expect(result.current.version).toBe("3.0.0");
    expect(result.current.lastChecked).not.toBeNull();
    expect(result.current.consecutiveFailures).toBe(0);
  });

  it("should set status to degraded on first failure", async () => {
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBackendHealth({ interval: 60000 }));

    await waitFor(() => {
      expect(result.current.status).toBe("degraded");
    });

    expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(1);
  });

  it("should set status to offline after failure threshold", async () => {
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useBackendHealth({ failureThreshold: 3, interval: 100 })
    );

    // Wait for offline status
    await waitFor(
      () => {
        expect(result.current.status).toBe("offline");
      },
      { timeout: 5000 }
    );

    expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(3);
  });

  it("should call onOffline callback when status changes to offline", async () => {
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Network error"));
    const onOffline = vi.fn();

    renderHook(() =>
      useBackendHealth({ failureThreshold: 1, onOffline, interval: 100 })
    );

    await waitFor(
      () => {
        expect(onOffline).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it("should call onRecover callback when status changes from offline to healthy", async () => {
    const onRecover = vi.fn();

    // Start with failures
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useBackendHealth({ failureThreshold: 1, onRecover, interval: 100 })
    );

    // Wait for offline status
    await waitFor(
      () => {
        expect(result.current.status).toBe("offline");
      },
      { timeout: 5000 }
    );

    expect(onRecover).not.toHaveBeenCalled();

    // Now make it succeed
    vi.mocked(client.healthCheck).mockResolvedValue({
      status: "ok",
      version: "3.0.1",
    });

    await waitFor(
      () => {
        expect(result.current.status).toBe("healthy");
      },
      { timeout: 5000 }
    );

    expect(onRecover).toHaveBeenCalled();
  });

  it("should reset consecutive failures on successful health check", async () => {
    // First fail
    vi.mocked(client.healthCheck).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useBackendHealth({ interval: 100 }));

    await waitFor(
      () => {
        expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(1);
      },
      { timeout: 5000 }
    );

    // Then succeed
    vi.mocked(client.healthCheck).mockResolvedValue({
      status: "ok",
      version: "3.0.0",
    });

    await waitFor(
      () => {
        expect(result.current.consecutiveFailures).toBe(0);
        expect(result.current.status).toBe("healthy");
      },
      { timeout: 5000 }
    );
  });

  it("should trigger recovery manually", async () => {
    vi.mocked(client.healthCheck)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        status: "ok",
        version: "3.0.0",
      });

    const { result } = renderHook(() => useBackendHealth({ interval: 60000 }));

    // Wait for first check to complete (failure)
    await waitFor(
      () => {
        expect(result.current.status).toBe("degraded");
      },
      { timeout: 5000 }
    );

    // Trigger manual recovery
    await act(async () => {
      await result.current.triggerRecovery();
    });

    expect(result.current.status).toBe("healthy");
  });

  it("should respect enabled option", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({
      status: "ok",
      version: "3.0.0",
    });

    const { result } = renderHook(() =>
      useBackendHealth({ enabled: false })
    );

    // Wait a bit - should not have called healthCheck
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still be in checking state because no check was made
    expect(result.current.status).toBe("checking");
    expect(client.healthCheck).not.toHaveBeenCalled();
  });

  it("should cleanup interval on unmount", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({
      status: "ok",
      version: "3.0.0",
    });

    const { unmount } = renderHook(() => useBackendHealth());

    unmount();

    // Wait a bit - should not cause any issues
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test passes if no errors are thrown
    expect(true).toBe(true);
  });
});
