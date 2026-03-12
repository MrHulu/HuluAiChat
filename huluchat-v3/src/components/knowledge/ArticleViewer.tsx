/**
 * ArticleViewer - 文章查看器
 * 渲染 Markdown 格式的知识文章
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { PromptTip } from "@/data/promptTips";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

interface ArticleViewerProps {
  article: PromptTip;
}

export function ArticleViewer({ article }: ArticleViewerProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      {/* 文章元信息 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
          {t(`knowledge.levels.${article.level}`)}
        </span>
        <span>·</span>
        <span>{t("knowledge.readTime", { minutes: article.readTime })}</span>
      </div>

      {/* Markdown 内容 */}
      <article
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-p:text-muted-foreground",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border",
          "prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2",
          "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
          "prose-li:marker:text-muted-foreground/50"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex]}
          components={{
            // 自定义代码块渲染
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;

              if (isInline) {
                return (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // 自定义标题渲染
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4 mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>
            ),
            // 自定义段落
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed">{children}</p>
            ),
            // 自定义列表
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
            ),
            // 自定义提示框
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary bg-muted/30 pl-4 py-2 my-4 rounded-r">
                {children}
              </blockquote>
            ),
          }}
        >
          {t(article.contentKey)}
        </ReactMarkdown>
      </article>
    </div>
  );
}
