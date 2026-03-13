/**
 * ModelSelectorDialog Component
 * TASK-233 Phase 5: Dialog for selecting a different model to regenerate AI response
 */
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModelInfo, OllamaModel } from "@/api/client";
import { Sparkles, Zap, Cpu, Bot, Star, Check } from "lucide-react";

export interface ModelSelectorDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Available models from API */
  models: ModelInfo[];
  /** Current model ID */
  currentModel?: string;
  /** Ollama models if available */
  ollamaModels?: OllamaModel[];
  /** Whether Ollama is available */
  ollamaAvailable?: boolean;
  /** Called when a model is selected */
  onSelectModel: (modelId: string) => void;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
  /** Recommended model ID */
  recommendedModel?: string | null;
}

/**
 * Get provider icon for a model
 */
function getProviderIcon(provider?: string, modelId?: string) {
  // Check by model ID prefix for Ollama models
  if (modelId?.startsWith("ollama:")) {
    return <Cpu className="w-4 h-4" aria-hidden="true" />;
  }

  switch (provider) {
    case "ollama":
      return <Cpu className="w-4 h-4" aria-hidden="true" />;
    case "openai":
      return <Sparkles className="w-4 h-4" aria-hidden="true" />;
    default:
      return <Bot className="w-4 h-4" aria-hidden="true" />;
  }
}

/**
 * Group models by provider
 */
function groupModelsByProvider(models: ModelInfo[]): Record<string, ModelInfo[]> {
  const groups: Record<string, ModelInfo[]> = {};

  for (const model of models) {
    const provider = model.provider || "other";
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
  }

  return groups;
}

/**
 * Get provider display name
 */
function getProviderDisplayName(provider: string, t: (key: string) => string): string {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "ollama":
      return t("chat.modelSelector.ollamaLocal");
    default:
      return provider;
  }
}

export const ModelSelectorDialog = memo(function ModelSelectorDialog({
  open,
  onOpenChange,
  models,
  currentModel,
  ollamaModels = [],
  ollamaAvailable = false,
  onSelectModel,
  isRegenerating = false,
  recommendedModel,
}: ModelSelectorDialogProps) {
  const { t } = useTranslation();

  // Combine API models with Ollama models
  const allModels = useMemo(() => {
    const combined = [...models];

    // Add Ollama models if available
    if (ollamaAvailable && ollamaModels.length > 0) {
      for (const ollamaModel of ollamaModels) {
        // Check if already in list
        const existing = combined.find(
          (m) => m.id === `ollama:${ollamaModel.name}` || m.id === ollamaModel.name
        );
        if (!existing) {
          combined.push({
            id: ollamaModel.name,
            name: ollamaModel.name,
            description: t("chat.modelSelector.localModel"),
            provider: "ollama",
          });
        }
      }
    }

    return combined;
  }, [models, ollamaModels, ollamaAvailable, t]);

  // Group models by provider
  const groupedModels = useMemo(
    () => groupModelsByProvider(allModels),
    [allModels]
  );

  // Provider order for display
  const providerOrder = useMemo(() => {
    const providers = Object.keys(groupedModels);
    // Sort: openai first, then ollama, then others
    return providers.sort((a, b) => {
      if (a === "openai") return -1;
      if (b === "openai") return 1;
      if (a === "ollama") return -1;
      if (b === "ollama") return 1;
      return a.localeCompare(b);
    });
  }, [groupedModels]);

  // Handle model selection
  const handleSelectModel = useCallback(
    (modelId: string) => {
      if (modelId !== currentModel && !isRegenerating) {
        onSelectModel(modelId);
        onOpenChange(false);
      }
    },
    [currentModel, isRegenerating, onSelectModel, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("chat.modelSelector.title")}
          </DialogTitle>
          <DialogDescription>
            {t("chat.modelSelector.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {providerOrder.map((provider) => (
            <div key={provider} className="mb-4 last:mb-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
                {getProviderDisplayName(provider, t)}
              </h3>
              <div className="space-y-1">
                {groupedModels[provider].map((model) => {
                  const isCurrent = model.id === currentModel;
                  const isRecommended = model.id === recommendedModel;
                  const isDisabled = isRegenerating;

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(model.id)}
                      disabled={isDisabled}
                      aria-label={t("chat.modelSelector.selectModel", {
                        model: model.name,
                      })}
                      aria-current={isCurrent ? "true" : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-left transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        // Hover state
                        !isDisabled && "hover:bg-accent hover:scale-[1.01]",
                        // Current model
                        isCurrent && "bg-primary/10 border border-primary/30",
                        // Recommended model
                        isRecommended && !isCurrent && "bg-amber-500/10",
                        // Disabled state
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* Provider icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 p-2 rounded-md",
                          isCurrent
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {getProviderIcon(model.provider, model.id)}
                      </div>

                      {/* Model info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium truncate",
                              isCurrent && "text-primary"
                            )}
                          >
                            {model.name}
                          </span>
                          {isRecommended && (
                            <Star
                              className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
                              aria-label={t("chat.modelSelector.recommended")}
                            />
                          )}
                          {isCurrent && (
                            <Check
                              className="w-4 h-4 text-primary flex-shrink-0"
                              aria-label={t("chat.modelSelector.currentModel")}
                            />
                          )}
                        </div>
                        {model.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {model.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow indicator */}
                      {!isCurrent && !isDisabled && (
                        <div
                          className={cn(
                            "flex-shrink-0 text-muted-foreground/50",
                            "transition-transform duration-200",
                            "group-hover:translate-x-1"
                          )}
                        >
                          →
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
