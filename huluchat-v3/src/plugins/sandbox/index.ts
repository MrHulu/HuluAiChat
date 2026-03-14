/**
 * Plugin Sandbox Manager
 * Manages Web Worker-based plugin execution
 * @module plugins/sandbox
 */

import type {
  SandboxConfig,
  SandboxState,
  SandboxInfo,
  SandboxMessage,
  SandboxResponse,
  NetworkRequestLog,
  NetworkPermission,
} from "./types";
import type { Message } from "@/api/client";

// ============== Request Log Store ==============

type RequestLogListener = (log: NetworkRequestLog) => void;

class RequestLogStore {
  private logs: Map<string, NetworkRequestLog[]> = new Map();
  private listeners: Set<RequestLogListener> = new Set();
  private maxLogsPerPlugin = 100;

  addLog(pluginId: string, log: NetworkRequestLog): void {
    if (!this.logs.has(pluginId)) {
      this.logs.set(pluginId, []);
    }

    const pluginLogs = this.logs.get(pluginId)!;
    pluginLogs.push(log);

    // Keep only last N logs
    if (pluginLogs.length > this.maxLogsPerPlugin) {
      pluginLogs.shift();
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(log);
    }
  }

  getLogs(pluginId: string): NetworkRequestLog[] {
    return this.logs.get(pluginId) || [];
  }

  getAllLogs(): Map<string, NetworkRequestLog[]> {
    return new Map(this.logs);
  }

  clearLogs(pluginId: string): void {
    this.logs.delete(pluginId);
  }

  subscribe(listener: RequestLogListener): { unsubscribe: () => void } {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }
}

// Global request log store
export const requestLogStore = new RequestLogStore();

// ============== Plugin Sandbox ==============

/**
 * Plugin Sandbox Instance
 * Manages a single plugin's Web Worker
 */
