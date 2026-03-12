/**
 * QuickActions - Preset actions for clipboard processing
 *
 * PRIVACY: All data stays local, no analytics
 */

export interface QuickAction {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  promptTemplate: string;
  shortcut?: string; // e.g., "Ctrl+1"
  category: "text" | "code" | "general";
}

/**
 * Default Quick Actions
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "translate",
    nameKey: "quickActions.translate.name",
    descriptionKey: "quickActions.translate.description",
    icon: "Languages",
    promptTemplate: "Translate the following text to {{target_language}}:\n\n{{text}}",
    shortcut: "Ctrl+1",
    category: "text",
  },
  {
    id: "summarize",
    nameKey: "quickActions.summarize.name",
    descriptionKey: "quickActions.summarize.description",
    icon: "List",
    promptTemplate: "Summarize the key points of the following text:\n\n{{text}}",
    shortcut: "Ctrl+2",
    category: "text",
  },
  {
    id: "polish",
    nameKey: "quickActions.polish.name",
    descriptionKey: "quickActions.polish.description",
    icon: "Sparkles",
    promptTemplate: "Polish and improve the writing style of the following text:\n\n{{text}}",
    shortcut: "Ctrl+3",
    category: "text",
  },
  {
    id: "explain",
    nameKey: "quickActions.explain.name",
    descriptionKey: "quickActions.explain.description",
    icon: "Lightbulb",
    promptTemplate: "Explain the following concept or text in simple terms:\n\n{{text}}",
    shortcut: "Ctrl+4",
    category: "general",
  },
  {
    id: "code-review",
    nameKey: "quickActions.codeReview.name",
    descriptionKey: "quickActions.codeReview.description",
    icon: "Code",
    promptTemplate: "Review the following code and provide suggestions for improvement:\n\n{{text}}",
    shortcut: "Ctrl+5",
    category: "code",
  },
  {
    id: "fix-grammar",
    nameKey: "quickActions.fixGrammar.name",
    descriptionKey: "quickActions.fixGrammar.description",
    icon: "CheckCircle",
    promptTemplate: "Fix grammar and spelling errors in the following text:\n\n{{text}}",
    category: "text",
  },
  {
    id: "expand",
    nameKey: "quickActions.expand.name",
    descriptionKey: "quickActions.expand.description",
    icon: "Maximize2",
    promptTemplate: "Expand and elaborate on the following text with more details:\n\n{{text}}",
    category: "text",
  },
  {
    id: "simplify",
    nameKey: "quickActions.simplify.name",
    descriptionKey: "quickActions.simplify.description",
    icon: "Minimize2",
    promptTemplate: "Simplify the following text to make it more concise:\n\n{{text}}",
    category: "text",
  },
];

/**
 * Default target language for translation
 */
export const DEFAULT_TARGET_LANGUAGE = "English";

/**
 * Variables that can be used in prompt templates
 */
export const TEMPLATE_VARIABLES = {
  text: "{{text}}",
  target_language: "{{target_language}}",
  source_language: "{{source_language}}",
} as const;

/**
 * Replace template variables with actual values
 */
export function processPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/**
 * Storage key for custom Quick Actions
 */
export const QUICK_ACTIONS_STORAGE_KEY = "huluchat_quick_actions";

/**
 * Load Quick Actions from localStorage
 * Returns default actions if none saved
 */
export function loadQuickActions(): QuickAction[] {
  try {
    const saved = localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as QuickAction[];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load Quick Actions:", e);
  }
  return [...DEFAULT_QUICK_ACTIONS];
}

/**
 * Save Quick Actions to localStorage
 */
export function saveQuickActions(actions: QuickAction[]): void {
  try {
    localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  } catch (e) {
    console.error("Failed to save Quick Actions:", e);
  }
}

/**
 * Reset Quick Actions to defaults
 */
export function resetQuickActions(): QuickAction[] {
  localStorage.removeItem(QUICK_ACTIONS_STORAGE_KEY);
  return [...DEFAULT_QUICK_ACTIONS];
}
