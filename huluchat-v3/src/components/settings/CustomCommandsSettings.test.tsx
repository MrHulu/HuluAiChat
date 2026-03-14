/**
 * Tests for CustomCommandsSettings component
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomCommandsSettings } from "./CustomCommandsSettings";
import * as customCommandsModule from "@/data/customCommands";

// Mock the customCommands module
vi.mock("@/data/customCommands", () => ({
  loadCustomCommands: vi.fn(),
  saveCustomCommands: vi.fn(),
  resetCustomCommands: vi.fn(),
  searchCommands: vi.fn((cmds, query) =>
    cmds.filter(
      (c: customCommandsModule.CustomCommand) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    )
  ),
  filterCommandsByCategory: vi.fn((cmds, cat) =>
    cat === "all" ? cmds : cmds.filter((c: customCommandsModule.CustomCommand) => c.category === cat)
  ),
  sortCommandsByName: vi.fn((cmds) => [...cmds].sort((a, b) => a.name.localeCompare(b.name))),
  COMMAND_CATEGORIES: [
    { id: "general", name: "General", icon: "MessageSquare" },
    { id: "writing", name: "Writing", icon: "PenLine" },
    { id: "coding", name: "Coding", icon: "Code" },
    { id: "analysis", name: "Analysis", icon: "Search" },
    { id: "custom", name: "Custom", icon: "Star" },
  ],
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "settings.customCommands.settingsDescription":
          "Create custom commands with prompt templates.",
        "settings.customCommands.addCommand": "Add Command",
        "settings.customCommands.editCommand": "Edit Command",
        "settings.customCommands.reset": "Reset to Defaults",
        "settings.customCommands.searchPlaceholder": "Search commands...",
        "settings.customCommands.allCategories": "All",
        "settings.customCommands.categories.general": "General",
        "settings.customCommands.categories.writing": "Writing",
        "settings.customCommands.categories.coding": "Coding",
        "settings.customCommands.categories.analysis": "Analysis",
        "settings.customCommands.categories.custom": "Custom",
        "settings.customCommands.name": "Name",
        "settings.customCommands.namePlaceholder": "e.g., Code Review",
        "settings.customCommands.commandDescription": "Description",
        "settings.customCommands.descriptionPlaceholder": "e.g., Review code",
        "settings.customCommands.category": "Category",
        "settings.customCommands.shortcut": "Shortcut",
        "settings.customCommands.shortcutPlaceholder": "e.g., Ctrl+Shift+R",
        "settings.customCommands.shortcutHint": "Optional keyboard shortcut",
        "settings.customCommands.status": "Status",
        "settings.customCommands.promptTemplate": "Prompt Template",
        "settings.customCommands.promptPlaceholder": "e.g., Review this code:",
        "settings.customCommands.promptHint": "Use {{text}} for selected text",
        "settings.customCommands.saved": "Command saved",
        "settings.customCommands.deleted": "Command deleted",
        "settings.customCommands.resetSuccess": "Commands reset to defaults",
        "settings.customCommands.errorRequired": "Name and Prompt Template are required",
        "settings.customCommands.noCommands": "No commands configured",
        "settings.customCommands.noResults": "No commands match your search",
        "settings.customCommands.toggleEnabled": "Toggle command enabled",
        "settings.customCommands.deleteCommand": "Delete Command",
        "settings.customCommands.privacyNote": "All data is stored locally.",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.enabled": "Enabled",
        "common.disabled": "Disabled",
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, v);
        });
      }
      return result;
    },
  }),
}));

describe("CustomCommandsSettings", () => {
  const mockCommands: customCommandsModule.CustomCommand[] = [
    {
      id: "cmd-1",
      name: "Code Review",
      description: "Review code for issues",
      promptTemplate: "Review: {{text}}",
      category: "coding",
      enabled: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "cmd-2",
      name: "Translate",
      description: "Translate text",
      promptTemplate: "Translate: {{text}}",
      category: "general",
      enabled: false,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customCommandsModule.loadCustomCommands).mockReturnValue(mockCommands);
    vi.mocked(customCommandsModule.saveCustomCommands).mockImplementation(() => {});
    vi.mocked(customCommandsModule.resetCustomCommands).mockReturnValue(mockCommands);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render commands list on load", () => {
    render(<CustomCommandsSettings />);

    expect(screen.getByText("Code Review")).toBeInTheDocument();
    expect(screen.getByText("Translate")).toBeInTheDocument();
  });

  it("should show search input and category filter", () => {
    render(<CustomCommandsSettings />);

    expect(screen.getByPlaceholderText("Search commands...")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("should show Add Command button", () => {
    render(<CustomCommandsSettings />);

    expect(screen.getByText("Add Command")).toBeInTheDocument();
  });

  it("should show Reset to Defaults button", () => {
    render(<CustomCommandsSettings />);

    expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
  });

  it("should show add form when Add Command is clicked", async () => {
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    await user.click(screen.getByText("Add Command"));

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Prompt Template")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Shortcut")).toBeInTheDocument();
  });

  it("should hide form when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    await user.click(screen.getByText("Add Command"));
    expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();

    await user.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: /name/i })).not.toBeInTheDocument();
    });
  });

  it("should show error when saving without required fields", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    await user.click(screen.getByText("Add Command"));
    await user.click(screen.getByText("Save"));

    expect(toast.error).toHaveBeenCalledWith("Name and Prompt Template are required");
  });

  it("should save new command when form is valid", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    await user.click(screen.getByText("Add Command"));

    const nameInput = screen.getByRole("textbox", { name: /name/i });
    const promptInput = screen.getByRole("textbox", { name: /prompt template/i });

    await user.type(nameInput, "New Command");
    await user.type(promptInput, "New prompt: {{text}}");
    await user.click(screen.getByText("Save"));

    expect(customCommandsModule.saveCustomCommands).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Command saved");
  });

  it("should delete command when delete button is clicked", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    const deleteButtons = screen.getAllByLabelText("Delete Command");
    await user.click(deleteButtons[0]);

    expect(customCommandsModule.saveCustomCommands).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Command deleted");
  });

  it("should reset to defaults when Reset button is clicked", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    await user.click(screen.getByText("Reset to Defaults"));

    expect(customCommandsModule.resetCustomCommands).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Commands reset to defaults");
  });

  it("should filter commands by search query", async () => {
    const user = userEvent.setup();
    render(<CustomCommandsSettings />);

    const searchInput = screen.getByPlaceholderText("Search commands...");
    await user.type(searchInput, "Code");

    expect(customCommandsModule.searchCommands).toHaveBeenCalled();
  });

  it("should show enabled commands with correct opacity", () => {
    render(<CustomCommandsSettings />);

    // Check that Code Review (enabled) doesn't have opacity-60
    const codeReviewText = screen.getByText("Code Review");
    const codeReviewItem = codeReviewText.closest('[class*="flex"][class*="items-center"][class*="justify-between"]');
    expect(codeReviewItem).not.toHaveClass("opacity-60");

    // Check that Translate (disabled) has opacity-60
    const translateText = screen.getByText("Translate");
    const translateItem = translateText.closest('[class*="flex"][class*="items-center"][class*="justify-between"]');
    expect(translateItem).toHaveClass("opacity-60");
  });

  it("should show privacy note at bottom", () => {
    render(<CustomCommandsSettings />);

    expect(screen.getByText("All data is stored locally.")).toBeInTheDocument();
  });

  it("should show no commands message when list is empty", () => {
    vi.mocked(customCommandsModule.loadCustomCommands).mockReturnValue([]);

    render(<CustomCommandsSettings />);

    expect(screen.getByText("No commands configured")).toBeInTheDocument();
  });

  it("should call onSettingsChange when command is saved", async () => {
    const onSettingsChange = vi.fn();
    const user = userEvent.setup();
    render(<CustomCommandsSettings onSettingsChange={onSettingsChange} />);

    await user.click(screen.getByText("Add Command"));

    const nameInput = screen.getByRole("textbox", { name: /name/i });
    const promptInput = screen.getByRole("textbox", { name: /prompt template/i });

    await user.type(nameInput, "Test");
    await user.type(promptInput, "Test: {{text}}");
    await user.click(screen.getByText("Save"));

    expect(onSettingsChange).toHaveBeenCalled();
  });
});
