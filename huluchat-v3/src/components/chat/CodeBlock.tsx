/**
 * CodeBlock Component
 * 代码块组件，支持语法高亮和一键复制
 */
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

export interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Extract code text from children
  const getCodeText = useCallback(() => {
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

  const handleCopy = useCallback(async () => {
    const code = getCodeText();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [getCodeText]);

  // Extract language from className (e.g., "language-typescript")
  const displayLanguage = language || className?.replace("hljs language-", "") || "";

  return (
    <div className="relative group/codeblock">
      {/* Language badge and copy button */}
      <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover/codeblock:opacity-100 transition-opacity">
        {displayLanguage && (
          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            {displayLanguage}
          </span>
        )}
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "bg-zinc-800 hover:bg-zinc-700",
            copied ? "text-green-400" : "text-zinc-400 hover:text-zinc-200"
          )}
          title={copied ? t("chat.codeCopied") : t("chat.copyCode")}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <pre className={cn("!bg-zinc-900 rounded-lg p-3 overflow-x-auto my-2", className)}>
        {children}
      </pre>
    </div>
  );
}
