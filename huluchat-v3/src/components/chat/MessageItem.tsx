/**
 * MessageItem Component
 * 单条消息展示，支持 Markdown 渲染和编辑
 */
import { useState, useRef, useEffect, memo, useCallback, useMemo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Message } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Bookmark, BookmarkCheck, Copy, Clock, RefreshCw, Quote, Trash2 } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { MermaidBlock } from "./MermaidBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Format timestamp to relative time (e.g., "2 min ago", "Yesterday")
 */
function formatRelativeTime(dateString: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute
  if (diffSeconds < 60) {
    return t("chat.time.justNow");
  }

  // 1-59 minutes ago
  if (diffMinutes < 60) {
    return t("chat.time.minutesAgo", { count: diffMinutes });
  }

  // 1-23 hours ago
  if (diffHours < 24) {
    return t("chat.time.hoursAgo", { count: diffHours });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t("chat.time.yesterday");
  }

  // Within 7 days
  if (diffDays < 7) {
    return t("chat.time.daysAgo", { count: diffDays });
  }

  // Format as date (e.g., "Mar 11")
  return date.toLocaleDateString(i18n.language === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

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
  // Regenerate props
  onRegenerate?: (messageId: string) => void;
  isRegenerating?: boolean;
  // Quote props
  onQuote?: (message: Message) => void;
  // Delete props
  onDelete?: (messageId: string) => void;
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
 * Enhanced with smooth breathing animation (Cycle #194)
 */
const StreamingCursor = memo(function StreamingCursor({ isStreaming }: { isStreaming?: boolean }) {
  if (!isStreaming) return null;
  return (
    <span
      className={cn(
        "inline-block w-2 h-4 ml-1 rounded-sm",
        "bg-primary/80",
        "animate-[typingCursor_1s_ease-in-out_infinite]",
        "will-change-opacity",
        // Dark mode glow effect
        "dark:bg-primary/90",
        "dark:shadow-[0_0_8px_oklch(0.488_0.243_264.376/0.5)]"
      )}
      aria-label={i18n.t("chat.streaming")}
    />
  );
});

export const MessageItem = memo(function MessageItem({
  message,
  isStreaming,
  onEdit,
  isBookmarked = false,
  bookmarkId,
  onBookmarkToggle,
  onRegenerate,
  isRegenerating = false,
  onQuote,
  onDelete,
}: MessageItemProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const hasImages = message.images && message.images.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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

  // Copy message content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast.success(t("chat.copied"));
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("common.error"));
    }
  }, [message.content, t]);

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
                : "bg-muted px-1.5 py-0.5 rounded text-xs"
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

  // Double-click to quote - Cycle #146
  const handleDoubleClick = useCallback(() => {
    if (onQuote && !isEditing && !isStreaming) {
      onQuote(message);
    }
  }, [onQuote, isEditing, isStreaming, message]);

  return (
    <div
      role="article"
      aria-label={isUser ? t("chat.you") : t("chat.ai")}
      onDoubleClick={handleDoubleClick}
      title={t("chat.doubleClickToQuote")}
      className={cn(
        "group flex w-full mb-4 animate-list-enter",
        isUser ? "justify-end" : "justify-start",
        onQuote && !isEditing && !isStreaming && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 relative",
          "shadow-sm hover:shadow-md transition-all duration-200 ease-out",
          "hover:scale-[1.005] active:scale-[0.995]",
          isUser
            ? "bg-primary text-primary-foreground ml-12 hover:bg-primary/90 dark:shadow-primary/20 dark:hover:shadow-primary/30"
            : "bg-muted text-foreground mr-12 border-l-4 border-primary/30 hover:bg-muted/80",
          // Dark mode enhancements - more visible borders and backgrounds
          "dark:shadow-lg dark:hover:shadow-xl",
          !isUser && "dark:border-primary/60 dark:bg-muted/70 dark:hover:bg-muted/90 dark:shadow-black/20 dark:hover:shadow-black/30"
        )}
      >
        {/* 头像标识和时间戳 */}
        <div
          className={cn(
            "text-xs font-medium mb-1 flex items-center justify-between",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <span>{isUser ? t("chat.you") : t("chat.ai")}</span>
            {/* Timestamp - Cycle #136 */}
            {!isStreaming && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  "text-[10px] opacity-0 group-hover:opacity-60 transition-opacity duration-200",
                  "dark:opacity-0 dark:group-hover:opacity-50"
                )}
                title={new Date(message.created_at).toLocaleString()}
              >
                <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                {formatRelativeTime(message.created_at, t)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Copy button for all messages */}
            {!isEditing && !isStreaming && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                aria-label={t("chat.copy")}
                className={cn(
                  "group/copy transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isCopied && "opacity-100",
                  isCopied
                    ? "text-primary hover:text-primary/80"
                    : isUser
                      ? "hover:bg-primary-foreground/10 text-primary-foreground/70"
                      : "hover:bg-accent text-muted-foreground"
                )}
              >
                {isCopied ? (
                  <Check className="w-3 h-3 transition-transform duration-200 ease-out group-hover/copy:scale-110" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3 transition-transform duration-200 ease-out group-hover/copy:scale-110" aria-hidden="true" />
                )}
              </button>
            )}
            {/* Bookmark button for all messages - Cycle #204 icon micro-interaction */}
            {onBookmarkToggle && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(message.id, isBookmarked, bookmarkId);
                }}
                aria-label={isBookmarked ? t("chat.removeBookmark") : t("chat.addBookmark")}
                aria-pressed={isBookmarked}
                className={cn(
                  "group/bookmark transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isBookmarked && "opacity-100",
                  isBookmarked
                    ? "text-primary hover:text-primary/80"
                    : isUser
                      ? "hover:bg-primary-foreground/10 text-primary-foreground/70"
                      : "hover:bg-accent text-muted-foreground"
                )}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-3 h-3 transition-transform duration-200 ease-out group-hover/bookmark:scale-110" aria-hidden="true" />
                ) : (
                  <Bookmark className="w-3 h-3 transition-transform duration-200 ease-out group-hover/bookmark:scale-110" aria-hidden="true" />
                )}
              </button>
            )}
            {/* Regenerate button for AI messages - Cycle #143 */}
            {!isUser && onRegenerate && !isEditing && !isStreaming && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(message.id);
                }}
                aria-label={t("chat.regenerate")}
                disabled={isRegenerating}
                className={cn(
                  "group/regenerate transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:bg-accent text-muted-foreground hover:text-foreground",
                  isRegenerating && "opacity-100 cursor-wait"
                )}
              >
                <RefreshCw
                  className={cn(
                    "w-3 h-3 transition-transform duration-200 ease-out",
                    "group-hover/regenerate:scale-110 group-hover/regenerate:rotate-180",
                    isRegenerating && "animate-spin"
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
            {/* Edit button for user messages - Cycle #204 icon micro-interaction */}
            {isUser && onEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                aria-label={t("chat.editMessage")}
                className={cn(
                  "group/edit opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "hover:bg-primary-foreground/10"
                )}
              >
                <Pencil className="w-3 h-3 transition-transform duration-200 ease-out group-hover/edit:rotate-12" aria-hidden="true" />
              </button>
            )}
            {/* Quote/Reply button for all messages - Cycle #145 */}
            {onQuote && !isEditing && !isStreaming && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuote(message);
                }}
                aria-label={t("chat.quote")}
                className={cn(
                  "group/quote transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isUser
                    ? "hover:bg-primary-foreground/10 text-primary-foreground/70"
                    : "hover:bg-accent text-muted-foreground"
                )}
              >
                <Quote className="w-3 h-3 transition-transform duration-200 ease-out group-hover/quote:scale-110 group-hover/quote:-rotate-12" aria-hidden="true" />
              </button>
            )}
            {/* Delete button for all messages - Cycle #155 */}
            {onDelete && !isEditing && !isStreaming && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(message.id);
                }}
                aria-label={t("chat.deleteMessage")}
                className={cn(
                  "group/delete transition-all p-1 rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isUser
                    ? "hover:bg-primary-foreground/10 text-primary-foreground/70"
                    : "hover:bg-accent text-muted-foreground",
                  "hover:text-destructive"
                )}
              >
                <Trash2 className="w-3 h-3 transition-transform duration-200 ease-out group-hover/delete:scale-110" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* 图片显示（仅用户消息） */}
        {isUser && hasImages && (
          <div
            className="flex flex-wrap gap-2 mb-2"
            role="group"
            aria-label={t("chat.uploadedImages")}
          >
            {message.images!.map((image, index) => (
              <img
                key={index}
                src={image.image_url.url}
                alt={t("chat.uploadedImage", { index: index + 1 })}
                className="max-w-[200px] max-h-[200px] object-cover rounded-lg animate-list-enter"
                style={{ animationDelay: `${index * 50}ms` }}
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
              // 代码块样式 - 使用主题变量
              "[&_.hljs]:bg-transparent [&_.hljs]:p-0",
              "[&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border",
              "[&_code:not(.hljs)]:bg-muted [&_code:not(.hljs)]:px-1.5 [&_code:not(.hljs)]:py-0.5",
              "[&_code:not(.hljs)]:rounded [&_code:not(.hljs)]:text-xs",
              // 表格样式 - 使用主题变量
              "[&_table]:w-full [&_table]:border-collapse",
              "[&_th]:border [&_th]:border-border",
              "[&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted",
              "[&_td]:border [&_td]:border-border",
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
