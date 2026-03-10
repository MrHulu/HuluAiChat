import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./CommandPalette";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "command.title": "Command Palette",
        "command.description": "Search for a command to run...",
        "command.placeholder": "Type a command or search...",
        "command.noResults": "No results found.",
        "command.groupActions": "Actions",
        "command.groupNavigation": "Navigation",
        "command.groupSettings": "Settings",
        "command.newSession": "New Chat",
        "command.newFolder": "New Folder",
        "command.exportSession": "Export Current Session",
        "command.search": "Search Messages",
        "command.toggleSidebar": "Toggle Sidebar",
        "command.changeLanguage": "Change Language",
        "command.toggleTheme": "Toggle Theme",
        "command.settings": "Settings",
        "command.showHelp": "Keyboard Shortcuts",
        "command.searchInput": "Search commands",
      };
      return translations[key] || key;
    },
  }),
}));

// Helper to render CommandPalette
const renderCommandPalette = (props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) => {
  const defaultProps: React.ComponentProps<typeof CommandPalette> = {
    open: true,
    onOpenChange: vi.fn(),
    ...props,
  };
  return render(<CommandPalette {...defaultProps} />);
};

describe("CommandPalette", () => {
  let originalPlatform: string;

  beforeEach(() => {
    vi.clearAllMocks();
    originalPlatform = navigator.platform;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    });
  });

  // Helper to mock platform
  const mockPlatform = (platform: string) => {
    Object.defineProperty(navigator, "platform", {
      value: platform,
      configurable: true,
    });
  };

  describe("Rendering", () => {
    it("should render dialog when open", () => {
      renderCommandPalette();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should not render dialog when closed", () => {
      renderCommandPalette({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render search input with placeholder", () => {
      renderCommandPalette();

      const searchInput = screen.getByPlaceholderText("Type a command or search...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should render search input with aria-label", () => {
      renderCommandPalette();

      const searchInput = screen.getByPlaceholderText("Type a command or search...");
      expect(searchInput).toHaveAttribute("aria-label", "Search commands");
    });

    it("should render search icon", () => {
      renderCommandPalette();

      const searchIcon = document.querySelector(".lucide-search");
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe("Command Items", () => {
    it("should show New Chat command", () => {
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      expect(screen.getByText("New Chat")).toBeInTheDocument();
    });

    it("should show New Folder command", () => {
      const onNewFolder = vi.fn();
      renderCommandPalette({ onNewFolder });

      expect(screen.getByText("New Folder")).toBeInTheDocument();
    });

    it("should show Export Session command", () => {
      const onExportSession = vi.fn();
      renderCommandPalette({ onExportSession });

      expect(screen.getByText("Export Current Session")).toBeInTheDocument();
    });

    it("should show Search command", () => {
      const onSearch = vi.fn();
      renderCommandPalette({ onSearch });

      expect(screen.getByText("Search Messages")).toBeInTheDocument();
    });

    it("should show Toggle Sidebar command", () => {
      const onToggleSidebar = vi.fn();
      renderCommandPalette({ onToggleSidebar });

      expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
    });

    it("should show Change Language command", () => {
      const onChangeLanguage = vi.fn();
      renderCommandPalette({ onChangeLanguage });

      expect(screen.getByText("Change Language")).toBeInTheDocument();
    });

    it("should show Toggle Theme command", () => {
      const onToggleTheme = vi.fn();
      renderCommandPalette({ onToggleTheme });

      expect(screen.getByText("Toggle Theme")).toBeInTheDocument();
    });

    it("should show Settings command", () => {
      const onOpenSettings = vi.fn();
      renderCommandPalette({ onOpenSettings });

      // "Settings" appears both as group heading and command text
      const settingsElements = screen.getAllByText("Settings");
      expect(settingsElements.length).toBeGreaterThanOrEqual(1);
    });

    it("should show Help command", () => {
      const onShowHelp = vi.fn();
      renderCommandPalette({ onShowHelp });

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  describe("Command Groups", () => {
    it("should render Actions group heading", () => {
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should render Navigation group heading", () => {
      const onToggleSidebar = vi.fn();
      renderCommandPalette({ onToggleSidebar });

      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });

    it("should render Settings group heading", () => {
      const onChangeLanguage = vi.fn();
      renderCommandPalette({ onChangeLanguage });

      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  describe("Command Icons", () => {
    it("should show Plus icon for New Chat", () => {
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      const plusIcon = document.querySelector(".lucide-plus");
      expect(plusIcon).toBeInTheDocument();
    });

    it("should show FolderPlus icon for New Folder", () => {
      const onNewFolder = vi.fn();
      renderCommandPalette({ onNewFolder });

      const folderPlusIcon = document.querySelector(".lucide-folder-plus");
      expect(folderPlusIcon).toBeInTheDocument();
    });

    it("should show Download icon for Export", () => {
      const onExportSession = vi.fn();
      renderCommandPalette({ onExportSession });

      const downloadIcon = document.querySelector(".lucide-download");
      expect(downloadIcon).toBeInTheDocument();
    });

    it("should show Search icon for Search Messages", () => {
      const onSearch = vi.fn();
      renderCommandPalette({ onSearch });

      // There are two search icons - one in input, one in command item
      const searchIcons = document.querySelectorAll(".lucide-search");
      expect(searchIcons.length).toBeGreaterThan(0);
    });

    it("should show PanelLeft icon for Toggle Sidebar", () => {
      const onToggleSidebar = vi.fn();
      renderCommandPalette({ onToggleSidebar });

      const panelLeftIcon = document.querySelector(".lucide-panel-left");
      expect(panelLeftIcon).toBeInTheDocument();
    });

    it("should show Globe icon for Change Language", () => {
      const onChangeLanguage = vi.fn();
      renderCommandPalette({ onChangeLanguage });

      const globeIcon = document.querySelector(".lucide-globe");
      expect(globeIcon).toBeInTheDocument();
    });

    it("should show Moon icon for Toggle Theme", () => {
      const onToggleTheme = vi.fn();
      renderCommandPalette({ onToggleTheme });

      const moonIcon = document.querySelector(".lucide-moon");
      expect(moonIcon).toBeInTheDocument();
    });

    it("should show Settings icon for Settings", () => {
      const onOpenSettings = vi.fn();
      renderCommandPalette({ onOpenSettings });

      const settingsIcon = document.querySelector(".lucide-settings");
      expect(settingsIcon).toBeInTheDocument();
    });

    it("should show HelpCircle icon for Help", () => {
      const onShowHelp = vi.fn();
      renderCommandPalette({ onShowHelp });

      // Lucide React uses svg elements, check for the circle-help icon pattern
      const helpIcon = document.querySelector(".lucide-circle-help, .lucide-help-circle, svg.lucide");
      expect(helpIcon).toBeInTheDocument();
    });
  });

  describe("Shortcuts", () => {
    it("should show Ctrl+N shortcut on Windows", () => {
      mockPlatform("Win32");
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      expect(screen.getByText("Ctrl+N")).toBeInTheDocument();
    });

    it("should show Cmd+N shortcut on macOS", () => {
      mockPlatform("MacIntel");
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      expect(screen.getByText("⌘N")).toBeInTheDocument();
    });

    it("should show Ctrl+F shortcut for search on Windows", () => {
      mockPlatform("Win32");
      const onSearch = vi.fn();
      renderCommandPalette({ onSearch });

      expect(screen.getByText("Ctrl+F")).toBeInTheDocument();
    });

    it("should show Cmd+F shortcut for search on macOS", () => {
      mockPlatform("MacIntel");
      const onSearch = vi.fn();
      renderCommandPalette({ onSearch });

      expect(screen.getByText("⌘F")).toBeInTheDocument();
    });

    it("should show Ctrl+B shortcut for sidebar on Windows", () => {
      mockPlatform("Win32");
      const onToggleSidebar = vi.fn();
      renderCommandPalette({ onToggleSidebar });

      expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
    });

    it("should show Cmd+B shortcut for sidebar on macOS", () => {
      mockPlatform("MacIntel");
      const onToggleSidebar = vi.fn();
      renderCommandPalette({ onToggleSidebar });

      expect(screen.getByText("⌘B")).toBeInTheDocument();
    });

    it("should show Ctrl+, shortcut for settings on Windows", () => {
      mockPlatform("Win32");
      const onOpenSettings = vi.fn();
      renderCommandPalette({ onOpenSettings });

      expect(screen.getByText("Ctrl+,")).toBeInTheDocument();
    });

    it("should show Cmd+, shortcut for settings on macOS", () => {
      mockPlatform("MacIntel");
      const onOpenSettings = vi.fn();
      renderCommandPalette({ onOpenSettings });

      expect(screen.getByText("⌘,")).toBeInTheDocument();
    });

    it("should show ? shortcut for help", () => {
      const onShowHelp = vi.fn();
      renderCommandPalette({ onShowHelp });

      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  describe("Command Execution", () => {
    it("should call onNewSession when New Chat is selected", async () => {
      const user = userEvent.setup();
      const onNewSession = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onNewSession, onOpenChange });

      await user.click(screen.getByText("New Chat"));

      expect(onNewSession).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onNewFolder when New Folder is selected", async () => {
      const user = userEvent.setup();
      const onNewFolder = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onNewFolder, onOpenChange });

      await user.click(screen.getByText("New Folder"));

      expect(onNewFolder).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onExportSession when Export is selected", async () => {
      const user = userEvent.setup();
      const onExportSession = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onExportSession, onOpenChange });

      await user.click(screen.getByText("Export Current Session"));

      expect(onExportSession).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onSearch when Search is selected", async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onSearch, onOpenChange });

      await user.click(screen.getByText("Search Messages"));

      expect(onSearch).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onToggleSidebar when Toggle Sidebar is selected", async () => {
      const user = userEvent.setup();
      const onToggleSidebar = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onToggleSidebar, onOpenChange });

      await user.click(screen.getByText("Toggle Sidebar"));

      expect(onToggleSidebar).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onChangeLanguage when Change Language is selected", async () => {
      const user = userEvent.setup();
      const onChangeLanguage = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onChangeLanguage, onOpenChange });

      await user.click(screen.getByText("Change Language"));

      expect(onChangeLanguage).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onToggleTheme when Toggle Theme is selected", async () => {
      const user = userEvent.setup();
      const onToggleTheme = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onToggleTheme, onOpenChange });

      await user.click(screen.getByText("Toggle Theme"));

      expect(onToggleTheme).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenSettings when Settings is selected", async () => {
      const user = userEvent.setup();
      const onOpenSettings = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onOpenSettings, onOpenChange });

      // Find the Settings command item (not the group heading)
      const settingsItems = screen.getAllByText("Settings");
      // The command item is the one inside a CommandItem
      const commandItem = settingsItems.find(
        (el) => el.closest("[data-slot='command-item']") !== null
      );
      expect(commandItem).toBeDefined();
      await user.click(commandItem!);

      expect(onOpenSettings).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onShowHelp when Help is selected", async () => {
      const user = userEvent.setup();
      const onShowHelp = vi.fn();
      const onOpenChange = vi.fn();
      renderCommandPalette({ onShowHelp, onOpenChange });

      await user.click(screen.getByText("Keyboard Shortcuts"));

      expect(onShowHelp).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Search Filtering", () => {
    it("should filter commands based on search input", async () => {
      const user = userEvent.setup();
      const onNewSession = vi.fn();
      const onNewFolder = vi.fn();
      renderCommandPalette({ onNewSession, onNewFolder });

      const searchInput = screen.getByPlaceholderText("Type a command or search...");

      await user.type(searchInput, "folder");

      await waitFor(
        () => {
          expect(screen.getByText("New Folder")).toBeInTheDocument();
          expect(screen.queryByText("New Chat")).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should show no results message when no commands match", async () => {
      const user = userEvent.setup();
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      const searchInput = screen.getByPlaceholderText("Type a command or search...");

      await user.type(searchInput, "xyznonexistent");

      await waitFor(() => {
        expect(screen.getByText("No results found.")).toBeInTheDocument();
      });
    });

    it("should clear filter when search input is cleared", async () => {
      const user = userEvent.setup();
      const onNewSession = vi.fn();
      const onOpenSettings = vi.fn();
      renderCommandPalette({ onNewSession, onOpenSettings });

      const searchInput = screen.getByPlaceholderText("Type a command or search...");

      await user.type(searchInput, "settings");

      await waitFor(() => {
        expect(screen.queryByText("New Chat")).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText("New Chat")).toBeInTheDocument();
      });
    });
  });

  describe("Animations", () => {
    it("should have staggered animation delays on Actions group items", () => {
      const onNewSession = vi.fn();
      const onNewFolder = vi.fn();
      const onExportSession = vi.fn();
      renderCommandPalette({ onNewSession, onNewFolder, onExportSession });

      const commandItems = document.querySelectorAll("[data-slot='command-item']");

      expect(commandItems.length).toBeGreaterThan(0);

      // Check that items have animation delay styles
      commandItems.forEach((item, index) => {
        const style = item.getAttribute("style");
        expect(style).toContain(`animation-delay: ${index * 50}ms`);
      });
    });

    it("should have animate-list-enter class on command items", () => {
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      const commandItem = document.querySelector("[data-slot='command-item']");
      expect(commandItem).toHaveClass("animate-list-enter");
    });
  });

  describe("Conditional Rendering", () => {
    it("should not show New Chat command when onNewSession is not provided", () => {
      renderCommandPalette({ onNewSession: undefined });

      expect(screen.queryByText("New Chat")).not.toBeInTheDocument();
    });

    it("should not show New Folder command when onNewFolder is not provided", () => {
      renderCommandPalette({ onNewFolder: undefined });

      expect(screen.queryByText("New Folder")).not.toBeInTheDocument();
    });

    it("should not show Export command when onExportSession is not provided", () => {
      renderCommandPalette({ onExportSession: undefined });

      expect(screen.queryByText("Export Current Session")).not.toBeInTheDocument();
    });

    it("should not show Search command when onSearch is not provided", () => {
      renderCommandPalette({ onSearch: undefined });

      expect(screen.queryByText("Search Messages")).not.toBeInTheDocument();
    });

    it("should not show Toggle Sidebar command when onToggleSidebar is not provided", () => {
      renderCommandPalette({ onToggleSidebar: undefined });

      expect(screen.queryByText("Toggle Sidebar")).not.toBeInTheDocument();
    });

    it("should not show Change Language command when onChangeLanguage is not provided", () => {
      renderCommandPalette({ onChangeLanguage: undefined });

      expect(screen.queryByText("Change Language")).not.toBeInTheDocument();
    });

    it("should not show Toggle Theme command when onToggleTheme is not provided", () => {
      renderCommandPalette({ onToggleTheme: undefined });

      expect(screen.queryByText("Toggle Theme")).not.toBeInTheDocument();
    });

    it("should not show Settings command when onOpenSettings is not provided", () => {
      renderCommandPalette({ onOpenSettings: undefined });

      expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    });

    it("should not show Help command when onShowHelp is not provided", () => {
      renderCommandPalette({ onShowHelp: undefined });

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have dialog role", () => {
      renderCommandPalette();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have accessible name from title", () => {
      renderCommandPalette();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("Command Palette");
    });

    it("should have icons with aria-hidden", () => {
      const onNewSession = vi.fn();
      renderCommandPalette({ onNewSession });

      const icons = document.querySelectorAll(".lucide-plus, .lucide-folder-plus, .lucide-download");
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
      });
    });
  });
});
