/**
 * TagInput Component
 * Input for adding tags to a session
 */
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SessionTag } from "./SessionTag";

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  existingTags?: string[];
  maxTags?: number;
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  existingTags = [],
  maxTags = 5,
}: TagInputProps) {
  const { t } = useTranslation();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInputVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputVisible]);

  const filteredSuggestions = existingTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
  );

  const handleSubmit = (tag?: string) => {
    const finalTag = tag || inputValue.trim().toLowerCase();
    if (
      finalTag &&
      !tags.includes(finalTag) &&
      tags.length < maxTags &&
      /^[a-z0-9\u4e00-\u9fa5_-]+$/.test(finalTag)
    ) {
      onAddTag(finalTag);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsInputVisible(false);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicking suggestions
    setTimeout(() => {
      if (inputValue.trim()) {
        handleSubmit();
      }
      setIsInputVisible(false);
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <SessionTag
          key={tag}
          name={tag}
          onRemove={() => onRemoveTag(tag)}
          size="xs"
        />
      ))}

      {tags.length < maxTags && (
        <>
          {isInputVisible ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={t("tags.addTag")}
                className={cn(
                  "w-20 px-1.5 py-0.5 text-[10px] rounded-full border",
                  "bg-transparent border-dashed border-muted-foreground/50",
                  "focus:outline-none focus:border-primary"
                )}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-full mt-1 z-50",
                    "min-w-[100px] max-w-[150px] p-1",
                    "bg-popover border rounded-md shadow-md"
                  )}
                >
                  {filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={() => handleSubmit(suggestion)}
                      className={cn(
                        "w-full px-2 py-1 text-xs text-left rounded",
                        "hover:bg-muted transition-colors"
                      )}
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInputVisible(true);
              }}
              className={cn(
                "px-1.5 py-0.5 text-[10px] rounded-full border border-dashed",
                "border-muted-foreground/30 text-muted-foreground",
                "hover:border-muted-foreground/50 hover:text-muted-foreground",
                "transition-colors"
              )}
            >
              + {t("tags.tag")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
