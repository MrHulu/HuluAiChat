/**
 * Sidebar Error Fallback Component
 * A compact error UI for sidebar errors
 */
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import i18n from "@/i18n";

interface SidebarErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
}

// Helper to get i18n text
const t = (key: string): string => i18n.t(key);

export function SidebarErrorFallback({ onReset }: SidebarErrorFallbackProps) {
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-6 h-full bg-muted/30 text-center"
      role="alert"
    >
      <div className="p-3 rounded-full bg-destructive/10 mb-3">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm font-medium mb-1">{t("errorBoundary.sidebarError")}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {t("errorBoundary.sidebarErrorDesc")}
      </p>
      <Button
        onClick={handleReset}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className="w-3 h-3" />
        {t("errorBoundary.tryAgain")}
      </Button>
    </div>
  );
}
