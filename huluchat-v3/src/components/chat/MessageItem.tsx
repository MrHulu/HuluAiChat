/**
 * MessageItem Component
 * 单条消息展示，支持 Markdown 渲染和编辑
 */
import { useState, useRef, useEffect, memo, useCallback, useMemo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Message } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Bookmark, BookmarkCheck } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { MermaidBlock } from "./MermaidBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// 只导入需要的 highlight.js 语言（减少体积）
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";

// 注册语言
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

export interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  // Bookmark props
  isBookmarked?: boolean;
  bookmarkId?: string;
  onBookmarkToggle?: (messageId: string, isBookmarked: boolean, bookmarkId?: string) => void;
}

// Stable plugin references (defined outside component to avoid recreation)
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeHighlight, rehypeKatex];

// Constants
const HLJS_LANGUAGE_PREFIX = "hljs language-";
const HLJS_CLASS = "hljs";

/**
 * Extracts code info from React children (for CodeBlock/MermaidBlock)
 */
function extractCodeInfo(children: React.ReactNode): { language: string; codeContent: string } {
  if (!children || typeof children !== "object" || !("props" in children)) {
    return { language: "", codeContent: "" };
  }

  const codeProps = (children as ReactElement).props as {
    className?: string;
    children?: React.ReactNode;
  };

  const language = codeProps.className?.replace(HLJS_LANGUAGE_PREFIX, "") || "";

  // Extract code content
  if (typeof codeProps.children === "string") {
    return { language, codeContent: codeProps.children };
  }

  // Handle nested structure
  if (codeProps.children && typeof codeProps.children === "object" && "props" in codeProps.children) {
    const nested = (codeProps.children as ReactElement).props as { children?: string };
    return { language, codeContent: nested.children || "" };
  }

  return { language, codeContent: "" };
}

/**
 * Streaming cursor component - separated to avoid unnecessary re-renders
 */
const StreamingCursor = memo(function StreamingCursor({ isStreaming }: { isStreaming?: boolean }) {
  if (!isStreaming) return null;
  return <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" aria-label="Streaming..." />;
});

