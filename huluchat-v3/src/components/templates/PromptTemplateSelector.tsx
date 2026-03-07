/**
 * PromptTemplateSelector Component
 * Template selection dialog for prompt templates
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PromptTemplate,
  TemplateCategory,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/api/client";

interface PromptTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (content: string) => void;
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  writing: "✍️",
  coding: "💻",
  analysis: "📊",
  translation: "🌐",
  custom: "⭐",
};

export function PromptTemplateSelector({
  open,
  onOpenChange,
  onSelect,
}: PromptTemplateSelectorProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");

  const getCategoryLabel = (category: TemplateCategory) => {
    return t(`templates.categories.${category}`);
  };

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTemplates(selectedCategory || undefined);
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Load templates on mount
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  const handleSelect = (template: PromptTemplate) => {
    onSelect(template.content);
    onOpenChange(false);
  };

  const handleCreateNew = async () => {
    const name = editName.trim() || t("templates.newTemplate").replace("+ ", "");
    const content = editContent.trim();

    if (!content) return;

    try {
      const newTemplate = await createTemplate(name, content, "custom");
      setTemplates((prev) => [...prev, newTemplate]);
      setEditingTemplate(null);
      setEditContent("");
      setEditName("");
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleUpdateTemplate = async (template: PromptTemplate) => {
    const name = editName.trim() || template.name;
    const content = editContent.trim();

    if (!content) return;

    try {
      const updated = await updateTemplate(template.id, {
        name,
        content,
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setEditingTemplate(null);
      setEditContent("");
      setEditName("");
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  };

  const handleDeleteTemplate = async (template: PromptTemplate) => {
    try {
      await deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const startEditing = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditContent(template.content);
  };

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce(
    (acc, template) => {
      const category = template.category as TemplateCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<TemplateCategory, PromptTemplate[]>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("templates.title")}</DialogTitle>
          <DialogDescription>{t("templates.description")}</DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTemplate({ id: "", name: "", content: "", category: "custom", is_builtin: false, created_at: "", updated_at: "" });
                setEditName("");
                setEditContent("");
              }}
            >
              {t("templates.newTemplate")}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Filter */}
          <nav className="w-48 border-r border-border pr-2 overflow-y-auto" aria-label={t("templates.categoriesLabel")}>
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => setSelectedCategory(null)}
              aria-pressed={selectedCategory === null}
            >
              {t("templates.all")}
            </Button>
            {(Object.keys(CATEGORY_ICONS) as TemplateCategory[]).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
              >
                <span className="mr-2" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                {getCategoryLabel(category)}
              </Button>
            ))}
          </nav>

          {/* Template List / Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">{t("common.loading")}</span>
              </div>
            ) : editingTemplate ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1">{t("templates.name")}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t("templates.namePlaceholder")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1">{t("templates.content")}</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
                    placeholder={t("templates.contentPlaceholder")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      setEditContent("");
                      setEditName("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={() =>
                      editingTemplate.is_builtin
                        ? handleUpdateTemplate(editingTemplate)
                        : handleCreateNew()
                    }
                  >
                    {editingTemplate.is_builtin ? t("common.save") : t("common.save")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <span>{CATEGORY_ICONS[category as TemplateCategory]}</span>
                      <span>{getCategoryLabel(category as TemplateCategory)}</span>
                    </h4>
                    <div className="space-y-2" role="list" aria-label={t("templates.templateList")}>
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          role="listitem"
                          tabIndex={0}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            "hover:bg-accent hover:border-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            template.is_builtin
                              ? "border-border"
                              : "border-dashed"
                          )}
                          onClick={() => handleSelect(template)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelect(template);
                            }
                          }}
                          aria-label={t("templates.selectTemplate", { name: template.name })}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.content.substring(0, 100)}...
                              </div>
                            </div>
                            {!template.is_builtin && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label={t("templates.edit")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(template);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L3.5 13.5 4 4 12.5 2.5 0 0 5.5 6.5L12 21l6.5-6.5-6.5-6.5z" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive"
                                  aria-label={t("templates.delete")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
