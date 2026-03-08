/**
 * MermaidBlock Component
 * 图表渲染组件，支持 Mermaid 流程图、时序图等
 * 使用动态导入实现懒加载，减小初始包体积
 */
import { useEffect, useState, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      const errorMsg = err instanceof Error ? err.message : t("mermaid.error");
      setError(errorMsg);
      setSvg("");
    } finally {
      setLoading(false);
    }
  }, [chart, id, mermaidTheme, t]);

  useEffect(() => {
    if (chart.trim()) {
      renderChart();
    }
  }, [chart, renderChart]);

  if (error) {
    return (
      <div
        role="alert"
        aria-label={t("mermaid.error")}
        className={cn(
          "p-4 rounded-lg bg-error-muted/50 border border-error/30",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "dark:bg-error-muted/30 dark:border-error/40 dark:shadow-sm dark:shadow-error/10",
          className
        )}
      >
        <div className="text-error text-sm font-medium mb-2">
          {t("mermaid.error")}
        </div>
        <pre className="text-xs text-error/80 overflow-x-auto">
          {chart}
        </pre>
        <div className="text-xs text-error/60 mt-2">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        aria-label={t("mermaid.loading")}
        className={cn(
          "mermaid-container flex justify-center items-center p-4 rounded-lg",
          "bg-muted animate-in fade-in-0 duration-150",
          "dark:bg-muted/40 dark:border dark:border-white/10",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>{t("mermaid.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${t("mermaid.label")}: ${chart.substring(0, 50)}...`}
      className={cn(
        "mermaid-container flex justify-center p-4 rounded-lg",
        "bg-muted overflow-x-auto",
        "animate-in fade-in-0 duration-300",
        "dark:bg-muted/40 dark:border dark:border-white/10 dark:shadow-sm dark:shadow-black/10",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
