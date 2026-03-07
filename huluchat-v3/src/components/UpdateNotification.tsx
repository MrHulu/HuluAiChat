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
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        {isChecking ? (
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm">{t("update.checking")}</span>
          </div>
        ) : isDownloading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary animate-bounce" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("update.downloading")}</p>
                <p className="text-xs text-muted-foreground">
                  v{updateInfo?.version} - {downloadProgress}%
                </p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <RefreshCw className="h-4 w-4 text-primary" />
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
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                <X className="h-4 w-4" />
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
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                  "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <Download className="h-4 w-4" />
                {t("update.updateNow")}
              </button>
              <button
                onClick={() => checkForUpdates(false)}
                aria-label={t("update.later")}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
