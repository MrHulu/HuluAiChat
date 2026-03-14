/**
 * HuluChat Plugin System Types
 * @module plugins/types
 */

import type { Message, Session } from "@/api/client";

// ============== Plugin Manifest ==============

/**
 * Plugin permission types
 */
export type PluginPermission =
  | "chat.read"
  | "chat.write"
  | "storage"
  | "api"
  | "clipboard"
  | "network"
  | "files";

/**
 * Command contribution definition
 */
export interface CommandContribution {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  shortcut?: string;
}

/**
 * Plugin contributions (what the plugin adds to the app)
 */
export interface PluginContributes {
  commands?: CommandContribution[];
  toolbar?: string[];
  settings?: string;
}

/**
 * Plugin manifest (manifest.json)
 */
export interface PluginManifest {
  /** Unique plugin ID (reverse domain format: com.example.plugin-name) */
  id: string;
  /** Display name */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Description */
  description: string;
  /** Author name */
  author: string;
  /** Minimum HuluChat version required */
  minAppVersion: string;
  /** Required permissions */
  permissions: PluginPermission[];
  /** Optional homepage URL */
  homepage?: string;
  /** Optional repository URL */
  repository?: string;
  /** What the plugin contributes */
  contributes?: PluginContributes;
  /** URL to check for updates (returns updated manifest.json) */
  updateUrl?: string;
  /** URL to download plugin package (.zip) */
  downloadUrl?: string;
  /**
   * Allowed domains for network requests (required if 'network' permission is granted)
   * Supports wildcards: *.example.com matches api.example.com, www.example.com
   * @security This is enforced by the sandbox
   */
  allowedDomains?: string[];
}

// ============== Plugin Instance ==============

/**
 * Plugin state
 */
export type PluginState =
  | "inactive" // Not loaded
  | "activating" // Currently activating
  | "active" // Running
  | "error"; // Failed to activate

/**
 * Loaded plugin instance
 */
export interface PluginInstance {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Current state */
  state: PluginState;
  /** Error message if state is 'error' */
  error?: string;
  /** Plugin context (API provided to plugin) */
  context?: PluginContext;
  /** Plugin module exports */
  module?: PluginModule;
  /** Installation path */
  path: string;
}

// ============== Plugin Module ==============

/**
 * Command definition
 */
export interface Command {
  id: string;
  title: string;
  icon?: string;
  handler: (...args: unknown[]) => void | Promise<void>;
}

/**
 * Toolbar button definition
 */
export interface ToolbarButton {
  id: string;
  icon: string;
  tooltip: string;
  onClick: () => void | Promise<void>;
}

/**
 * Settings panel definition
 */
export interface SettingsPanel {
  id: string;
  title: string;
  icon?: string;
  render: (container: HTMLElement) => void;
  onSave?: () => void | Promise<void>;
}

/**
 * Message handler for hooks
 */
export type MessageHandler = (
  message: Message
) => Message | null | Promise<Message | null>;

/**
 * Disposable resource
 */
export interface Disposable {
  dispose: () => void;
}

/**
 * Plugin module interface (main.js exports)
 */
export interface PluginModule {
  /**
   * Called when plugin is activated
   * @param context Plugin context with APIs
   */
  activate: (context: PluginContext) => void | Promise<void>;

  /**
   * Called when plugin is deactivated
   */
  deactivate?: () => void | Promise<void>;
}

// ============== Plugin Context API ==============

/**
 * Plugin storage API
 */
export interface PluginStorage {
  /** Get a value from storage */
  get: <T>(key: string) => T | null;
  /** Set a value in storage */
  set: <T>(key: string, value: T) => void;
  /** Delete a value from storage */
  delete: (key: string) => void;
  /** Clear all plugin storage */
  clear: () => void;
  /** Get all keys */
  keys: () => string[];
}

/**
 * Plugin API access (requires 'api' permission)
 */
