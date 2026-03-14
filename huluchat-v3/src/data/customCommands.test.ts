/**
 * Tests for CustomCommands data module
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  loadCustomCommands,
  saveCustomCommands,
  addCustomCommand,
  updateCustomCommand,
  deleteCustomCommand,
  resetCustomCommands,
  searchCommands,
  filterCommandsByCategory,
  sortCommandsByName,
  sortCommandsByDate,
  processCommandTemplate,
  CUSTOM_COMMANDS_STORAGE_KEY,
  DEFAULT_CUSTOM_COMMANDS,
  type CustomCommand,
} from "./customCommands";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("customCommands", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadCustomCommands", () => {
    it("should return default commands when localStorage is empty", () => {
      const commands = loadCustomCommands();
      expect(commands).toEqual(DEFAULT_CUSTOM_COMMANDS);
    });

    it("should load saved commands from localStorage", () => {
      const savedCommands: CustomCommand[] = [
        {
          id: "test-1",
          name: "Test Command",
          description: "A test command",
          promptTemplate: "Test: {{text}}",
          category: "general",
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      localStorageMock.setItem(CUSTOM_COMMANDS_STORAGE_KEY, JSON.stringify(savedCommands));

      const commands = loadCustomCommands();
      expect(commands).toEqual(savedCommands);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorageMock.setItem(CUSTOM_COMMANDS_STORAGE_KEY, "invalid json{");

      const commands = loadCustomCommands();
      expect(commands).toEqual(DEFAULT_CUSTOM_COMMANDS);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("saveCustomCommands", () => {
    it("should save commands to localStorage", () => {
      const commands: CustomCommand[] = [
        {
          id: "test-1",
          name: "Test",
          description: "Test",
          promptTemplate: "Test: {{text}}",
          category: "general",
          enabled: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      saveCustomCommands(commands);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        CUSTOM_COMMANDS_STORAGE_KEY,
        JSON.stringify(commands)
      );
    });
  });

  describe("addCustomCommand", () => {
    it("should add a new command with generated id and timestamps", () => {
      const newCommand = {
        name: "New Command",
        description: "A new command",
        promptTemplate: "New: {{text}}",
        category: "coding" as const,
        enabled: true,
      };

      const result = addCustomCommand(newCommand);

      expect(result.id).toMatch(/^cmd-\d+-[a-z0-9]+$/);
      expect(result.name).toBe("New Command");
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe("updateCustomCommand", () => {
    it("should update an existing command", () => {
      // First add a command
      const added = addCustomCommand({
        name: "Original",
        description: "Original desc",
        promptTemplate: "Original: {{text}}",
        category: "general",
        enabled: true,
      });

      const updated = updateCustomCommand(added.id, { name: "Updated" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated");
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(added.updatedAt);
    });

    it("should return null if command not found", () => {
      const result = updateCustomCommand("non-existent", { name: "Updated" });
      expect(result).toBeNull();
    });
  });

  describe("deleteCustomCommand", () => {
    it("should delete an existing command", () => {
      const added = addCustomCommand({
        name: "To Delete",
        description: "Will be deleted",
        promptTemplate: "Delete: {{text}}",
        category: "general",
        enabled: true,
      });

      const result = deleteCustomCommand(added.id);
      expect(result).toBe(true);

      const commands = loadCustomCommands();
      expect(commands.find((c) => c.id === added.id)).toBeUndefined();
    });

    it("should return false if command not found", () => {
      const result = deleteCustomCommand("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("resetCustomCommands", () => {
    it("should reset to default commands", () => {
      // Add some custom commands first
      addCustomCommand({
        name: "Custom",
        description: "Custom",
        promptTemplate: "Custom: {{text}}",
        category: "general",
        enabled: true,
      });

      const result = resetCustomCommands();
      expect(result).toEqual(DEFAULT_CUSTOM_COMMANDS);

      // Verify localStorage was cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(CUSTOM_COMMANDS_STORAGE_KEY);
    });
  });

  describe("searchCommands", () => {
    const testCommands: CustomCommand[] = [
      {
        id: "1",
        name: "Code Review",
        description: "Review code for issues",
        promptTemplate: "Review: {{text}}",
        category: "coding",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "2",
        name: "Translate",
        description: "Translate text",
        promptTemplate: "Translate: {{text}}",
        category: "general",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it("should find commands by name", () => {
      const results = searchCommands(testCommands, "code");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Code Review");
    });

    it("should find commands by description", () => {
      const results = searchCommands(testCommands, "translate");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Translate");
    });

    it("should be case-insensitive", () => {
      const results = searchCommands(testCommands, "CODE");
      expect(results).toHaveLength(1);
    });

    it("should return empty array if no match", () => {
      const results = searchCommands(testCommands, "nonexistent");
      expect(results).toHaveLength(0);
    });
  });

  describe("filterCommandsByCategory", () => {
    const testCommands: CustomCommand[] = [
      {
        id: "1",
        name: "Cmd 1",
        description: "Desc",
        promptTemplate: "Test",
        category: "coding",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "2",
        name: "Cmd 2",
        description: "Desc",
        promptTemplate: "Test",
        category: "writing",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it("should filter by category", () => {
      const results = filterCommandsByCategory(testCommands, "coding");
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("coding");
    });

    it("should return all commands when category is 'all'", () => {
      const results = filterCommandsByCategory(testCommands, "all");
      expect(results).toHaveLength(2);
    });
  });

  describe("sortCommandsByName", () => {
    const testCommands: CustomCommand[] = [
      {
        id: "1",
        name: "Zebra",
        description: "Desc",
        promptTemplate: "Test",
        category: "general",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "2",
        name: "Apple",
        description: "Desc",
        promptTemplate: "Test",
        category: "general",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it("should sort commands ascending by name", () => {
      const results = sortCommandsByName(testCommands, true);
      expect(results[0].name).toBe("Apple");
      expect(results[1].name).toBe("Zebra");
    });

    it("should sort commands descending by name", () => {
      const results = sortCommandsByName(testCommands, false);
      expect(results[0].name).toBe("Zebra");
      expect(results[1].name).toBe("Apple");
    });

    it("should not mutate original array", () => {
      sortCommandsByName(testCommands, true);
      expect(testCommands[0].name).toBe("Zebra");
    });
  });

  describe("sortCommandsByDate", () => {
    const testCommands: CustomCommand[] = [
      {
        id: "1",
        name: "Old",
        description: "Desc",
        promptTemplate: "Test",
        category: "general",
        enabled: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "2",
        name: "New",
        description: "Desc",
        promptTemplate: "Test",
        category: "general",
        enabled: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    it("should sort commands newest first", () => {
      const results = sortCommandsByDate(testCommands, true);
      expect(results[0].name).toBe("New");
      expect(results[1].name).toBe("Old");
    });

    it("should sort commands oldest first", () => {
      const results = sortCommandsByDate(testCommands, false);
      expect(results[0].name).toBe("Old");
      expect(results[1].name).toBe("New");
    });
  });

  describe("processCommandTemplate", () => {
    it("should replace template variables", () => {
      const template = "Hello {{text}}, how are you?";
      const result = processCommandTemplate(template, { text: "World" });
      expect(result).toBe("Hello World, how are you?");
    });

    it("should replace multiple occurrences", () => {
      const template = "{{text}} and {{text}}";
      const result = processCommandTemplate(template, { text: "A" });
      expect(result).toBe("A and A");
    });

    it("should replace multiple variables", () => {
      const template = "{{text}} in {{language}}";
      const result = processCommandTemplate(template, {
        text: "Hello",
        language: "English",
      });
      expect(result).toBe("Hello in English");
    });

    it("should not modify template if variable not provided", () => {
      const template = "Hello {{text}}, {{unknown}}";
      const result = processCommandTemplate(template, { text: "World" });
      expect(result).toBe("Hello World, {{unknown}}");
    });
  });
});
