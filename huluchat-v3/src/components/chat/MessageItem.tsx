/**
 * MessageItem Component
 * 单条消息展示，支持 Markdown 渲染
 */
import { cn } from "@/lib/utils";
import { Message } from "@/api/client";
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
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-foreground mr-12"
        )}
      >
        {/* 头像标识 */}
        <div
          className={cn(
            "text-xs font-medium mb-1",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {isUser ? "You" : "AI"}
        </div>

        {/* 消息内容 */}
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
      </div>
    </div>
  );
}
