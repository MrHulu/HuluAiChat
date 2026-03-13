import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PluginSettings } from "./PluginSettings";
import type {
  PluginInstance,
  PluginUpdateInfo,
} from "@/plugins";

// Mock usePluginManager hook
const mockActivatePlugin = vi.fn();
const mockDeactivatePlugin = vi.fn();
const mockInstallPlugin = vi.fn();
const mockUninstallPlugin = vi.fn();
const mockRefreshPlugins = vi.fn();
const mockCheckForUpdate = vi.fn();
const mockCheckForAllUpdates = vi.fn();
const mockUpdatePlugin = vi.fn();

interface MockUsePluginManagerReturn {
  manager: null;
  plugins: PluginInstance[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  activatePlugin: typeof mockActivatePlugin;
  deactivatePlugin: typeof mockDeactivatePlugin;
  installPlugin: typeof mockInstallPlugin;
  uninstallPlugin: typeof mockUninstallPlugin;
  refreshPlugins: typeof mockRefreshPlugins;
  checkForUpdate: typeof mockCheckForUpdate;
  checkForAllUpdates: typeof mockCheckForAllUpdates;
  updatePlugin: typeof mockUpdatePlugin;
}

let mockPluginManagerState: MockUsePluginManagerReturn = {
  manager: null,
  plugins: [],
  isInitialized: true,
  isLoading: false,
  error: null,
  activatePlugin: mockActivatePlugin,
  deactivatePlugin: mockDeactivatePlugin,
  installPlugin: mockInstallPlugin,
  uninstallPlugin: mockUninstallPlugin,
  refreshPlugins: mockRefreshPlugins,
  checkForUpdate: mockCheckForUpdate,
  checkForAllUpdates: mockCheckForAllUpdates,
  updatePlugin: mockUpdatePlugin,
};

vi.mock("@/hooks", () => ({
  usePluginManager: () => mockPluginManagerState,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Tauri
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

// Helper to create a mock plugin
function createMockPlugin(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    manifest: {
      id: "com.test.plugin",
      name: "Test Plugin",
      version: "1.0.0",
      description: "A test plugin",
      author: "Test Author",
      minAppVersion: "3.0.0",
      permissions: [],
      ...overrides.manifest,
    },
    state: "inactive",
    path: "/plugins/test-plugin",
    ...overrides,
  };
}

// Helper to render and wait for async effects
async function renderPluginSettings() {
  const utils = render(<PluginSettings />);
  // Wait for the checkForAllUpdates effect to complete
  await waitFor(() => {
    expect(mockCheckForAllUpdates).toHaveBeenCalled();
  });
  return utils;
}

describe("PluginSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginManagerState = {
      manager: null,
      plugins: [],
      isInitialized: true,
      isLoading: false,
      error: null,
      activatePlugin: mockActivatePlugin,
      deactivatePlugin: mockDeactivatePlugin,
      installPlugin: mockInstallPlugin,
      uninstallPlugin: mockUninstallPlugin,
      refreshPlugins: mockRefreshPlugins,
      checkForUpdate: mockCheckForUpdate,
      checkForAllUpdates: mockCheckForAllUpdates,
      updatePlugin: mockUpdatePlugin,
    };
    mockCheckForAllUpdates.mockResolvedValue(new Map());
  });

