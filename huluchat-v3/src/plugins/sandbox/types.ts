/**
 * Plugin Sandbox Types
 * Security-first plugin execution environment
 * @module plugins/sandbox/types
 */

import type { PluginPermission } from "../types";

// ============== Network Security ==============

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

/**
 * Network permission configuration
 */
export interface NetworkPermission {
  /** Allowed domains (exact match or wildcard) */
  allowedDomains: string[];
  /** Rate limit: requests per minute */
  rateLimit?: number;
  /** Max request timeout in ms */
  timeout?: number;
}

// ============== Sandbox Communication ==============

/**
 * Sandbox message types (main thread -> worker)
 */
export type SandboxMessageType =
  | "init" // Initialize sandbox with plugin code
  | "activate" // Call activate on plugin
  | "deactivate" // Call deactivate on plugin
  | "invoke" // Invoke a method on plugin context
  | "storage.get" // Storage operation
  | "storage.set"
  | "storage.delete"
  | "storage.clear"
  | "storage.keys"
  | "api.fetch" // Network request
  | "api.getSessions"
  | "api.getSession"
  | "api.getMessages"
  | "api.sendMessage"
  | "clipboard.read"
  | "clipboard.write"
  | "command.register"
  | "command.execute"
  | "hook.register"
  | "hook.process"
  | "notification.show"
  | "dispose"; // Clean up sandbox

/**
 * Base sandbox message
 */
export interface SandboxMessageBase {
  /** Message ID for correlation */
  id: string;
  /** Message type */
  type: SandboxMessageType;
  /** Plugin ID */
  pluginId: string;
}

/**
 * Init message - loads plugin code into sandbox
 */
export interface SandboxInitMessage extends SandboxMessageBase {
  type: "init";
  /** Plugin JavaScript code */
  code: string;
  /** Plugin manifest */
  manifest: {
    id: string;
    version: string;
    permissions: PluginPermission[];
    allowedDomains?: string[];
  };
}

/**
 * Activate message - calls plugin activate function
 */
export interface SandboxActivateMessage extends SandboxMessageBase {
  type: "activate";
}

/**
 * Deactivate message - calls plugin deactivate function
 */
export interface SandboxDeactivateMessage extends SandboxMessageBase {
  type: "deactivate";
}

/**
 * Storage operation message
 */
export interface SandboxStorageMessage extends SandboxMessageBase {
  type: "storage.get" | "storage.set" | "storage.delete" | "storage.clear" | "storage.keys";
  /** Storage key (for get/set/delete) */
  key?: string;
  /** Storage value (for set) */
  value?: unknown;
}

/**
 * Fetch message - network request
 */
export interface SandboxFetchMessage extends SandboxMessageBase {
  type: "api.fetch";
  /** Request URL */
  url: string;
  /** Fetch options */
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };
}

/**
 * Hook process message
 */
export interface SandboxHookMessage extends SandboxMessageBase {
  type: "hook.process";
  /** Hook type */
  hookType: "beforeSend" | "afterReceive";
  /** Message to process */
  message: unknown;
}

/**
 * Union type for all sandbox messages
 */
export type SandboxMessage =
  | SandboxInitMessage
  | SandboxActivateMessage
  | SandboxDeactivateMessage
  | SandboxStorageMessage
  | SandboxFetchMessage
  | SandboxHookMessage
  | SandboxMessageBase;

// ============== Sandbox Response ==============

/**
 * Sandbox response types (worker -> main thread)
 */
export type SandboxResponseType =
  | "success"
  | "error"
  | "result"
  | "log"
  | "network";

/**
 * Base sandbox response
 */
export interface SandboxResponseBase {
  /** Correlated message ID */
  id: string;
  /** Response type */
  type: SandboxResponseType;
  /** Plugin ID */
  pluginId: string;
}

/**
 * Success response
 */
export interface SandboxSuccessResponse extends SandboxResponseBase {
  type: "success";
  /** Result data */
  data?: unknown;
}

/**
 * Error response
 */
export interface SandboxErrorResponse extends SandboxResponseBase {
  type: "error";
  /** Error message */
  error: string;
  /** Error stack trace */
  stack?: string;
}

/**
 * Result response (for hook processing)
 */
export interface SandboxResultResponse extends SandboxResponseBase {
  type: "result";
  /** Result data */
  result: unknown;
}

/**
 * Log response (console output from sandbox)
 */
export interface SandboxLogResponse extends SandboxResponseBase {
  type: "log";
  /** Log level */
  level: "log" | "warn" | "error" | "info";
  /** Log arguments */
  args: unknown[];
}

/**
 * Network response (network request log)
 */
export interface SandboxNetworkResponse extends SandboxResponseBase {
  type: "network";
  /** Network request log */
  log: NetworkRequestLog;
}

/**
 * Union type for all sandbox responses
 */
export type SandboxResponse =
  | SandboxSuccessResponse
  | SandboxErrorResponse
  | SandboxResultResponse
  | SandboxLogResponse
  | SandboxNetworkResponse;

// ============== Sandbox Configuration ==============

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Plugin ID */
  pluginId: string;
  /** Plugin code */
  code: string;
  /** Plugin manifest */
  manifest: {
    id: string;
    version: string;
    permissions: PluginPermission[];
    allowedDomains?: string[];
  };
  /** Hook timeout in ms (default: 5000) */
  hookTimeout?: number;
  /** Network rate limit per minute (default: 100) */
  networkRateLimit?: number;
  /** Storage quota in bytes (default: 10MB) */
  storageQuota?: number;
}

/**
 * Sandbox state
 */
export type SandboxState =
  | "uninitialized" // Worker not created
  | "ready" // Code loaded, ready for activate
  | "activating" // Activate in progress
  | "active" // Plugin running
  | "deactivating" // Deactivate in progress
  | "inactive" // Plugin stopped
  | "error"; // Error state

/**
 * Sandbox instance info
 */
export interface SandboxInfo {
  /** Plugin ID */
  pluginId: string;
  /** Current state */
  state: SandboxState;
  /** Error message if state is 'error' */
  error?: string;
  /** Time of last activation */
  activatedAt?: number;
  /** Network request count in current session */
  networkRequestCount: number;
  /** Storage usage in bytes */
  storageUsage: number;
}
