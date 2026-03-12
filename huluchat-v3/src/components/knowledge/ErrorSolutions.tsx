/**
 * ErrorSolutions - 错误解决建议组件
 * 显示常见错误和解决方案
 * 隐私设计：静态内容，不收集用户错误信息
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, ExternalLink, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ERROR_CODES,
  ERROR_CATEGORIES,
  getErrorsByCategory,
  type ErrorCodeConfig,
  type ErrorCategory,
} from "@/data/errorCodes";

interface ErrorSolutionsProps {
  className?: string;
}

export function ErrorSolutions({ className }: ErrorSolutionsProps) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<ErrorCategory | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤错误
  const filteredErrors = searchQuery.trim()
    ? ERROR_CODES.filter((error) => {
        const query = searchQuery.toLowerCase();
        return (
          t(error.titleKey).toLowerCase().includes(query) ||
          t(error.descriptionKey).toLowerCase().includes(query) ||
          error.symptoms.some((s) => s.toLowerCase().includes(query))
        );
      })
    : null;

  // 切换类别展开
  const toggleCategory = (category: ErrorCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setExpandedError(null);
  };

  // 切换错误展开
  const toggleError = (errorId: string) => {
    setExpandedError(expandedError === errorId ? null : errorId);
  };

  // 渲染单个错误卡片
  const renderErrorCard = (error: ErrorCodeConfig) => {
    const isExpanded = expandedError === error.id;

    return (
      <div
        key={error.id}
        className={cn(
          "border rounded-lg overflow-hidden transition-all duration-200",
          "dark:border-white/10",
          isExpanded && "ring-1 ring-primary/20"
        )}
      >
        <button
          onClick={() => toggleError(error.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 text-left transition-colors",
            "hover:bg-muted/50 dark:hover:bg-muted/30"
          )}
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
              isExpanded && "rotate-90"
            )}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {t(error.titleKey)}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {t(error.descriptionKey)}
            </p>
          </div>
          {error.relatedSettings && (
            <Settings className="size-4 text-muted-foreground flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t dark:border-white/5">
            <div className="space-y-3">
              {/* 解决方案步骤 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("errors.solutions")}
                </p>
                <ol className="space-y-2">
                  {error.solutions.map((solution, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">
                        {t(solution.stepKey)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 相关设置链接 */}
              {error.relatedSettings && (
                <div className="pt-2 border-t dark:border-white/5">
                  <p className="text-xs text-muted-foreground">
                    {t("errors.relatedSettings")}:{" "}
                    <span className="text-primary font-medium">
                      {t(`settings.categories.${error.relatedSettings}`)}
                    </span>
                  </p>
                </div>
              )}

              {/* 了解更多 */}
              {error.learnMoreUrl && (
                <a
                  href={error.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {t("errors.learnMore")}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 标题和搜索 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          {t("errors.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("errors.description")}
        </p>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("errors.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "dark:border-white/10"
            )}
          />
        </div>
      </div>

      {/* 搜索结果或分类列表 */}
      {filteredErrors ? (
        <div className="space-y-2">
          {filteredErrors.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t("errors.searchResults", { count: filteredErrors.length })}
              </p>
              {filteredErrors.map(renderErrorCard)}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("errors.noResults")}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ERROR_CATEGORIES.map((category) => {
            const categoryErrors = getErrorsByCategory(category.id);
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} className="border rounded-lg dark:border-white/10">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left transition-colors",
                    "hover:bg-muted/50 dark:hover:bg-muted/30"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      !isExpanded && "-rotate-90"
                    )}
                  />
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{t(category.titleKey)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {categoryErrors.length} {t("errors.items")}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {categoryErrors.map(renderErrorCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ErrorSolutions;
