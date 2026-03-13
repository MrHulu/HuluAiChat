/**
 * RAGPanel Component
 * RAG 文档上传和管理的面板
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DocumentUploader, DocumentList } from ".";
import { RAGUploadResponse } from "@/api/client";
import { cn } from "@/lib/utils";

export interface RAGPanelProps {
  onDocumentChange?: (docId?: string) => void;
  /** Called when a document is successfully uploaded - TASK-324 */
  onDocumentUpload?: () => void;
  disabled?: boolean;
  className?: string;
}

export function RAGPanel({
  onDocumentChange,
  onDocumentUpload,
  disabled = false,
  className,
}: RAGPanelProps) {
  const { t } = useTranslation();

  const handleUploadSuccess = useCallback(
    (result: RAGUploadResponse) => {
      onDocumentChange?.(result.doc_id);
      onDocumentUpload?.(); // TASK-324: 通知文档上传成功
    },
    [onDocumentChange, onDocumentUpload]
  );

  const handleUploadError = useCallback((error: string) => {
    console.error("Upload error:", error);
  }, []);

  const handleDelete = useCallback(
    (docId: string) => {
      onDocumentChange?.(docId);
    },
    [onDocumentChange]
  );

  return (
    <section
      className={cn("flex flex-col gap-4 p-4", className)}
      role="region"
      aria-labelledby="rag-panel-title"
      aria-describedby="rag-panel-description"
    >
      {/* Header */}
      <div className="space-y-1">
        <h3 id="rag-panel-title" className="text-sm font-medium text-foreground">{t("rag.title")}</h3>
        <p id="rag-panel-description" className="text-xs text-muted-foreground">{t("rag.description")}</p>
      </div>

      {/* Document Uploader */}
      <DocumentUploader
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        disabled={disabled}
      />

      {/* Document List */}
      <DocumentList onDelete={handleDelete} disabled={disabled} />
    </section>
  );
}
