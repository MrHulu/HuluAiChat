/**
 * CustomCommands - User-defined commands with prompts
 *
 * PRIVACY: All data stays local, no analytics
 * NO TRACKING: Command usage frequency is NOT tracked
 */

export interface CustomCommand {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  category: CommandCategory;
  shortcut?: string; // e.g., "Ctrl+Shift+T"
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CommandCategory = "general" | "writing" | "coding" | "analysis" | "custom";

export interface CommandCategoryInfo {
  id: CommandCategory;
  name: string;
  icon: string;
}

/**
 * Available command categories
 */
export const COMMAND_CATEGORIES: CommandCategoryInfo[] = [
  { id: "general", name: "General", icon: "MessageSquare" },
  { id: "writing", name: "Writing", icon: "PenLine" },
  { id: "coding", name: "Coding", icon: "Code" },
  { id: "analysis", name: "Analysis", icon: "Search" },
  { id: "custom", name: "Custom", icon: "Star" },
];

/**
 * Default custom commands (examples for new users)
 */
export const DEFAULT_CUSTOM_COMMANDS: CustomCommand[] = [
  {
    id: "default-1",
    name: "Code Review",
    description: "Review code for best practices and potential issues",
    promptTemplate: "Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance considerations\n4. Suggestions for improvement\n\n{{text}}",
    category: "coding",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-2",
    name: "Explain Code",
    description: "Explain code in simple terms",
    promptTemplate: "Please explain the following code in simple terms:\n\n{{text}}",
    category: "coding",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-3",
    name: "Improve Writing",
    description: "Improve the clarity and style of text",
    promptTemplate: "Please improve the following text for clarity, style, and readability:\n\n{{text}}",
    category: "writing",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Variables that can be used in prompt templates
 */
export const TEMPLATE_VARIABLES = {
  text: "{{text}}",
  selection: "{{selection}}",
  language: "{{language}}",
  context: "{{context}}",
} as const;

/**
 * Replace template variables with actual values
 */
export function processCommandTemplate(
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
 * Storage key for custom commands
 */
export const CUSTOM_COMMANDS_STORAGE_KEY = "huluchat_custom_commands";

/**
 * Load custom commands from localStorage
 * Returns default commands if none saved
 */
export function loadCustomCommands(): CustomCommand[] {
  try {
    const saved = localStorage.getItem(CUSTOM_COMMANDS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CustomCommand[];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load custom commands:", e);
  }
  return [...DEFAULT_CUSTOM_COMMANDS];
}

/**
 * Save custom commands to localStorage
 */
export function saveCustomCommands(commands: CustomCommand[]): void {
  try {
    localStorage.setItem(CUSTOM_COMMANDS_STORAGE_KEY, JSON.stringify(commands));
  } catch (e) {
    console.error("Failed to save custom commands:", e);
  }
}

/**
 * Add a new custom command
 */
export function addCustomCommand(command: Omit<CustomCommand, "id" | "createdAt" | "updatedAt">): CustomCommand {
  const commands = loadCustomCommands();
  const newCommand: CustomCommand = {
    ...command,
    id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  commands.push(newCommand);
  saveCustomCommands(commands);
  return newCommand;
}

/**
 * Update an existing custom command
 */
export function updateCustomCommand(id: string, updates: Partial<Omit<CustomCommand, "id" | "createdAt">>): CustomCommand | null {
  const commands = loadCustomCommands();
  const index = commands.findIndex((c) => c.id === id);
  if (index === -1) return null;

  commands[index] = {
    ...commands[index],
    ...updates,
    updatedAt: Date.now(),
  };
  saveCustomCommands(commands);
  return commands[index];
}

/**
 * Delete a custom command
 */
export function deleteCustomCommand(id: string): boolean {
  const commands = loadCustomCommands();
  const filtered = commands.filter((c) => c.id !== id);
  if (filtered.length === commands.length) return false;
  saveCustomCommands(filtered);
  return true;
}

/**
 * Reset custom commands to defaults
 */
export function resetCustomCommands(): CustomCommand[] {
  localStorage.removeItem(CUSTOM_COMMANDS_STORAGE_KEY);
  return [...DEFAULT_CUSTOM_COMMANDS];
}

/**
 * Search commands by name or description
 */
export function searchCommands(commands: CustomCommand[], query: string): CustomCommand[] {
  const lowerQuery = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter commands by category
 */
export function filterCommandsByCategory(commands: CustomCommand[], category: CommandCategory | "all"): CustomCommand[] {
  if (category === "all") return commands;
  return commands.filter((cmd) => cmd.category === category);
}

/**
 * Sort commands by name
 */
export function sortCommandsByName(commands: CustomCommand[], ascending = true): CustomCommand[] {
  return [...commands].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return ascending ? comparison : -comparison;
  });
}

/**
 * Sort commands by update date
 */
export function sortCommandsByDate(commands: CustomCommand[], newestFirst = true): CustomCommand[] {
  return [...commands].sort((a, b) => {
    const comparison = a.updatedAt - b.updatedAt;
    return newestFirst ? -comparison : comparison;
  });
}