export const MessageItem = memo(function MessageItem({
  message,
  isStreaming,
  onEdit,
  isBookmarked = false,
  bookmarkId,
  onBookmarkToggle,
}: MessageItemProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const hasImages = message.images && message.images.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editContent when message content changes (e.g., during streaming)
  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [message.content, isEditing]);

  // Auto-focus and resize textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
      // Auto-resize to fit content
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (isUser && onEdit) {
      setEditContent(message.content);
      setIsEditing(true);
    }
  }, [isUser, onEdit, message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleSaveEdit = useCallback(async () => {
    if (!onEdit || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save edit:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onEdit, editContent, message.id, message.content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  // Memoize markdown components to prevent unnecessary re-renders
  const markdownComponents = useMemo(
    () => ({
      // Custom link that opens in new tab
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      ),
      // Custom code block - use CodeBlock/MermaidBlock components
      pre: ({ children }: { children?: React.ReactNode }) => {
        const { language, codeContent } = extractCodeInfo(children);
        // Use MermaidBlock for mermaid diagrams
        if (language === "mermaid" && codeContent) {
          return <MermaidBlock chart={codeContent} />;
        }
        return <CodeBlock language={language}>{children}</CodeBlock>;
      },
      // Custom inline code
      code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes(HLJS_CLASS);
        return (
          <code
            className={cn(
              isBlock
                ? "block text-sm"
                : "bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs"
            )}
          >
            {children}
          </code>
        );
      },
    }),
    []
  );

  // Memoize markdown content rendering to prevent unnecessary re-parsing
  const renderedContent = useMemo(() => {
    if (isUser) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }
    return (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={markdownComponents}
      >
        {message.content}
      </ReactMarkdown>
    );
  }, [isUser, message.content, markdownComponents]);

  return (
    <div
      role="article"
      aria-label={isUser ? t("chat.you") : t("chat.ai")}
      className={cn(
        "group flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 relative",
          "shadow-sm hover:shadow-md transition-all duration-200",
          isUser
            ? "bg-primary text-primary-foreground ml-12 hover:bg-primary/90"
            : "bg-muted text-foreground mr-12 border-l-4 border-primary/30 hover:bg-muted/80"
        )}
      >
        {/* 头像标识 */}
        <div
          className={cn(
            "text-xs font-medium mb-1 flex items-center justify-between",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span>{isUser ? t("chat.you") : t("chat.ai")}</span>
          <div className="flex items-center gap-1">
            {/* Bookmark button for all messages */}
            {onBookmarkToggle && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(message.id, isBookmarked, bookmarkId);
                }}
                aria-label={isBookmarked ? t("chat.removeBookmark") : t("chat.addBookmark")}
                className={cn(
                  "transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100",
                  isBookmarked && "opacity-100",
                  isBookmarked
                    ? "text-primary hover:text-primary/80"
                    : isUser
                      ? "hover:bg-primary-foreground/10 text-primary-foreground/70"
                      : "hover:bg-accent text-muted-foreground"
                )}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-3 h-3" />
                ) : (
                  <Bookmark className="w-3 h-3" />
                )}
              </button>
            )}
            {/* Edit button for user messages */}
            {isUser && onEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                aria-label={t("chat.editMessage")}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary-foreground/10 rounded"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 图片显示（仅用户消息） */}
        {isUser && hasImages && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images!.map((image, index) => (
              <img
                key={index}
                src={image.image_url.url}
                alt={`Upload ${index + 1}`}
                className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* 消息内容 */}
        {isEditing ? (
          <div className="flex flex-col gap-2" role="region" aria-label={t("chat.editMessage")}>
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              aria-label={t("chat.editMessage")}
              className={cn(
                "w-full min-h-[60px] p-2 rounded-lg resize-none",
                "bg-primary-foreground/10 text-primary-foreground",
                "border border-primary-foreground/20 focus:outline-none focus:ring-1 focus:ring-primary-foreground/50",
                "text-sm leading-relaxed"
              )}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isSaving}
                aria-label={t("chat.cancelEdit")}
                className="h-7 px-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="w-4 h-4 mr-1" />
                {t("chat.cancelEdit")}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                aria-label={t("chat.saveEdit")}
                className="h-7 px-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                <Check className="w-4 h-4 mr-1" />
                {isSaving ? t("chat.saving") : t("chat.saveEdit")}
              </Button>
            </div>
            <span className="text-xs text-primary-foreground/50">
              {t("chat.ctrlEnterToSave")}
            </span>
          </div>
        ) : (
          <div
            className={cn(
              "text-sm leading-relaxed break-words",
              // Markdown 样式
              "prose prose-sm dark:prose-invert max-w-none",
              // 代码块样式
              "[&_.hljs]:bg-transparent [&_.hljs]:p-0",
              "[&_pre]:bg-zinc-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto",
              "[&_code:not(.hljs)]:bg-zinc-200 [&_code:not(.hljs)]:dark:bg-zinc-700",
              "[&_code:not(.hljs)]:px-1.5 [&_code:not(.hljs)]:py-0.5",
              "[&_code:not(.hljs)]:rounded [&_code:not(.hljs)]:text-xs",
              // 表格样式
              "[&_table]:w-full [&_table]:border-collapse",
              "[&_th]:border [&_th]:border-zinc-300 [&_th]:dark:border-zinc-600",
              "[&_th]:px-2 [&_th]:py-1 [&_th]:bg-zinc-100 [&_th]:dark:bg-zinc-800",
              "[&_td]:border [&_td]:border-zinc-300 [&_td]:dark:border-zinc-600",
              "[&_td]:px-2 [&_td]:py-1",
              // 用户消息样式覆盖
              isUser && "[&_code:not(.hljs)]:bg-primary-foreground/20"
            )}
          >
            {renderedContent}
            <StreamingCursor isStreaming={isStreaming} />
          </div>
        )}
      </div>
    </div>
  );
});
