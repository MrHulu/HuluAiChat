/**
 * OllamaStatus Component
 * 显示 Ollama 服务状态和本地模型信息
 */
import { Server, Loader2, RefreshCw } from "lucide-react";
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
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {/* 状态指示器 */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            available
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
          )}
        >
          <Server className="h-4 w-4" />
        </div>

        {/* 状态信息 */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {available ? "Ollama 在线" : "Ollama 离线"}
          </span>
          {available && (
            <span className="text-xs text-muted-foreground">
              {modelCount} 个本地模型
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
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span className="sr-only">刷新状态</span>
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
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          available
            ? "bg-green-500 animate-pulse"
            : "bg-gray-400"
        )}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {available ? `${modelCount} 本地` : "离线"}
        </span>
      )}
    </div>
  );
}
