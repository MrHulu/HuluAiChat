/**
 * ChatInput Component
 * 聊天输入框，支持多行输入、快捷键、模板选择器和图片上传
 */
import { useState, useRef, useEffect, useCallback, memo, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Send, ImagePlus, X, Loader2 } from "lucide-react";
import {
  PromptTemplateSelector,
} from "@/components/templates/PromptTemplateSelector";
import { VoiceInputButton } from "@/components/chat/VoiceInputButton";
import { ImageContent } from "@/api/client";

// Constants
const MAX_TEXTAREA_HEIGHT = 200;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 5;

export interface ChatInputProps {
  onSend: (message: string, images?: ImageContent[]) => void;
  disabled?: boolean;
  placeholder?: string;
  onTemplateSelect?: (content: string) => void;
  isLoading?: boolean;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  placeholder,
  isLoading = false,
}: ChatInputProps) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [images, setImages] = useState<ImageContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevDisabledRef = useRef<boolean | undefined>(undefined);

  const actualPlaceholder = placeholder || t("chat.typeMessage");

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [value]);

  // 自动聚焦：初始渲染时或 disabled 从 true 变为 false 时聚焦
  useEffect(() => {
    const shouldFocus = !disabled && (prevDisabledRef.current === true || prevDisabledRef.current === undefined);
    prevDisabledRef.current = disabled;

    if (shouldFocus && textareaRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [disabled]);

  // 处理图片文件（支持选择和拖拽上传）
  const processImageFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ImageContent[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_SIZE) {
        console.warn(`Image ${file.name} is too large (max 10MB)`);
        continue;
      }
      if (images.length + newImages.length >= MAX_IMAGES) break;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImages((prev) => {
            if (prev.length >= MAX_IMAGES) return prev;
            return [...prev, { type: "image_url", image_url: { url: dataUrl } }];
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }, [images.length]);

  // 处理图片文件选择
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processImageFiles(files);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processImageFiles]);

  // 移除图片
  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个容器时才取消拖拽状态
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFiles(files);
    }
  }, [disabled, isLoading, processImageFiles]);

  const handleSend = useCallback(() => {
    if ((value.trim() || images.length > 0) && !disabled) {
      onSend(value.trim(), images.length > 0 ? images : undefined);
      setValue("");
      setImages([]);
      // 重置高度并保持聚焦
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    }
  }, [value, images, disabled, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleTemplateSelect = useCallback((content: string) => {
    setValue(content);
    setShowTemplateSelector(false);
    // Focus textarea after selection
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

  // 处理语音输入
  const handleVoiceTranscript = useCallback((text: string) => {
    setValue(text);
    // Focus textarea after voice input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleOpenTemplateSelector = useCallback(() => {
    setShowTemplateSelector(true);
  }, []);

  // 打开图片选择器
  const handleOpenImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "chat-input-container border-t border-border bg-background dark:bg-background/95 dark:shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)] p-4 transition-all duration-300 ease-out relative",
        // 拖拽状态视觉反馈
        isDragging && "border-primary/50 bg-primary/5 dark:bg-primary/10",
        isDragging && "dark:shadow-[0_0_24px_oklch(0.5_0.2_264/0.2),0_-4px_20px_-5px_rgba(0,0,0,0.3)]"
      )}
      role="region"
      aria-label={t("chat.typeMessage")}
    >
      {/* 拖拽提示覆盖层 */}
      {isDragging && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 dark:bg-background/90 backdrop-blur-sm animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 dark:bg-primary/10 dark:border-primary/40">
            <ImagePlus className="w-8 h-8 text-primary animate-bounce" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">{t("chat.dropImage")}</span>
          </div>
        </div>
      )}
      {/* Image Preview Area */}
      {images.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto animate-fade-in"
          role="group"
          aria-label={t("chat.uploadedImages")}
        >
          {images.map((image, index) => (
            <div key={index} className="image-preview-item relative group list-item-enter rounded-lg">
              <img
                src={image.image_url.url}
                alt={t("chat.uploadedImage", { index: index + 1 })}
                className="w-16 h-16 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                aria-label={t("chat.removeImage")}
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Template Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenTemplateSelector}
          disabled={disabled}
          className="chat-input-icon-btn px-3 h-12 transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95 group"
          aria-label={t("chat.selectTemplate")}
        >
          <LayoutTemplate className="w-[18px] h-[18px] transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
        </Button>

        {/* Image Upload Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenImagePicker}
          disabled={disabled || images.length >= MAX_IMAGES}
          className="chat-input-icon-btn px-3 h-12 transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95 disabled:hover:scale-100 group"
          aria-label={t("chat.uploadImage")}
        >
          <ImagePlus className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Voice Input Button */}
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          disabled={disabled}
          lang={i18n.language}
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={actualPlaceholder}
            disabled={disabled}
            rows={1}
            aria-label={actualPlaceholder}
            aria-describedby="chat-input-hint"
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background",
              "px-4 py-3 text-sm",
              "placeholder:text-muted-foreground",
              "hover:border-muted-foreground/40 dark:hover:border-muted-foreground/50 dark:hover:bg-muted/10",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "dark:focus:ring-ring/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200 ease-out"
            )}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || isLoading || (!value.trim() && images.length === 0)}
          data-loading={isLoading || undefined}
          className="chat-send-button px-6 h-12 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 group"
          aria-label={isLoading ? t("chat.sending") : t("chat.send")}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span className="mr-2">{t("chat.sending")}</span>
            </>
          ) : (
            <>
              <span className="mr-2">{t("chat.send")}</span>
              <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
      <div id="chat-input-hint" className="text-xs text-muted-foreground mt-2 text-center" aria-live="polite">
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
});
