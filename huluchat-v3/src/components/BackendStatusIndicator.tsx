/**
 * BackendStatusIndicator Component
 * Displays backend health status with visual indicator
 *
 * Privacy-first: Only displays current status, no tracking
 */
import { useTranslation } from "react-i18next";
import { Server, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type BackendStatus } from "@/hooks/useBackendHealth";

export interface BackendStatusIndicatorProps {
  status: BackendStatus;
  version: string | null;
  isRecovering: boolean;
  lastChecked: Date | null;
  onRetry: () => void;
  className?: string;
  /** Whether to show compact mode (icon only) */
  compact?: boolean;
}

/**
 * Status indicator component for backend health
 */
export function BackendStatusIndicator({
  status,
  version,
  isRecovering,
  lastChecked,
  onRetry,
  className,
  compact = true,
}: BackendStatusIndicatorProps) {
  const { t } = useTranslation();

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (status) {
      case "healthy":
        return {
          icon: CheckCircle,
          color: "text-success dark:text-success",
          bgColor: "bg-success/10 dark:bg-success/20",
          label: t("backend.healthy"),
          description: version
            ? t("backend.healthyDescription", { version })
            : t("backend.healthyDescriptionNoVersion"),
        };
      case "degraded":
        return {
          icon: AlertTriangle,
          color: "text-warning dark:text-warning",
          bgColor: "bg-warning/10 dark:bg-warning/20",
          label: t("backend.degraded"),
          description: t("backend.degradedDescription"),
        };
      case "offline":
        return {
          icon: XCircle,
          color: "text-destructive dark:text-destructive",
          bgColor: "bg-destructive/10 dark:bg-destructive/20",
          label: t("backend.offline"),
          description: t("backend.offlineDescription"),
        };
      case "checking":
      default:
        return {
          icon: Server,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          label: t("backend.checking"),
          description: t("backend.checkingDescription"),
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const isOfflineOrRecovering = status === "offline" || isRecovering;

  // Format last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) {
      return t("backend.lastCheckedJustNow");
    } else if (diffSecs < 3600) {
      const mins = Math.floor(diffSecs / 60);
      return t("backend.lastCheckedMinutes", { count: mins });
    } else {
      const hours = Math.floor(diffSecs / 3600);
      return t("backend.lastCheckedHours", { count: hours });
    }
  };

  // Compact mode - just icon with tooltip
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors",
              statusDisplay.bgColor,
              isOfflineOrRecovering && "animate-pulse",
              className
            )}
            role="status"
            aria-live="polite"
            aria-label={statusDisplay.label}
          >
            <StatusIcon
              className={cn(
                "h-4 w-4",
                statusDisplay.color,
                (status === "checking" || isRecovering) && "animate-spin"
              )}
              aria-hidden="true"
            />
            {!compact && (
              <span className={cn("text-xs font-medium", statusDisplay.color)}>
                {statusDisplay.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("h-4 w-4", statusDisplay.color)} />
              <span className="font-medium">{statusDisplay.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {statusDisplay.description}
            </p>
            {lastChecked && (
              <p className="text-xs text-muted-foreground">
                {formatLastChecked()}
              </p>
            )}
            {status === "offline" && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  onRetry();
                }}
                disabled={isRecovering}
                className="w-full mt-2"
              >
                {isRecovering ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {t("backend.retry")}
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full mode - icon + label + retry button
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        statusDisplay.bgColor,
        status === "offline" && "border-destructive/30",
        status === "healthy" && "border-success/30",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <StatusIcon
        className={cn(
          "h-5 w-5",
          statusDisplay.color,
          (status === "checking" || isRecovering) && "animate-spin"
        )}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", statusDisplay.color)}>
          {statusDisplay.label}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {statusDisplay.description}
        </p>
      </div>
      {status === "offline" && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRecovering}
        >
          {isRecovering ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          {t("backend.retry")}
        </Button>
      )}
    </div>
  );
}
