/**
 * useAccessibilityPermission Hook
 *
 * Detects and manages macOS accessibility permissions required for global shortcuts.
 *
 * PRIVACY: Permission state is only stored locally, no data sent to servers
 *
 * Platform behavior:
 * - macOS: Requires Accessibility permission for global shortcuts
 * - Windows/Linux: No additional permission needed
 */
import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Storage key for dismissed permission guide
 */
const PERMISSION_GUIDE_DISMISSED_KEY = "huluchat-permission-guide-dismissed";

/**
 * Permission status type
 */
export type PermissionStatus = "checking" | "granted" | "denied";

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
 * Hook return type
 */
export interface UseAccessibilityPermissionResult {
  /** Current permission status */
  status: PermissionStatus;
  /** Whether the permission guide dialog should be shown */
  showGuide: boolean;
  /** Whether the user has permanently dismissed the guide */
  isDismissed: boolean;
  /** Open system accessibility settings (macOS only) */
  openSettings: () => Promise<void>;
  /** Re-check permission status */
  checkPermission: () => Promise<void>;
  /** Dismiss the permission guide for this session */
  dismissGuide: () => void;
  /** Alias for dismissPermanently - dismiss the permission guide permanently */
  dismissPermanently: () => void;
  /** Reset the permanently dismissed state */
  resetDismissed: () => void;
  /** Whether the current platform requires accessibility permission */
  platformRequiresPermission: boolean;
}

/**
 * Hook for managing macOS accessibility permissions
 *
 * On macOS, global shortcuts require Accessibility permission to work when
 * the app is not focused. This hook detects the permission state and provides
 * UI guidance for users to enable it.
 *
 * @param options Configuration options
 * @returns Permission state and control functions
 */
export function useAccessibilityPermission(options?: {
  /** Whether to auto-check on mount (default: true) */
  autoCheck?: boolean;
  /** Interval for periodic permission checks in ms (default: 5000) */
  checkInterval?: number;
}): UseAccessibilityPermissionResult {
  const { autoCheck = true, checkInterval = 5000 } = options || {};

  const [status, setStatus] = useState<PermissionStatus>("checking");
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(PERMISSION_GUIDE_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const platformRequiresPermission = isMacOSPlatform();

  /**
   * Check the current accessibility permission status
   */
  const checkPermission = useCallback(async () => {
    // Skip on non-macOS platforms
    if (!platformRequiresPermission) {
      setStatus("granted");
      return;
    }

    // Skip if Tauri is not available (e.g., in browser during development)
    if (!isTauriAvailable()) {
      // In browser, assume permission is granted
      setStatus("granted");
      return;
    }

    try {
      const hasPermission = await invoke<boolean>("check_accessibility_permission");
      setStatus(hasPermission ? "granted" : "denied");
    } catch (error) {
      console.error("Failed to check accessibility permission:", error);
      // On error, assume denied to be safe
      setStatus("denied");
    }
  }, [platformRequiresPermission]);

  /**
   * Open macOS System Settings to Accessibility panel
   */
  const openSettings = useCallback(async () => {
    if (!isTauriAvailable()) {
      console.warn("Tauri not available, cannot open system settings");
      return;
    }

    try {
      await invoke("open_accessibility_settings");
    } catch (error) {
      console.error("Failed to open accessibility settings:", error);
      throw error;
    }
  }, []);

  /**
   * Dismiss the permission guide for this session
   */
  const dismissGuide = useCallback(() => {
    setIsDismissed(true);
  }, []);

  /**
   * Permanently dismiss the permission guide
   */
  const dismissPermanently = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(PERMISSION_GUIDE_DISMISSED_KEY, "true");
    } catch (error) {
      console.error("Failed to save dismissed state:", error);
    }
  }, []);

  /**
   * Reset the permanently dismissed state
   */
  const resetDismissed = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(PERMISSION_GUIDE_DISMISSED_KEY);
    } catch (error) {
      console.error("Failed to reset dismissed state:", error);
    }
  }, []);

  // Initial permission check
  useEffect(() => {
    if (autoCheck) {
      checkPermission();
    }
  }, [autoCheck, checkPermission]);

  // Periodic permission check (to detect when user grants permission)
  useEffect(() => {
    if (!platformRequiresPermission || !autoCheck || status === "granted") {
      return;
    }

    const interval = setInterval(checkPermission, checkInterval);
    return () => clearInterval(interval);
  }, [platformRequiresPermission, autoCheck, status, checkPermission, checkInterval]);

  // Determine if guide should be shown
  const showGuide = platformRequiresPermission && status === "denied" && !isDismissed;

  return {
    status,
    showGuide,
    isDismissed,
    openSettings,
    checkPermission,
    dismissGuide,
    dismissPermanently,
    resetDismissed,
    platformRequiresPermission,
  };
}

export default useAccessibilityPermission;
