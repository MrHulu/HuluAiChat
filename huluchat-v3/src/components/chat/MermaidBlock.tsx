/**
 * MermaidBlock Component
 * 图表渲染组件，支持 Mermaid 流程图、时序图等
 */
import { useEffect, useState, memo, useRef } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

// 生成唯一 ID
let mermaidCounter = 0;
const generateId = () => `mermaid-${++mermaidCounter}-${Date.now()}`;

// Mermaid 主题类型
type MermaidTheme = "default" | "dark" | "forest" | "neutral" | "base";

// 获取当前主题
const getTheme = (): MermaidTheme =>
  document.documentElement.classList.contains("dark") ? "dark" : "default";

export interface MermaidBlockProps {
  chart: string;
  className?: string;
}

export const MermaidBlock = memo(function MermaidBlock({
  chart,
  className,
}: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => generateId());
  const [theme, setTheme] = useState(() => getTheme());

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      try {
        // 初始化 mermaid（带当前主题）
        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        // 渲染图表
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        const errorMsg = err instanceof Error ? err.message : "Chart rendering error";
        setError(errorMsg);
        setSvg("");
      }
    };

    if (chart.trim()) {
      renderChart();
    }
  }, [chart, id, theme]);

  if (error) {
    return (
      <div
        className={cn(
          "p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
          className
        )}
      >
        <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
          Chart Error
        </div>
        <pre className="text-xs text-red-500 dark:text-red-300 overflow-x-auto">
          {chart}
        </pre>
        <div className="text-xs text-red-400 dark:text-red-500 mt-2">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "mermaid-container flex justify-center p-4 rounded-lg",
        "bg-zinc-50 dark:bg-zinc-900 overflow-x-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
