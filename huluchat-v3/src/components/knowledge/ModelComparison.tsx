/**
 * ModelComparison - 模型对比组件
 * 展示不同 AI 模型的特点、价格和适用场景
 */
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MODEL_PROVIDERS,
  MODELS,
  type ModelInfo,
  type ProviderInfo,
} from "@/data/modelComparison";

interface ModelComparisonProps {
  className?: string;
}

/**
 * 模型卡片组件
 */
function ModelCard({ model }: { model: ModelInfo }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "border rounded-lg p-4",
        "bg-card hover:bg-muted/30 transition-colors",
        "dark:border-white/10"
      )}
    >
      {/* 模型名称和分类 */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{t(model.nameKey)}</h4>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded",
            model.category === "flagship"
              ? "bg-primary/20 text-primary"
              : model.category === "local"
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {t(`knowledge.models.categories.${model.category}`)}
        </span>
      </div>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground mb-3">
        {t(model.descriptionKey)}
      </p>

      {/* 特点列表 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {model.features.map((featureKey) => (
          <span
            key={featureKey}
            className="text-xs px-2 py-0.5 bg-muted/50 rounded-full"
          >
            {t(featureKey)}
          </span>
        ))}
      </div>

      {/* 价格和速度 */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-muted-foreground">{t("knowledge.models.pricing.label")}: </span>
          <span>{t(model.pricingKey)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("knowledge.models.speed.label")}: </span>
          <span>{t(model.speedKey)}</span>
        </div>
      </div>

      {/* 适用场景 */}
      <div className="text-xs bg-muted/30 rounded p-2">
        <span className="text-muted-foreground">{t("knowledge.models.bestFor")}: </span>
        {t(model.bestForKey)}
      </div>
    </div>
  );
}

/**
 * 供应商区块组件
 */
function ProviderSection({ provider }: { provider: ProviderInfo }) {
  const { t } = useTranslation();
  const models = useMemo(
    () => MODELS.filter((m) => m.provider === provider.id),
    [provider.id]
  );

  return (
    <div className="space-y-3">
      {/* 供应商标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t(provider.nameKey)}</h3>
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            {t("knowledge.models.visitWebsite")}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {/* 供应商描述 */}
      <p className="text-xs text-muted-foreground">{t(provider.descriptionKey)}</p>

      {/* 模型列表 */}
      <div className="grid gap-3">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}

export function ModelComparison({ className }: ModelComparisonProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-6", className)}>
      {/* 标题 */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground px-1">
          {t("knowledge.models.title")}
        </h3>
        <p className="text-xs text-muted-foreground px-1">
          {t("knowledge.models.subtitle")}
        </p>
      </div>

      {/* 供应商和模型 */}
      {MODEL_PROVIDERS.map((provider) => (
        <ProviderSection key={provider.id} provider={provider} />
      ))}

      {/* 选择建议 */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t dark:border-white/10">
        {t("knowledge.models.selectionTip")}
      </div>
    </div>
  );
}