  describe("rendering", () => {
    it("should render plugin settings tabs", async () => {
      await renderPluginSettings();

      expect(screen.getByText("Installed")).toBeInTheDocument();
      expect(screen.getByText("Marketplace")).toBeInTheDocument();
    });

    it("should show installed count badge", async () => {
      await renderPluginSettings();

      // The count is now shown in a badge within the Installed tab
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should render drop zone for installation", async () => {
      await renderPluginSettings();

      expect(screen.getByText("Drop plugin folder to install")).toBeInTheDocument();
      expect(screen.getByText("Drag and drop a plugin folder containing manifest.json")).toBeInTheDocument();
    });

    it("should render browse folder button", async () => {
      await renderPluginSettings();

      expect(screen.getByRole("button", { name: /browse/i })).toBeInTheDocument();
    });

    it("should render refresh button", async () => {
      await renderPluginSettings();

      expect(screen.getByRole("button", { name: /refresh plugins/i })).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading spinner when loading", () => {
      mockPluginManagerState.isLoading = true;
      mockPluginManagerState.isInitialized = false;

      render(<PluginSettings />);

      expect(screen.getByText("Loading plugins...")).toBeInTheDocument();
    });

    it("should show animate-spin when loading", () => {
      mockPluginManagerState.isLoading = true;
      mockPluginManagerState.isInitialized = false;

      render(<PluginSettings />);

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("initialization error", () => {
    it("should show error message when not initialized", () => {
      mockPluginManagerState.isInitialized = false;
      mockPluginManagerState.isLoading = false;
      mockPluginManagerState.error = "Failed to initialize";

      render(<PluginSettings />);

      expect(screen.getByText("Failed to initialize")).toBeInTheDocument();
    });

    it("should show default error message when no error provided", () => {
      mockPluginManagerState.isInitialized = false;
      mockPluginManagerState.isLoading = false;
      mockPluginManagerState.error = null;

      render(<PluginSettings />);

      expect(screen.getByText("Plugin system initialization failed")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show no plugins message when list is empty", async () => {
      mockPluginManagerState.plugins = [];

      await renderPluginSettings();

      expect(screen.getByText("No plugins installed")).toBeInTheDocument();
      expect(screen.getByText("Drop a plugin folder or click Browse to install")).toBeInTheDocument();
    });
  });

  describe("plugin list", () => {
    it("should render plugin cards when plugins exist", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin1",
            name: "Plugin One",
            version: "1.0.0",
            description: "First plugin",
            author: "Author One",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
        createMockPlugin({
          manifest: {
            id: "com.test.plugin2",
            name: "Plugin Two",
            version: "2.0.0",
            description: "Second plugin",
            author: "Author Two",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Plugin One")).toBeInTheDocument();
      expect(screen.getByText("Plugin Two")).toBeInTheDocument();
    });

    it("should show plugin description", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "A wonderful test plugin",
            author: "Test Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("A wonderful test plugin")).toBeInTheDocument();
    });

    it("should show plugin version", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "2.5.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText(/v2.5.0/)).toBeInTheDocument();
    });

    it("should show author name", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "John Doe",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("should show homepage link when available", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
            homepage: "https://example.com/plugin",
          },
        }),
      ];

      await renderPluginSettings();

      const homepageLink = screen.getByRole("link", { name: /homepage/i });
      expect(homepageLink).toBeInTheDocument();
      expect(homepageLink).toHaveAttribute("href", "https://example.com/plugin");
      expect(homepageLink).toHaveAttribute("target", "_blank");
      expect(homepageLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should not show homepage link when not available", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.queryByRole("link", { name: /homepage/i })).not.toBeInTheDocument();
    });

    it("should show permissions as badges", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: ["chat.read", "storage", "network"],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("chat.read")).toBeInTheDocument();
      expect(screen.getByText("storage")).toBeInTheDocument();
      expect(screen.getByText("network")).toBeInTheDocument();
    });
  });

