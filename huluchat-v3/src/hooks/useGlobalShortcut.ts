/**
 * useGlobalShortcut Hook
 * System-wide keyboard shortcuts that work even when the app is not focused
 *
 * PRIVACY: All shortcut preferences stored locally, no data sent to servers
 *
 * Uses Tauri global-shortcut plugin for native system integration
 */
import { useEffect, useCallback, useState, useRef } from "react";
import {
  register,
  unregister,
  isRegistered,
} from "@tauri-apps/plugin-global-shortcut";

/**
 * Global shortcut configuration
 */
export interface GlobalShortcutConfig {
  /** Unique identifier for the shortcut */
  id: string;
  /** Shortcut string (e.g., "CommandOrControl+Shift+Space") */
  shortcut: string;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Description for display purposes */
  description?: string;
}

/**
 * Default global shortcut for quick summon
 * - Windows/Linux: Ctrl+Shift+Space
 * - macOS: Cmd+Shift+Space
 */
export const DEFAULT_GLOBAL_SHORTCUT = "CommandOrControl+Shift+Space";

/**
 * Storage key for custom global shortcut
 */
const STORAGE_KEY = "huluchat_global_shortcut";

/**
 * Platform-specific shortcut formatting
 */
export function formatGlobalShortcut(shortcut: string, isMac: boolean): string {
  return shortcut
    .replace("CommandOrControl", isMac ? "Cmd" : "Ctrl")
    .replace(/\+/g, isMac ? " " : "+");
}

/**
 * Check if running on macOS
 */
function isMacOSPlatform(): boolean {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Detect if Tauri APIs are available
 */
function isTauriAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Hook for managing global keyboard shortcuts
 *
 * @param config - Shortcut configuration
 * @param options - Additional options
 */
export function useGlobalShortcut(
  config: GlobalShortcutConfig,
  options: {
    /** Whether the shortcut is enabled */
    enabled?: boolean;
    /** Callback when shortcut registration fails */
    onError?: (error: Error) => void;
  } = {}
): {
  /** Whether the shortcut is currently registered */
  isRegistered: boolean;
  /** Error if registration failed */
  error: Error | null;
  /** Manually register the shortcut */
  registerShortcut: () => Promise<void>;
  /** Manually unregister the shortcut */
  unregisterShortcut: () => Promise<void>;
  /** Update the shortcut key combination */
  updateShortcut: (shortcut: string) => Promise<void>;
  /** Current shortcut string */
  currentShortcut: string;
  /** Check if shortcut is registered */
  checkRegistration: () => Promise<boolean>;
} {
  const { enabled = true, onError } = options;

  const [isRegisteredState, setIsRegisteredState] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentShortcut, setCurrentShortcut] = useState(() => {
    // Load custom shortcut from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch (e) {
      console.error("Failed to load global shortcut:", e);
    }
    return config.shortcut || DEFAULT_GLOBAL_SHORTCUT;
  });

  // Keep track of registered shortcut to avoid re-registering
  const registeredShortcutRef = useRef<string | null>(null);
  const handlerRef = useRef(config.handler);

  // Update handler ref when config changes
  useEffect(() => {
    handlerRef.current = config.handler;
  }, [config.handler]);

  /**
   * Register the global shortcut
   */
  const registerShortcut = useCallback(async () => {
    if (!isTauriAvailable()) {
      console.warn("Tauri not available, skipping global shortcut registration");
      return;
    }

    try {
      // Check if already registered with the same shortcut
      if (registeredShortcutRef.current === currentShortcut) {
        return;
      }

      // Unregister previous shortcut if different
      if (registeredShortcutRef.current && registeredShortcutRef.current !== currentShortcut) {
        await unregister(registeredShortcutRef.current);
        setIsRegisteredState(false);
      }

      // Register new shortcut
      await register(currentShortcut, () => {
        handlerRef.current();
      });

      registeredShortcutRef.current = currentShortcut;
      setIsRegisteredState(true);
      setError(null);

      console.log(`Global shortcut registered: ${currentShortcut}`);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("Failed to register global shortcut:", err);
      setError(err);
      setIsRegisteredState(false);
      onError?.(err);
    }
  }, [currentShortcut, onError]);

  /**
   * Unregister the global shortcut
   */
  const unregisterShortcut = useCallback(async () => {
    if (!isTauriAvailable()) {
      return;
    }

    try {
      if (registeredShortcutRef.current) {
        await unregister(registeredShortcutRef.current);
        registeredShortcutRef.current = null;
        setIsRegisteredState(false);
        console.log("Global shortcut unregistered");
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("Failed to unregister global shortcut:", err);
      setError(err);
    }
  }, []);

  /**
   * Update the shortcut key combination
   */
  const updateShortcut = useCallback(async (shortcut: string) => {
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, shortcut);
    } catch (e) {
      console.error("Failed to save global shortcut:", e);
    }

    // Update state and trigger re-registration
    setCurrentShortcut(shortcut);
  }, []);

  /**
   * Check registration status
   */
  const checkRegistration = useCallback(async () => {
    if (!isTauriAvailable()) {
      return false;
    }

    try {
      const registered = await isRegistered(currentShortcut);
      setIsRegisteredState(registered);
      return registered;
    } catch (e) {
      console.error("Failed to check shortcut registration:", e);
      return false;
    }
  }, [currentShortcut]);

  // Register on mount and when enabled/shortcut changes
  useEffect(() => {
    if (enabled) {
      registerShortcut();
    } else {
      unregisterShortcut();
    }

    // Cleanup on unmount
    return () => {
      unregisterShortcut();
    };
  }, [enabled, registerShortcut, unregisterShortcut]);

  return {
    isRegistered: isRegisteredState,
    error,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    currentShortcut,
    checkRegistration,
  };
}

