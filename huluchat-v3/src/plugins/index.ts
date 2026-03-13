/**
 * HuluChat Plugin System
 * @module plugins
 */

export type {
  // Manifest types
  PluginPermission,
  CommandContribution,
  PluginContributes,
  PluginManifest,

  // Instance types
  PluginState,
  PluginInstance,

  // Module types
  Command,
  ToolbarButton,
  SettingsPanel,
  MessageHandler,
  Disposable,
  PluginModule,

  // Context types
  PluginStorage,
  PluginAPI,
  PluginContext,

  // Manager types
  PluginManagerEvent,
  PluginManagerEventHandler,
  PluginManager,

  // Update types
  PluginUpdateInfo,
  PluginUpdateState,

  // Utility types
  PluginInstallResult,
  PluginValidationResult,
} from "./types";

export {
  getPluginManager,
  initializePluginSystem,
  PluginManagerImpl,
} from "./manager";

// Registry exports
export type {
  PluginCategory,
  PluginBadge,
  PluginRegistryEntry,
} from "./registry";

export {
  OFFICIAL_PLUGIN_REGISTRY,
  getAvailablePlugins,
  getPluginsByCategory,
  searchPlugins,
  getPluginById,
  getCategories,
  getFeaturedPlugins,
  sortPlugins,
  getPermissionInfo,
  getCategoryInfo,
} from "./registry";
