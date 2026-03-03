/**
 * useUpdater - Tauri Auto-Update Hook
 * Handles checking, downloading, and installing app updates
 */
import { useState, useCallback, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

export interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

export interface UpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloadProgress: number;
  error: string | null;
}

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    updateInfo: null,
    downloadProgress: 0,
    error: null,
  });

  // Check for updates
  const checkForUpdates = useCallback(async (silent = false) => {
    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const update = await check();

      if (update) {
        setState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: true,
          updateInfo: {
            version: update.version,
            date: update.date,
            body: update.body,
          },
        }));

        if (!silent) {
          toast.success(`发现新版本 v${update.version}`, {
            description: "点击更新按钮进行安装",
          });
        }
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: false,
          updateInfo: null,
        }));

        if (!silent) {
          toast.info("当前已是最新版本");
        }
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "检查更新失败";
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: errorMsg,
      }));

      if (!silent) {
        toast.error("检查更新失败", { description: errorMsg });
      }
      return false;
    }
  }, []);

  // Download and install update
  const downloadAndInstall = useCallback(async () => {
    if (!state.updateAvailable) return;

    setState((prev) => ({ ...prev, isDownloading: true, downloadProgress: 0 }));

    try {
      const update = await check();

      if (!update) {
        throw new Error("No update available");
      }

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const progress = Math.round((downloaded / contentLength) * 100);
              setState((prev) => ({ ...prev, downloadProgress: progress }));
            }
            break;
          case "Finished":
            toast.success("下载完成，正在重启应用...");
            break;
        }
      });

      // Relaunch the app
      await relaunch();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "下载更新失败";
      setState((prev) => ({
        ...prev,
        isDownloading: false,
        error: errorMsg,
      }));
      toast.error("更新失败", { description: errorMsg });
    }
  }, [state.updateAvailable]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      updateAvailable: false,
      updateInfo: null,
    }));
  }, []);

  // Auto-check on mount (silent)
  useEffect(() => {
    // Delay to allow app to fully load
    const timer = setTimeout(() => {
      checkForUpdates(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
  };
}
