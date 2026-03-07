/**
 * DocumentUploader Component
 * 上传文档用于 RAG 对话
 */
import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { uploadRAGDocument, RAGUploadResponse } from "@/api/client";
import { cn } from "@/lib/utils";

// Supported file types
const ACCEPTED_TYPES = [".txt", ".md", ".pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface DocumentUploaderProps {
  onUploadSuccess: (result: RAGUploadResponse) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploader({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className,
}: DocumentUploaderProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Unsupported file type: ${ext}. Supported: ${ACCEPTED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        return;
      }

      setIsUploading(true);
      try {
        const result = await uploadRAGDocument(file);
        if (result.success) {
          onUploadSuccess(result);
        } else {
          onUploadError?.(result.error || t("rag.uploadError"));
        }
      } catch (error) {
        onUploadError?.(error instanceof Error ? error.message : t("rag.uploadError"));
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess, onUploadError, t]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input to allow re-uploading the same file
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t("rag.selectFile")}
      aria-disabled={disabled || isUploading}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {isUploading ? (
          <>
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span className="text-sm text-muted-foreground" role="status" aria-live="polite">{t("rag.uploading")}</span>
          </>
        ) : (
          <>
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="text-sm">
              <span className="font-medium text-primary">{t("rag.selectFile")}</span>
              <span className="text-muted-foreground"> {t("rag.dragDrop")}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("rag.supportedFormats")} • {t("rag.maxSize")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
