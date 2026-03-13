/**
 * HuluChat Plugin Registry
 * Local index of available plugins for discovery
 * @module plugins/registry
 *
 * Note: This is a LOCAL registry only - no cloud services.
 * All plugin metadata is bundled with the application.
 */

import type { PluginManifest, PluginPermission } from "./types";

/**
 * Plugin category for organization
 */
export type PluginCategory =
  | "productivity" // Productivity tools
  | "developer" // Developer tools
  | "communication" // Communication enhancements
  | "export" // Export and sharing
  | "appearance" // UI and appearance
  | "utility" // General utilities
  | "integration"; // Third-party integrations

/**
 * Plugin badge for special labeling
 */
export type PluginBadge = "official" | "new" | "popular" | "featured";

/**
 * Extended plugin info for marketplace display
 */
export interface PluginRegistryEntry {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Category for filtering */
  category: PluginCategory;
  /** Optional badges */
  badges?: PluginBadge[];
  /** Download count (for sorting) */
  downloads?: number;
  /** Star rating (0-5) */
  rating?: number;
  /** Tags for search */
  tags: string[];
  /** Screenshot URLs (relative to assets) */
  screenshots?: string[];
  /** Whether plugin is built-in (cannot be uninstalled) */
  builtin?: boolean;
  /** Source path for installation (relative to plugins/) */
  sourcePath: string;
}

/**
 * Official plugin registry
 *
 * This is the source of truth for available plugins.
 * Plugins are discovered from the bundled plugins/ directory.
 */
export const OFFICIAL_PLUGIN_REGISTRY: PluginRegistryEntry[] = [
  {
    manifest: {
      id: "com.huluchat.sample-hello",
      name: "Hello World Sample",
      version: "1.0.0",
      description: "A sample plugin demonstrating the HuluChat plugin API",
      author: "HuluChat Team",
      minAppVersion: "3.40.0",
      permissions: ["chat.read", "storage", "api"],
      contributes: {
        commands: [
          { id: "sampleHello.sayHello", title: "Say Hello", category: "Sample Plugin" },
          { id: "sampleHello.showStats", title: "Show Session Stats", category: "Sample Plugin" },
          { id: "sampleHello.insertTimestamp", title: "Insert Timestamp", category: "Sample Plugin" },
        ],
      },
    },
    category: "developer",
    badges: ["official"],
    tags: ["sample", "demo", "developer", "api"],
    sourcePath: "sample-hello",
    builtin: false,
  },
  {
    manifest: {
      id: "com.huluchat.code-formatter",
      name: "Code Formatter",
      version: "1.0.0",
      description: "Format and beautify code blocks in your messages with syntax highlighting",
      author: "HuluChat Team",
      minAppVersion: "3.40.0",
      permissions: ["chat.read", "storage", "api", "clipboard"],
      contributes: {
        commands: [
          { id: "codeFormatter.formatJSON", title: "Format JSON", category: "Code Formatter" },
          { id: "codeFormatter.formatCode", title: "Format Code Block", category: "Code Formatter" },
          { id: "codeFormatter.extractCode", title: "Extract Last Code Block", category: "Code Formatter" },
          { id: "codeFormatter.minifyJSON", title: "Minify JSON", category: "Code Formatter" },
        ],
      },
    },
    category: "developer",
    badges: ["official", "featured"],
    tags: ["code", "format", "json", "developer", "syntax"],
    sourcePath: "code-formatter",
    builtin: false,
  },
  {
    manifest: {
      id: "com.huluchat.export-chat",
      name: "Export Chat",
      version: "1.0.0",
      description: "Export chat conversations to various formats including Markdown, PDF, and JSON",
      author: "HuluChat Team",
      minAppVersion: "3.40.0",
      permissions: ["chat.read", "storage", "files"],
      contributes: {
        commands: [
          { id: "exportChat.exportMarkdown", title: "Export as Markdown", category: "Export" },
          { id: "exportChat.exportPDF", title: "Export as PDF", category: "Export" },
          { id: "exportChat.exportJSON", title: "Export as JSON", category: "Export" },
        ],
      },
    },
    category: "export",
    badges: ["official", "popular"],
    tags: ["export", "markdown", "pdf", "json", "backup"],
    sourcePath: "export-chat",
    builtin: false,
  },
  {
    manifest: {
      id: "com.huluchat.quick-reply",
      name: "Quick Reply",
      version: "1.0.0",
      description: "Save and quickly insert frequently used responses with keyboard shortcuts",
      author: "HuluChat Team",
      minAppVersion: "3.40.0",
      permissions: ["chat.read", "chat.write", "storage", "clipboard"],
      contributes: {
        commands: [
          { id: "quickReply.insert", title: "Insert Quick Reply", category: "Quick Reply" },
          { id: "quickReply.manage", title: "Manage Quick Replies", category: "Quick Reply" },
        ],
      },
    },
    category: "productivity",
    badges: ["official"],
    tags: ["reply", "template", "shortcut", "productivity"],
    sourcePath: "quick-reply",
    builtin: false,
  },
  {
    manifest: {
      id: "com.huluchat.word-count",
      name: "Word Count",
      version: "1.0.0",
      description: "Display word, character, and token counts for messages and conversations",
      author: "HuluChat Team",
      minAppVersion: "3.40.0",
      permissions: ["chat.read"],
      contributes: {
        commands: [
          { id: "wordCount.showStats", title: "Show Word Stats", category: "Word Count" },
          { id: "wordCount.countSelection", title: "Count Selection", category: "Word Count" },
        ],
      },
    },
    category: "utility",
    badges: ["official"],
    tags: ["word", "count", "token", "statistics", "utility"],
    sourcePath: "word-count",
    builtin: false,
  },
];