export interface PluginAPI {
  /** Get all sessions */
  getSessions: () => Promise<Session[]>;
  /** Get a session by ID */
  getSession: (id: string) => Promise<Session | null>;
  /** Get messages for a session */
  getMessages: (sessionId: string) => Promise<Message[]>;
  /** Send a message */
  sendMessage: (sessionId: string, content: string) => Promise<void>;
}

/**
 * Plugin context - API provided to plugins
 */
export interface PluginContext {
  // ============== Metadata ==============
  /** Plugin ID */
  readonly id: string;
  /** Plugin version */
  readonly version: string;

  // ============== Commands ==============
  /** Register a command */
  registerCommand: (command: Command) => Disposable;
  /** Execute a command by ID */
  executeCommand: (id: string, ...args: unknown[]) => void | Promise<void>;

  // ============== Hooks ==============
  /** Hook called before a message is sent */
  onBeforeSend: (handler: MessageHandler) => Disposable;
  /** Hook called after a message is received */
  onAfterReceive: (handler: MessageHandler) => Disposable;

  // ============== UI ==============
  /** Add a toolbar button */
  addToolbarButton: (button: ToolbarButton) => Disposable;
  /** Add a settings panel */
  addSettingsPanel: (panel: SettingsPanel) => Disposable;
  /** Show a notification toast */
  showNotification: (
    message: string,
    type?: "info" | "success" | "error" | "warning"
  ) => void;

  // ============== Storage (requires 'storage' permission) ==============
  /** Plugin persistent storage */
  readonly storage: PluginStorage;

  // ============== API (requires 'api' permission) ==============
  /** HuluChat API access */
  readonly api: PluginAPI;

  // ============== Clipboard (requires 'clipboard' permission) ==============
  /** Read clipboard text */
  readClipboard?: () => Promise<string>;
  /** Write to clipboard */
  writeClipboard?: (text: string) => Promise<void>;

  // ============== Network (requires 'network' permission) ==============
  /** Make HTTP requests */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;

  // ============== Lifecycle ==============
  /** Register a cleanup function */
  onDispose: (callback: () => void) => void;
}

// ============== Plugin Manager Events ==============

/**
 * Plugin manager event types
 */
export type PluginManagerEvent =
  | "plugin:loaded"
  | "plugin:activated"
  | "plugin:deactivated"
  | "plugin:unloaded"
  | "plugin:error";

/**
 * Plugin manager event handler
 */
export type PluginManagerEventHandler = (
  event: PluginManagerEvent,
  plugin: PluginInstance
) => void;

// ============== Plugin Hook Types (TASK-329) ==============

/**
 * Hook execution result
 */
export interface HookResult {
  /** Whether the hook execution was successful */
  success: boolean;
  /** The processed message (null if cancelled) */
  message: Message | null;
  /** Error message if execution failed */
  error?: string;
  /** Whether the hook timed out */
  timedOut?: boolean;
  /** Which handler failed (for error reporting) */
  failedHandler?: string;
}

/**
 * Hook execution options
 */
export interface HookOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Whether to continue on error (default: true) */
  continueOnError?: boolean;
  /** Whether to validate return values (default: true) */
  validateReturn?: boolean;
}

// ============== Plugin Manager Interface ==============

/**
 * Plugin manager - manages all plugins
 */
export interface PluginManager {
  // ============== Discovery ==============
  /** Get all discovered plugins */
  getPlugins: () => PluginInstance[];
  /** Get a specific plugin */
  getPlugin: (id: string) => PluginInstance | undefined;

  // ============== Lifecycle ==============
  /** Load a plugin from directory */
  loadPlugin: (path: string) => Promise<PluginInstance>;
  /** Unload a plugin */
  unloadPlugin: (id: string) => Promise<void>;
  /** Activate a plugin */
  activatePlugin: (id: string) => Promise<void>;
  /** Deactivate a plugin */
  deactivatePlugin: (id: string) => Promise<void>;

