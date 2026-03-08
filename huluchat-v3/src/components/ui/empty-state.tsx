/**
 * EmptyState Component
 * 统一的空状态展示组件，支持深色模式增强
 */
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type EmptyStateSize = "sm" | "md" | "lg";

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
    container: "p-8",
    icon: "text-5xl mb-4",
    title: "text-lg font-medium",
    description: "text-sm mt-2",
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
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "text-center",
        config.container,
        // 基础样式
        "rounded-2xl",
        "transition-all duration-300 ease-out",
        // 深色模式增强 - Cycle #196
        "dark:bg-gradient-to-br dark:from-muted/25 dark:to-muted/15",
        "dark:border dark:border-white/[0.06]",
        "dark:shadow-[0_4px_24px_oklch(0_0_0/0.2),0_0_32px_oklch(0.4_0.1_264/0.05)]",
        "dark:backdrop-blur-sm",
        // 进入动画
        "animate-bounce-in",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* 图标容器 */}
      {icon && (
        <div
          className={cn(
            config.icon,
            // 深色模式图标发光效果 - Cycle #196
            "dark:drop-shadow-[0_0_12px_oklch(0.6_0.15_264/0.25)]",
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
          config.title,
          "text-muted-foreground",
          // 深色模式标题增强 - Cycle #196
          "dark:text-foreground/90"
        )}
      >
        {title}
      </p>

      {/* 描述 */}
      {description && (
        <p
          className={cn(
            config.description,
            "text-muted-foreground/70"
          )}
        >
          {description}
        </p>
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
        "flex items-center justify-center gap-2 py-3 px-3",
        "text-muted-foreground text-sm",
        // 深色模式增强 - Cycle #196
        "dark:bg-muted/10",
        "dark:border dark:border-white/5",
        "dark:rounded-lg",
        "dark:shadow-sm dark:shadow-black/10",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <span
          className={cn(
            "text-base opacity-50",
            "dark:drop-shadow-[0_0_8px_oklch(0.5_0.1_264/0.2)]"
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span>{title}</span>
    </div>
  );
}

export default EmptyState;
