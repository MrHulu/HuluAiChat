/**
 * Plugin Settings Component
 * UI for managing plugins (view, activate, deactivate, install, uninstall)
 * @module components/settings/PluginSettings
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Puzzle,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Power,
  ExternalLink,
  Trash2,
  Upload,
  FolderOpen,
  Download,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePluginManager } from "@/hooks";
import type { PluginInstance, PluginUpdateInfo, PluginUpdateState } from "@/plugins";

/**
 * Get badge variant based on plugin state
 */
function getStateBadgeVariant(state: PluginInstance["state"]): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    case "activating":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * State icon component
 */
function StateIcon({ state }: { state: PluginInstance["state"] }) {
  switch (state) {
    case "active":
      return <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />;
    case "inactive":
      return <Power className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    case "activating":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />;
    default:
      return null;
  }
}

/**
 * Plugin card component
 */
function PluginCard({
  plugin,
  updateInfo,
  updateState,
  onActivate,
  onDeactivate,
  onUninstall,
  onCheckUpdate,
  onUpdate,
  isProcessing,
}: {
  plugin: PluginInstance;
  updateInfo: PluginUpdateInfo | null;
  updateState: PluginUpdateState;
  onActivate: () => void;
  onDeactivate: () => void;
  onUninstall: () => void;
  onCheckUpdate: () => void;
  onUpdate: () => void;
  isProcessing: boolean;
}) {
  const { t } = useTranslation();
  const isActive = plugin.state === "active";
  const isActivating = plugin.state === "activating";
  const hasUpdate = updateInfo?.hasUpdate ?? false;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <StateIcon state={plugin.state} />
            {plugin.manifest.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasUpdate && (
              <Badge variant="default" className="bg-primary text-xs">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                {t("plugins.updateAvailable")}
              </Badge>
            )}
            <Badge variant={getStateBadgeVariant(plugin.state)}>
              {t(`plugins.state.${plugin.state}`)}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs mt-1">
          {plugin.manifest.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Author & Version */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("plugins.byAuthor", { author: plugin.manifest.author })}
            </span>
            <span>
              v{plugin.manifest.version}
              {hasUpdate && updateInfo && (
                <span className="text-primary ml-1">
                  → v{updateInfo.latestVersion}
                </span>
              )}
            </span>
          </div>

          {/* Homepage */}
          {plugin.manifest.homepage && (
            <a
              href={plugin.manifest.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              {t("plugins.homepage")}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Permissions */}
          {plugin.manifest.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plugin.manifest.permissions.map((perm) => (
                <Badge key={perm} variant="outline" className="text-xs">
                  {perm}
                </Badge>
              ))}
            </div>
          )}

          {/* Error message */}
          {plugin.error && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{plugin.error}</span>
            </div>
          )}

          {/* Update status */}
          {updateState === "checking" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("plugins.checkingUpdate")}
            </div>
          )}
          {updateState === "downloading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Download className="h-3 w-3 animate-bounce" />
              {t("plugins.downloadingUpdate")}
            </div>
          )}
          {updateState === "installing" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("plugins.installingUpdate")}
            </div>
          )}
          {updateState === "updated" && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              {t("plugins.updateSuccess")}
            </div>
          )}
          {updateState === "error" && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {t("plugins.updateFailed")}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isProcessing || isActivating}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    onActivate();
                  } else {
                    onDeactivate();
                  }
                }}
                aria-label={t("plugins.togglePlugin")}
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Update button */}
              {hasUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpdate}
                  disabled={isProcessing || updateState === "downloading" || updateState === "installing"}
                  className="h-8"
                >
                  {updateState === "downloading" || updateState === "installing" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  {t("plugins.update")}
                </Button>
              )}
              {/* Check update button */}
              {plugin.manifest.updateUrl && !hasUpdate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCheckUpdate}
                  disabled={isProcessing || updateState === "checking"}
                  className="h-8"
                >
                  {updateState === "checking" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span className="sr-only">{t("plugins.checkUpdate")}</span>
                </Button>
              )}
              {isActivating && (
                <span className="text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  {t("plugins.activating")}
                </span>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={isProcessing || isActive}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("plugins.uninstall")}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("plugins.uninstallConfirm.title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("plugins.uninstallConfirm.description", { name: plugin.manifest.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onUninstall}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("plugins.uninstall")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Drop zone component for drag-and-drop installation
 */
function DropZone({
  onInstall,
  isInstalling,
}: {
  onInstall: (path: string) => Promise<void>;
  isInstalling: boolean;
}) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          // Get the full path from the entry
          const path = await getDirectoryPath(entry);
          if (path) {
            try {
              await onInstall(path);
              toast.success(t("plugins.installSuccess"));
            } catch (err) {
              toast.error(t("plugins.installFailed", { error: err instanceof Error ? err.message : String(err) }));
            }
          }
        } else {
          toast.error(t("plugins.installFolderOnly"));
        }
      }
    }
  };

  // Helper to get directory path (works in Electron/Tauri with webkitRelativePath)
  const getDirectoryPath = async (entry: FileSystemEntry): Promise<string | null> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        resolve(null);
      } else if (entry.isDirectory) {
        // In browser context, we can't get the full path
        // But for drag-drop of folders, we can use webkitRelativePath
        const dirEntry = entry as FileSystemDirectoryEntry;
        dirEntry.createReader().readEntries((entries) => {
          // Check for manifest.json
          const hasManifest = entries.some(
            (e) => e.name === "manifest.json"
          );
          if (hasManifest) {
            // Return the entry name as path identifier
            // Note: In Tauri, we need to use dialog API for actual file paths
            resolve(entry.name);
          } else {
            resolve(null);
          }
        });
      }
    });
  };

  const handleBrowseClick = async () => {
    // In Tauri, use dialog API to select folder
    const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
    if (isTauri) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const selectedPath = await open({
          directory: true,
          multiple: false,
          title: t("plugins.selectFolder"),
        });
        if (selectedPath) {
          await onInstall(selectedPath as string);
          toast.success(t("plugins.installSuccess"));
        }
      } catch (err) {
        toast.error(t("plugins.installFailed", { error: err instanceof Error ? err.message : String(err) }));
      }
    } else {
      toast.info(t("plugins.tauriOnly"));
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("plugins.dropToInstall")}
      aria-busy={isInstalling}
      aria-disabled={isInstalling}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      } ${isInstalling ? "opacity-50 cursor-wait" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleBrowseClick();
        }
      }}
    >
      <div className="flex flex-col items-center gap-3">
        {isInstalling ? (
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        )}
        <div>
          <p className="text-sm font-medium">{t("plugins.dropToInstall")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("plugins.dropHint")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBrowseClick}
          disabled={isInstalling}
        >
          <FolderOpen className="h-4 w-4 mr-2" aria-hidden="true" />
          {t("plugins.browseFolder")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Plugin Settings component
 */
export function PluginSettings() {
  const { t } = useTranslation();
  const {
    plugins,
    isLoading,
    isInitialized,
    error,
    activatePlugin,
    deactivatePlugin,
    installPlugin,
    uninstallPlugin,
    refreshPlugins,
    checkForUpdate,
    checkForAllUpdates,
    updatePlugin,
  } = usePluginManager();

  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [updateInfos, setUpdateInfos] = React.useState<Map<string, PluginUpdateInfo>>(new Map());
  const [updateStates, setUpdateStates] = React.useState<Map<string, PluginUpdateState>>(new Map());

  const handleActivate = async (id: string) => {
    try {
      setProcessingId(id);
      await activatePlugin(id);
      toast.success(t("plugins.activateSuccess"));
    } catch (err) {
      toast.error(t("plugins.activateFailed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      setProcessingId(id);
      await deactivatePlugin(id);
      toast.success(t("plugins.deactivateSuccess"));
    } catch (err) {
      toast.error(t("plugins.deactivateFailed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleInstall = async (path: string) => {
    try {
      setIsInstalling(true);
      await installPlugin(path);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      setProcessingId(id);
      await uninstallPlugin(id);
      toast.success(t("plugins.uninstallSuccess"));
    } catch (err) {
      toast.error(t("plugins.uninstallFailed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckUpdate = async (id: string) => {
    try {
      setUpdateStates((prev) => new Map(prev).set(id, "checking"));
      const info = await checkForUpdate(id);
      if (info) {
        setUpdateInfos((prev) => new Map(prev).set(id, info));
      }
      setUpdateStates((prev) => new Map(prev).set(id, "idle"));
    } catch (err) {
      setUpdateStates((prev) => new Map(prev).set(id, "error"));
      toast.error(t("plugins.checkUpdateFailed", { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setUpdateStates((prev) => new Map(prev).set(id, "downloading"));
      await updatePlugin(id);
      setUpdateStates((prev) => new Map(prev).set(id, "updated"));
      setUpdateInfos((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      toast.success(t("plugins.updateSuccess"));
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setUpdateStates((prev) => new Map(prev).set(id, "idle"));
      }, 3000);
    } catch (err) {
      setUpdateStates((prev) => new Map(prev).set(id, "error"));
      toast.error(t("plugins.updateFailed", { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  // Check all updates on mount
  React.useEffect(() => {
    if (isInitialized) {
      checkForAllUpdates().then((infos) => {
        setUpdateInfos(infos);
      }).catch(console.error);
    }
  }, [isInitialized, checkForAllUpdates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t("plugins.loading")}</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">{error || t("plugins.initFailed")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t("plugins.title")}</h3>
          <Badge variant="secondary" className="text-xs">
            {t("plugins.installed", { count: plugins.length })}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshPlugins}>
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">{t("plugins.refresh")}</span>
        </Button>
      </div>

      {/* Install drop zone */}
      <DropZone onInstall={handleInstall} isInstalling={isInstalling} />

      {/* Plugin list */}
      {plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <Puzzle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("plugins.noPlugins")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("plugins.installHint")}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.manifest.id}
              plugin={plugin}
              updateInfo={updateInfos.get(plugin.manifest.id) ?? null}
              updateState={updateStates.get(plugin.manifest.id) ?? "idle"}
              onActivate={() => handleActivate(plugin.manifest.id)}
              onDeactivate={() => handleDeactivate(plugin.manifest.id)}
              onUninstall={() => handleUninstall(plugin.manifest.id)}
              onCheckUpdate={() => handleCheckUpdate(plugin.manifest.id)}
              onUpdate={() => handleUpdate(plugin.manifest.id)}
              isProcessing={processingId === plugin.manifest.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
