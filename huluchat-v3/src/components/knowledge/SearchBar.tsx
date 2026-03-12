/**
 * SearchBar - 帮助文档搜索
 * 提供全局搜索功能，搜索提示词技巧、FAQ、模型对比
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Lightbulb, HelpCircle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createSearchIndex,
  searchKnowledge,
  getSearchResultTypeLabel,
  type SearchItem,
  type SearchItemType,
} from "@/data/searchData";
import type { PromptTip } from "@/data/promptTips";

interface SearchBarProps {
  onNavigateToTip?: (tip: PromptTip) => void;
  className?: string;
}

export function SearchBar({ onNavigateToTip, className }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 创建搜索索引（只需一次）
  useMemo(() => {
    createSearchIndex(t);
  }, [t]);

  // 执行搜索
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = searchKnowledge(query);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  }, [query, t]);

  // 处理结果点击
  const handleResultClick = useCallback(
    (item: SearchItem) => {
      setQuery("");
      setIsOpen(false);
      setResults([]);

      // 如果是提示词技巧，导航到详情页
      if (item.type === "tip" && onNavigateToTip) {
        onNavigateToTip(item.originalData as PromptTip);
      }
    },
    [onNavigateToTip]
  );

  // 清除搜索
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  // 获取类型图标
  const getTypeIcon = (type: SearchItemType) => {
    switch (type) {
      case "tip":
        return <Lightbulb className="size-4 text-yellow-500" />;
      case "faq":
        return <HelpCircle className="size-4 text-blue-500" />;
      case "model":
        return <Cpu className="size-4 text-purple-500" />;
    }
  };

  // 高亮搜索词
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-inherit px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("knowledge.search.placeholder")}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background",
            "text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "dark:border-white/10 dark:bg-muted/30"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
            aria-label={t("common.clear")}
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {isOpen && results.length > 0 && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "bg-popover border rounded-lg shadow-lg",
            "dark:border-white/10 dark:shadow-xl"
          )}
        >
          <ul className="max-h-80 overflow-y-auto p-1">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleResultClick(item)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-md text-left",
                    "hover:bg-muted/50 transition-colors",
                    "dark:hover:bg-muted/30"
                  )}
                >
                  {/* 类型图标 */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题和类型标签 */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {highlightText(item.title, query)}
                      </span>
                      <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                        {t(getSearchResultTypeLabel(item.type))}
                      </span>
                    </div>

                    {/* 描述 */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText(item.description, query)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* 结果数量提示 */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground dark:border-white/10">
            {t("knowledge.search.resultsCount", { count: results.length })}
          </div>
        </div>
      )}
    </div>
  );
}

export { type SearchBarProps };
