/**
 * KnowledgeCenter - AI 知识中心
 * 提示词技巧、帮助文档等知识内容
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Lightbulb, HelpCircle, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PROMPT_TIPS, type PromptTip } from "@/data/promptTips";
import { ArticleViewer } from "./ArticleViewer";
import { FAQList } from "./FAQList";
import { ShortcutList } from "./ShortcutList";
import { FeedbackLinks } from "./FeedbackLinks";

interface KnowledgeCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialArticleId?: string;
}

type Category = "prompts" | "help" | "models";

interface CategoryInfo {
  id: Category;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: "prompts",
    icon: <Lightbulb className="size-5" />,
    titleKey: "knowledge.categories.prompts",
    descriptionKey: "knowledge.categories.promptsDesc",
  },
  {
    id: "help",
    icon: <HelpCircle className="size-5" />,
    titleKey: "knowledge.categories.help",
    descriptionKey: "knowledge.categories.helpDesc",
  },
  {
    id: "models",
    icon: <BookOpen className="size-5" />,
    titleKey: "knowledge.categories.models",
    descriptionKey: "knowledge.categories.modelsDesc",
  },
];

export function KnowledgeCenter({
  open,
  onOpenChange,
  initialArticleId,
}: KnowledgeCenterProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<PromptTip | null>(() => {
    if (initialArticleId) {
      return PROMPT_TIPS.find((tip) => tip.id === initialArticleId) || null;
    }
    return null;
  });

  // 获取当前分类的文章列表
  const articles = useMemo(() => {
    if (selectedCategory === "prompts") {
      return PROMPT_TIPS;
    }
    // 其他分类可以后续扩展
    return [];
  }, [selectedCategory]);

  // 处理文章选择
  const handleSelectArticle = (article: PromptTip) => {
    setSelectedArticle(article);
  };

  // 返回分类列表
  const handleBackToCategories = () => {
    setSelectedArticle(null);
  };

  // 返回主页
  const handleBackToHome = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
  };

  // 关闭对话框
  const handleClose = () => {
    onOpenChange(false);
    // 延迟重置状态，避免关闭动画期间状态变化
    setTimeout(() => {
      setSelectedCategory(null);
      setSelectedArticle(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {selectedArticle ? (
              <button
                onClick={handleBackToCategories}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : selectedCategory ? (
              <button
                onClick={handleBackToHome}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}
            <BookOpen className="size-5" />
            <span>
              {selectedArticle
                ? t(selectedArticle.titleKey)
                : selectedCategory
                ? t(`knowledge.categories.${selectedCategory}`)
                : t("knowledge.title")}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 主页 - 分类列表 */}
          {!selectedCategory && !selectedArticle && (
            <div className="grid gap-4 p-4">
              <p className="text-muted-foreground text-sm mb-4">
                {t("knowledge.description")}
              </p>
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border text-left",
                    "hover:bg-muted/50 transition-all duration-200",
                    "dark:border-white/10 dark:hover:bg-muted/30"
                  )}
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{t(category.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(category.descriptionKey)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 分类页 - 文章列表 */}
          {selectedCategory && !selectedArticle && (
            <div className="p-4">
              {/* Help 分类显示 FAQ 和快捷键 */}
              {selectedCategory === "help" ? (
                <>
                  {/* 快捷键列表 */}
                  <ShortcutList className="mb-8" />
                  {/* FAQ 列表 */}
                  <FAQList className="mb-8" />
                  {/* 反馈入口 */}
                  <FeedbackLinks />
                </>
              ) : articles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("knowledge.comingSoon")}
                </p>
              ) : (
                <div className="space-y-2">
                  {articles.map((article, index) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left",
                        "hover:bg-muted/50 transition-all duration-200",
                        "dark:hover:bg-muted/30",
                        "animate-list-enter"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="p-1.5 rounded bg-primary/10 text-primary text-lg">
                        {article.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {t(article.titleKey)}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {t(article.descriptionKey)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {t(`knowledge.levels.${article.level}`)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 文章详情页 */}
          {selectedArticle && (
            <ArticleViewer article={selectedArticle} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { type KnowledgeCenterProps };