export class PluginSandbox {
  private worker: Worker | null = null;
  private config: SandboxConfig;
  private state: SandboxState = "uninitialized";
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private requestTimeout: number;
  private error: string | undefined;
  private activatedAt: number | undefined;
  private networkRequestCount = 0;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.requestTimeout = config.hookTimeout || 5000;
  }

  /**
   * Initialize the sandbox
   */
  async initialize(): Promise<void> {
    if (this.state !== "uninitialized") {
      throw new Error(`Cannot initialize sandbox in state: ${this.state}`);
    }

    try {
      // Create Worker from inline blob (avoids separate worker file issues)
      this.worker = this.createWorker();

      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Send init message
      await this.sendMessage({
        id: this.generateId(),
        type: "init",
        pluginId: this.config.pluginId,
        code: this.config.code,
        manifest: this.config.manifest,
      });

      this.state = "ready";
    } catch (error) {
      this.state = "error";
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Activate the plugin
   */
  async activate(): Promise<void> {
    if (this.state !== "ready") {
      throw new Error(`Cannot activate sandbox in state: ${this.state}`);
    }

    this.state = "activating";

    try {
      await this.sendMessage({
        id: this.generateId(),
        type: "activate",
        pluginId: this.config.pluginId,
      });

      this.state = "active";
      this.activatedAt = Date.now();
    } catch (error) {
      this.state = "error";
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    if (this.state !== "active") {
      return;
    }

    this.state = "deactivating";

    try {
      await this.sendMessage({
        id: this.generateId(),
        type: "deactivate",
        pluginId: this.config.pluginId,
      });

      this.state = "inactive";
    } catch (error) {
      this.state = "error";
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Dispose the sandbox
   */
  async dispose(): Promise<void> {
    if (this.worker) {
      try {
        await this.sendMessage({
          id: this.generateId(),
          type: "dispose",
          pluginId: this.config.pluginId,
        });
      } catch {
        // Ignore errors during dispose
      }

      this.worker.terminate();
      this.worker = null;
    }

    // Clear pending requests
    for (const [, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(new Error("Sandbox disposed"));
    }
    this.pendingRequests.clear();

    this.state = "uninitialized";
  }

  /**
   * Process a message through beforeSend hooks
   */
  async processBeforeSend(message: Message): Promise<Message | null> {
    if (this.state !== "active") {
      return message;
    }

    try {
      const response = await this.sendMessage({
        id: this.generateId(),
        type: "hook.process",
        pluginId: this.config.pluginId,
        hookType: "beforeSend",
        message,
      });

      return response as Message | null;
    } catch {
      // On error, return original message
      return message;
    }
  }

  /**
   * Process a message through afterReceive hooks
   */
  async processAfterReceive(message: Message): Promise<Message | null> {
    if (this.state !== "active") {
      return message;
    }

    try {
      const response = await this.sendMessage({
        id: this.generateId(),
        type: "hook.process",
        pluginId: this.config.pluginId,
        hookType: "afterReceive",
        message,
      });

      return response as Message | null;
    } catch {
      // On error, return original message
      return message;
    }
  }

  /**
   * Get sandbox info
   */
  getInfo(): SandboxInfo {
    return {
      pluginId: this.config.pluginId,
      state: this.state,
      error: this.error,
      activatedAt: this.activatedAt,
      networkRequestCount: this.networkRequestCount,
      storageUsage: 0, // Would need to be tracked in worker
    };
  }

  /**
   * Get current state
   */
  getState(): SandboxState {
    return this.state;
  }

  // ============== Private Methods ==============

  private createWorker(): Worker {
    // Inline worker code
    const workerCode = `
      // Worker state
      const state = {
        pluginId: "",
        manifest: { id: "", version: "", permissions: [], allowedDomains: [] },
        module: null,
        storage: new Map(),
        storageQuota: 10 * 1024 * 1024,
        storageUsage: 0,
        hooks: { beforeSend: [], afterReceive: [] },
        networkRequestCount: 0,
        networkRateLimit: 100,
        lastNetworkReset: Date.now(),
        disposed: false
      };

      function generateId() {
        return Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      }

      function sendResponse(response) {
        self.postMessage(response);
      }

      function sendSuccess(id, pluginId, data) {
        sendResponse({ id, type: "success", pluginId, data });
      }

      function sendError(id, pluginId, error, stack) {
        sendResponse({ id, type: "error", pluginId, error, stack });
      }

      function sendNetworkLog(pluginId, log) {
        sendResponse({ id: generateId(), type: "network", pluginId, log });
      }

      function checkRateLimit() {
        const now = Date.now();
        if (now - state.lastNetworkReset >= 60000) {
          state.networkRequestCount = 0;
          state.lastNetworkReset = now;
        }
        return {
          allowed: state.networkRequestCount < state.networkRateLimit,
          remaining: state.networkRateLimit - state.networkRequestCount
        };
      }

      function isDomainAllowed(url) {
        if (!state.manifest.permissions.includes("network")) {
          return { allowed: false, reason: "Network permission not granted" };
        }
        if (state.manifest.allowedDomains.length === 0) {
          return { allowed: false, reason: "No domains whitelisted in manifest" };
        }
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          for (const allowed of state.manifest.allowedDomains) {
            if (hostname === allowed) return { allowed: true };
            if (allowed.startsWith("*.")) {
              const baseDomain = allowed.slice(2);
              if (hostname === baseDomain || hostname.endsWith("." + baseDomain)) {
                return { allowed: true };
              }
            }
          }
          return { allowed: false, reason: "Domain '" + hostname + "' not in whitelist" };
        } catch {
          return { allowed: false, reason: "Invalid URL" };
        }
      }

      async function handleInit(message) {
        const { id, pluginId, code, manifest } = message;
        try {
          state.pluginId = pluginId;
          state.manifest = { ...manifest, allowedDomains: manifest.allowedDomains || [] };
          const createModule = new Function("exports", "module", code + "\\n return module.exports;");
          const moduleExport = createModule({}, { exports: {} });
          const module = moduleExport.default || moduleExport;
          if (typeof module.activate !== "function") {
            throw new Error("Plugin module must export an activate function");
          }
          state.module = module;
          sendSuccess(id, pluginId);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          sendError(id, pluginId, "Failed to initialize: " + err.message, err.stack);
        }
      }

      async function handleActivate(message) {
        const { id, pluginId } = message;
        if (!state.module) {
          sendError(id, pluginId, "Plugin not initialized");
          return;
        }
        try {
          const context = createPluginContext(pluginId);
          await state.module.activate(context);
          sendSuccess(id, pluginId);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          sendError(id, pluginId, "Activation failed: " + err.message, err.stack);
        }
      }

      function createPluginContext(pluginId) {
        return {
          id: state.manifest.id,
          version: state.manifest.version,
          onBeforeSend: (handler) => {
            state.hooks.beforeSend.push(handler);
            return { dispose: () => {
              const index = state.hooks.beforeSend.indexOf(handler);
              if (index >= 0) state.hooks.beforeSend.splice(index, 1);
            }};
          },
          onAfterReceive: (handler) => {
            state.hooks.afterReceive.push(handler);
            return { dispose: () => {
              const index = state.hooks.afterReceive.indexOf(handler);
              if (index >= 0) state.hooks.afterReceive.splice(index, 1);
            }};
          },
          storage: {
            get: (key) => state.storage.get(key) ?? null,
            set: (key, value) => {
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
            delete: (key) => {
              const value = state.storage.get(key);
              if (value) state.storageUsage -= JSON.stringify(value).length;
              state.storage.delete(key);
            },
            clear: () => { state.storage.clear(); state.storageUsage = 0; },
            keys: () => Array.from(state.storage.keys())
          },
          showNotification: (message, type = "info") => {
            sendResponse({ id: generateId(), type: "log", pluginId, level: "info", args: ["[Notification: " + type + "] " + message] });
          },
          onDispose: () => {}
        };
      }

      async function handleFetch(message) {
        const { id, pluginId, url, options } = message;
        const domainCheck = isDomainAllowed(url);
        if (!domainCheck.allowed) {
          const log = { id: generateId(), pluginId, url, method: options?.method || "GET", timestamp: Date.now(), blocked: true, blockReason: domainCheck.reason };
          sendNetworkLog(pluginId, log);
          sendError(id, pluginId, "Network request blocked: " + domainCheck.reason);
          return;
        }
        const rateCheck = checkRateLimit();
        if (!rateCheck.allowed) {
          const log = { id: generateId(), pluginId, url, method: options?.method || "GET", timestamp: Date.now(), blocked: true, blockReason: "Rate limit exceeded" };
          sendNetworkLog(pluginId, log);
          sendError(id, pluginId, "Network rate limit exceeded");
          return;
        }
        const requestId = generateId();
        const startTime = Date.now();
        state.networkRequestCount++;
        try {
          const response = await fetch(url, { method: options?.method || "GET", headers: options?.headers, body: options?.body });
          const duration = Date.now() - startTime;
          const log = { id: requestId, pluginId, url, method: options?.method || "GET", timestamp: startTime, status: response.status, duration };
          sendNetworkLog(pluginId, log);
          const text = await response.text();
          sendSuccess(id, pluginId, { ok: response.ok, status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()), body: text });
        } catch (error) {
          const duration = Date.now() - startTime;
          const err = error instanceof Error ? error : new Error(String(error));
          const log = { id: requestId, pluginId, url, method: options?.method || "GET", timestamp: startTime, error: err.message, duration };
          sendNetworkLog(pluginId, log);
          sendError(id, pluginId, "Fetch failed: " + err.message);
        }
      }

      self.onmessage = async (event) => {
        const message = event.data;
        if (state.disposed && message.type !== "dispose") {
          sendError(message.id, message.pluginId, "Sandbox has been disposed");
          return;
        }
        switch (message.type) {
          case "init": await handleInit(message); break;
          case "activate": await handleActivate(message); break;
          case "deactivate":
            if (state.module?.deactivate) await state.module.deactivate();
            state.hooks.beforeSend = [];
            state.hooks.afterReceive = [];
            sendSuccess(message.id, message.pluginId);
            break;
          case "api.fetch": await handleFetch(message); break;
          case "dispose":
            state.disposed = true;
            state.module = null;
            state.storage.clear();
            sendSuccess(message.id, message.pluginId);
            break;
          default:
            sendError(message.id, message.pluginId, "Unknown message type: " + message.type);
        }
      };

      self.onerror = (error) => {
        sendResponse({ id: generateId(), type: "log", pluginId: state.pluginId, level: "error", args: ["Unhandled error:", error] });
      };

      self.onunhandledrejection = (event) => {
        sendResponse({ id: generateId(), type: "log", pluginId: state.pluginId, level: "error", args: ["Unhandled rejection:", event.reason] });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  }

  private handleWorkerMessage(event: MessageEvent<SandboxResponse>): void {
    const response = event.data;

    // Handle network log
    if (response.type === "network") {
      this.networkRequestCount++;
      requestLogStore.addLog(response.pluginId, (response as { log: NetworkRequestLog }).log);
      return;
    }

    // Handle log
    if (response.type === "log") {
      const logResponse = response as { level: string; args: unknown[] };
      console[logResponse.level as "log" | "warn" | "error" | "info"](
        `[PluginSandbox:${this.config.pluginId}]`,
        ...logResponse.args
      );
      return;
    }

    // Handle pending request
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.type === "error") {
      pending.reject(new Error((response as { error: string }).error));
    } else {
      pending.resolve((response as { data?: unknown }).data);
    }
  }

  private handleWorkerError(event: ErrorEvent): void {
    console.error(`[PluginSandbox:${this.config.pluginId}] Worker error:`, event.message);

    // Reject all pending requests
    for (const [, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(new Error(`Worker error: ${event.message}`));
    }
    this.pendingRequests.clear();

    this.state = "error";
    this.error = event.message;
  }

  private sendMessage(message: SandboxMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      this.pendingRequests.set(message.id, { resolve, reject, timeout });
      this.worker.postMessage(message);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============== Sandbox Factory ==============

/**
 * Create a new plugin sandbox
 */
export function createSandbox(config: SandboxConfig): PluginSandbox {
  return new PluginSandbox(config);
}

// Re-export types
export type {
  SandboxConfig,
  SandboxState,
  SandboxInfo,
  NetworkRequestLog,
  NetworkPermission,
};
