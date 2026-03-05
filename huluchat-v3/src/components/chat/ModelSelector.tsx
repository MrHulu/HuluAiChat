/**
 * ModelSelector Component
 * 模型选择下拉框，用于快速切换 AI 模型
 * 支持 Cloud (OpenAI) 和 Local (Ollama) 模型分组
 */
import { Check, Loader2, Server, Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ModelInfo, ModelProvider } from "@/api/client";

export interface ModelSelectorProps {
  /** 当前选择的模型 ID */
  value: string;
  /** 可用的模型列表 */
  models: ModelInfo[];
  /** 选择模型时的回调 */
  onChange: (modelId: string) => void;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** Ollama 是否可用 */
  ollamaAvailable?: boolean;
  /** Ollama 本地模型列表 */
  ollamaModels?: Array<{ name: string }>;
}

// Provider 图标组件
function ProviderIcon({ provider }: { provider: ModelProvider }) {
  return provider === "ollama" ? (
    <Server className="h-3 w-3 text-muted-foreground" />
  ) : (
    <Cloud className="h-3 w-3 text-muted-foreground" />
  );
}

export function ModelSelector({
  value,
  models,
  onChange,
  isLoading = false,
  disabled = false,
  ollamaAvailable = false,
  ollamaModels: _ollamaModels = [],
}: ModelSelectorProps) {
  const { t } = useTranslation();
  // _ollamaModels is kept for API compatibility but not used internally
  void _ollamaModels;
  const currentModel = models.find((m) => m.id === value);

  // 按提供商分组模型
  const cloudModels = models.filter((m) => m.provider !== "ollama");
  const ollamaModelsList = models.filter((m) => m.provider === "ollama");

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  const hasCloudModels = cloudModels.length > 0;
  const hasOllamaModels = ollamaModelsList.length > 0;
  const showOllamaOffline = !ollamaAvailable && hasOllamaModels;
  // 只有混合模型时才显示分组标题
  const showGroupHeaders = hasCloudModels && hasOllamaModels;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 max-w-[180px]"
        >
          {currentModel?.provider && <ProviderIcon provider={currentModel.provider} />}
          <span className="truncate">{currentModel?.name || value}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px] max-h-[400px] overflow-y-auto">
        {/* Cloud Models 分组 */}
        {hasCloudModels && (
          <>
            {showGroupHeaders && (
              <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                <Cloud className="h-3 w-3" />
                {t("modelSelector.cloudModels")}
              </DropdownMenuLabel>
            )}
            <DropdownMenuGroup>
              {cloudModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onChange(model.id)}
                  className={cn(
                    "flex items-center justify-between gap-2",
                    value === model.id && "bg-accent"
                  )}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{model.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {model.description}
                    </span>
                  </div>
                  {value === model.id && <Check className="h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {/* 分隔线（当两类模型都存在时显示） */}
        {showGroupHeaders && <DropdownMenuSeparator />}

        {/* Ollama 分组 */}
        {(hasOllamaModels || showOllamaOffline) && (
          <>
            {showGroupHeaders && (
              <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                <Server className="h-3 w-3" />
                {t("modelSelector.localModels")}
              </DropdownMenuLabel>
            )}
            <DropdownMenuGroup>
              {hasOllamaModels ? (
                ollamaModelsList.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onChange(model.id)}
                    className={cn(
                      "flex items-center justify-between gap-2",
                      value === model.id && "bg-accent"
                    )}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{model.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {model.description}
                      </span>
                    </div>
                    {value === model.id && <Check className="h-4 w-4 shrink-0" />}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  <Server className="h-4 w-4 mx-auto mb-1 opacity-50" />
                  <p className="mb-1">{t("modelSelector.ollamaOffline")}</p>
                  <p className="text-xs">{t("modelSelector.ollamaHint")}</p>
                </div>
              )}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
