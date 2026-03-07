/**
 * TagFilter Component
 * Filter sessions by tags
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onClearSelection: () => void;
}

export function TagFilter({
  allTags,
  selectedTags,
  onTagSelect,
  onClearSelection,
}: TagFilterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (allTags.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs rounded-md",
            "border transition-colors",
            selectedTags.length > 0
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-transparent border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <path d="M7 7h.01" />
          </svg>
          {selectedTags.length > 0 ? (
            <span>
              {selectedTags.length} {t("tags.selected")}
            </span>
          ) : (
            <span>{t("tags.filterByTag")}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("tags.filterByTag")}
            </span>
            {selectedTags.length > 0 && (
              <button
                onClick={onClearSelection}
                className="text-[10px] text-primary hover:underline"
              >
                {t("tags.clear")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full border transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
