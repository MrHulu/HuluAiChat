/**
 * ModelSelector Component
 * 模型选择下拉框，用于快速切换 AI 模型
 */
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ModelInfo } from "@/api/client";

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
}

export function ModelSelector({
  value,
  models,
  onChange,
  isLoading = false,
  disabled = false,
}: ModelSelectorProps) {
  const currentModel = models.find((m) => m.id === value);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 max-w-[180px]"
        >
          <span className="truncate">{currentModel?.name || value}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onChange(model.id)}
            className={cn(
              "flex items-center justify-between",
              value === model.id && "bg-accent"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </div>
            {value === model.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
