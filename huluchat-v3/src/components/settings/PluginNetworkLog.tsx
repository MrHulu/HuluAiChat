/**
 * Plugin Network Request Log Component
 * Displays network requests made by plugins for user visibility
 * @module components/settings/PluginNetworkLog
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Globe, X, AlertTriangle, Check, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { requestLogStore } from "@/plugins/sandbox";
import type { NetworkRequestLog } from "@/plugins/sandbox/types";

interface PluginNetworkLogProps {
  /** Plugin ID to show logs for (optional, shows all if not specified) */
  pluginId?: string;
  /** Whether to show as a dialog trigger button */
  asDialog?: boolean;
  /** Maximum number of logs to display */
  maxLogs?: number;
}

/**
 * Plugin Network Request Log Component
 */
export function PluginNetworkLog({
  pluginId,
  asDialog = false,
  maxLogs = 100,
}: PluginNetworkLogProps) {
  const { t } = useTranslation("settings");
  const [logs, setLogs] = useState<NetworkRequestLog[]>([]);
  const [filter, setFilter] = useState<"all" | "blocked" | "allowed">("all");

  // Subscribe to network request logs
  useEffect(() => {
    // Initial load
    const allLogs = pluginId
      ? requestLogStore.getLogs(pluginId)
      : Array.from(requestLogStore.getAllLogs().values()).flat();
    setLogs(allLogs.slice(-maxLogs));

    // Subscribe to new logs
    const { unsubscribe } = requestLogStore.subscribe((log) => {
      if (pluginId && log.pluginId !== pluginId) return;
      setLogs((prev) => {
        const newLogs = [...prev, log];
        return newLogs.slice(-maxLogs);
      });
    });

    return unsubscribe;
  }, [pluginId, maxLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    if (filter === "blocked") return logs.filter((log) => log.blocked);
    return logs.filter((log) => !log.blocked);
  }, [logs, filter]);

  // Clear logs
  const handleClearLogs = () => {
    if (pluginId) {
      requestLogStore.clearLogs(pluginId);
    }
    setLogs([]);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (ms?: number) => {
    if (ms === undefined) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Truncate URL for display
  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      if (path.length > 20) {
        return `${urlObj.host}${path.substring(0, 20)}...`;
      }
      return url;
    } catch {
      return url.substring(0, maxLength) + "...";
    }
  };

  // Get method badge color
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-500/10 text-blue-500";
      case "POST":
        return "bg-green-500/10 text-green-500";
      case "PUT":
        return "bg-yellow-500/10 text-yellow-500";
      case "DELETE":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const logContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("plugins.networkLog.title", {
              defaultValue: "Plugin Network Activity",
            })}
          </span>
          <Badge variant="secondary" className="text-xs">
            {filteredLogs.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex rounded-lg border">
            {(["all", "allowed", "blocked"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-none first:rounded-l-lg last:rounded-r-lg"
                onClick={() => setFilter(f)}
              >
                {t(`plugins.networkLog.filter.${f}`, { defaultValue: f })}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log list */}
      <div className="h-[300px] overflow-auto rounded-md border">
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {t("plugins.networkLog.empty", {
              defaultValue: "No network requests recorded",
            })}
          </div>
        ) : (
          <div className="divide-y">
            {filteredLogs
              .slice()
              .reverse()
              .map((log) => (
                <div
                  key={log.id}
                  className={`grid grid-cols-[80px_70px_1fr_80px_70px] items-center gap-2 px-3 py-2 text-sm ${
                    log.blocked ? "bg-red-500/5" : ""
                  }`}
                >
                  {/* Status */}
                  <div>
                    {log.blocked ? (
                      <div className="flex items-center gap-1">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-500">
                          {t("plugins.networkLog.blocked", { defaultValue: "Blocked" })}
                        </span>
                      </div>
                    ) : log.error ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500">
                          {t("plugins.networkLog.error", { defaultValue: "Error" })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs">{log.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Method */}
                  <Badge className={getMethodColor(log.method)} variant="outline">
                    {log.method}
                  </Badge>

                  {/* URL */}
                  <div className="truncate font-mono text-xs" title={log.url}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span>{truncateUrl(log.url)}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(log.timestamp)}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(log.duration)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Block reason if any */}
      {filteredLogs.some((log) => log.blocked) && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-red-500">
            <AlertTriangle className="h-4 w-4" />
            {t("plugins.networkLog.blockedTitle", {
              defaultValue: "Blocked Requests",
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("plugins.networkLog.blockedDesc", {
              defaultValue:
                "Some requests were blocked because they were not in the plugin's allowed domains list.",
            })}
          </p>
        </div>
      )}
    </div>
  );

  if (asDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Shield className="h-4 w-4" />
            {t("plugins.networkLog.viewLog", { defaultValue: "View Network Log" })}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("plugins.networkLog.title", {
                defaultValue: "Plugin Network Activity",
              })}
            </DialogTitle>
          </DialogHeader>
          {logContent}
        </DialogContent>
      </Dialog>
    );
  }

  return logContent;
}

export default PluginNetworkLog;