/**
 * Check if a shortcut conflicts with common system shortcuts
 */
export function checkSystemShortcutConflicts(shortcut: string): string[] {
  const conflicts: string[] = [];

  // Common Windows shortcuts
  const windowsShortcuts = [
    "Ctrl+Alt+Del",
    "Ctrl+Shift+Esc",
    "Alt+Tab",
    "Alt+F4",
    "Win+D",
    "Win+E",
    "Win+L",
    "Win+R",
  ];

  // Common macOS shortcuts
  const macShortcuts = [
    "Cmd+Q",
    "Cmd+W",
    "Cmd+Tab",
    "Cmd+Space",
    "Cmd+Option+Esc",
  ];

  const isMac = isMacOSPlatform();
  const checkList = isMac ? macShortcuts : windowsShortcuts;

  // Normalize shortcut for comparison
  const normalizedShortcut = shortcut
    .replace("CommandOrControl", isMac ? "Cmd" : "Ctrl")
    .toLowerCase();

  for (const sysShortcut of checkList) {
    if (normalizedShortcut === sysShortcut.toLowerCase()) {
      conflicts.push(sysShortcut);
    }
  }

  return conflicts;
}

/**
 * Validate a shortcut string
 */
export function validateShortcut(shortcut: string): {
  valid: boolean;
  error?: string;
} {
  if (!shortcut || shortcut.trim() === "") {
    return { valid: false, error: "Shortcut cannot be empty" };
  }

  // Check basic format
  const parts = shortcut.split("+");
  if (parts.length < 2) {
    return {
      valid: false,
      error: "Shortcut must include at least one modifier key",
    };
  }

  // Check for valid modifiers
  const validModifiers = [
    "CommandOrControl",
    "Ctrl",
    "Cmd",
    "Alt",
    "Option",
    "Shift",
    "Super",
    "Meta",
  ];

  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) {
      return {
        valid: false,
        error: `Invalid modifier: ${modifier}`,
      };
    }
  }

  // Check key is not empty
  if (!key || key.trim() === "") {
    return { valid: false, error: "Shortcut must include a key" };
  }

  return { valid: true };
}

export default useGlobalShortcut;
