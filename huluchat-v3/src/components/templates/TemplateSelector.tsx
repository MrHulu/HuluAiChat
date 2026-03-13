/**
 * TemplateSelector Component - TASK-197
 * Quick session creation with preset templates
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  listSessionTemplates,
  SessionTemplate,
} from "@/api/client";
import { Loader2 } from "lucide-react";

export interface TemplateSelectorProps {
  onSelectTemplate: (template: SessionTemplate) => void;
  className?: string;
}

export function TemplateSelector({
  onSelectTemplate,
  className,
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await listSessionTemplates();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError(t("templates.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, [t]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t("templates.loading")}</span>
      </div>
    );
  }

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-trigger the effect by calling loadTemplates directly
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await listSessionTemplates();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError(err instanceof Error ? err.message : t("templates.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  };

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-destructive mb-3">{error}</p>
        <button
          onClick={handleRetry}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md",
            "bg-secondary text-secondary-foreground",
            "hover:bg-secondary/80 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span>{t("common.retry", "Retry")}</span>
        </button>
      </div>
    );
  }

  // Helper function to get localized template name
  const getTemplateName = (template: SessionTemplate): string => {
    // For built-in templates, try to use translation first
    if (template.is_builtin) {
      const translationKey = `templates.builtIn.${template.id}.name`;
      const translatedName = t(translationKey);
      // If translation exists (key doesn't return itself), use it
      if (translatedName !== translationKey) {
        return translatedName;
      }
    }
    // Fallback to server-provided name
    return template.name;
  };

  // Helper function to get localized template description
  const getTemplateDescription = (template: SessionTemplate): string | null => {
    if (!template.description) return null;
    // For built-in templates, try to use translation first
    if (template.is_builtin) {
      const translationKey = `templates.builtIn.${template.id}.description`;
      const translatedDesc = t(translationKey);
      // If translation exists (key doesn't return itself), use it
      if (translatedDesc !== translationKey) {
        return translatedDesc;
      }
    }
    // Fallback to server-provided description
    return template.description;
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className={cn(
            "flex flex-col items-start p-4 rounded-lg border transition-all",
            "hover:border-primary hover:bg-accent/50 hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "text-left"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{template.icon || "📝"}</span>
            <span className="font-medium">{getTemplateName(template)}</span>
          </div>
          {getTemplateDescription(template) && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {getTemplateDescription(template)}
            </p>
          )}
          {template.default_model && (
            <span className="mt-2 text-xs text-primary/70">
              {template.default_model}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Template icon for display in lists
 */
export function TemplateIcon({ icon, name }: { icon?: string | null; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span>{icon || "📝"}</span>
      <span>{name}</span>
    </span>
  );
}
