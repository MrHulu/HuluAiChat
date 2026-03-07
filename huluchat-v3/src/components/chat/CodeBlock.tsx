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
    <div className="relative group/codeblock">
      {/* Language badge and copy button */}
      <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover/codeblock:opacity-100 transition-opacity">
        {displayLanguage && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {displayLanguage}
          </span>
        )}
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "bg-muted hover:bg-accent",
            copied ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={copied ? t("chat.codeCopied") : t("chat.copyCode")}
          aria-live="polite"
          title={copied ? t("chat.codeCopied") : t("chat.copyCode")}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className={cn("!bg-muted rounded-lg p-3 overflow-x-auto my-2 border border-border", className)}>
        {children}
      </pre>
    </div>
  );
});
