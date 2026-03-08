/**
 * UpdateNotification - Auto-Update Notification Component
 * Shows update available, download progress, and install actions
 */
import { Download, X, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdater } from "@/hooks";
import { cn } from "@/lib/utils";

export function UpdateNotification() {
  const { t } = useTranslation();
  const {
    updateAvailable,
    updateInfo,
    isDownloading,
    downloadProgress,
    isChecking,
    downloadAndInstall,
    dismissUpdate,
    checkForUpdates,
  } = useUpdater();

  if (!updateAvailable && !isChecking) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
      role="status"
      aria-live="polite"
      aria-label={t("update.notificationLabel")}
    >
      <div className="bg-card border border-border rounded-xl shadow-lg dark:shadow-xl dark:shadow-black/20 p-4 backdrop-blur-sm">
        {isChecking ? (
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="text-sm">{t("update.checking")}</span>
          </div>
        ) : isDownloading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary animate-bounce" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("update.downloading")}</p>
                <p className="text-xs text-muted-foreground">
                  v{updateInfo?.version} - {downloadProgress}%
                </p>
              </div>
            </div>
            <div
              className="w-full bg-muted rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={downloadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("update.downloadProgress")}
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${downloadProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg transition-transform duration-200 hover:scale-105">
                  <RefreshCw className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("update.newVersion")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("update.available", { version: updateInfo?.version })}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissUpdate}
                aria-label={t("common.close")}
                className={cn(
                  "text-muted-foreground transition-all duration-150 rounded-md p-1",
                  "hover:text-foreground hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "active:scale-95"
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {updateInfo?.body && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {updateInfo.body}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={downloadAndInstall}
                aria-label={t("update.updateNow")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "transition-all duration-200 ease-out",
                  "hover:bg-primary/90 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "active:scale-[0.98]"
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("update.updateNow")}
              </button>
              <button
                onClick={() => checkForUpdates(false)}
                aria-label={t("update.later")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "text-muted-foreground",
                  "transition-all duration-200 ease-out",
                  "hover:text-foreground hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "active:scale-[0.98]"
                )}
              >
                {t("update.later")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
