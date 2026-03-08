/**
 * CodeBlock Component
 * 代码块组件，支持语法高亮和一键复制
 */
import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

const COPY_FEEDBACK_DURATION_MS = 2000;

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div className="relative group/codeblock rounded-lg overflow-hidden">
      {/* Language badge and copy button */}
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
            <Check className="w-4 h-4 animate-in zoom-in-50 duration-150 group-hover/copy:scale-110" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 transition-transform duration-200 group-hover/copy:-translate-y-0.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre
        className={cn(
          "!bg-muted dark:!bg-muted/50",
          "rounded-lg p-3 overflow-x-auto my-2",
          "border border-border dark:border-border/60",
          "shadow-sm",
          // Dark mode enhancements - Cycle #186
          "dark:shadow-lg dark:shadow-black/25",
          "dark:hover:border-white/20 dark:hover:shadow-[0_0_16px_oklch(0.35_0.06_264/0.2)]",
          "transition-all duration-200",
          className
        )}
      >
        {children}
      </pre>
    </div>
  );
});
