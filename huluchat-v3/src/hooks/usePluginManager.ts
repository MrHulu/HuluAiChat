/**
 * Plugin Manager Hook
 * Provides access to the plugin system from React components
 * @module hooks/usePluginManager
 */

import { useState, useEffect, useCallback } from "react";
import {
  initializePluginSystem,
  type PluginInstance,
  type PluginManager,
  type PluginManagerEvent,
  type PluginUpdateInfo,
} from "@/plugins";

export interface UsePluginManagerReturn {
  /** Plugin manager instance */
  manager: PluginManager | null;
  /** All discovered plugins */
  plugins: PluginInstance[];
  /** Is the plugin system initialized */
  isInitialized: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Activate a plugin */
  activatePlugin: (id: string) => Promise<void>;
  /** Deactivate a plugin */
  deactivatePlugin: (id: string) => Promise<void>;
  /** Install a plugin from directory path */
  installPlugin: (sourcePath: string) => Promise<void>;
  /** Uninstall a plugin */
  uninstallPlugin: (id: string) => Promise<void>;
  /** Refresh plugin list */
  refreshPlugins: () => void;
  /** Check for updates for a specific plugin */
  checkForUpdate: (id: string) => Promise<PluginUpdateInfo | null>;
  /** Check for updates for all plugins */
  checkForAllUpdates: () => Promise<Map<string, PluginUpdateInfo>>;
  /** Update a plugin to the latest version */
  updatePlugin: (id: string) => Promise<void>;
}

/**
 * Hook to access the plugin manager
 */
export function usePluginManager(): UsePluginManagerReturn {
  const [manager, setManager] = useState<PluginManager | null>(null);
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize plugin system on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const pm = await initializePluginSystem();
        if (mounted) {
          setManager(pm);
          setPlugins(pm.getPlugins());
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize plugin system");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to plugin events
  useEffect(() => {
    if (!manager) return;

    const handlePluginEvent = (
      _event: PluginManagerEvent,
      _plugin: PluginInstance
    ) => {
      // Refresh plugin list on any event
      setPlugins(manager.getPlugins());
    };

    const disposable = manager.on(handlePluginEvent);
    return () => disposable.dispose();
  }, [manager]);

  const activatePlugin = useCallback(
    async (id: string) => {
      if (!manager) throw new Error("Plugin manager not initialized");
      await manager.activatePlugin(id);
      setPlugins(manager.getPlugins());
    },
    [manager]
  );

  const deactivatePlugin = useCallback(
    async (id: string) => {
      if (!manager) throw new Error("Plugin manager not initialized");
      await manager.deactivatePlugin(id);
      setPlugins(manager.getPlugins());
    },
    [manager]
  );

  const installPlugin = useCallback(
    async (sourcePath: string) => {
      if (!manager) throw new Error("Plugin manager not initialized");
      await manager.installPlugin(sourcePath);
      setPlugins(manager.getPlugins());
    },
    [manager]
  );

  const uninstallPlugin = useCallback(
    async (id: string) => {
      if (!manager) throw new Error("Plugin manager not initialized");
      await manager.uninstallPlugin(id);
      setPlugins(manager.getPlugins());
    },
    [manager]
  );

  const refreshPlugins = useCallback(() => {
    if (manager) {
      setPlugins(manager.getPlugins());
    }
  }, [manager]);

  const checkForUpdate = useCallback(
    async (id: string): Promise<PluginUpdateInfo | null> => {
      if (!manager) throw new Error("Plugin manager not initialized");
      return manager.checkForUpdate(id);
    },
    [manager]
  );

  const checkForAllUpdates = useCallback(async (): Promise<Map<string, PluginUpdateInfo>> => {
    if (!manager) throw new Error("Plugin manager not initialized");
    return manager.checkForAllUpdates();
  }, [manager]);

  const updatePlugin = useCallback(
    async (id: string) => {
      if (!manager) throw new Error("Plugin manager not initialized");
      await manager.updatePlugin(id);
      setPlugins(manager.getPlugins());
    },
    [manager]
  );

  return {
    manager,
    plugins,
    isInitialized,
    isLoading,
    error,
    activatePlugin,
    deactivatePlugin,
    installPlugin,
    uninstallPlugin,
    refreshPlugins,
    checkForUpdate,
    checkForAllUpdates,
    updatePlugin,
  };
}

// Re-export types for convenience
export type { PluginInstance, PluginState } from "@/plugins";
