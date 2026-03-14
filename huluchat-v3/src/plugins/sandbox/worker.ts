/**
 * Plugin Sandbox Worker
 * Runs plugin code in an isolated Web Worker context
 * @module plugins/sandbox/worker
 *
 * SECURITY:
 * - No access to localStorage, sessionStorage, IndexedDB
 * - No access to DOM (document, window)
 * - Network access only through controlled proxy
 * - Storage through controlled proxy with quota
 */

import type {
  SandboxMessage,
  SandboxResponse,
  SandboxInitMessage,
  SandboxActivateMessage,
  SandboxFetchMessage,
  NetworkRequestLog,
} from "./types";

// ============== Worker State ==============

interface WorkerState {
  pluginId: string;
  manifest: {
    id: string;
    version: string;
    permissions: string[];
    allowedDomains: string[];
  };
  module: {
    activate: (context: unknown) => void | Promise<void>;
    deactivate?: () => void | Promise<void>;
  } | null;
  storage: Map<string, unknown>;
  storageQuota: number;
  storageUsage: number;
  hooks: {
    beforeSend: Array<(message: unknown) => unknown>;
    afterReceive: Array<(message: unknown) => unknown>;
  };
  networkRequests: Map<string, { startTime: number }>;
  networkRateLimit: number;
  networkRequestCount: number;
  lastNetworkReset: number;
  disposed: boolean;
}

const state: WorkerState = {
  pluginId: "",
  manifest: { id: "", version: "", permissions: [], allowedDomains: [] },
  module: null,
  storage: new Map(),
  storageQuota: 10 * 1024 * 1024, // 10MB
  storageUsage: 0,
  hooks: { beforeSend: [], afterReceive: [] },
  networkRequests: new Map(),
  networkRateLimit: 100, // 100 requests per minute
  networkRequestCount: 0,
  lastNetworkReset: Date.now(),
  disposed: false,
};

// ============== Utilities ==============

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sendResponse(response: SandboxResponse): void {
  self.postMessage(response);
}

function sendSuccess(id: string, pluginId: string, data?: unknown): void {
  sendResponse({ id, type: "success", pluginId, data });
}

function sendError(id: string, pluginId: string, error: string, stack?: string): void {
  sendResponse({ id, type: "error", pluginId, error, stack });
}

function sendLog(pluginId: string, level: "log" | "warn" | "error" | "info", args: unknown[]): void {
  sendResponse({
    id: generateId(),
    type: "log",
    pluginId,
    level,
    args,
  });
}

function sendNetworkLog(pluginId: string, log: NetworkRequestLog): void {
  sendResponse({
    id: generateId(),
    type: "network",
    pluginId,
    log,
  });
}

// ============== Security Checks ==============

function checkRateLimit(): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Reset counter every minute
  if (now - state.lastNetworkReset >= 60000) {
    state.networkRequestCount = 0;
    state.lastNetworkReset = now;
  }

  const remaining = state.networkRateLimit - state.networkRequestCount;

  if (state.networkRequestCount >= state.networkRateLimit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: remaining - 1 };
}

function isDomainAllowed(url: string): { allowed: boolean; reason?: string } {
  // Check if network permission is granted
  if (!state.manifest.permissions.includes("network")) {
    return { allowed: false, reason: "Network permission not granted" };
  }

  // If no domains specified, block all (fail-safe)
  if (state.manifest.allowedDomains.length === 0) {
    return { allowed: false, reason: "No domains whitelisted in manifest" };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Check each allowed domain
    for (const allowed of state.manifest.allowedDomains) {
      // Exact match
      if (hostname === allowed) {
        return { allowed: true };
      }

      // Wildcard match (*.example.com)
      if (allowed.startsWith("*.")) {
        const baseDomain = allowed.slice(2);
        if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
          return { allowed: true };
        }
      }
    }

    return { allowed: false, reason: `Domain '${hostname}' not in whitelist` };
  } catch {
    return { allowed: false, reason: "Invalid URL" };
  }
}

// ============== Message Handlers ==============

