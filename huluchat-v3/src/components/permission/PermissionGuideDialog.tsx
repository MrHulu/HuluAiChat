/**
 * PermissionGuideDialog - macOS Accessibility Permission Guide
 *
 * A dialog that guides users to enable Accessibility permission on macOS
 * for global shortcuts to work properly.
 *
 * PRIVACY: All data stays local, no analytics
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ExternalLink, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PermissionStatus } from "@/hooks/useAccessibilityPermission";

interface PermissionGuideDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current permission status */
  status: PermissionStatus;
  /** Callback to open system settings */
  onOpenSettings: () => Promise<void>;
  /** Callback to dismiss for this session */
  onDismiss: () => void;
  /** Callback to permanently dismiss the dialog */
  onDismissPermanently: () => void;
  /** Callback to re-check permission status */
  onRecheck: () => void;
}

/**
 * PermissionGuideDialog Component
 *
 * Shows a step-by-step guide for enabling Accessibility permission on macOS
 */
export function PermissionGuideDialog({
  open,
  onOpenChange,
  status,
  onOpenSettings,
  onDismiss,
  onDismissPermanently,
  onRecheck,
}: PermissionGuideDialogProps) {
  const { t } = useTranslation();
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  const handleOpenSettings = async () => {
    setIsOpeningSettings(true);
    try {
      await onOpenSettings();
    } catch (error) {
      console.error("Failed to open settings:", error);
    } finally {
      // Keep button disabled for a bit to show feedback
      setTimeout(() => setIsOpeningSettings(false), 2000);
    }
  };

  const steps = [
    {
      number: 1,
      title: t("permission.guide.step1.title"),
      description: t("permission.guide.step1.description"),
    },
    {
      number: 2,
      title: t("permission.guide.step2.title"),
      description: t("permission.guide.step2.description"),
    },
    {
      number: 3,
      title: t("permission.guide.step3.title"),
      description: t("permission.guide.step3.description"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          "animate-in zoom-in-95 duration-200"
        )}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-lg">
              {t("permission.guide.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {t("permission.guide.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Why is this needed? */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">
              {t("permission.guide.whyNeeded")}
            </p>
          </div>

          {/* Step-by-step guide */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {step.number}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                status === "granted" && "bg-green-500",
                status === "denied" && "bg-red-500",
                status === "checking" && "bg-amber-500 animate-pulse"
              )}
            />
            <span className="text-sm text-muted-foreground">
              {status === "granted" && t("permission.status.granted")}
              {status === "denied" && t("permission.status.denied")}
              {status === "checking" && t("permission.status.checking")}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecheck}
              disabled={status === "checking"}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-1",
                  status === "checking" && "animate-spin"
                )}
              />
              {t("permission.guide.recheck")}
            </Button>
            <Button
              size="sm"
              onClick={handleOpenSettings}
              disabled={isOpeningSettings}
              className="flex-1 sm:flex-none"
            >
              <Settings className="h-4 w-4 mr-1" />
              {isOpeningSettings
                ? t("permission.guide.opening")
                : t("permission.guide.openSettings")}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-muted-foreground"
            >
              {t("permission.guide.remindLater")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissPermanently}
              className="text-muted-foreground"
            >
              {t("permission.guide.dontShowAgain")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PermissionGuideDialog;