  // ============== Installation ==============
  /** Install a plugin from a directory path */
  installPlugin: (sourcePath: string) => Promise<PluginInstance>;
  /** Uninstall a plugin (removes from disk) */
  uninstallPlugin: (id: string) => Promise<void>;

  // ============== Commands ==============
  /** Get all registered commands */
  getCommands: () => Command[];
  /** Execute a command */
  executeCommand: (id: string, ...args: unknown[]) => void | Promise<void>;

  // ============== Hooks (Sync - Legacy) ==============
  /** Process message through beforeSend hooks (synchronous, skips async handlers) */
  processBeforeSend: (message: Message) => Message;
  /** Process message through afterReceive hooks (synchronous, skips async handlers) */
  processAfterReceive: (message: Message) => Message;

  // ============== Hooks (Async - TASK-329) ==============
  /**
   * Process message through beforeSend hooks asynchronously
   * Includes timeout protection (5s), error isolation, and return value validation
   * @param message The message to process
   * @param options Hook execution options
   * @returns Hook execution result
   */
  processBeforeSendAsync: (message: Message, options?: HookOptions) => Promise<HookResult>;
  /**
   * Process message through afterReceive hooks asynchronously
   * Includes timeout protection (5s), error isolation, and return value validation
   * @param message The message to process
   * @param options Hook execution options
   * @returns Hook execution result
   */
  processAfterReceiveAsync: (message: Message, options?: HookOptions) => Promise<HookResult>;

  // ============== Events ==============
  /** Subscribe to plugin events */
  on: (handler: PluginManagerEventHandler) => Disposable;

  // ============== Storage ==============
  /** Get plugin storage */
  getPluginStorage: (pluginId: string) => PluginStorage;

  // ============== Updates ==============
  /** Check for updates for a specific plugin */
  checkForUpdate: (id: string) => Promise<PluginUpdateInfo | null>;
  /** Check for updates for all plugins */
  checkForAllUpdates: () => Promise<Map<string, PluginUpdateInfo>>;
  /** Update a plugin to the latest version */
  updatePlugin: (id: string) => Promise<void>;

  // ============== Network Logs (TASK-330) ==============
  /**
   * Get network request logs for a plugin
   * @param pluginId Plugin ID (optional, returns all if not specified)
   */
  getNetworkLogs: (pluginId?: string) => NetworkRequestLog[];
  /** Clear network request logs */
  clearNetworkLogs: (pluginId?: string) => void;
  /** Subscribe to network request logs */
  onNetworkLog: (listener: (log: NetworkRequestLog) => void) => Disposable;
}

// ============== Network Log Types (TASK-330) ==============

/**
 * Network request log entry
 */
export interface NetworkRequestLog {
  /** Unique request ID */
  id: string;
  /** Plugin ID that made the request */
  pluginId: string;
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request timestamp */
  timestamp: number;
  /** Response status code (if completed) */
  status?: number;
  /** Error message (if failed) */
  error?: string;
  /** Request duration in ms */
  duration?: number;
  /** Whether request was blocked */
  blocked?: boolean;
  /** Block reason */
  blockReason?: string;
}

// ============== Utility Types ==============

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  success: boolean;
  plugin?: PluginInstance;
  error?: string;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============== Plugin Update Types ==============

/**
 * Plugin update check result
 */
export interface PluginUpdateInfo {
  /** Plugin ID */
  id: string;
  /** Current installed version */
  currentVersion: string;
  /** Latest available version */
  latestVersion: string;
  /** Whether an update is available */
  hasUpdate: boolean;
  /** Release notes for the update */
  releaseNotes?: string;
  /** Download URL for the update */
  downloadUrl?: string;
  /** Update manifest from remote */
  manifest?: PluginManifest;
}

/**
 * Plugin update state for UI
 */
export type PluginUpdateState =
  | "idle" // No update check done
  | "checking" // Currently checking for updates
  | "available" // Update available
  | "downloading" // Downloading update
  | "installing" // Installing update
  | "updated" // Successfully updated
  | "error"; // Update failed
