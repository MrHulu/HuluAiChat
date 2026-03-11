/**
 * ChatInput Component
 * 聊天输入框，支持多行输入、快捷键、模板选择器、图片上传和文件上传
 */
import { useState, useRef, useEffect, useCallback, memo, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Send, ImagePlus, X, Loader2, Paperclip, FileText, FileCode, File } from "lucide-react";
import {
  PromptTemplateSelector,
} from "@/components/templates/PromptTemplateSelector";
import { VoiceInputButton } from "@/components/chat/VoiceInputButton";
import { ImageContent, FileAttachment } from "@/api/client";

// Constants
const MAX_TEXTAREA_HEIGHT = 200;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_IMAGES = 5;
const MAX_FILES = 5;

// Get file type icon based on MIME type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("text/") || mimeType.includes("javascript") || mimeType.includes("typescript")) {
    if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json") || mimeType.includes("xml")) {
      return FileCode;
    }
    return FileText;
  }
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("sheet")) {
    return FileText;
  }
  return File;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ChatInputProps {
  onSend: (message: string, images?: ImageContent[], files?: FileAttachment[]) => void;
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
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
  const processImageFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newImages: ImageContent[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(t("chat.imageTooLarge", { name: file.name, max: "10MB" }));
        continue;
      }
      if (images.length + newImages.length >= MAX_IMAGES) {
        toast.warning(t("chat.maxImagesReached", { max: MAX_IMAGES }));
        break;
      }

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

  // 处理普通文件（支持选择和拖拽上传）
  const processRegularFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Skip images (handled separately)
      if (file.type.startsWith("image/")) continue;
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("chat.fileTooLarge", { name: file.name, max: "20MB" }));
        continue;
      }
      // Check if max files reached
      if (files.length >= MAX_FILES) {
        toast.warning(t("chat.maxFilesReached", { max: MAX_FILES }));
        break;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setFiles((prev) => {
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              content: content,
            }];
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }, [files.length]);

  // 处理图片文件选择
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processImageFiles(fileList);
    }
    // Reset file input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [processImageFiles]);

  // 处理普通文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processRegularFiles(fileList);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processRegularFiles]);

  // 移除图片
  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 移除文件
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
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

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      // Process both images and regular files
      processImageFiles(droppedFiles);
      processRegularFiles(droppedFiles);
    }
  }, [disabled, isLoading, processImageFiles, processRegularFiles]);

  const handleSend = useCallback(() => {
    if ((value.trim() || images.length > 0 || files.length > 0) && !disabled) {
      onSend(
        value.trim(),
        images.length > 0 ? images : undefined,
        files.length > 0 ? files : undefined
      );
      setValue("");
      setImages([]);
      setFiles([]);
      // 重置高度并保持聚焦
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    }
  }, [value, images, files, disabled, onSend]);

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
    imageInputRef.current?.click();
  }, []);

  // 打开文件选择器
  const handleOpenFilePicker = useCallback(() => {
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
            <ImagePlus className="w-8 h-8 text-primary animate-bounce-subtle" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">{t("chat.dropFile")}</span>
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
            <div
              key={index}
              className="image-preview-item relative group animate-list-enter rounded-lg"
              style={{ animationDelay: `${index * 50}ms` }}
            >
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
      {/* File Preview Area */}
      {files.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto animate-fade-in"
          role="group"
          aria-label={t("chat.uploadedFiles")}
        >
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="file-preview-item relative group flex items-center gap-2 px-3 py-2 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border animate-list-enter"
              >
                <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium truncate max-w-[120px]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 flex-shrink-0"
                  aria-label={t("chat.removeFile")}
                >
                  <X className="w-2.5 h-2.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
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
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* File Upload Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenFilePicker}
          disabled={disabled || files.length >= MAX_FILES}
          className="chat-input-icon-btn px-3 h-12 transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95 disabled:hover:scale-100 group"
          aria-label={t("chat.uploadFile")}
        >
          <Paperclip className="w-[18px] h-[18px] transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.html,.css,.xml,.doc,.docx,.xls,.xlsx"
          multiple
          onChange={handleFileSelect}
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
          disabled={disabled || isLoading || (!value.trim() && images.length === 0 && files.length === 0)}
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
