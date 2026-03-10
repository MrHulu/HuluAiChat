/**
 * Tests for usePluginManager hook
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePluginManager } from "./usePluginManager";
import * as pluginModule from "@/plugins";

// Mock the plugins module
vi.mock("@/plugins", () => ({
  initializePluginSystem: vi.fn(),
  PluginManagerImpl: vi.fn(),
}));

const mockPlugins: pluginModule.PluginInstance[] = [
  {
    manifest: {
      id: "com.example.plugin1",
      name: "Test Plugin 1",
      version: "1.0.0",
      description: "A test plugin",
      author: "Test Author",
      minAppVersion: "3.0.0",
      permissions: ["chat.read"],
    },
    state: "active",
    path: "/plugins/plugin1",
  },
  {
    manifest: {
      id: "com.example.plugin2",
      name: "Test Plugin 2",
      version: "2.0.0",
      description: "Another test plugin",
      author: "Test Author",
      minAppVersion: "3.0.0",
      permissions: ["chat.read", "chat.write"],
    },
    state: "inactive",
    path: "/plugins/plugin2",
  },
];

function createMockManager() {
  const eventHandlers: Array<(event: unknown, plugin: unknown) => void> = [];

  return {
    getPlugins: vi.fn(() => mockPlugins),
    activatePlugin: vi.fn(async () => {}),
    deactivatePlugin: vi.fn(async () => {}),
    installPlugin: vi.fn(async () => {}),
    uninstallPlugin: vi.fn(async () => {}),
    checkForUpdate: vi.fn(async () => null),
    checkForAllUpdates: vi.fn(async () => new Map()),
    updatePlugin: vi.fn(async () => {}),
    on: vi.fn((handler: (event: unknown, plugin: unknown) => void) => {
      eventHandlers.push(handler);
      return {
        dispose: vi.fn(() => {
          const index = eventHandlers.indexOf(handler);
          if (index > -1) {
            eventHandlers.splice(index, 1);
          }
        }),
      };
    }),
    _triggerEvent: (event: unknown, plugin: unknown) => {
      for (const handler of eventHandlers) {
        handler(event, plugin);
      }
    },
  };
}

type MockManager = ReturnType<typeof createMockManager>;

describe("usePluginManager", () => {
  let mockManager: MockManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockManager = createMockManager();
    vi.mocked(pluginModule.initializePluginSystem).mockReset();
  });

  describe("initialization", () => {
    it("should start with loading state", () => {
      vi.mocked(pluginModule.initializePluginSystem).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePluginManager());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.manager).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("should initialize successfully", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.manager).toBe(mockManager);
      expect(result.current.error).toBe(null);
      expect(result.current.plugins).toEqual(mockPlugins);
    });

    it("should handle initialization error", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed to initialize")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.manager).toBe(null);
      expect(result.current.error).toBe("Failed to initialize");
    });

    it("should handle non-Error initialization failure", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        "Unknown error"
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to initialize plugin system");
    });
  });

  describe("plugin operations", () => {
    it("should activate a plugin", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.activatePlugin("com.example.plugin2");
      });

      expect(mockManager.activatePlugin).toHaveBeenCalledWith(
        "com.example.plugin2"
      );
    });

    it("should throw error when activating without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.activatePlugin("com.example.plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });

    it("should deactivate a plugin", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.deactivatePlugin("com.example.plugin1");
      });

      expect(mockManager.deactivatePlugin).toHaveBeenCalledWith(
        "com.example.plugin1"
      );
    });

    it("should throw error when deactivating without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.deactivatePlugin("com.example.plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });

    it("should install a plugin", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.installPlugin("/path/to/plugin");
      });

      expect(mockManager.installPlugin).toHaveBeenCalledWith("/path/to/plugin");
    });

    it("should throw error when installing without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.installPlugin("/path/to/plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });

    it("should uninstall a plugin", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.uninstallPlugin("com.example.plugin1");
      });

      expect(mockManager.uninstallPlugin).toHaveBeenCalledWith(
        "com.example.plugin1"
      );
    });

    it("should throw error when uninstalling without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.uninstallPlugin("com.example.plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });
  });

  describe("refresh plugins", () => {
    it("should refresh plugins list", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      act(() => {
        result.current.refreshPlugins();
      });

      expect(mockManager.getPlugins).toHaveBeenCalled();
    });

    it("should not throw when refreshing without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => {
        result.current.refreshPlugins();
      }).not.toThrow();
    });
  });

  describe("update checking", () => {
    it("should check for update", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        const updateInfo = await result.current.checkForUpdate(
          "com.example.plugin1"
        );
        expect(updateInfo).toBe(null);
      });

      expect(mockManager.checkForUpdate).toHaveBeenCalledWith(
        "com.example.plugin1"
      );
    });

    it("should throw error when checking for update without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.checkForUpdate("com.example.plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });

    it("should check for all updates", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        const updates = await result.current.checkForAllUpdates();
        expect(updates).toBeInstanceOf(Map);
      });

      expect(mockManager.checkForAllUpdates).toHaveBeenCalled();
    });

    it("should throw error when checking for all updates without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.checkForAllUpdates()).rejects.toThrow(
        "Plugin manager not initialized"
      );
    });

    it("should update a plugin", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.updatePlugin("com.example.plugin1");
      });

      expect(mockManager.updatePlugin).toHaveBeenCalledWith(
        "com.example.plugin1"
      );
    });

    it("should throw error when updating without manager", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.updatePlugin("com.example.plugin")
      ).rejects.toThrow("Plugin manager not initialized");
    });
  });

  describe("event handling", () => {
    it("should subscribe to manager events", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockManager.on).toHaveBeenCalled();
    });

    it("should refresh plugins on events", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear previous calls
      mockManager.getPlugins.mockClear();

      // Trigger event
      act(() => {
        mockManager._triggerEvent("activated", mockPlugins[0]);
      });

      expect(mockManager.getPlugins).toHaveBeenCalled();
    });

    it("should dispose event subscription on unmount", async () => {
      const disposable = { dispose: vi.fn() };
      mockManager.on.mockReturnValue(disposable);

      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { unmount } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(mockManager.on).toHaveBeenCalled();
      });

      unmount();

      expect(disposable.dispose).toHaveBeenCalled();
    });
  });

  describe("return values", () => {
    it("should return all expected properties", async () => {
      vi.mocked(pluginModule.initializePluginSystem).mockResolvedValue(
        mockManager as unknown as pluginModule.PluginManager
      );

      const { result } = renderHook(() => usePluginManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current).toHaveProperty("manager");
      expect(result.current).toHaveProperty("plugins");
      expect(result.current).toHaveProperty("isInitialized");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("activatePlugin");
      expect(result.current).toHaveProperty("deactivatePlugin");
      expect(result.current).toHaveProperty("installPlugin");
      expect(result.current).toHaveProperty("uninstallPlugin");
      expect(result.current).toHaveProperty("refreshPlugins");
      expect(result.current).toHaveProperty("checkForUpdate");
      expect(result.current).toHaveProperty("checkForAllUpdates");
      expect(result.current).toHaveProperty("updatePlugin");

      expect(typeof result.current.activatePlugin).toBe("function");
      expect(typeof result.current.deactivatePlugin).toBe("function");
      expect(typeof result.current.installPlugin).toBe("function");
      expect(typeof result.current.uninstallPlugin).toBe("function");
      expect(typeof result.current.refreshPlugins).toBe("function");
      expect(typeof result.current.checkForUpdate).toBe("function");
      expect(typeof result.current.checkForAllUpdates).toBe("function");
      expect(typeof result.current.updatePlugin).toBe("function");
    });
  });
});
