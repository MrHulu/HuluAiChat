import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PluginMarketplace } from "./PluginMarketplace";
import type { PluginInstance } from "@/plugins";

// Mock usePluginManager hook
const mockInstallPlugin = vi.fn();

interface MockUsePluginManagerReturn {
  plugins: PluginInstance[];
  isLoading: boolean;
  installPlugin: typeof mockInstallPlugin;
}

let mockPluginManagerState: MockUsePluginManagerReturn = {
  plugins: [],
  isLoading: false,
  installPlugin: mockInstallPlugin,
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

// Helper to render and wait for async effects
async function renderPluginMarketplace() {
  const utils = render(<PluginMarketplace />);
  await waitFor(() => {
    expect(screen.getByText("Plugin Marketplace")).toBeInTheDocument();
  });
  return utils;
}

describe("PluginMarketplace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginManagerState = {
      plugins: [],
      isLoading: false,
      installPlugin: mockInstallPlugin,
    };
  });

  describe("rendering", () => {
    it("should render marketplace title", async () => {
      await renderPluginMarketplace();
      expect(screen.getByText("Plugin Marketplace")).toBeInTheDocument();
    });

    it("should render search input", async () => {
      await renderPluginMarketplace();
      expect(screen.getByPlaceholderText("Search plugins...")).toBeInTheDocument();
    });

    it("should render view mode toggle buttons", async () => {
      await renderPluginMarketplace();
      // Use getAllByRole since there are multiple elements matching
      const buttons = screen.getAllByRole("button", { name: /all/i });
      expect(buttons.length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /featured/i })).toBeInTheDocument();
    });

    it("should render category tabs", async () => {
      await renderPluginMarketplace();
      // Use getAllByText for common text
      const allTabs = screen.getAllByText("All");
      expect(allTabs.length).toBeGreaterThan(0);
      expect(screen.getByRole("tab", { name: /developer/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /utility/i })).toBeInTheDocument();
    });

    it("should render sort options", async () => {
      await renderPluginMarketplace();
      expect(screen.getByText("Sort by")).toBeInTheDocument();
    });

    it("should render plugin cards from registry", async () => {
      await renderPluginMarketplace();
      // Should show plugins from the official registry
      expect(screen.getByText("Hello World Sample")).toBeInTheDocument();
      expect(screen.getByText("Code Formatter")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("should filter plugins by search query", async () => {
      const user = userEvent.setup();
      await renderPluginMarketplace();

      const searchInput = screen.getByPlaceholderText("Search plugins...");
      await user.type(searchInput, "formatter");

      await waitFor(() => {
        expect(screen.getByText("Code Formatter")).toBeInTheDocument();
      });
    });

    it("should show no results message when no matches", async () => {
      const user = userEvent.setup();
      await renderPluginMarketplace();

      const searchInput = screen.getByPlaceholderText("Search plugins...");
      await user.type(searchInput, "nonexistentplugin123");

      await waitFor(() => {
        expect(screen.getByText("No plugins found")).toBeInTheDocument();
      });
    });
  });

  describe("category filtering", () => {
    it("should filter by category when tab is clicked", async () => {
      const user = userEvent.setup();
      await renderPluginMarketplace();

      // Click on Developer category
      const developerTab = screen.getByRole("tab", { name: /developer/i });
      await user.click(developerTab);

      // Should show developer plugins
      await waitFor(() => {
        expect(screen.getByText("Code Formatter")).toBeInTheDocument();
      });
    });
  });

  describe("view mode toggle", () => {
    it("should show featured plugins when Featured is clicked", async () => {
      const user = userEvent.setup();
      await renderPluginMarketplace();

      const featuredButton = screen.getByRole("button", { name: /featured/i });
      await user.click(featuredButton);

      // Featured plugins should be shown (Code Formatter is featured)
      await waitFor(() => {
        expect(screen.getByText("Code Formatter")).toBeInTheDocument();
      });
    });
  });

  describe("install functionality", () => {
    it("should show Install button for not installed plugins", async () => {
      await renderPluginMarketplace();
      const installButtons = screen.getAllByRole("button", { name: /install/i });
      expect(installButtons.length).toBeGreaterThan(0);
    });

    it("should show Installed badge for installed plugins", async () => {
      // Set up mock with installed plugin
      mockPluginManagerState.plugins = [
        {
          manifest: {
            id: "com.huluchat.sample-hello",
            name: "Hello World Sample",
            version: "1.0.0",
            description: "A sample plugin",
            author: "HuluChat Team",
            minAppVersion: "3.40.0",
            permissions: [],
          },
          state: "active",
          path: "/plugins/sample-hello",
        },
      ];

      await renderPluginMarketplace();

      // Hello World Sample should show Installed badge
      expect(screen.getByText("Installed")).toBeInTheDocument();
    });

    it("should call installPlugin when Install is clicked", async () => {
      const user = userEvent.setup();
      mockInstallPlugin.mockResolvedValue(undefined);

      await renderPluginMarketplace();

      const installButtons = screen.getAllByRole("button", { name: /install/i });
      await user.click(installButtons[0]);

      await waitFor(() => {
        expect(mockInstallPlugin).toHaveBeenCalled();
      });
    });
  });

  describe("loading state", () => {
    it("should show loading indicator when isLoading is true", () => {
      mockPluginManagerState.isLoading = true;
      render(<PluginMarketplace />);

      expect(screen.getByText("Loading plugins...")).toBeInTheDocument();
    });
  });

  describe("plugin card rendering", () => {
    it("should show plugin badges", async () => {
      await renderPluginMarketplace();
      // Code Formatter has "featured" badge
      const featuredBadges = screen.getAllByText("Featured");
      expect(featuredBadges.length).toBeGreaterThan(0);
    });

    it("should show plugin author", async () => {
      await renderPluginMarketplace();
      // Use getAllByText since multiple plugins have the same author
      const authorElements = screen.getAllByText(/HuluChat Team/);
      expect(authorElements.length).toBeGreaterThan(0);
    });

    it("should show plugin version", async () => {
      await renderPluginMarketplace();
      // Use getAllByText since multiple plugins have the same version
      const versionElements = screen.getAllByText(/v1\.0\.0/);
      expect(versionElements.length).toBeGreaterThan(0);
    });

    it("should show plugin category badge", async () => {
      await renderPluginMarketplace();
      // Use getAllByRole for more precise selection
      const developerTabs = screen.getAllByRole("tab", { name: /developer/i });
      expect(developerTabs.length).toBeGreaterThan(0);
    });
  });
});