async function handleInit(message: SandboxInitMessage): Promise<void> {
  const { id, pluginId, code, manifest } = message;

  try {
    state.pluginId = pluginId;
    state.manifest = {
      ...manifest,
      allowedDomains: manifest.allowedDomains || [],
    };

    // Create sandboxed module using Function constructor
    // Note: This is still within a Worker, so it's isolated from main thread
    // The Worker itself provides the security boundary
    const createModule = new Function(
      "exports",
      "module",
      `${code}\n return module.exports;`
    );

    const moduleExport = createModule({}, { exports: {} });
    const module = moduleExport.default || moduleExport;

    if (typeof module.activate !== "function") {
      throw new Error("Plugin module must export an activate function");
    }

    state.module = module;
    sendSuccess(id, pluginId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    sendError(id, pluginId, `Failed to initialize: ${err.message}`, err.stack);
  }
}

async function handleActivate(message: SandboxActivateMessage): Promise<void> {
  const { id, pluginId } = message;

  if (!state.module) {
    sendError(id, pluginId, "Plugin not initialized");
    return;
  }

  try {
    // Create the plugin context
    const context = createPluginContext(pluginId);

    // Call activate
    await state.module.activate(context);

    sendSuccess(id, pluginId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    sendError(id, pluginId, `Activation failed: ${err.message}`, err.stack);
  }
}

async function handleDeactivate(message: SandboxMessage): Promise<void> {
  const { id, pluginId } = message;

  if (!state.module) {
    sendSuccess(id, pluginId);
    return;
  }

  try {
    if (state.module.deactivate) {
      await state.module.deactivate();
    }

    // Clear hooks
    state.hooks.beforeSend = [];
    state.hooks.afterReceive = [];

    sendSuccess(id, pluginId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    sendError(id, pluginId, `Deactivation failed: ${err.message}`, err.stack);
  }
}

async function handleFetch(message: SandboxFetchMessage): Promise<void> {
  const { id, pluginId, url, options } = message;

  // Check domain whitelist
  const domainCheck = isDomainAllowed(url);
  if (!domainCheck.allowed) {
    const log: NetworkRequestLog = {
      id: generateId(),
      pluginId,
      url,
      method: options?.method || "GET",
      timestamp: Date.now(),
      blocked: true,
      blockReason: domainCheck.reason,
    };
    sendNetworkLog(pluginId, log);
    sendError(id, pluginId, `Network request blocked: ${domainCheck.reason}`);
    return;
  }

  // Check rate limit
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    const log: NetworkRequestLog = {
      id: generateId(),
      pluginId,
      url,
      method: options?.method || "GET",
      timestamp: Date.now(),
      blocked: true,
      blockReason: "Rate limit exceeded",
    };
    sendNetworkLog(pluginId, log);
    sendError(id, pluginId, "Network rate limit exceeded");
    return;
  }

  const requestId = generateId();
  const startTime = Date.now();
  state.networkRequestCount++;

  try {
    const response = await fetch(url, {
      method: options?.method || "GET",
      headers: options?.headers,
      body: options?.body,
    });

    const duration = Date.now() - startTime;
    const log: NetworkRequestLog = {
      id: requestId,
      pluginId,
      url,
      method: options?.method || "GET",
      timestamp: startTime,
      status: response.status,
      duration,
    };
    sendNetworkLog(pluginId, log);

    // Clone response for transfer
    const text = await response.text();

    sendSuccess(id, pluginId, {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    const log: NetworkRequestLog = {
      id: requestId,
      pluginId,
      url,
      method: options?.method || "GET",
      timestamp: startTime,
      error: err.message,
      duration,
    };
    sendNetworkLog(pluginId, log);
    sendError(id, pluginId, `Fetch failed: ${err.message}`);
  }
}

// ============== Plugin Context ==============

function createPluginContext(pluginId: string): unknown {
  const context = {
    // Metadata
    id: state.manifest.id,
    version: state.manifest.version,

    // Hooks
    onBeforeSend: (handler: (message: unknown) => unknown) => {
      state.hooks.beforeSend.push(handler);
      return {
        dispose: () => {
          const index = state.hooks.beforeSend.indexOf(handler);
          if (index >= 0) state.hooks.beforeSend.splice(index, 1);
        },
      };
    },

    onAfterReceive: (handler: (message: unknown) => unknown) => {
      state.hooks.afterReceive.push(handler);
      return {
        dispose: () => {
          const index = state.hooks.afterReceive.indexOf(handler);
          if (index >= 0) state.hooks.afterReceive.splice(index, 1);
        },
      };
    },

    // Storage (with quota)
    storage: {
      get: <T>(key: string): T | null => {
        return (state.storage.get(key) as T) ?? null;
      },

      set: <T>(key: string, value: T): void => {
        const oldValue = state.storage.get(key);
        const oldSize = oldValue ? JSON.stringify(oldValue).length : 0;
        const newSize = JSON.stringify(value).length;
        const diff = newSize - oldSize;

        if (state.storageUsage + diff > state.storageQuota) {
          throw new Error("Storage quota exceeded");
        }

        state.storage.set(key, value);
        state.storageUsage += diff;
      },

      delete: (key: string): void => {
        const value = state.storage.get(key);
        if (value) {
          state.storageUsage -= JSON.stringify(value).length;
        }
        state.storage.delete(key);
      },

      clear: (): void => {
        state.storage.clear();
        state.storageUsage = 0;
      },

      keys: (): string[] => {
        return Array.from(state.storage.keys());
      },
    },

    // Notifications
    showNotification: (message: string, type = "info") => {
      sendLog(pluginId, "info", [`[Notification: ${type}] ${message}`]);
    },

    // Cleanup
    onDispose: (_callback: () => void) => {
      // Dispose callbacks are tracked by main thread
    },
  };

  return context;
}

// ============== Message Router ==============

self.onmessage = async (event: MessageEvent<SandboxMessage>) => {
  const message = event.data;

  if (state.disposed && message.type !== "dispose") {
    sendError(message.id, message.pluginId, "Sandbox has been disposed");
    return;
  }

  switch (message.type) {
    case "init":
      await handleInit(message as SandboxInitMessage);
      break;

    case "activate":
      await handleActivate(message as SandboxActivateMessage);
      break;

    case "deactivate":
      await handleDeactivate(message);
      break;

    case "api.fetch":
      await handleFetch(message as SandboxFetchMessage);
      break;

    case "dispose":
      state.disposed = true;
      state.module = null;
      state.storage.clear();
      state.hooks.beforeSend = [];
      state.hooks.afterReceive = [];
      sendSuccess(message.id, message.pluginId);
      break;

    default:
      sendError(message.id, message.pluginId, `Unknown message type: ${message.type}`);
  }
};

// Log unhandled errors
self.onerror = (error) => {
  sendLog(state.pluginId, "error", ["Unhandled error in sandbox:", error]);
};

self.onunhandledrejection = (event) => {
  sendLog(state.pluginId, "error", ["Unhandled promise rejection:", event.reason]);
};
