/**
 * ContextualTip Component
 * 上下文智能提示组件 - 基于当前状态显示智能建议
 *
 * 隐私约束：
 * - 只显示提示，不追踪用户行为
 * - 可关闭或永久关闭
 */
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContextualTipConfig } from "@/data/contextualTips";
import { cn } from "@/lib/utils";

export interface ContextualTipProps {
  /** 提示配置 */
  tip: ContextualTipConfig;
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
 * 上下文智能提示组件
 */
export function ContextualTip({
  tip,
  onDismiss,
  onDisableAll,
  onAction,
  className,
}: ContextualTipProps) {
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
            {tip.icon}
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">
              {t(tip.titleKey)}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {t(tip.descriptionKey)}
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
              aria-label={t("contextualTips.moreOptions")}
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
              {t("contextualTips.dismiss")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDisableAll}
              className="text-muted-foreground"
            >
              {t("contextualTips.dontShowAgain")}
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
          {t(tip.actionKey)}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ContextualTip;
