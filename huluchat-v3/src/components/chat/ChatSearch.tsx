/**
 * ChatSearch Component
 * 会话内搜索功能 - TASK-202
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Search, X, ChevronUp, ChevronDown, CaseSensitive } from "lucide-react";

export interface ChatSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, caseSensitive: boolean) => void;
  onNavigate: (direction: "prev" | "next") => void;
  matchCount: number;
  currentMatch: number;
}

export function ChatSearch({
  isOpen,
  onClose,
  onSearch,
  onNavigate,
  matchCount,
  currentMatch,
}: ChatSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle search input change
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      onSearch(value, caseSensitive);
    },
    [caseSensitive, onSearch]
  );

  // Toggle case sensitivity
  const toggleCaseSensitive = useCallback(() => {
    const newValue = !caseSensitive;
    setCaseSensitive(newValue);
    onSearch(query, newValue);
  }, [caseSensitive, query, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onNavigate("prev");
        } else {
          onNavigate("next");
        }
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "F3") {
        e.preventDefault();
        if (e.shiftKey) {
          onNavigate("prev");
        } else {
          onNavigate("next");
        }
      }
    },
    [onNavigate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        "bg-background border-b border-border",
        "animate-slide-down"
      )}
      role="search"
      aria-label={t("chat.searchInConversation")}
    >
      {/* Search Icon */}
      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("chat.searchPlaceholder")}
        className={cn(
          "flex-1 min-w-0 px-2 py-1 text-sm",
          "bg-transparent border-none outline-none",
          "text-foreground placeholder:text-muted-foreground"
        )}
        aria-label={t("chat.searchQuery")}
      />

      {/* Match Counter */}
      {query && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {matchCount > 0
            ? t("chat.searchMatchCount", {
                current: currentMatch + 1,
                total: matchCount,
              })
            : t("chat.searchNoMatch")}
        </span>
      )}

      {/* Case Sensitive Toggle */}
      <button
        onClick={toggleCaseSensitive}
        aria-label={t("chat.searchCaseSensitive")}
        aria-pressed={caseSensitive}
        className={cn(
          "p-1 rounded transition-colors",
          caseSensitive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <CaseSensitive className="w-4 h-4" />
      </button>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onNavigate("prev")}
          disabled={matchCount === 0}
          aria-label={t("chat.searchPrev")}
          className={cn(
            "p-1 rounded transition-colors",
            matchCount === 0
              ? "text-muted-foreground/50 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate("next")}
          disabled={matchCount === 0}
          aria-label={t("chat.searchNext")}
          className={cn(
            "p-1 rounded transition-colors",
            matchCount === 0
              ? "text-muted-foreground/50 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label={t("chat.searchClose")}
        className={cn(
          "p-1 rounded transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
