/**
 * OllamaStatus Component
 * 显示 Ollama 服务状态和本地模型信息
 */
import { Server, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OllamaStatusProps {
  /** Ollama 服务是否可用 */
  available: boolean;
  /** 本地模型数量 */
  modelCount: number;
  /** 刷新状态回调 */
  onRefresh: () => void;
  /** 是否正在刷新 */
  isRefreshing?: boolean;
  /** 服务 URL */
  baseUrl?: string;
  /** 版本信息 */
  version?: string;
}

export function OllamaStatus({
  available,
  modelCount,
  onRefresh,
  isRefreshing = false,
  baseUrl,
  version,
}: OllamaStatusProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border bg-card"
      role="status"
      aria-live="polite"
      aria-label={available ? t("ollama.online") : t("ollama.offline")}
    >
      <div className="flex items-center gap-3">
        {/* 状态指示器 */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            available
              ? "bg-success/20 text-success"
              : "bg-muted text-muted-foreground"
          )}
          aria-hidden="true"
        >
          <Server className="h-4 w-4" />
        </div>

        {/* 状态信息 */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {available ? t("ollama.online") : t("ollama.offline")}
          </span>
          {available && (
            <span className="text-xs text-muted-foreground">
              {t("ollama.models", { count: modelCount })}
              {version && ` · ${version}`}
            </span>
          )}
          {!available && baseUrl && (
            <span className="text-xs text-muted-foreground">{baseUrl}</span>
          )}
        </div>
      </div>

      {/* 刷新按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-8 w-8"
        aria-label={t("ollama.refreshStatus")}
        aria-busy={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only">{t("ollama.refreshStatus")}</span>
      </Button>
    </div>
  );
}

/**
 * 紧凑版 Ollama 状态指示器
 * 用于侧边栏等空间受限的地方
 */
export interface OllamaStatusIndicatorProps {
  available: boolean;
  modelCount: number;
  showText?: boolean;
}

export function OllamaStatusIndicator({
  available,
  modelCount,
  showText = true,
}: OllamaStatusIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={available
        ? t("ollama.models", { count: modelCount })
        : t("ollama.offline")}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          available
            ? "bg-success animate-pulse"
            : "bg-muted-foreground"
        )}
        aria-hidden="true"
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {available ? `${modelCount} ${t("ollama.online")}` : t("ollama.offline")}
        </span>
      )}
      {!showText && (
        <span className="sr-only">
          {available
            ? t("ollama.models", { count: modelCount })
            : t("ollama.offline")}
        </span>
      )}
    </div>
  );
}
