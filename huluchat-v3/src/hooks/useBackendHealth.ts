/**
 * useBackendHealth Hook
 * Monitors backend health status and provides automatic recovery
 *
 * Privacy-first: Only checks current status, no usage tracking
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { healthCheck } from "@/api/client";

export type BackendStatus = "healthy" | "degraded" | "offline" | "checking";

export interface BackendHealthState {
  status: BackendStatus;
  lastChecked: Date | null;
  consecutiveFailures: number;
  version: string | null;
  isRecovering: boolean;
}

export interface UseBackendHealthOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Number of consecutive failures before marking as offline (default: 3) */
  failureThreshold?: number;
  /** Whether to enable polling (default: true) */
  enabled?: boolean;
  /** Callback when backend goes offline */
  onOffline?: () => void;
  /** Callback when backend recovers */
  onRecover?: () => void;
}

const DEFAULT_INTERVAL = 30000; // 30 seconds
const DEFAULT_FAILURE_THRESHOLD = 3;

/**
 * Hook to monitor backend health status
 *
 * Features:
 * - Periodic health checks via polling
 * - Graceful degradation detection
 * - Automatic recovery detection
 * - No data collection (privacy-first)
 */
export function useBackendHealth(options: UseBackendHealthOptions = {}) {
  const {
    interval = DEFAULT_INTERVAL,
    failureThreshold = DEFAULT_FAILURE_THRESHOLD,
    enabled = true,
    onOffline,
    onRecover,
  } = options;

  const [state, setState] = useState<BackendHealthState>({
    status: "checking",
    lastChecked: null,
    consecutiveFailures: 0,
    version: null,
    isRecovering: false,
  });

  // Use refs to track state for callbacks without causing re-renders
  const wasOffline = useRef(false);
  const isChecking = useRef(false);
  const currentStatusRef = useRef<BackendStatus>("checking");
  const consecutiveFailuresRef = useRef(0);

  const checkHealth = useCallback(async () => {
    // Prevent concurrent checks
    if (isChecking.current) return;
    isChecking.current = true;

    // Capture previous status before update
    const previousStatus = currentStatusRef.current;

    try {
      const result = await healthCheck();
      const now = new Date();

      // Reset failures on success
      consecutiveFailuresRef.current = 0;
      currentStatusRef.current = "healthy";

      setState({
        status: "healthy",
        lastChecked: now,
        consecutiveFailures: 0,
        version: result.version,
        isRecovering: false,
      });

      // Trigger recovery callback if was offline/degraded and now healthy
      if ((previousStatus === "offline" || previousStatus === "degraded") && onRecover) {
        onRecover();
      }

      wasOffline.current = false;
    } catch (error) {
      const now = new Date();

      // Increment failures
      consecutiveFailuresRef.current += 1;
      const newFailures = consecutiveFailuresRef.current;

      let newStatus: BackendStatus;
      if (newFailures >= failureThreshold) {
        newStatus = "offline";
      } else if (newFailures > 0) {
        newStatus = "degraded";
      } else {
        newStatus = "healthy";
      }

      currentStatusRef.current = newStatus;

      setState({
        status: newStatus,
        lastChecked: now,
        consecutiveFailures: newFailures,
        version: null,
        isRecovering: false,
      });

      // Trigger offline callback once when transitioning to offline
      if (!wasOffline.current && newStatus === "offline" && onOffline) {
        wasOffline.current = true;
        onOffline();
      }
    } finally {
      isChecking.current = false;
    }
  }, [failureThreshold, onOffline, onRecover]);

  // Manual recovery trigger (for user-initiated retry)
  const triggerRecovery = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isRecovering: true,
    }));

    await checkHealth();
  }, [checkHealth]);

  // Initial check and periodic polling
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkHealth();

    // Set up polling
    const intervalId = setInterval(checkHealth, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, checkHealth]);

  return {
    ...state,
    triggerRecovery,
    checkHealth,
  };
}
