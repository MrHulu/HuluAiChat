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
  PluginUpdateInfo,
  HookResult,
  HookOptions,
} from "./types";
import type { Message, Session } from "@/api/client";
import { getSessionMessages, listSessions, getSession } from "@/api/client";

// Detect if running in Tauri environment
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// Lazy-load Tauri FS functions only when in Tauri environment
let tauriFs: typeof import("@tauri-apps/plugin-fs") | null = null;

async function getTauriFs() {
  if (!isTauri) return null;
  if (!tauriFs) {
    tauriFs = await import("@tauri-apps/plugin-fs");
  }
  return tauriFs;
}

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
  private persistFn: () => Promise<void>;

  constructor(_pluginId: string, persistFn: () => Promise<void>) {
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

      // Initialize storage (load persisted data)
      await this.initPluginStorageAsync(plugin);

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

  // ============== Installation ==============

  async installPlugin(sourcePath: string): Promise<PluginInstance> {
    const fs = await getTauriFs();
    if (!fs) {
      throw new Error("Plugin installation requires Tauri environment");
    }

    // Read manifest from source
    const manifestPath = `${sourcePath}/manifest.json`;
    const manifestContent = await fs.readTextFile(manifestPath, {
      baseDir: fs.BaseDirectory.AppData,
    });
    const manifest = JSON.parse(manifestContent) as PluginManifest;

    // Validate plugin
    const validation = this.validatePlugin(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin: ${validation.errors.join(", ")}`);
    }

    // Check if already installed
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    // Create plugin directory
    const pluginDir = await getPluginsDirectory();
    const targetPath = `${pluginDir}/${manifest.id.replace(/\./g, "_")}`;

    // Ensure plugins directory exists
    const pluginsDirExists = await fs.exists(pluginDir, {
      baseDir: fs.BaseDirectory.AppData,
    });
    if (!pluginsDirExists) {
      await fs.mkdir(pluginDir, {
        baseDir: fs.BaseDirectory.AppData,
        recursive: true,
      });
    }

    // Copy plugin files
    await this.copyPluginFiles(sourcePath, targetPath);

    // Load the plugin
    const instance = await this.loadPlugin(targetPath);
    this.emit("plugin:loaded", instance);

    return instance;
  }

  async uninstallPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }

    const fs = await getTauriFs();
    if (!fs) {
      throw new Error("Plugin uninstallation requires Tauri environment");
    }

    // Unload the plugin first
    await this.unloadPlugin(id);

    // Remove plugin directory
    try {
      const pluginPath = plugin.path;
      await this.removePluginDirectory(pluginPath);
    } catch (error) {
      console.error(`Failed to remove plugin directory: ${error}`);
      // Continue even if directory removal fails
    }

    // Remove storage
    try {
      const storagePath = `plugins/storage/${id}.json`;
      const storageExists = await fs.exists(storagePath, {
        baseDir: fs.BaseDirectory.AppData,
      });
      if (storageExists) {
        await fs.remove(storagePath, {
          baseDir: fs.BaseDirectory.AppData,
        });
      }
    } catch (error) {
      console.error(`Failed to remove plugin storage: ${error}`);
    }

    this.pluginStorages.delete(id);
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

  // ============== Async Hooks (TASK-329) ==============

  /**
   * Default hook options
   */
  private static readonly DEFAULT_HOOK_OPTIONS: Required<HookOptions> = {
    timeout: 5000, // 5 seconds
    continueOnError: true,
    validateReturn: true,
  };

  /**
   * Validate that a returned value is a valid Message object
   */
  private validateMessage(message: unknown, handlerIndex: number): { valid: boolean; error?: string } {
    if (message === null) {
      // null is valid - means cancel the message
      return { valid: true };
    }

    if (typeof message !== "object" || message === null) {
      return { valid: false, error: `Handler ${handlerIndex} returned non-object value` };
    }

    const msg = message as Record<string, unknown>;

    // Check required fields
    if (typeof msg.id !== "string") {
      return { valid: false, error: `Handler ${handlerIndex} returned message without valid 'id'` };
    }
    if (typeof msg.session_id !== "string") {
      return { valid: false, error: `Handler ${handlerIndex} returned message without valid 'session_id'` };
    }
    if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") {
      return { valid: false, error: `Handler ${handlerIndex} returned message without valid 'role'` };
    }
    if (typeof msg.content !== "string") {
      return { valid: false, error: `Handler ${handlerIndex} returned message without valid 'content'` };
    }

    return { valid: true };
  }

  /**
   * Execute a single handler with timeout protection
   */
  private async executeHandlerWithTimeout(
    handler: MessageHandler,
    message: Message,
    timeout: number,
    handlerIndex: number
  ): Promise<{ result: Message | null; error?: string; timedOut?: boolean }> {
    return new Promise((resolve) => {
      // Create timeout timer
      const timeoutId = setTimeout(() => {
        resolve({
          result: message, // Return original message on timeout
          error: `Handler ${handlerIndex} timed out after ${timeout}ms`,
          timedOut: true,
        });
      }, timeout);

      // Execute handler
      try {
        const result = handler(message);

        // Handle async handlers
        if (result instanceof Promise) {
          result
            .then((asyncResult) => {
              clearTimeout(timeoutId);
              resolve({ result: asyncResult });
            })
            .catch((error) => {
              clearTimeout(timeoutId);
              resolve({
                result: message,
                error: `Handler ${handlerIndex} threw error: ${error instanceof Error ? error.message : String(error)}`,
              });
            });
        } else {
          // Sync handler
          clearTimeout(timeoutId);
          resolve({ result });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({
          result: message,
          error: `Handler ${handlerIndex} threw error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });
  }

  /**
   * Process message through beforeSend hooks asynchronously
   * Includes timeout protection, error isolation, and return value validation
   */
  async processBeforeSendAsync(message: Message, options?: HookOptions): Promise<HookResult> {
    const opts = { ...PluginManagerImpl.DEFAULT_HOOK_OPTIONS, ...options };
    const errors: string[] = [];
    let currentMessage: Message | null = message;

    for (let i = 0; i < this.beforeSendHandlers.length; i++) {
      if (currentMessage === null) {
        // Message was cancelled by a previous handler
        break;
      }

      const handler = this.beforeSendHandlers[i];

      try {
        const { result, error, timedOut } = await this.executeHandlerWithTimeout(
          handler,
          currentMessage,
          opts.timeout,
          i
        );

        if (error) {
          errors.push(error);
          if (timedOut) {
            console.warn(`[PluginManager] beforeSend handler ${i} timed out:`, error);
          } else {
            console.error(`[PluginManager] beforeSend handler ${i} error:`, error);
          }

          if (!opts.continueOnError) {
            return {
              success: false,
              message: currentMessage,
              error: errors.join("; "),
              failedHandler: `handler-${i}`,
            };
          }
          // Continue with original message on error
          continue;
        }

        // Validate return value
        if (opts.validateReturn && result !== null) {
          const validation = this.validateMessage(result, i);
          if (!validation.valid) {
            errors.push(validation.error!);
            console.error(`[PluginManager] beforeSend handler ${i} validation failed:`, validation.error);

            if (!opts.continueOnError) {
              return {
                success: false,
                message: currentMessage,
                error: validation.error,
                failedHandler: `handler-${i}`,
              };
            }
            // Continue with original message on validation failure
            continue;
          }
        }

        currentMessage = result;
      } catch (error) {
        const errorMsg = `Handler ${i} unexpected error: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`[PluginManager] beforeSend handler ${i} unexpected error:`, error);

        if (!opts.continueOnError) {
          return {
            success: false,
            message: currentMessage,
            error: errorMsg,
            failedHandler: `handler-${i}`,
          };
        }
      }
    }

    return {
      success: errors.length === 0,
      message: currentMessage,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  }

  /**
   * Process message through afterReceive hooks asynchronously
   * Includes timeout protection, error isolation, and return value validation
   */
  async processAfterReceiveAsync(message: Message, options?: HookOptions): Promise<HookResult> {
    const opts = { ...PluginManagerImpl.DEFAULT_HOOK_OPTIONS, ...options };
    const errors: string[] = [];
    let currentMessage: Message | null = message;

    for (let i = 0; i < this.afterReceiveHandlers.length; i++) {
      if (currentMessage === null) {
        // Handler wants to skip this message entirely
        break;
      }

      const handler = this.afterReceiveHandlers[i];

      try {
        const { result, error, timedOut } = await this.executeHandlerWithTimeout(
          handler,
          currentMessage,
          opts.timeout,
          i
        );

        if (error) {
          errors.push(error);
          if (timedOut) {
            console.warn(`[PluginManager] afterReceive handler ${i} timed out:`, error);
          } else {
            console.error(`[PluginManager] afterReceive handler ${i} error:`, error);
          }

          if (!opts.continueOnError) {
            return {
              success: false,
              message: currentMessage,
              error: errors.join("; "),
              failedHandler: `handler-${i}`,
            };
          }
          // Continue with original message on error
          continue;
        }

        // Validate return value
        if (opts.validateReturn && result !== null) {
          const validation = this.validateMessage(result, i);
          if (!validation.valid) {
            errors.push(validation.error!);
            console.error(`[PluginManager] afterReceive handler ${i} validation failed:`, validation.error);

            if (!opts.continueOnError) {
              return {
                success: false,
                message: currentMessage,
                error: validation.error,
                failedHandler: `handler-${i}`,
              };
            }
            // Continue with original message on validation failure
            continue;
          }
        }

        // null means cancel the message (filter it out)
        currentMessage = result;
      } catch (error) {
        const errorMsg = `Handler ${i} unexpected error: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`[PluginManager] afterReceive handler ${i} unexpected error:`, error);

        if (!opts.continueOnError) {
          return {
            success: false,
            message: currentMessage,
            error: errorMsg,
            failedHandler: `handler-${i}`,
          };
        }
      }
    }

    return {
      success: errors.length === 0,
      message: currentMessage,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
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

  // ============== Updates ==============

  async checkForUpdate(id: string): Promise<PluginUpdateInfo | null> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }

    const { updateUrl } = plugin.manifest;
    if (!updateUrl) {
      // No update URL configured
      return null;
    }

    try {
      // Fetch the latest manifest from updateUrl
      const response = await fetch(updateUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch update info: ${response.status}`);
      }

      const remoteManifest = (await response.json()) as PluginManifest;

      // Compare versions
      const hasUpdate = this.compareVersions(
        remoteManifest.version,
        plugin.manifest.version
      ) > 0;

      return {
        id: plugin.manifest.id,
        currentVersion: plugin.manifest.version,
        latestVersion: remoteManifest.version,
        hasUpdate,
        downloadUrl: remoteManifest.downloadUrl,
        manifest: remoteManifest,
      };
    } catch (error) {
      console.error(`Failed to check for update for ${id}:`, error);
      return null;
    }
  }

  async checkForAllUpdates(): Promise<Map<string, PluginUpdateInfo>> {
    const updates = new Map<string, PluginUpdateInfo>();

    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.updateUrl) {
        const updateInfo = await this.checkForUpdate(plugin.manifest.id);
        if (updateInfo) {
          updates.set(plugin.manifest.id, updateInfo);
        }
      }
    }

    return updates;
  }

  async updatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }

    const updateInfo = await this.checkForUpdate(id);
    if (!updateInfo || !updateInfo.hasUpdate) {
      throw new Error("No update available");
    }

    if (!updateInfo.downloadUrl) {
      throw new Error("No download URL available for update");
    }

    const fs = await getTauriFs();
    if (!fs) {
      throw new Error("Plugin update requires Tauri environment");
    }

    try {
      // Download the plugin package
      const response = await fetch(updateInfo.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download plugin: ${response.status}`);
      }

      // For now, we'll support downloading a .zip or direct files
      // This is a simplified implementation
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/zip")) {
        // Handle zip file - would need JSZip or similar library
        throw new Error("ZIP update not yet supported. Please update manually.");
      } else if (contentType.includes("application/json")) {
        // Direct manifest update (for simple plugins)
        const newManifest = await response.json();

        // Backup current plugin
        const backupPath = `${plugin.path}.backup`;

        // Update manifest
        const manifestPath = `${plugin.path}/manifest.json`;
        await fs.writeTextFile(manifestPath, JSON.stringify(newManifest, null, 2), {
          baseDir: fs.BaseDirectory.AppData,
        });

        // If there's a main.js URL, download that too
        if (newManifest.mainUrl) {
          const mainResponse = await fetch(newManifest.mainUrl);
          const mainContent = await mainResponse.text();
          const mainPath = `${plugin.path}/main.js`;
          await fs.writeTextFile(mainPath, mainContent, {
            baseDir: fs.BaseDirectory.AppData,
          });
        }

        // Reload the plugin
        await this.unloadPlugin(id);
        await this.loadPlugin(plugin.path);

        // Clean up backup
        try {
          await fs.remove(backupPath, { baseDir: fs.BaseDirectory.AppData });
        } catch {
          // Ignore cleanup errors
        }
      } else {
        throw new Error("Unsupported update format");
      }
    } catch (error) {
      throw new Error(
        `Failed to update plugin: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ============== Private Methods ==============

  private async loadManifest(pluginPath: string): Promise<PluginManifest> {
    const fs = await getTauriFs();
    if (!fs) {
      throw new Error("Plugin loading requires Tauri environment");
    }

    try {
      const manifestPath = `${pluginPath}/manifest.json`;
      const content = await fs.readTextFile(manifestPath, {
        baseDir: fs.BaseDirectory.AppData,
      });
      return JSON.parse(content) as PluginManifest;
    } catch (error) {
      throw new Error(
        `Failed to load plugin manifest: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async loadPluginModule(pluginPath: string): Promise<PluginModule> {
    const fs = await getTauriFs();
    if (!fs) {
      throw new Error("Plugin loading requires Tauri environment");
    }

    try {
      const mainPath = `${pluginPath}/main.js`;
      const content = await fs.readTextFile(mainPath, {
        baseDir: fs.BaseDirectory.AppData,
      });

      // Create a sandboxed evaluation context
      // Using Function constructor for sandboxing
      const sandboxedModule = new Function(
        "exports",
        "module",
        `${content}\n return module.exports;`
      )({}, { exports: {} });

      // Support both default export and named export
      const moduleExport = sandboxedModule.default || sandboxedModule;

      if (typeof moduleExport.activate !== "function") {
        throw new Error("Plugin module must export an activate function");
      }

      return moduleExport as PluginModule;
    } catch (error) {
      throw new Error(
        `Failed to load plugin module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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

  private async initPluginStorageAsync(plugin: PluginInstance): Promise<void> {
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

    // Load persisted storage from disk
    const savedData = await this.loadPluginStorage(pluginId);
    if (savedData) {
      storage.load(savedData);
    }
  }

  private async loadPluginStorage(pluginId: string): Promise<Record<string, unknown> | null> {
    const fs = await getTauriFs();
    if (!fs) return null;

    try {
      const storagePath = `plugins/storage/${pluginId}.json`;
      const exists = await fs.exists(storagePath, {
        baseDir: fs.BaseDirectory.AppData,
      });

      if (!exists) {
        return null;
      }

      const data = await fs.readTextFile(storagePath, {
        baseDir: fs.BaseDirectory.AppData,
      });

      return JSON.parse(data) as Record<string, unknown>;
    } catch (error) {
      console.error(`Failed to load storage for plugin ${pluginId}:`, error);
      return null;
    }
  }

  private async persistStorage(pluginId: string): Promise<void> {
    const fs = await getTauriFs();
    if (!fs) return;

    try {
      const storage = this.pluginStorages.get(pluginId);
      if (storage) {
        const storageData = JSON.stringify(storage.export());
        const storagePath = `plugins/storage/${pluginId}.json`;

        // Ensure storage directory exists
        const storageDir = "plugins/storage";
        const dirExists = await fs.exists(storageDir, {
          baseDir: fs.BaseDirectory.AppData,
        });
        if (!dirExists) {
          await fs.mkdir(storageDir, {
            baseDir: fs.BaseDirectory.AppData,
            recursive: true,
          });
        }

        await fs.writeTextFile(storagePath, storageData, {
          baseDir: fs.BaseDirectory.AppData,
        });
      }
    } catch (error) {
      console.error(`Failed to persist storage for plugin ${pluginId}:`, error);
    }
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

  /**
   * Compare two semver version strings
   * Returns: positive if a > b, negative if a < b, 0 if equal
   */
  private compareVersions(a: string, b: string): number {
    const parseVersion = (v: string): number[] => {
      return v.split(".").map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? 0 : num;
      });
    };

    const partsA = parseVersion(a);
    const partsB = parseVersion(b);
    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }

    return 0;
  }

  private async copyPluginFiles(sourcePath: string, targetPath: string): Promise<void> {
    const fs = await getTauriFs();
    if (!fs) return;

    // Create target directory
    await fs.mkdir(targetPath, {
      baseDir: fs.BaseDirectory.AppData,
      recursive: true,
    });

    // Read source directory
    const entries = await fs.readDir(sourcePath, {
      baseDir: fs.BaseDirectory.AppData,
    });

    // Copy each file
    for (const entry of entries) {
      const sourceFile = `${sourcePath}/${entry.name}`;
      const targetFile = `${targetPath}/${entry.name}`;

      if (entry.isDirectory) {
        // Recursively copy subdirectory
        await this.copyPluginFiles(sourceFile, targetFile);
      } else {
        // Copy file
        const content = await fs.readTextFile(sourceFile, {
          baseDir: fs.BaseDirectory.AppData,
        });
        await fs.writeTextFile(targetFile, content, {
          baseDir: fs.BaseDirectory.AppData,
        });
      }
    }
  }

  private async removePluginDirectory(pluginPath: string): Promise<void> {
    const fs = await getTauriFs();
    if (!fs) return;

    // Read directory contents
    const entries = await fs.readDir(pluginPath, {
      baseDir: fs.BaseDirectory.AppData,
    });

    // Remove all files and subdirectories first
    for (const entry of entries) {
      const entryPath = `${pluginPath}/${entry.name}`;
      if (entry.isDirectory) {
        await this.removePluginDirectory(entryPath);
      } else {
        await fs.remove(entryPath, {
          baseDir: fs.BaseDirectory.AppData,
        });
      }
    }

    // Remove the directory itself
    await fs.remove(pluginPath, {
      baseDir: fs.BaseDirectory.AppData,
    });
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
 * Get the plugins directory path
 */
export async function getPluginsDirectory(): Promise<string> {
  return "plugins";
}

/**
 * Discover all installed plugins
 */
async function discoverPlugins(pluginDir: string): Promise<string[]> {
  const fs = await getTauriFs();
  if (!fs) {
    console.log("Plugin discovery skipped: not in Tauri environment");
    return [];
  }

  try {
    // Check if plugins directory exists
    const pluginDirExists = await fs.exists(pluginDir, {
      baseDir: fs.BaseDirectory.AppData,
    });

    if (!pluginDirExists) {
      // Create plugins directory
      await fs.mkdir(pluginDir, {
        baseDir: fs.BaseDirectory.AppData,
        recursive: true,
      });
      return [];
    }

    // Read plugin directories
    const entries = await fs.readDir(pluginDir, {
      baseDir: fs.BaseDirectory.AppData,
    });

    // Filter directories that contain manifest.json
    const pluginPaths: string[] = [];
    for (const entry of entries) {
      if (entry.isDirectory) {
        const manifestPath = `${pluginDir}/${entry.name}/manifest.json`;
        const hasManifest = await fs.exists(manifestPath, {
          baseDir: fs.BaseDirectory.AppData,
        });
        if (hasManifest) {
          pluginPaths.push(`${pluginDir}/${entry.name}`);
        }
      }
    }

    return pluginPaths;
  } catch (error) {
    console.error("Failed to discover plugins:", error);
    return [];
  }
}

/**
 * Initialize the plugin system
 */
export async function initializePluginSystem(): Promise<PluginManager> {
  const manager = getPluginManager() as PluginManagerImpl;

  try {
    // Get plugins directory
    const pluginDir = await getPluginsDirectory();

    // Discover installed plugins
    const pluginPaths = await discoverPlugins(pluginDir);

    // Load each plugin
    for (const pluginPath of pluginPaths) {
      try {
        await manager.loadPlugin(pluginPath);
      } catch (error) {
        console.error(`Failed to load plugin from ${pluginPath}:`, error);
      }
    }

    return manager;
  } catch (error) {
    console.error("Failed to initialize plugin system:", error);
    return manager;
  }
}

export { PluginManagerImpl };
