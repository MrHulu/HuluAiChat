/**
 * CodeBlock Component
 * 代码块组件，支持语法高亮、一键复制和折叠/展开
 */
import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";

const COPY_FEEDBACK_DURATION_MS = 2000;
const COLLAPSE_THRESHOLD_LINES = 15; // 超过 15 行自动折叠
const COLLAPSED_MAX_HEIGHT = 200; // 折叠时最大高度 px

export interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

export const CodeBlock = memo(function CodeBlock({
  children,
  className,
  language,
}: CodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldShowCollapse, setShouldShowCollapse] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Extract code text from children
  const codeText = useMemo(() => {
    if (typeof children === "string") {
      return children;
    }
    // Handle nested elements
    if (children && typeof children === "object" && "props" in children) {
      const childProps = children.props as { children?: React.ReactNode };
      if (typeof childProps.children === "string") {
        return childProps.children;
      }
    }
    return "";
  }, [children]);

  // Count lines and determine if collapse should be shown
  const lineCount = useMemo(() => {
    return codeText.split("\n").length;
  }, [codeText]);

  // Check if code should be collapsible based on line count
  // Note: isCollapsed intentionally excluded from deps - only auto-collapse on initial load
  useEffect(() => {
    const isLong = lineCount > COLLAPSE_THRESHOLD_LINES;
    setShouldShowCollapse(isLong);
    // Auto-collapse long code blocks on initial render
    if (isLong && !isCollapsed) {
      setIsCollapsed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineCount]);

  // Extract language from className (e.g., "language-typescript")
  const displayLanguage = useMemo(
    () => language || className?.replace("hljs language-", "") || "",
    [language, className]
  );

  const handleCopy = useCallback(async () => {
    if (!codeText) return;

    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [codeText]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="relative group/codeblock rounded-lg overflow-hidden">
      {/* Language badge, line count, collapse button and copy button */}
      <div
        className={cn(
          "absolute right-2 top-2 flex items-center gap-2 z-10",
          "opacity-0 group-hover/codeblock:opacity-100 focus-within:opacity-100",
          "transition-all duration-200 ease-out"
        )}
      >
        {displayLanguage && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              "bg-muted/80 dark:bg-muted/70 backdrop-blur-sm",
              "px-2 py-0.5 rounded-md",
              "dark:border dark:border-white/10 dark:shadow-sm dark:shadow-black/20"
            )}
          >
            {displayLanguage}
          </span>
        )}
        {/* Collapse/Expand button - Cycle #144 */}
        {shouldShowCollapse && (
          <button
            onClick={toggleCollapse}
            className={cn(
              "p-1.5 rounded-md",
              "transition-all duration-200 ease-out",
              "bg-muted/80 dark:bg-muted/70 backdrop-blur-sm",
              "hover:bg-accent active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "text-muted-foreground hover:text-foreground",
              "dark:border dark:border-white/10",
              "dark:hover:bg-accent/80 dark:hover:border-white/20"
            )}
            aria-label={isCollapsed ? t("chat.expandCode") : t("chat.collapseCode")}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? t("chat.expandCode") : t("chat.collapseCode")}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded-md",
            "transition-all duration-200 ease-out",
            "bg-muted/80 dark:bg-muted/70 backdrop-blur-sm",
            "hover:bg-accent active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "group/copy",
            copied
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
            "dark:border dark:border-white/10",
            "dark:hover:bg-accent/80 dark:hover:border-white/20",
            "dark:hover:shadow-lg dark:hover:shadow-primary/10"
          )}
          aria-label={copied ? t("chat.codeCopied") : t("chat.copyCode")}
          aria-live="polite"
          title={copied ? t("chat.codeCopied") : t("chat.copyCode")}
        >
          {copied ? (
            <Check className="w-4 h-4 animate-bounce-in duration-300 group-hover/copy:scale-110" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 transition-transform duration-200 group-hover/copy:-translate-y-0.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre
        ref={preRef}
        className={cn(
          "!bg-muted dark:!bg-muted/50",
          "rounded-lg p-3 overflow-x-auto my-2",
          "border border-border dark:border-border/60",
          "shadow-sm",
          // Dark mode enhancements - Cycle #186
          "dark:shadow-lg dark:shadow-black/25",
          "dark:hover:border-white/20 dark:hover:shadow-[0_0_16px_oklch(0.35_0.06_264/0.2)]",
          "transition-all duration-200",
          // Collapse styles - Cycle #144
          shouldShowCollapse && isCollapsed && "max-h-[200px] relative",
          className
        )}
        style={shouldShowCollapse && isCollapsed ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
      >
        {children}
        {/* Gradient overlay when collapsed - Cycle #144 */}
        {shouldShowCollapse && isCollapsed && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-16",
              "bg-gradient-to-t from-muted to-transparent",
              "dark:from-muted/90 dark:to-transparent",
              "pointer-events-none"
            )}
            aria-hidden="true"
          />
        )}
      </pre>
      {/* Show more indicator when collapsed - Cycle #144 */}
      {shouldShowCollapse && isCollapsed && (
        <button
          onClick={toggleCollapse}
          className={cn(
            "absolute bottom-2 left-1/2 -translate-x-1/2",
            "text-xs text-muted-foreground hover:text-foreground",
            "bg-muted/80 dark:bg-muted/70 backdrop-blur-sm",
            "px-3 py-1 rounded-full",
            "border border-border/50 hover:border-border",
            "transition-all duration-200 ease-out",
            "hover:scale-105 active:scale-95",
            "opacity-0 group-hover/codeblock:opacity-100",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "dark:border-white/10 dark:hover:border-white/20"
          )}
          aria-label={t("chat.showMoreLines", { count: lineCount })}
        >
          {t("chat.showMoreLines", { count: lineCount })}
        </button>
      )}
    </div>
  );
});
