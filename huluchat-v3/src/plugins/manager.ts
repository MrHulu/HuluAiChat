/**
 * HuluChat Plugin Manager
 * Manages plugin lifecycle, commands, and hooks
 * @module plugins/manager
 */

import { toast } from "sonner";
import type {
  PluginManager,
  PluginInstance,
  PluginManifest,
  PluginContext,
  PluginModule,
  PluginStorage,
  PluginAPI,
  Command,
  ToolbarButton,
  SettingsPanel,
  MessageHandler,
  Disposable,
  PluginManagerEventHandler,
  PluginManagerEvent,
  PluginValidationResult,
} from "./types";
import type { Message, Session } from "@/api/client";
import { getSessionMessages, listSessions, getSession } from "@/api/client";

/**
 * Create a disposable that calls a callback when disposed
 */
function createDisposable(callback: () => void): Disposable {
  return { dispose: callback };
}

/**
 * Plugin storage implementation
 */
class PluginStorageImpl implements PluginStorage {
  private data: Map<string, unknown> = new Map();
  private persistFn: () => void;

  constructor(_pluginId: string, persistFn: () => void) {
    this.persistFn = persistFn;
  }

  get<T>(key: string): T | null {
    return (this.data.get(key) as T) ?? null;
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
    this.persistFn();
  }

  delete(key: string): void {
    this.data.delete(key);
    this.persistFn();
  }

  clear(): void {
    this.data.clear();
    this.persistFn();
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /** Load data from persisted storage */
  load(data: Record<string, unknown>): void {
    this.data = new Map(Object.entries(data));
  }

  /** Export data for persistence */
  export(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }
}

/**
 * Plugin Manager Implementation
 */
class PluginManagerImpl implements PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private commands: Map<string, Command> = new Map();
  private toolbarButtons: Map<string, ToolbarButton> = new Map();
  private settingsPanels: Map<string, SettingsPanel> = new Map();
  private beforeSendHandlers: MessageHandler[] = [];
  private afterReceiveHandlers: MessageHandler[] = [];
  private eventHandlers: PluginManagerEventHandler[] = [];
  private pluginStorages: Map<string, PluginStorageImpl> = new Map();
  private disposeCallbacks: Map<string, (() => void)[]> = new Map();

  // ============== Discovery ==============

  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  // ============== Lifecycle ==============

