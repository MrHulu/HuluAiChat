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

// HTML 转义工具函数
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
        className={cn(
          "p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
          className
        )}
      >
        <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
          Math Error
        </div>
        <pre className="text-xs text-red-500 dark:text-red-300 overflow-x-auto">
          {math}
        </pre>
        <div className="text-xs text-red-400 dark:text-red-500 mt-2">
          {error}
        </div>
      </div>
    );
  }

  // 错误处理 - inline 模式显示简单提示
  if (error && inline) {
    return (
      <span
        className={cn("text-red-500 dark:text-red-400", className)}
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
      className={inline ? className : cn("katex-display", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
