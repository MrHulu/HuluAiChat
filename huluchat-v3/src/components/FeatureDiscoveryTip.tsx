/**
 * FeatureDiscoveryTip Component
 * 功能发现提示 - 显示未使用功能的提示卡片
 *
 * 隐私约束：
 * - 只显示提示，不追踪用户行为
 * - 可关闭或永久关闭
 */
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FeatureConfig } from "@/hooks/useFeatureDiscovery";
import { cn } from "@/lib/utils";

export interface FeatureDiscoveryTipProps {
  /** 功能配置 */
  feature: FeatureConfig;
  /** 关闭提示回调 */
  onDismiss: () => void;
  /** 永久禁用提示回调 */
  onDisableAll: () => void;
  /** 点击操作回调 */
  onAction?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 功能发现提示组件
 */
export function FeatureDiscoveryTip({
  feature,
  onDismiss,
  onDisableAll,
  onAction,
  className,
}: FeatureDiscoveryTipProps) {
  const { t } = useTranslation();

  const handleActionClick = () => {
    onAction?.();
    onDismiss();
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "border-primary/20 dark:border-primary/30",
        "bg-gradient-to-br from-background to-muted/30",
        "dark:from-background dark:to-primary/5",
        "shadow-lg dark:shadow-primary/5",
        "animate-slide-up",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 dark:bg-primary/40" />

      <CardHeader className="pb-2 pr-10">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg",
              "flex items-center justify-center text-2xl",
              "bg-muted dark:bg-primary/10",
              "border border-border dark:border-primary/20"
            )}
            aria-hidden="true"
          >
            {feature.icon}
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">
              {t(feature.titleKey)}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {t(feature.descriptionKey)}
            </CardDescription>
          </div>
        </div>

        {/* More options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={t("featureDiscovery.moreOptions")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDismiss}>
              {t("featureDiscovery.dismiss")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDisableAll} className="text-muted-foreground">
              {t("featureDiscovery.dontShowAgain")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          onClick={handleActionClick}
          size="sm"
          className="w-full sm:w-auto"
        >
          {t(feature.actionKey)}
        </Button>
      </CardContent>
    </Card>
  );
}

export default FeatureDiscoveryTip;
