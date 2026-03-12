/**
 * QuickActions Data Tests
 *
 * Tests for Quick Actions presets and utility functions
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_QUICK_ACTIONS,
  DEFAULT_TARGET_LANGUAGE,
  TEMPLATE_VARIABLES,
  processPromptTemplate,
  loadQuickActions,
  saveQuickActions,
  resetQuickActions,
  QUICK_ACTIONS_STORAGE_KEY,
  type QuickAction,
} from "./quickActions";

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

describe("quickActions data", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("DEFAULT_QUICK_ACTIONS", () => {
    it("should have 8 default actions", () => {
      expect(DEFAULT_QUICK_ACTIONS).toHaveLength(8);
    });

    it("should have required properties for each action", () => {
      DEFAULT_QUICK_ACTIONS.forEach((action) => {
        expect(action).toHaveProperty("id");
        expect(action).toHaveProperty("nameKey");
        expect(action).toHaveProperty("descriptionKey");
        expect(action).toHaveProperty("icon");
        expect(action).toHaveProperty("promptTemplate");
        expect(action).toHaveProperty("category");
        expect(action.id).toBeTruthy();
        expect(action.nameKey).toBeTruthy();
        expect(action.promptTemplate).toContain("{{text}}");
      });
    });

    it("should have translate action with correct properties", () => {
      const translateAction = DEFAULT_QUICK_ACTIONS.find((a) => a.id === "translate");
      expect(translateAction).toBeDefined();
      expect(translateAction?.nameKey).toBe("quickActions.translate.name");
      expect(translateAction?.promptTemplate).toContain("{{target_language}}");
      expect(translateAction?.shortcut).toBe("Ctrl+1");
    });

    it("should have summarize action", () => {
      const summarizeAction = DEFAULT_QUICK_ACTIONS.find((a) => a.id === "summarize");
      expect(summarizeAction).toBeDefined();
      expect(summarizeAction?.category).toBe("text");
    });

    it("should have code-review action", () => {
      const codeReviewAction = DEFAULT_QUICK_ACTIONS.find((a) => a.id === "code-review");
      expect(codeReviewAction).toBeDefined();
      expect(codeReviewAction?.category).toBe("code");
    });

    it("should have correct category types", () => {
      const categories = new Set(DEFAULT_QUICK_ACTIONS.map((a) => a.category));
      expect(categories.has("text")).toBe(true);
      expect(categories.has("code")).toBe(true);
      expect(categories.has("general")).toBe(true);
    });
  });

  describe("DEFAULT_TARGET_LANGUAGE", () => {
    it("should be English", () => {
      expect(DEFAULT_TARGET_LANGUAGE).toBe("English");
    });
  });

  describe("TEMPLATE_VARIABLES", () => {
    it("should have text variable", () => {
      expect(TEMPLATE_VARIABLES.text).toBe("{{text}}");
    });

    it("should have target_language variable", () => {
      expect(TEMPLATE_VARIABLES.target_language).toBe("{{target_language}}");
    });

    it("should have source_language variable", () => {
      expect(TEMPLATE_VARIABLES.source_language).toBe("{{source_language}}");
    });
  });

  describe("processPromptTemplate", () => {
    it("should replace text variable", () => {
      const template = "Translate this: {{text}}";
      const result = processPromptTemplate(template, { text: "Hello World" });
      expect(result).toBe("Translate this: Hello World");
    });

    it("should replace multiple variables", () => {
      const template = "Translate {{text}} from {{source_language}} to {{target_language}}";
      const result = processPromptTemplate(template, {
        text: "Bonjour",
        source_language: "French",
        target_language: "English",
      });
      expect(result).toBe("Translate Bonjour from French to English");
    });

    it("should replace all occurrences of the same variable", () => {
      const template = "{{text}} and {{text}} again";
      const result = processPromptTemplate(template, { text: "Test" });
      expect(result).toBe("Test and Test again");
    });

    it("should handle empty variables", () => {
      const template = "Hello {{name}}";
      const result = processPromptTemplate(template, {});
      expect(result).toBe("Hello {{name}}");
    });

    it("should handle special characters in values", () => {
      const template = "Code: {{text}}";
      const result = processPromptTemplate(template, { text: "const x = '<script>';" });
      expect(result).toBe("Code: const x = '<script>';");
    });
  });

  describe("loadQuickActions", () => {
    it("should return default actions when localStorage is empty", () => {
      const actions = loadQuickActions();
      expect(actions).toEqual(DEFAULT_QUICK_ACTIONS);
    });

    it("should return saved actions from localStorage", () => {
      const customActions: QuickAction[] = [
        {
          id: "custom-1",
          nameKey: "Custom Action",
          descriptionKey: "Custom description",
          icon: "Star",
          promptTemplate: "Custom: {{text}}",
          category: "general",
        },
      ];
      localStorageMock.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(customActions));

      const actions = loadQuickActions();
      expect(actions).toEqual(customActions);
    });

    it("should return default actions on parse error", () => {
      localStorageMock.setItem(QUICK_ACTIONS_STORAGE_KEY, "invalid json");

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const actions = loadQuickActions();
      consoleSpy.mockRestore();

      expect(actions).toEqual(DEFAULT_QUICK_ACTIONS);
    });
  });

  describe("saveQuickActions", () => {
    it("should save actions to localStorage", () => {
      const actions: QuickAction[] = [
        {
          id: "test",
          nameKey: "Test",
          descriptionKey: "Test description",
          icon: "Star",
          promptTemplate: "Test: {{text}}",
          category: "text",
        },
      ];

      saveQuickActions(actions);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        QUICK_ACTIONS_STORAGE_KEY,
        JSON.stringify(actions)
      );
    });

    it("should handle localStorage errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("Quota exceeded");
      });

      // Should not throw
      expect(() => saveQuickActions([])).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("resetQuickActions", () => {
    it("should remove item from localStorage", () => {
      localStorageMock.setItem(QUICK_ACTIONS_STORAGE_KEY, "[]");

      const result = resetQuickActions();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(QUICK_ACTIONS_STORAGE_KEY);
      expect(result).toEqual(DEFAULT_QUICK_ACTIONS);
    });

    it("should return default actions", () => {
      const result = resetQuickActions();
      expect(result).toEqual(DEFAULT_QUICK_ACTIONS);
    });
  });
});
