/**
 * useUpdater Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock Tauri updater plugin
const mockCheck = vi.fn();
const mockRelaunch = vi.fn();

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: () => mockCheck(),
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: () => mockRelaunch(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { useUpdater } from "./useUpdater";

describe("useUpdater hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useUpdater());

    expect(result.current.isChecking).toBe(false);
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.updateInfo).toBeNull();
    expect(result.current.downloadProgress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("should auto-check for updates on mount (silent)", async () => {
    mockCheck.mockResolvedValue(null);

    renderHook(() => useUpdater());

    // Auto-check happens after 3 seconds
    expect(mockCheck).not.toHaveBeenCalled();

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(mockCheck).toHaveBeenCalled();
  });

  describe("checkForUpdates", () => {
    it("should set isChecking to true while checking", async () => {
      mockCheck.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useUpdater());

      act(() => {
        result.current.checkForUpdates();
      });

      expect(result.current.isChecking).toBe(true);
    });

    it("should detect available update", async () => {
      const mockUpdate = {
        version: "4.0.0",
        date: "2026-03-05",
        body: "New features",
      };
      mockCheck.mockResolvedValue(mockUpdate);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.updateAvailable).toBe(true);
      expect(result.current.updateInfo).toEqual({
        version: "4.0.0",
        date: "2026-03-05",
        body: "New features",
      });
      expect(result.current.isChecking).toBe(false);
    });

    it("should handle no update available", async () => {
      mockCheck.mockResolvedValue(null);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.updateAvailable).toBe(false);
      expect(result.current.updateInfo).toBeNull();
      expect(result.current.isChecking).toBe(false);
    });

    it("should handle check error", async () => {
      mockCheck.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.isChecking).toBe(false);
    });

    it("should handle non-Error thrown", async () => {
      mockCheck.mockRejectedValue("String error");

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.error).toBe("检查更新失败");
    });

    it("should return true when update is available", async () => {
      mockCheck.mockResolvedValue({ version: "4.0.0" });

      const { result } = renderHook(() => useUpdater());

      let updateFound: boolean | undefined;
      await act(async () => {
        updateFound = await result.current.checkForUpdates();
      });

      expect(updateFound).toBe(true);
    });

    it("should return false when no update is available", async () => {
      mockCheck.mockResolvedValue(null);

      const { result } = renderHook(() => useUpdater());

      let updateFound: boolean | undefined;
      await act(async () => {
        updateFound = await result.current.checkForUpdates();
      });

      expect(updateFound).toBe(false);
    });
  });

  describe("downloadAndInstall", () => {
    it("should not download if no update available", async () => {
      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(mockCheck).not.toHaveBeenCalled();
    });

    it("should handle download and install", async () => {
      const mockDownloadAndInstall = vi.fn((callback) => {
        // Simulate download events
        callback({ event: "Started", data: { contentLength: 1000 } });
        callback({ event: "Progress", data: { chunkLength: 500 } });
        callback({ event: "Progress", data: { chunkLength: 500 } });
        callback({ event: "Finished", data: {} });
        return Promise.resolve();
      });

      mockCheck.mockResolvedValue({
        version: "4.0.0",
        downloadAndInstall: mockDownloadAndInstall,
      });

      const { result } = renderHook(() => useUpdater());

      // First check for updates
      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.updateAvailable).toBe(true);

      // Then download
      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(mockDownloadAndInstall).toHaveBeenCalled();
      expect(mockRelaunch).toHaveBeenCalled();
    });

    it("should update download progress", async () => {
      const mockDownloadAndInstall = vi.fn((callback) => {
        callback({ event: "Started", data: { contentLength: 100 } });
        callback({ event: "Progress", data: { chunkLength: 50 } });
        return Promise.resolve();
      });

      mockCheck.mockResolvedValue({
        version: "4.0.0",
        downloadAndInstall: mockDownloadAndInstall,
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.updateAvailable).toBe(true);

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      // Progress should have been updated (50/100 = 50%)
      expect(result.current.downloadProgress).toBeGreaterThanOrEqual(50);
    });

    it("should handle download error", async () => {
      mockCheck.mockResolvedValue({
        version: "4.0.0",
        downloadAndInstall: () => Promise.reject(new Error("Download failed")),
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(result.current.error).toBe("Download failed");
      expect(result.current.isDownloading).toBe(false);
    });

    it("should handle no update when trying to download", async () => {
      // First check returns update
      mockCheck.mockResolvedValueOnce({
        version: "4.0.0",
        downloadAndInstall: vi.fn(),
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      // Second check returns null (no update)
      mockCheck.mockResolvedValueOnce(null);

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(result.current.error).toBe("No update available");
    });
  });

  describe("dismissUpdate", () => {
    it("should dismiss update notification", async () => {
      mockCheck.mockResolvedValue({ version: "4.0.0" });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.updateAvailable).toBe(true);

      act(() => {
        result.current.dismissUpdate();
      });

      expect(result.current.updateAvailable).toBe(false);
      expect(result.current.updateInfo).toBeNull();
    });
  });
});