  describe("plugin state display", () => {
    it("should show active state badge", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "active",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show inactive state badge", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should show activating state badge", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "activating",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Activating")).toBeInTheDocument();
    });

    it("should show error state badge", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "error",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should show error message when plugin has error", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "error",
          error: "Failed to load plugin",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Failed to load plugin")).toBeInTheDocument();
    });
  });

  describe("activate/deactivate", () => {
    it("should show switch for plugin activation", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByRole("switch", { name: /toggle plugin/i })).toBeInTheDocument();
    });

    it("should call activatePlugin when switch is turned on", async () => {
      const user = userEvent.setup();
      mockActivatePlugin.mockResolvedValue(undefined);
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      const switchBtn = screen.getByRole("switch", { name: /toggle plugin/i });
      await user.click(switchBtn);

      expect(mockActivatePlugin).toHaveBeenCalledWith("com.test.plugin");
    });

    it("should call deactivatePlugin when switch is turned off", async () => {
      const user = userEvent.setup();
      mockDeactivatePlugin.mockResolvedValue(undefined);
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "active",
        }),
      ];

      await renderPluginSettings();

      const switchBtn = screen.getByRole("switch", { name: /toggle plugin/i });
      await user.click(switchBtn);

      expect(mockDeactivatePlugin).toHaveBeenCalledWith("com.test.plugin");
    });

    it("should disable switch while activating", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "activating",
        }),
      ];

      await renderPluginSettings();

      const switchBtn = screen.getByRole("switch", { name: /toggle plugin/i });
      expect(switchBtn).toBeDisabled();
    });

    it("should show activating spinner while activating", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "activating",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByText("Activating...")).toBeInTheDocument();
    });
  });

  describe("uninstall", () => {
    it("should show uninstall button", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByRole("button", { name: /uninstall/i })).toBeInTheDocument();
    });

    it("should show confirmation dialog when uninstall is clicked", async () => {
      const user = userEvent.setup();
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      const uninstallBtn = screen.getByRole("button", { name: /uninstall/i });
      await user.click(uninstallBtn);

      expect(screen.getByText("Uninstall Plugin")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to uninstall/)).toBeInTheDocument();
    });

    it("should call uninstallPlugin when confirmed", async () => {
      const user = userEvent.setup();
      mockUninstallPlugin.mockResolvedValue(undefined);
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      const uninstallBtn = screen.getByRole("button", { name: /uninstall/i });
      await user.click(uninstallBtn);

      const confirmBtn = screen.getByRole("button", { name: /^uninstall$/i });
      await user.click(confirmBtn);

      expect(mockUninstallPlugin).toHaveBeenCalledWith("com.test.plugin");
    });

    it("should not call uninstallPlugin when cancelled", async () => {
      const user = userEvent.setup();
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "inactive",
        }),
      ];

      await renderPluginSettings();

      const uninstallBtn = screen.getByRole("button", { name: /uninstall/i });
      await user.click(uninstallBtn);

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelBtn);

      expect(mockUninstallPlugin).not.toHaveBeenCalled();
    });

    it("should disable uninstall button when plugin is active", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          state: "active",
        }),
      ];

      await renderPluginSettings();

      const uninstallBtn = screen.getByRole("button", { name: /uninstall/i });
      expect(uninstallBtn).toBeDisabled();
    });
  });

  describe("update functionality", () => {
    it("should show update available badge when update exists", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      const updateInfo: PluginUpdateInfo = {
        id: "com.test.plugin",
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        hasUpdate: true,
      };

      mockCheckForAllUpdates.mockResolvedValue(new Map([["com.test.plugin", updateInfo]]));

      render(<PluginSettings />);

      await waitFor(() => {
        expect(screen.getByText("Update Available")).toBeInTheDocument();
      });
    });

    it("should show new version number when update available", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      const updateInfo: PluginUpdateInfo = {
        id: "com.test.plugin",
        currentVersion: "1.0.0",
        latestVersion: "2.0.0",
        hasUpdate: true,
      };

      mockCheckForAllUpdates.mockResolvedValue(new Map([["com.test.plugin", updateInfo]]));

      render(<PluginSettings />);

      await waitFor(() => {
        expect(screen.getByText(/→ v2.0.0/)).toBeInTheDocument();
      });
    });

    it("should show update button when update available", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      const updateInfo: PluginUpdateInfo = {
        id: "com.test.plugin",
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        hasUpdate: true,
      };

      mockCheckForAllUpdates.mockResolvedValue(new Map([["com.test.plugin", updateInfo]]));

      render(<PluginSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^update$/i })).toBeInTheDocument();
      });
    });

    it("should call updatePlugin when update button is clicked", async () => {
      const user = userEvent.setup();
      mockUpdatePlugin.mockResolvedValue(undefined);
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      const updateInfo: PluginUpdateInfo = {
        id: "com.test.plugin",
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        hasUpdate: true,
      };

      mockCheckForAllUpdates.mockResolvedValue(new Map([["com.test.plugin", updateInfo]]));

      render(<PluginSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^update$/i })).toBeInTheDocument();
      });

      const updateBtn = screen.getByRole("button", { name: /^update$/i });
      await user.click(updateBtn);

      expect(mockUpdatePlugin).toHaveBeenCalledWith("com.test.plugin");
    });

    it("should show check update button when plugin has updateUrl", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
            updateUrl: "https://example.com/update",
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.getByRole("button", { name: /check for updates/i })).toBeInTheDocument();
    });

    it("should not show check update button when no updateUrl", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
          },
        }),
      ];

      await renderPluginSettings();

      expect(screen.queryByRole("button", { name: /check for updates/i })).not.toBeInTheDocument();
    });

    it("should call checkForUpdate when check button is clicked", async () => {
      const user = userEvent.setup();
      mockCheckForUpdate.mockResolvedValue(null);
      mockPluginManagerState.plugins = [
        createMockPlugin({
          manifest: {
            id: "com.test.plugin",
            name: "Test Plugin",
            version: "1.0.0",
            description: "Test",
            author: "Author",
            minAppVersion: "3.0.0",
            permissions: [],
            updateUrl: "https://example.com/update",
          },
        }),
      ];

      await renderPluginSettings();

      const checkBtn = screen.getByRole("button", { name: /check for updates/i });
      await user.click(checkBtn);

      expect(mockCheckForUpdate).toHaveBeenCalledWith("com.test.plugin");
    });
  });

  describe("drop zone", () => {
    it("should have correct aria attributes", async () => {
      await renderPluginSettings();

      const dropZone = screen.getByRole("button", { name: /drop plugin folder/i });
      expect(dropZone).toHaveAttribute("aria-busy", "false");
      expect(dropZone).toHaveAttribute("aria-disabled", "false");
    });

    it("should show install state when installing", async () => {
      await renderPluginSettings();

      // Find drop zone by text and check parent
      const dropText = screen.getByText("Drop plugin folder to install");
      const dropZone = dropText.closest('[role="button"]');
      expect(dropZone).toBeInTheDocument();
    });

    it("should call installPlugin when folder is dropped", async () => {
      mockInstallPlugin.mockResolvedValue(undefined);

      render(<PluginSettings />);

      // Wait for initial effects
      await waitFor(() => {
        expect(mockCheckForAllUpdates).toHaveBeenCalled();
      });

      // Find drop zone by text and check parent
      const dropText = screen.getByText("Drop plugin folder to install");
      const dropZone = dropText.closest('[role="button"]');

      // Create mock file entry
      const mockEntry = {
        isDirectory: true,
        isFile: false,
        name: "test-plugin",
        createReader: () => ({
          readEntries: (callback: (entries: { name: string }[]) => void) => {
            callback([{ name: "manifest.json" }]);
          },
        }),
      };

      const mockDataTransfer = {
        items: [
          {
            kind: "file",
            webkitGetAsEntry: () => mockEntry,
          },
        ],
      };

      const dropEvent = new Event("drop", { bubbles: true });
      Object.assign(dropEvent, { dataTransfer: mockDataTransfer });

      dropZone?.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockInstallPlugin).toHaveBeenCalled();
      });
    });
  });

  describe("refresh", () => {
    it("should call refreshPlugins when refresh button is clicked", async () => {
      const user = userEvent.setup();

      await renderPluginSettings();

      const refreshBtn = screen.getByRole("button", { name: /refresh plugins/i });
      await user.click(refreshBtn);

      expect(mockRefreshPlugins).toHaveBeenCalled();
    });
  });

  describe("animations", () => {
    it("should have animate-fade-in class when loading", () => {
      mockPluginManagerState.isLoading = true;
      mockPluginManagerState.isInitialized = false;

      render(<PluginSettings />);

      const fadeElement = document.querySelector(".animate-fade-in");
      expect(fadeElement).toBeInTheDocument();
    });

    it("should have animate-bounce-in class when initialization fails", () => {
      mockPluginManagerState.isInitialized = false;
      mockPluginManagerState.isLoading = false;
      mockPluginManagerState.error = "Init error";

      render(<PluginSettings />);

      const bounceElement = document.querySelector(".animate-bounce-in");
      expect(bounceElement).toBeInTheDocument();
    });

    it("should have animate-list-enter class on plugin cards", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({ manifest: { id: "p1", name: "P1", version: "1.0", description: "D1", author: "A1", minAppVersion: "3.0", permissions: [] } }),
        createMockPlugin({ manifest: { id: "p2", name: "P2", version: "1.0", description: "D2", author: "A2", minAppVersion: "3.0", permissions: [] } }),
      ];

      await renderPluginSettings();

      const animatedElements = document.querySelectorAll(".animate-list-enter");
      expect(animatedElements.length).toBe(2);
    });

    it("should have staggered animation delays on plugin cards", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin({ manifest: { id: "p1", name: "P1", version: "1.0", description: "D1", author: "A1", minAppVersion: "3.0", permissions: [] } }),
        createMockPlugin({ manifest: { id: "p2", name: "P2", version: "1.0", description: "D2", author: "A2", minAppVersion: "3.0", permissions: [] } }),
      ];

      await renderPluginSettings();

      const animatedElements = document.querySelectorAll(".animate-list-enter");
      expect(animatedElements[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(animatedElements[1]).toHaveStyle({ animationDelay: "50ms" });
    });
  });

  describe("card interactions", () => {
    it("should have hover classes on plugin cards", async () => {
      mockPluginManagerState.plugins = [
        createMockPlugin(),
      ];

      await renderPluginSettings();

      const card = document.querySelector(".hover\\:shadow-md");
      expect(card).toBeInTheDocument();
    });
  });
});
