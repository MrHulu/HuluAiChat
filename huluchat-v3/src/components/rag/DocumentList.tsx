/**
 * DocumentList Component
 * 显示已上传的 RAG 文档列表
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { listRAGDocuments, deleteRAGDocument, RAGDocument } from "@/api/client";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export interface DocumentListProps {
  onDelete?: (docId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentList({
  onDelete,
  disabled = false,
  className,
}: DocumentListProps) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await listRAGDocuments();
      setDocuments(response.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (doc: RAGDocument) => {
    if (disabled) return;

    const confirmed = window.confirm(t("rag.deleteConfirm"));
    if (!confirmed) return;

    setDeletingId(doc.doc_id);
    try {
      const result = await deleteRAGDocument(doc.doc_id);
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.doc_id !== doc.doc_id));
        onDelete?.(doc.doc_id);
      } else {
        console.error("Delete failed:", result.error);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4 animate-fade-in", className)}>
        <Loading variant="ring" size="md" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={cn("text-center py-4 text-muted-foreground", className)}>
        {t("rag.noDocuments")}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-foreground">{t("rag.documents")}</h3>
      <ul className="space-y-1">
        {documents.map((doc) => (
          <li
            key={doc.doc_id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* File icon */}
              <svg
                className="w-4 h-4 text-muted-foreground shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm truncate">{doc.filename}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {t("rag.chunks", { count: doc.chunk_count })}
              </span>
            </div>
            <button
              onClick={() => handleDelete(doc)}
              disabled={disabled || deletingId === doc.doc_id}
              className={cn(
                "text-xs px-2 py-1 rounded-md transition-colors",
                "text-destructive hover:bg-destructive/10",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {deletingId === doc.doc_id ? t("rag.deleting") : t("rag.delete")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
