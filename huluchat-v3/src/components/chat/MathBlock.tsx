/**
 * MathBlock Component
 * 数学公式渲染组件，支持 KaTeX
 */
import { useMemo, memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export interface MathBlockProps {
  math: string;
  inline?: boolean;
  className?: string;
}

export const MathBlock = memo(function MathBlock({
  math,
  inline = false,
  className,
}: MathBlockProps) {
  const { html, error } = useMemo(() => {
    try {
      const rendered = katex.renderToString(math, {
        displayMode: !inline,
        throwOnError: false,
      });
      return { html: rendered, error: null };
    } catch (err) {
      console.error("KaTeX rendering error:", err);
      const errorMsg = err instanceof Error ? err.message : "Math rendering error";
      return { html: "", error: errorMsg };
    }
  }, [math, inline]);

  // 错误处理 - block 模式显示详细错误
  if (error && !inline) {
    return (
      <div
        role="alert"
        aria-label="Math formula error"
        className={cn(
          "p-4 rounded-lg bg-error-muted/50 border border-error/30",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "dark:bg-error-muted/30 dark:border-error/40 dark:shadow-sm dark:shadow-error/10",
          className
        )}
      >
        <div className="text-error text-sm font-medium mb-2">
          Math Error
        </div>
        <pre className="text-xs text-error/80 overflow-x-auto">
          {math}
        </pre>
        <div className="text-xs text-error/60 mt-2">
          {error}
        </div>
      </div>
    );
  }

  // 错误处理 - inline 模式显示简单提示
  if (error && inline) {
    return (
      <span
        role="alert"
        aria-label={`Math formula error: ${error}`}
        className={cn("text-error", className)}
        title={error}
      >
        {math}
      </span>
    );
  }

  // 正常渲染 - 动态选择容器元素
  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper
      aria-label={`Math formula: ${math}`}
      className={inline ? className : cn("katex-display", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
