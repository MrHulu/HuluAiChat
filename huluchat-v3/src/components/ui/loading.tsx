/**
 * Loading Component
 * 统一的加载动画组件，支持多种风格
 */
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { t } from "@/i18n";

export type LoadingVariant = "spinner" | "dots" | "pulse" | "ring" | "wave" | "thinking";
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
  /** 无障碍标签 */
  ariaLabel?: string;
}

const sizeMap: Record<LoadingSize, { spinner: string; dots: string; gap: string; wave: string }> = {
  sm: { spinner: "w-4 h-4", dots: "w-1.5 h-1.5", gap: "gap-0.5", wave: "w-1 h-3" },
  md: { spinner: "w-5 h-5", dots: "w-2 h-2", gap: "gap-1", wave: "w-1.5 h-4" },
  lg: { spinner: "w-8 h-8", dots: "w-3 h-3", gap: "gap-1.5", wave: "w-2 h-6" },
};

/**
 * 旋转加载器
 */
function SpinnerLoader({ size, className }: { size: LoadingSize; className?: string }) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-primary transition-opacity duration-200",
        sizeMap[size].spinner,
        className
      )}
    />
  );
}

/**
 * 三个跳动点加载器（优化版）
 * 使用 scale + opacity 动画，更加流畅优雅
 */
function DotsLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const dotSize = sizeMap[size].dots;
  const gap = sizeMap[size].gap;

  return (
    <div className={cn("flex items-center", gap, className)}>
      <span
        className={cn(
          "rounded-full bg-primary",
          "animate-[dotPulse_1.2s_ease-in-out_infinite]",
          "will-change-transform",
          dotSize
        )}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={cn(
          "rounded-full bg-primary",
          "animate-[dotPulse_1.2s_ease-in-out_infinite]",
          "will-change-transform",
          dotSize
        )}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={cn(
          "rounded-full bg-primary",
          "animate-[dotPulse_1.2s_ease-in-out_infinite]",
          "will-change-transform",
          dotSize
        )}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

/**
 * 波浪加载器
 */
function WaveLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const waveSize = sizeMap[size].wave;
  const gap = sizeMap[size].gap;

  return (
    <div className={cn("flex items-end", gap, className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-primary",
            "animate-[wave_1.2s_ease-in-out_infinite]",
            "will-change-transform",
            waveSize
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * AI 思考加载器
 * 模拟 AI 思考时的脉冲效果，更有科技感
 */
function ThinkingLoader({ size, className }: { size: LoadingSize; className?: string }) {
  const dotSize = sizeMap[size].dots;
  const gap = sizeMap[size].gap;

  return (
    <div className={cn("flex items-center", gap, className)}>
      {/* 中心脉冲点 */}
      <span
        className={cn(
          "rounded-full bg-primary",
          "animate-[thinkingPulse_1.5s_ease-in-out_infinite]",
          "will-change-transform",
          dotSize
        )}
      />
      {/* 两个较小的跟随点 */}
      <span
        className={cn(
          "rounded-full bg-primary/60",
          "animate-[thinkingPulse_1.5s_ease-in-out_infinite]",
          "will-change-transform",
          size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
        )}
        style={{ animationDelay: "200ms" }}
      />
      <span
        className={cn(
          "rounded-full bg-primary/40",
          "animate-[thinkingPulse_1.5s_ease-in-out_infinite]",
          "will-change-transform",
          size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
        )}
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}

/**
 * AI 沉浸式思考加载器
 * 更有沉浸感的思考动画，包含打字效果和呼吸发光
 * 用于消息列表中 AI 思考时的显示
 */
export function ThinkingLoaderImmersive({
  size = "md",
  text,
  className,
}: {
  size?: LoadingSize;
  text?: string;
  className?: string;
}) {
  const displayText = text || t("loading.thinking");

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        "animate-fade-in",
        className
      )}
    >
      {/* 动态思考图标 - 旋转的 AI 符号 */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-primary/80 to-primary/40",
            "flex items-center justify-center",
            "animate-[pulse_2s_ease-in-out_infinite]",
            "dark:shadow-[0_0_16px_oklch(0.5_0.2_264/0.4)]",
            size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "text-primary-foreground animate-[spin_3s_linear_infinite]",
              size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5"
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="7.5" cy="14.5" r="1.5" className="animate-[pulse_1s_ease-in-out_infinite]" />
            <circle cx="16.5" cy="14.5" r="1.5" className="animate-[pulse_1s_ease-in-out_infinite_200ms]" />
          </svg>
        </div>
        {/* 脉冲环 */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-primary/30",
            "animate-[ping_2s_ease-out_infinite]",
            size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
          )}
        />
      </div>

      {/* 打字效果的文字 */}
      <div className="flex items-center">
        <span
          className={cn(
            "text-muted-foreground font-medium",
            "animate-[shimmer_2s_ease-in-out_infinite]",
            "bg-gradient-to-r from-muted-foreground via-foreground/70 to-muted-foreground bg-[length:200%_100%] bg-clip-text",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )}
        >
          {displayText}
        </span>
        {/* 动态打字点 */}
        <span className="flex ml-1">
          <span
            className={cn(
              "rounded-full bg-primary/70",
              "animate-[bounce_1.4s_ease-in-out_infinite]",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
            )}
            style={{ animationDelay: "0ms" }}
          />
          <span
            className={cn(
              "rounded-full bg-primary/70 ml-0.5",
              "animate-[bounce_1.4s_ease-in-out_infinite]",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
            )}
            style={{ animationDelay: "200ms" }}
          />
          <span
            className={cn(
              "rounded-full bg-primary/70 ml-0.5",
              "animate-[bounce_1.4s_ease-in-out_infinite]",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
            )}
            style={{ animationDelay: "400ms" }}
          />
        </span>
      </div>
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
        "animate-spin rounded-full border-2 border-primary/30 border-t-primary transition-opacity duration-200",
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
  ariaLabel,
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
      case "wave":
        return <WaveLoader size={size} />;
      case "thinking":
        return <ThinkingLoader size={size} />;
      default:
        return <SpinnerLoader size={size} />;
    }
  };

  const content = (
    <div
      className={cn("flex items-center gap-2", center && "justify-center", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel || text || t("loading.loading")}
    >
      {renderLoader()}
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
      {/* Screen reader only text for components without visible text */}
      {!text && <span className="sr-only">{ariaLabel || t("loading.loading")}</span>}
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
export function LoadingOverlay({ text, ariaLabel }: { text?: string; ariaLabel?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "animate-bounce-in",
        // Dark mode enhancements - Cycle #180
        "dark:bg-gradient-to-br dark:from-background/95 dark:to-background/85",
        "dark:backdrop-blur-md"
      )}
      role="alertdialog"
      aria-busy="true"
      aria-label={ariaLabel || text || t("loading.loading")}
      aria-modal="true"
    >
      {/* Glowing loading container - Cycle #180 */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-card/80 backdrop-blur-sm",
        // Dark mode enhancements - Cycle #180
        "dark:bg-card/90",
        "dark:border dark:border-white/10",
        "dark:shadow-[0_0_20px_oklch(0.4_0.1_264/0.3),0_0_40px_oklch(0.4_0.1_264/0.15)]"
      )}>
        <Loading variant="dots" size="lg" text={text} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}

/**
 * 行内加载指示器（用于按钮等）
 */
export function LoadingInline({ className, ariaLabel }: { className?: string; ariaLabel?: string }) {
  return (
    <Loading
      variant="spinner"
      size="sm"
      className={className}
      ariaLabel={ariaLabel || t("loading.processing")}
    />
  );
}

export default Loading;
