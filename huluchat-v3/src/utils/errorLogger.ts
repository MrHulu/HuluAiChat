/**
 * Error Logger Utility
 * Records errors locally (no telemetry, privacy-first)
 */

interface ErrorLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

const ERROR_LOG_KEY = "huluchat-error-log";
const MAX_LOG_ENTRIES = 50; // Keep last 50 errors

/**
 * Log an error to local storage
 * Does NOT send any data to external servers
 */
export function logError(
  error: Error,
  componentStack?: string
): void {
  try {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Get existing logs
    const existingLogs = getErrorLogs();

    // Add new entry at the beginning
    const updatedLogs = [entry, ...existingLogs].slice(0, MAX_LOG_ENTRIES);

    // Save to localStorage
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    // If localStorage fails, just console.error
    console.error("Failed to log error:", e);
  }
}

/**
 * Get all error logs from local storage
 */
export function getErrorLogs(): ErrorLogEntry[] {
  try {
    const logs = localStorage.getItem(ERROR_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all error logs
 */
export function clearErrorLogs(): void {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch (e) {
    console.error("Failed to clear error logs:", e);
  }
}

/**
 * Export error logs as JSON string (for user to download)
 */
export function exportErrorLogs(): string {
  const logs = getErrorLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Get error summary for display
 */
export function getErrorSummary(): {
  total: number;
  lastError: ErrorLogEntry | null;
  recentCount: number; // Last 24 hours
} {
  const logs = getErrorLogs();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const recentCount = logs.filter(
    (log) => new Date(log.timestamp).getTime() > oneDayAgo
  ).length;

  return {
    total: logs.length,
    lastError: logs[0] || null,
    recentCount,
  };
}
