/**
 * MessageItem Component
 * 单条消息展示，支持 Markdown 渲染和编辑
 */
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

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
}

export function MessageItem({ message, isStreaming, onEdit }: MessageItemProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleStartEdit = () => {
    if (isUser && onEdit) {
      setEditContent(message.content);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div
      className={cn(
        "group flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 relative",
          isUser
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-foreground mr-12"
        )}
      >
        {/* 头像标识 */}
        <div
          className={cn(
            "text-xs font-medium mb-1 flex items-center justify-between",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span>{isUser ? "You" : "AI"}</span>
          {/* Edit button for user messages */}
          {isUser && onEdit && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary-foreground/10 rounded"
              title="Edit message"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 消息内容 */}
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
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
                className="h-7 px-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                className="h-7 px-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              >
                <Check className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
            <span className="text-xs text-primary-foreground/50">
              Ctrl+Enter to save, Esc to cancel
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
            {isUser ? (
              // 用户消息直接显示，不解析 Markdown
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              // AI 消息渲染 Markdown
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // 自定义链接在新窗口打开
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  // 自定义代码块
                  pre: ({ children }) => (
                    <pre className="!bg-zinc-900 rounded-lg p-3 overflow-x-auto my-2">
                      {children}
                    </pre>
                  ),
                  // 自定义行内代码
                  code: ({ className, children }) => {
                    const isBlock = className?.includes("hljs");
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
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
