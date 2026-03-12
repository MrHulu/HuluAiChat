/**
 * ModelSelector Component
 * 模型选择下拉框，用于快速切换 AI 模型
 * 支持 Cloud (OpenAI) 和 Local (Ollama) 模型分组
 * 支持本地偏好学习推荐标记（隐私优先）
 */
import { Check, Loader2, Server, Cloud, Star } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  /** 推荐的模型 ID */
  recommendedModel?: string | null;
}

// Provider 图标组件
function ProviderIcon({ provider }: { provider: ModelProvider }) {
  return provider === "ollama" ? (
    <Server className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
  ) : (
    <Cloud className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
  recommendedModel = null,
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
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        <span>{t("modelSelector.loading")}</span>
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
          className="group/model gap-2 max-w-[180px] transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95 disabled:hover:scale-100"
          aria-label={t("modelSelector.selectModel")}
          aria-haspopup="listbox"
        >
          {currentModel?.provider && (
            <span className="transition-transform duration-200 group-hover/model:scale-110">
              <ProviderIcon provider={currentModel.provider} />
            </span>
          )}
          <span className="truncate">{currentModel?.name || value}</span>
          {recommendedModel && value === recommendedModel && (
            <Star className="h-3 w-3 text-yellow-500 shrink-0" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px] max-h-[400px] overflow-y-auto">
        {/* Cloud Models 分组 */}
        {hasCloudModels && (
          <>
            {showGroupHeaders && (
              <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                <Cloud className="h-3 w-3" aria-hidden="true" />
                {t("modelSelector.cloudModels")}
              </DropdownMenuLabel>
            )}
            <DropdownMenuGroup>
              {cloudModels.map((model, index) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onChange(model.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 transition-all duration-200 ease-out",
                    "hover:bg-accent/50 hover:translate-x-0.5",
                    "animate-list-enter",
                    value === model.id && "bg-accent"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{model.name}</span>
                      {recommendedModel === model.id && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                          <Star className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                          {t("modelSelector.recommended")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {model.description}
                    </span>
                  </div>
                  {value === model.id && <Check className="h-4 w-4 shrink-0 animate-scale-in transition-transform duration-200 hover:scale-110" aria-hidden="true" />}
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
                <Server className="h-3 w-3" aria-hidden="true" />
                {t("modelSelector.localModels")}
              </DropdownMenuLabel>
            )}
            <DropdownMenuGroup>
              {hasOllamaModels ? (
                ollamaModelsList.map((model, index) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onChange(model.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 transition-all duration-150",
                      "hover:bg-accent/50 hover:translate-x-0.5",
                      "animate-list-enter",
                      value === model.id && "bg-accent"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{model.name}</span>
                        {recommendedModel === model.id && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                            <Star className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                            {t("modelSelector.recommended")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {model.description}
                      </span>
                    </div>
                    {value === model.id && <Check className="h-4 w-4 shrink-0 animate-scale-in transition-transform duration-200 hover:scale-110" aria-hidden="true" />}
                  </DropdownMenuItem>
                ))
              ) : (
                <div
                  className="px-2 py-3 text-sm text-muted-foreground text-center"
                  role="status"
                  aria-live="polite"
                >
                  <Server className="h-4 w-4 mx-auto mb-1 opacity-50" aria-hidden="true" />
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