  async loadPlugin(path: string): Promise<PluginInstance> {
    // Load manifest
    const manifest = await this.loadManifest(path);

    // Validate plugin
    const validation = this.validatePlugin(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin: ${validation.errors.join(", ")}`);
    }

    // Create plugin instance
    const instance: PluginInstance = {
      manifest,
      state: "inactive",
      path,
    };

    this.plugins.set(manifest.id, instance);
    this.emit("plugin:loaded", instance);

    return instance;
  }

  async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) return;

    // Deactivate if active
    if (plugin.state === "active") {
      await this.deactivatePlugin(id);
    }

    // Remove from plugins
    this.plugins.delete(id);

    // Cleanup storage
    this.pluginStorages.delete(id);
    this.disposeCallbacks.delete(id);
  }

  async activatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }

    if (plugin.state === "active") {
      return; // Already active
    }

    try {
      plugin.state = "activating";

      // Load plugin module
      const module = await this.loadPluginModule(plugin.path);
      plugin.module = module;

      // Create context
      const context = this.createPluginContext(plugin);
      plugin.context = context;

      // Initialize storage
      this.initPluginStorage(plugin);

      // Call activate
      await module.activate(context);

      plugin.state = "active";
      this.emit("plugin:activated", plugin);
    } catch (error) {
      plugin.state = "error";
      plugin.error = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", plugin);
      throw error;
    }
  }

  async deactivatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin || plugin.state !== "active") return;

    try {
      // Call deactivate if available
      if (plugin.module?.deactivate) {
        await plugin.module.deactivate();
      }

      // Run dispose callbacks
      const callbacks = this.disposeCallbacks.get(id) || [];
      callbacks.forEach((cb) => cb());

      // Cleanup
      this.unregisterPluginComponents(id);
      plugin.state = "inactive";
      plugin.context = undefined;

      this.emit("plugin:deactivated", plugin);
    } catch (error) {
      plugin.state = "error";
      plugin.error = error instanceof Error ? error.message : String(error);
      this.emit("plugin:error", plugin);
      throw error;
    }
  }

  // ============== Commands ==============

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  async executeCommand(id: string, ...args: unknown[]): Promise<void> {
    const command = this.commands.get(id);
    if (!command) {
      throw new Error(`Command not found: ${id}`);
    }
    await command.handler(...args);
  }

  // ============== Hooks ==============

  processBeforeSend(message: Message): Message {
    let result: Message = message;
    for (const handler of this.beforeSendHandlers) {
      const processed = handler(result);
      if (processed === null) {
        // Handler cancelled the message
        return message;
      }
      // Handle both sync and async handlers (for sync path, Promise values are ignored)
      if (processed instanceof Promise) {
        // Skip async handlers in sync context
        continue;
      }
      result = processed;
    }
    return result;
  }

  processAfterReceive(message: Message): Message {
    let result: Message = message;
    for (const handler of this.afterReceiveHandlers) {
      const processed = handler(result);
      if (processed === null) {
        // Handler wants to skip this message
        continue;
      }
      // Handle both sync and async handlers
      if (processed instanceof Promise) {
        // Skip async handlers in sync context
        continue;
      }
      result = processed;
    }
    return result;
  }

  // ============== Events ==============

  on(handler: PluginManagerEventHandler): Disposable {
    this.eventHandlers.push(handler);
    return createDisposable(() => {
      const index = this.eventHandlers.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.splice(index, 1);
      }
    });
  }

  // ============== Storage ==============

  getPluginStorage(pluginId: string): PluginStorage {
    let storage = this.pluginStorages.get(pluginId);
    if (!storage) {
      storage = new PluginStorageImpl(pluginId, () => this.persistStorage(pluginId));
      this.pluginStorages.set(pluginId, storage);
    }
    return storage;
  }

  // ============== Private Methods ==============

  private async loadManifest(_path: string): Promise<PluginManifest> {
    // In a real implementation, this would read from the file system
    // For now, we'll use a placeholder that would be replaced by Tauri FS API
    // TODO: Use Tauri FS API to read the file
    // const manifestPath = `${path}/manifest.json`;
    // const content = await readTextFile(manifestPath);
    // return JSON.parse(content);

    // Placeholder for testing
    throw new Error("Plugin loading not yet implemented - requires Tauri FS API");
  }

  private async loadPluginModule(_path: string): Promise<PluginModule> {
    // In a real implementation, this would load the JS module
    // For security, we'd use a sandboxed evaluation
    // TODO: Use sandboxed module loading
    // const mainPath = `${path}/main.js`;

    throw new Error("Plugin module loading not yet implemented");
  }

  private validatePlugin(manifest: PluginManifest): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.id) {
      errors.push("Plugin ID is required");
    } else if (!/^[a-z0-9-]+\.[a-z0-9-]+$/i.test(manifest.id)) {
      errors.push("Plugin ID must be in reverse domain format (e.g., com.example.plugin)");
    }

    if (!manifest.name) {
      errors.push("Plugin name is required");
    }

    if (!manifest.version) {
      errors.push("Plugin version is required");
    }

    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      warnings.push("No permissions declared - plugin will have limited functionality");
    }

    // Validate permissions
    const validPermissions = [
      "chat.read",
      "chat.write",
      "storage",
      "api",
      "clipboard",
      "network",
      "files",
    ];
    if (manifest.permissions) {
      for (const perm of manifest.permissions) {
        if (!validPermissions.includes(perm)) {
          warnings.push(`Unknown permission: ${perm}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private createPluginContext(plugin: PluginInstance): PluginContext {
    const pluginId = plugin.manifest.id;
    const disposeCallbacks: (() => void)[] = [];
    this.disposeCallbacks.set(pluginId, disposeCallbacks);

    const context: PluginContext = {
      id: pluginId,
      version: plugin.manifest.version,

      registerCommand: (command: Command): Disposable => {
        this.commands.set(command.id, command);
        return createDisposable(() => {
          this.commands.delete(command.id);
        });
      },

      executeCommand: async (id: string, ...args: unknown[]): Promise<void> => {
        await this.executeCommand(id, ...args);
      },

      onBeforeSend: (handler: MessageHandler): Disposable => {
        this.beforeSendHandlers.push(handler);
        return createDisposable(() => {
          const index = this.beforeSendHandlers.indexOf(handler);
          if (index >= 0) {
            this.beforeSendHandlers.splice(index, 1);
          }
        });
      },

      onAfterReceive: (handler: MessageHandler): Disposable => {
        this.afterReceiveHandlers.push(handler);
        return createDisposable(() => {
          const index = this.afterReceiveHandlers.indexOf(handler);
          if (index >= 0) {
            this.afterReceiveHandlers.splice(index, 1);
          }
        });
      },

      addToolbarButton: (button: ToolbarButton): Disposable => {
        this.toolbarButtons.set(button.id, button);
        return createDisposable(() => {
          this.toolbarButtons.delete(button.id);
        });
      },

      addSettingsPanel: (panel: SettingsPanel): Disposable => {
        this.settingsPanels.set(panel.id, panel);
        return createDisposable(() => {
          this.settingsPanels.delete(panel.id);
        });
      },

      showNotification: (
        message: string,
        type: "info" | "success" | "error" | "warning" = "info"
      ): void => {
        switch (type) {
          case "success":
            toast.success(message);
            break;
          case "error":
            toast.error(message);
            break;
          case "warning":
            toast.warning(message);
            break;
          default:
            toast.info(message);
        }
      },

      storage: this.getPluginStorage(pluginId),

      api: this.createPluginAPI(plugin),

      readClipboard: async (): Promise<string> => {
        if (!plugin.manifest.permissions.includes("clipboard")) {
          throw new Error("Clipboard permission required");
        }
        return navigator.clipboard.readText();
      },

      writeClipboard: async (text: string): Promise<void> => {
        if (!plugin.manifest.permissions.includes("clipboard")) {
          throw new Error("Clipboard permission required");
        }
        await navigator.clipboard.writeText(text);
      },

      fetch: async (url: string, options?: RequestInit): Promise<Response> => {
        if (!plugin.manifest.permissions.includes("network")) {
          throw new Error("Network permission required");
        }
        return fetch(url, options);
      },

      onDispose: (callback: () => void): void => {
        disposeCallbacks.push(callback);
      },
    };

    return context;
  }

  private createPluginAPI(plugin: PluginInstance): PluginAPI {
    return {
      getSessions: async (): Promise<Session[]> => {
        if (!plugin.manifest.permissions.includes("api")) {
          throw new Error("API permission required");
        }
        return listSessions();
      },

      getSession: async (id: string): Promise<Session | null> => {
        if (!plugin.manifest.permissions.includes("api")) {
          throw new Error("API permission required");
        }
        try {
          return await getSession(id);
        } catch {
          return null;
        }
      },

      getMessages: async (sessionId: string): Promise<Message[]> => {
        if (!plugin.manifest.permissions.includes("api")) {
          throw new Error("API permission required");
        }
        const result = await getSessionMessages(sessionId);
        return result.messages;
      },

      sendMessage: async (sessionId: string, content: string): Promise<void> => {
        if (!plugin.manifest.permissions.includes("chat.write")) {
          throw new Error("chat.write permission required");
        }
        // This would integrate with the chat system
        // For now, it's a placeholder
        console.log(`Plugin sending message to session ${sessionId}: ${content}`);
      },
    };
  }

  private initPluginStorage(plugin: PluginInstance): void {
    const pluginId = plugin.manifest.id;

    // Check if storage permission is granted
    if (!plugin.manifest.permissions.includes("storage")) {
      return;
    }

    // Create or get existing storage
    let storage = this.pluginStorages.get(pluginId);
    if (!storage) {
      storage = new PluginStorageImpl(pluginId, () => this.persistStorage(pluginId));
      this.pluginStorages.set(pluginId, storage);
    }

    // TODO: Load persisted storage from disk
    // const savedData = await loadPluginStorage(pluginId);
    // storage.load(savedData);
  }

  private persistStorage(_pluginId: string): void {
    // TODO: Persist storage to disk using Tauri FS API
    // const storage = this.pluginStorages.get(pluginId);
    // if (storage) {
    //   await savePluginStorage(pluginId, storage.export());
    // }
  }

  private unregisterPluginComponents(pluginId: string): void {
    // Remove commands registered by this plugin
    for (const [id] of this.commands) {
      if (id.startsWith(pluginId)) {
        this.commands.delete(id);
      }
    }

    // Remove toolbar buttons
    for (const [id] of this.toolbarButtons) {
      if (id.startsWith(pluginId)) {
        this.toolbarButtons.delete(id);
      }
    }

    // Remove settings panels
    for (const [id] of this.settingsPanels) {
      if (id.startsWith(pluginId)) {
        this.settingsPanels.delete(id);
      }
    }
  }

  private emit(event: PluginManagerEvent, plugin: PluginInstance): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event, plugin);
      } catch (error) {
        console.error("Plugin event handler error:", error);
      }
    }
  }
}

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

/**
 * Get the plugin manager instance
 */
export function getPluginManager(): PluginManager {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManagerImpl();
  }
  return pluginManagerInstance;
}

/**
 * Initialize the plugin system
 */
export async function initializePluginSystem(): Promise<PluginManager> {
  const manager = getPluginManager();
  // TODO: Discover and load installed plugins
  // const pluginDir = await getPluginDirectory();
  // const plugins = await discoverPlugins(pluginDir);
  // for (const plugin of plugins) {
  //   await manager.loadPlugin(plugin);
  //   if (plugin.autoActivate) {
  //     await manager.activatePlugin(plugin.id);
  //   }
  // }
  return manager;
}

export { PluginManagerImpl };
