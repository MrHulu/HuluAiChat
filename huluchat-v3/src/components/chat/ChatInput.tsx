/**
 * ChatInput Component
 * 聊天输入框，支持多行输入、快捷键和模板选择器
 */
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PromptTemplateSelector,
} from "@/components/templates/PromptTemplateSelector";

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onTemplateSelect?: (content: string) => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const actualPlaceholder = placeholder || t("chat.typeMessage");

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
      // 重置高度
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (content: string) => {
    setValue(content);
    setShowTemplateSelector(false);
    // Focus textarea after selection
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Template Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTemplateSelector(true)}
          disabled={disabled}
          className="rounded-xl px-3 h-12"
          title={t("chat.selectTemplate")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18h18" />
            <path d="M12 3v18" />
          </svg>
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={actualPlaceholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-background",
              "px-4 py-3 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200"
            )}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="rounded-xl px-6 h-12"
        >
          <span className="mr-2">{t("chat.send")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        {t("chat.enterToSend")}
      </div>

      {/* Template Selector Dialog */}
      <PromptTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}
