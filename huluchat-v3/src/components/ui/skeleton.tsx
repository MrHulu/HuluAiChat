/**
 * Skeleton Component
 * 骨架屏加载占位组件，用于内容加载前的占位显示
 */
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  /** 额外的类名 */
  className?: string;
  /** 是否开启动画 */
  animate?: boolean;
}

/**
 * 基础骨架屏组件
 *
 * @example
 * // 基本用法
 * <Skeleton className="h-4 w-full" />
 *
 * // 圆形头像骨架
 * <Skeleton className="h-10 w-10 rounded-full" />
 *
 * // 卡片骨架
 * <div className="space-y-2">
 *   <Skeleton className="h-4 w-3/4" />
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-1/2" />
 * </div>
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        animate && "animate-shimmer",
        "bg-gradient-to-r from-muted via-muted/70 to-muted bg-[length:200%_100%]",
        className
      )}
    />
  );
}

/**
 * 文本行骨架
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * 头像骨架
 */
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Skeleton
      className={cn(
        "rounded-full",
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * 消息骨架
 */
export function SkeletonMessage({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 p-4", className)}>
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

/**
 * 会话列表项骨架
 */
export function SkeletonSessionItem({ className }: { className?: string }) {
  return (
    <div className={cn("p-3 space-y-2", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/**
 * 卡片骨架
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border p-4 space-y-3", className)}>
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export default Skeleton;
