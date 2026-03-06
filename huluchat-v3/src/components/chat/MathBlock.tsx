/**
 * MathBlock Component
 * 数学公式渲染组件，支持 KaTeX
 */
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface MathBlockProps {
  math: string;
  inline?: boolean;
  className?: string;
}

export function MathBlock({ math, inline = false, className }: MathBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: !inline,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch (error) {
      console.error("KaTeX rendering error:", error);
      // Return error message in red
      const errorMsg = error instanceof Error ? error.message : "Math rendering error";
      return `<span class="text-red-500" title="${errorMsg}">${math}</span>`;
    }
  }, [math, inline]);

  if (inline) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
