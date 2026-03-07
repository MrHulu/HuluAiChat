/**
 * MermaidBlock Component
 * 图表渲染组件，支持 Mermaid 流程图、时序图等
 * 使用动态导入实现懒加载，减小初始包体积
 */
import { useEffect, useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

// Mermaid 类型（动态导入后使用）
type MermaidAPI = typeof import("mermaid").default;

// 生成唯一 ID
let mermaidCounter = 0;
const generateId = () => `mermaid-${++mermaidCounter}`;

// Mermaid 主题类型
type MermaidTheme = "default" | "dark" | "forest" | "neutral" | "base";

// 全局 mermaid 实例（懒加载）
let mermaidInstance: MermaidAPI | null = null;
let mermaidInitialized = false;

// 初始化 mermaid（只执行一次）
const initMermaid = async (theme: MermaidTheme): Promise<MermaidAPI> => {
  if (!mermaidInstance) {
    const mermaid = await import("mermaid");
    mermaidInstance = mermaid.default;
  }
  if (!mermaidInitialized) {
    mermaidInstance.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "loose",
      fontFamily: "inherit",
    });
    mermaidInitialized = true;
  }
  return mermaidInstance;
};

// 获取 Mermaid 主题
const getMermaidTheme = (isDark: boolean): MermaidTheme => (isDark ? "dark" : "default");

export interface MermaidBlockProps {
  chart: string;
  className?: string;
}

export const MermaidBlock = memo(function MermaidBlock({
  chart,
  className,
}: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [id] = useState(() => generateId());

  // 使用全局主题管理
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const mermaidTheme = getMermaidTheme(isDark);

  const renderChart = useCallback(async () => {
    try {
      setLoading(true);
      const mermaid = await initMermaid(mermaidTheme);
      const { svg: renderedSvg } = await mermaid.render(id, chart);
      setSvg(renderedSvg);
      setError(null);
    } catch (err) {
      console.error("Mermaid rendering error:", err);
      const errorMsg = err instanceof Error ? err.message : "Chart rendering error";
      setError(errorMsg);
      setSvg("");
    } finally {
      setLoading(false);
    }
  }, [chart, id, mermaidTheme]);

  useEffect(() => {
    if (chart.trim()) {
      renderChart();
    }
  }, [chart, renderChart]);

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

  if (loading) {
    return (
      <div
        className={cn(
          "mermaid-container flex justify-center items-center p-4 rounded-lg",
          "bg-zinc-50 dark:bg-zinc-900",
          className
        )}
      >
        <div className="text-zinc-400 dark:text-zinc-500 text-sm animate-pulse">
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mermaid-container flex justify-center p-4 rounded-lg",
        "bg-zinc-50 dark:bg-zinc-900 overflow-x-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
