/**
 * Loading Component
 * 统一的加载动画组件，支持多种风格
 */
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type LoadingVariant = "spinner" | "dots" | "pulse" | "ring";
export type LoadingSize = "sm" | "md" | "lg";

export interface LoadingProps {
  /** 动画类型 */
  variant?: LoadingVariant;
  /** 大小 */
  size?: LoadingSize;
  /** 额外的类名 */
  className?: string;
  /** 显示文字 */
  text?: string;
  /** 居中显示 */
  center?: boolean;
}

const sizeMap: Record<LoadingSize, { spinner: string; dots: string; gap: string }> = {
  sm: { spinner: "w-4 h-4", dots: "w-1.5 h-1.5", gap: "gap-0.5" },
  md: { spinner: "w-5 h-5", dots: "w-2 h-2", gap: "gap-1" },
  lg: { spinner: "w-8 h-8", dots: "w-3 h-3", gap: "gap-1.5" },
};

/**
 * 旋转加载器
 */
function SpinnerLoader({ size, className }: { size: LoadingSize; className?: string }) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-primary",
        sizeMap[size].spinner,
        className
      )}
    />
  );
}

/**
 * 三个跳动点加载器
 */
function DotsLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const dotSize = sizeMap[size].dots;
  const gap = sizeMap[size].gap;

  return (
    <div className={cn("flex items-center", gap, className)}>
      <span
        className={cn(
          "bg-current rounded-full animate-bounce text-muted-foreground",
          dotSize
        )}
        style={{ animationDelay: "0ms", animationDuration: "600ms" }}
      />
      <span
        className={cn(
          "bg-current rounded-full animate-bounce text-muted-foreground",
          dotSize
        )}
        style={{ animationDelay: "150ms", animationDuration: "600ms" }}
      />
      <span
        className={cn(
          "bg-current rounded-full animate-bounce text-muted-foreground",
          dotSize
        )}
        style={{ animationDelay: "300ms", animationDuration: "600ms" }}
      />
    </div>
  );
}

/**
 * 脉冲加载器
 */
function PulseLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const sizeClass = sizeMap[size].spinner;

  return (
    <div className={cn("relative", sizeClass, className)}>
      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      <div className="absolute inset-1 rounded-full bg-primary/50 animate-pulse" />
    </div>
  );
}

/**
 * 环形加载器
 */
function RingLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const sizeClass = sizeMap[size].spinner;

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary/30 border-t-primary",
        sizeClass,
        className
      )}
    />
  );
}

/**
 * 统一加载组件
 *
 * @example
 * // 基本用法
 * <Loading />
 *
 * // 带文字
 * <Loading text="思考中..." />
 *
 * // 不同的动画类型
 * <Loading variant="dots" />
 * <Loading variant="pulse" />
 *
 * // 不同的尺寸
 * <Loading size="sm" />
 * <Loading size="lg" />
 */
export function Loading({
  variant = "spinner",
  size = "md",
  className,
  text,
  center = false,
}: LoadingProps) {
  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return <SpinnerLoader size={size} />;
      case "dots":
        return <DotsLoader size={size} />;
      case "pulse":
        return <PulseLoader size={size} />;
      case "ring":
        return <RingLoader size={size} />;
      default:
        return <SpinnerLoader size={size} />;
    }
  };

  const content = (
    <div className={cn("flex items-center gap-2", center && "justify-center", className)}>
      {renderLoader()}
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * 全屏加载遮罩
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Loading variant="dots" size="lg" text={text} />
    </div>
  );
}

/**
 * 行内加载指示器（用于按钮等）
 */
export function LoadingInline({ className }: { className?: string }) {
  return <Loading variant="spinner" size="sm" className={className} />;
}

export default Loading;
