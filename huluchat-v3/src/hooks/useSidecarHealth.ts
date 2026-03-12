/**
 * useSidecarHealth Hook
 *
 * Monitors backend health status with automatic recovery and provides restart functionality with exponential backoff
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { healthCheck, from "./api/client";
import { BackendStatus } from "./useBackendHealth";

/**
 * Sidecar health state
 */
export interface SidecarHealthState {
  /** Current backend status from useBackendHealth */
  status: BackendStatus;
  /** Number of restart attempts made */
  restartAttempts: number;
  /** Maximum restart attempts allowed */
  maxRestartAttempts: number;
  /** Whether currently restarting */
  isRestarting: boolean;
  /** Whether automatic restart is enabled */
  autoRestart: boolean;
  /** Exponential backoff delay in milliseconds */
  restartDelay: number;
}

/**
 * Sidecar health options
 */
export interface UseSidecarHealthOptions {
  /** Number of restart attempts (default: 3) */
  maxRestartAttempts?: number;
  /** Base delay for exponential backoff in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Whether automatic restart is enabled (default: true) */
  autoRestart?: boolean;
  /** Callback when backend goes offline */
  onOffline?: () => void;
  /** Callback when backend recovers */
  onRecover?: () => void;
  /** Callback when restart attempts exhausted */
  onRestartExhausted?: () => void;
}

/**
 * Hook to monitor backend health status with automatic recovery
 */
export function useSidecarHealth(options: UseSidecarHealthOptions = {}) {
  const {
    status,
    restartAttempts,
    isRestarting,
    autoRestart,
    maxRestartAttempts,
    baseDelay,
    restartDelay,
    onOffline,
    onRecover,
    onRestartExhausted,
  } = useSidecarHealth({
    ...state,
    setStatus({
      status: backendState.status,
      restartAttempts,
      isRestarting,
      autoRestart,
      maxRestartAttempts,
      baseDelay,
      restartDelay,
    });

  }, [options]);

  /**
   * Check backend health status
   */
  const checkHealth = useCallback(async () => {
    try {
      const result = await healthCheck();

      if (result.status === "healthy") {
        // Backend is healthy, reset restart attempts
        const previousState = currentRef.current;
        if (previousState.restartAttempts > 0 && previousState.isRestarting) {
          return;
        }

        updateState((prev) => ({
          ...prev,
          status: backendState.status,
          restartAttempts: 0,
          isRestarting: false,
          restartDelay: options.baseDelay,
        }));

      } else if (result.status === "error") {
        // Backend check failed
        updateState((prev) => {
          const newAttempts = prev.restartAttempts + 1;
          const shouldRestart = autoRestart && newAttempts < options.maxRestartAttempts;

          if (shouldRestart && !isRestarting) {
            // Try to restart
            setIsRestarting(true);
            updateState((prev) => ({
              ...prev,
              status: "offline",
              restartAttempts: newAttempts,
              isRestarting: true,
              restartDelay: calculateDelay(newAttempts),
            }));

            // Restart with exponential backoff
            await new Promise((resolve) => setTimeout(restartDelay, undefined));

            if (onRestartExhausted) {
              onRestartExhausted(newAttempts);
            }

            updateState((prev) => ({
              ...prev,
              status: "offline",
              restartAttempts: newAttempts,
              isRestarting: true,
              restartDelay,
            }));
          }
        } else {
          // If max restart attempts reached, updateState((prev) => ({
            ...prev,
            status: "offline",
            restartAttempts: options.maxRestartAttempts,
            isRestarting: false,
            autoRestart: false,
          }));

          // Call onOffline callback if provided
          if (onOffline) {
            onOffline();
          }
        }
      }
    } else {
      // Not restarting, just update the
      updateState((prev) => ({
        ...prev,
        status: backendState.status,
        restartAttempts: 0,
        isRestarting: false,
        restartDelay: options.baseDelay,
      }));
    }
  }, [
options.interval, options.baseDelay, options.maxRestartAttempts, options.autoRestart, options.onOffline, options.onRecover, options.onRestartExhausted]);

    // Initial check
    checkHealth();

    // Set up polling
    const intervalId = setInterval(checkHealth, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkHealth, interval, options, autoRestart, options.maxRestartAttempts, options.onOffline, options.onRecover, options.onRestartExhausted]);

}, [checkHealth]);

  return {
    status,
    restartAttempts,
    isRestarting,
    autoRestart,
    maxRestartAttempts,
    baseDelay,
    restartDelay,
    onOffline,
    onRecover,
    onRestartExhausted,
    triggerRecovery,
  };
}