/**
 * Get all available plugins from registry
 */
export function getAvailablePlugins(): PluginRegistryEntry[] {
  return OFFICIAL_PLUGIN_REGISTRY;
}

/**
 * Get plugins by category
 */
export function getPluginsByCategory(category: PluginCategory): PluginRegistryEntry[] {
  return OFFICIAL_PLUGIN_REGISTRY.filter((plugin) => plugin.category === category);
}

/**
 * Search plugins by query
 */
export function searchPlugins(query: string): PluginRegistryEntry[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return OFFICIAL_PLUGIN_REGISTRY;
  }

  return OFFICIAL_PLUGIN_REGISTRY.filter((plugin) => {
    const { manifest, tags } = plugin;

    // Search in name
    if (manifest.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in description
    if (manifest.description.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in author
    if (manifest.author.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in tags
    if (tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }

    // Search in commands
    if (manifest.contributes?.commands?.some((cmd) => cmd.title.toLowerCase().includes(normalizedQuery))) {
      return true;
    }

    return false;
  });
}

/**
 * Get plugin by ID
 */
export function getPluginById(id: string): PluginRegistryEntry | undefined {
  return OFFICIAL_PLUGIN_REGISTRY.find((plugin) => plugin.manifest.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories(): PluginCategory[] {
  const categories = new Set<PluginCategory>();
  OFFICIAL_PLUGIN_REGISTRY.forEach((plugin) => categories.add(plugin.category));
  return Array.from(categories);
}

/**
 * Get featured plugins
 */
export function getFeaturedPlugins(): PluginRegistryEntry[] {
  return OFFICIAL_PLUGIN_REGISTRY.filter((plugin) => plugin.badges?.includes("featured"));
}

/**
 * Sort plugins by criteria
 */
export function sortPlugins(
  plugins: PluginRegistryEntry[],
  sortBy: "name" | "downloads" | "rating" | "updated"
): PluginRegistryEntry[] {
  const sorted = [...plugins];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
    case "downloads":
      return sorted.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "updated":
      // For now, use registry order as "updated" order
      return sorted;
    default:
      return sorted;
  }
}

/**
 * Get permission display info
 */
export function getPermissionInfo(permission: PluginPermission): {
  label: string;
  description: string;
  icon: string;
} {
  const permissionMap: Record<PluginPermission, { label: string; description: string; icon: string }> = {
    "chat.read": {
      label: "Read Messages",
      description: "Read your chat messages",
      icon: "message",
    },
    "chat.write": {
      label: "Write Messages",
      description: "Send messages on your behalf",
      icon: "send",
    },
    storage: {
      label: "Local Storage",
      description: "Store data locally on your device",
      icon: "database",
    },
    api: {
      label: "API Access",
      description: "Access HuluChat internal APIs",
      icon: "code",
    },
    clipboard: {
      label: "Clipboard",
      description: "Read and write to your clipboard",
      icon: "clipboard",
    },
    network: {
      label: "Network",
      description: "Make network requests",
      icon: "globe",
    },
    files: {
      label: "File System",
      description: "Read and write files on your device",
      icon: "folder",
    },
  };

  return permissionMap[permission];
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: PluginCategory): {
  label: string;
  description: string;
  icon: string;
} {
  const categoryMap: Record<PluginCategory, { label: string; description: string; icon: string }> = {
    productivity: {
      label: "Productivity",
      description: "Tools to boost your productivity",
      icon: "zap",
    },
    developer: {
      label: "Developer Tools",
      description: "Tools for developers and coding",
      icon: "code",
    },
    communication: {
      label: "Communication",
      description: "Enhance your conversations",
      icon: "message-circle",
    },
    export: {
      label: "Export & Sharing",
      description: "Export and share your content",
      icon: "download",
    },
    appearance: {
      label: "Appearance",
      description: "Customize the look and feel",
      icon: "palette",
    },
    utility: {
      label: "Utilities",
      description: "Helpful utility functions",
      icon: "tool",
    },
    integration: {
      label: "Integrations",
      description: "Connect with other services",
      icon: "plug",
    },
  };

  return categoryMap[category];
}
