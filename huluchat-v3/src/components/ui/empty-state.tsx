/**
 * EmptyState Component
 * 统一的空状态展示组件，支持深色模式增强
 */
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateAction {
  /** 按钮文字 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
  /** 按钮图标 */
  icon?: ReactNode;
  /** 按钮样式变体 */
  variant?: "default" | "outline" | "ghost" | "link";
}

export interface EmptyStateProps {
  /** 图标（可以是 emoji 或 ReactNode） */
  icon?: ReactNode;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 尺寸 */
  size?: EmptyStateSize;
  /** 额外的类名 */
  className?: string;
  /** 自定义图标容器类名 */
  iconClassName?: string;
  /** 是否显示动画 */
  animated?: boolean;
  /** 快捷操作按钮 */
  action?: EmptyStateAction;
  /** 快捷提示列表 */
  hints?: string[];
  /** 快捷提示点击回调 */
  onHintClick?: (hint: string) => void;
}

const sizeConfig = {
  sm: {
    container: "py-4 px-4",
    icon: "text-3xl mb-2",
    title: "text-sm font-medium",
    description: "text-xs mt-1",
  },
  md: {
    container: "py-6 px-6",
    icon: "text-4xl mb-3",
    title: "text-base font-medium",
    description: "text-sm mt-1.5",
  },
  lg: {
    container: "p-10",
    icon: "text-6xl mb-5",
    title: "text-xl font-semibold",
    description: "text-sm mt-3",
  },
};

/**
 * 统一空状态组件
 *
 * @example
 * // 基本用法
 * <EmptyState
 *   icon="💬"
 *   title="开始对话"
 *   description="输入消息开始新的对话"
 * />
 *
 * // 小尺寸
 * <EmptyState
 *   icon={<IconComponent />}
 *   title="暂无数据"
 *   size="sm"
 * />
 *
 * // 深色模式自动增强
 */
export function EmptyState({
  icon,
  title,
  description,
  size = "md",
  className,
  iconClassName,
  animated = true,
  action,
  hints,
  onHintClick,
}: EmptyStateProps) {
  const config = sizeConfig[size];
  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "text-center relative overflow-hidden",
        config.container,
        // 基础样式
        "rounded-2xl",
        "transition-all duration-300 ease-out",
        // 浅色模式增强 - Cycle #158
        "bg-gradient-to-b from-muted/40 to-muted/20",
        "border border-border/50",
        "shadow-sm hover:shadow-md",
        // 深色模式增强 - Cycle #196 + #158
        "dark:bg-gradient-to-br dark:from-muted/30 dark:via-muted/20 dark:to-muted/10",
        "dark:border dark:border-white/[0.08]",
        "dark:shadow-[0_4px_24px_oklch(0_0_0/0.25),0_0_40px_oklch(0.4_0.1_264/0.08)]",
        "dark:backdrop-blur-md",
        "dark:hover:shadow-[0_8px_32px_oklch(0_0_0/0.3),0_0_48px_oklch(0.5_0.15_264/0.12)]",
        // 进入动画
        "animate-bounce-in",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* 装饰性背景光晕 - 仅大尺寸显示 - Cycle #158 */}
      {isLarge && (
        <>
          <div
            className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl animate-pulse"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-primary/3 dark:bg-primary/8 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
            aria-hidden="true"
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-radial from-primary/5 to-transparent dark:from-primary/8 dark:to-transparent"
            aria-hidden="true"
          />
        </>
      )}

      {/* 图标容器 */}
      {icon && (
        <div
          className={cn(
            "relative z-10",
            config.icon,
            // 浅色模式增强
            "drop-shadow-sm",
            // 深色模式图标发光效果 - Cycle #196 + #158
            "dark:drop-shadow-[0_0_16px_oklch(0.6_0.18_264/0.35)]",
            iconClassName,
            animated && "animate-bounce"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* 标题 */}
      <p
        className={cn(
          "relative z-10",
          config.title,
          "text-foreground/80",
          // 深色模式标题增强 - Cycle #196 + #158
          "dark:text-foreground/95"
        )}
      >
        {title}
      </p>

      {/* 描述 */}
      {description && (
        <p
          className={cn(
            "relative z-10",
            config.description,
            "text-muted-foreground/80 leading-relaxed",
            // 深色模式描述增强
            "dark:text-muted-foreground/90"
          )}
        >
          {description}
        </p>
      )}

      {/* 快捷提示列表 - Cycle #158 增强版 */}
      {hints && hints.length > 0 && onHintClick && (
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2.5">
          {hints.map((hint, index) => (
            <button
              key={index}
              onClick={() => onHintClick(hint)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-full",
                // 浅色模式
                "bg-background/60 hover:bg-background",
                "text-muted-foreground hover:text-foreground",
                "border border-border/40 hover:border-primary/40",
                "shadow-sm hover:shadow",
                // 交互效果
                "transition-all duration-200 ease-out",
                "hover:scale-105 active:scale-95",
                "animate-list-enter",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                // Dark mode enhancements - Cycle #158
                "dark:bg-primary/8 dark:hover:bg-primary/15",
                "dark:border-primary/15 dark:hover:border-primary/35",
                "dark:text-primary/75 dark:hover:text-primary",
                "dark:shadow-none dark:hover:shadow-[0_0_12px_oklch(0.5_0.15_264/0.18)]",
                "dark:hover:backdrop-blur-sm"
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* 快捷操作按钮 */}
      {action && (
        <div className="mt-6 relative z-10">
          <Button
            variant={action.variant || "default"}
            size="sm"
            onClick={action.onClick}
            className={cn(
              "transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "shadow-sm hover:shadow-md",
              // Dark mode glow - Cycle #158
              "dark:hover:shadow-[0_0_16px_oklch(0.5_0.2_264/0.4)]",
              "dark:active:shadow-[0_0_8px_oklch(0.4_0.2_264/0.2)]"
            )}
          >
            {action.icon && (
              <span className="mr-1.5" aria-hidden="true">
                {action.icon}
              </span>
            )}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑型空状态（用于侧边栏等小区域）
 */
export function EmptyStateCompact({
  icon,
  title,
  className,
}: {
  icon?: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 py-3 px-3",
        "text-muted-foreground text-sm",
        // 浅色模式增强 - Cycle #158
        "bg-muted/30 rounded-lg border border-transparent",
        "hover:bg-muted/40 hover:border-border/50",
        // 深色模式增强 - Cycle #196 + #158
        "dark:bg-muted/15",
        "dark:border dark:border-white/[0.08]",
        "dark:shadow-sm dark:shadow-black/5",
        "dark:hover:bg-muted/25 dark:hover:border-white/[0.12]",
        // 进入动画 - Cycle #244
        "animate-fade-in",
        "transition-all duration-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <span
          className={cn(
            "text-base opacity-60",
            "dark:drop-shadow-[0_0_8px_oklch(0.5_0.1_264/0.15)]",
            "dark:opacity-70"
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="dark:text-foreground/70">{title}</span>
    </div>
  );
}

export default EmptyState;
