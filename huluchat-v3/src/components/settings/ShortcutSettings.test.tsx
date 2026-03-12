/**
 * Tests for ShortcutSettings component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShortcutSettings } from "./ShortcutSettings";

// Mock useShortcutSettings hook
const mockResetAllShortcuts = vi.fn();
const mockUpdateShortcut = vi.fn();
const mockResetShortcut = vi.fn();
const mockFormatShortcut = vi.fn((binding) => `Mock+${binding.key}`);

vi.mock("@/hooks/useShortcutSettings", () => ({
  useShortcutSettings: () => ({
    shortcuts: [
      { id: "commandPalette", key: "KeyK", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      { id: "newChat", key: "KeyN", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      { id: "toggleSidebar", key: "KeyB", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
    ],
    conflicts: new Map(),
    isMac: false,
    updateShortcut: mockUpdateShortcut,
    resetShortcut: mockResetShortcut,
    resetAllShortcuts: mockResetAllShortcuts,
    formatShortcut: mockFormatShortcut,
    checkConflict: vi.fn(() => []),
  }),
  SHORTCUT_META: {
    commandPalette: { descriptionKey: "keyboard.commandPalette", group: "navigation" },
    newChat: { descriptionKey: "keyboard.newChat", group: "actions" },
    toggleSidebar: { descriptionKey: "keyboard.toggleSidebar", group: "navigation" },
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "shortcuts.title": "Customize Shortcuts",
        "shortcuts.instructions": "Click on a shortcut to record a new key combination.",
        "shortcuts.resetAll": "Reset All",
        "shortcuts.groupNavigation": "Navigation",
        "shortcuts.groupActions": "Actions",
        "shortcuts.groupOther": "Other",
        "shortcuts.platformWin": "Windows/Linux shortcuts (use Ctrl key)",
        "shortcuts.privacyNote": "Shortcut preferences are stored locally.",
        "shortcuts.pressKeys": "Press keys...",
        "shortcuts.resetShortcut": "Reset to default",
        "shortcuts.conflictWarning": "Shortcut conflict",
        "shortcuts.conflictsWith": "Conflicts with",
        "keyboard.commandPalette": "Open command palette",
        "keyboard.newChat": "New chat",
        "keyboard.toggleSidebar": "Toggle sidebar",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ShortcutSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the shortcuts title", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Customize Shortcuts")).toBeInTheDocument();
  });

  it("should render the instructions", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Click on a shortcut to record a new key combination.")).toBeInTheDocument();
  });

  it("should render the Reset All button", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Reset All")).toBeInTheDocument();
  });

  it("should call resetAllShortcuts when Reset All is clicked", () => {
    render(<ShortcutSettings />);
    const resetButton = screen.getByText("Reset All");
    fireEvent.click(resetButton);
    expect(mockResetAllShortcuts).toHaveBeenCalled();
  });

  it("should render shortcut groups", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("should render shortcut descriptions", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Open command palette")).toBeInTheDocument();
    expect(screen.getByText("New chat")).toBeInTheDocument();
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument();
  });

  it("should render the privacy note", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Shortcut preferences are stored locally.")).toBeInTheDocument();
  });

  it("should render platform indicator", () => {
    render(<ShortcutSettings />);
    expect(screen.getByText("Windows/Linux shortcuts (use Ctrl key)")).toBeInTheDocument();
  });
});
