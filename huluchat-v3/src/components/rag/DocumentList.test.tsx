/**
 * DocumentList Component Tests
 * Tests for RAG document list display
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentList } from "./DocumentList";
import * as api from "@/api/client";

// Mock the API module
vi.mock("@/api/client", () => ({
  listRAGDocuments: vi.fn(),
  deleteRAGDocument: vi.fn(),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "rag.documents": "Documents",
        "rag.noDocuments": "No documents uploaded",
        "rag.chunks": "{{count}} chunks",
        "rag.delete": "Delete",
        "rag.deleteConfirm": "Are you sure you want to delete this document?",
        "rag.deleting": "Deleting...",
        "rag.deleteError": "Failed to delete document",
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

describe("DocumentList", () => {
  const mockOnDelete = vi.fn();

  const mockDocuments = [
    { doc_id: "doc-1", filename: "test1.txt", chunk_count: 5 },
    { doc_id: "doc-2", filename: "test2.md", chunk_count: 3 },
    { doc_id: "doc-3", filename: "document.pdf", chunk_count: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listRAGDocuments).mockResolvedValue({ documents: mockDocuments });
  });

  it("should render document list", async () => {
    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
      expect(screen.getByText("test2.md")).toBeInTheDocument();
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });
  });

  it("should show chunk count for each document", async () => {
    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText("5 chunks")).toBeInTheDocument();
      expect(screen.getByText("3 chunks")).toBeInTheDocument();
      expect(screen.getByText("10 chunks")).toBeInTheDocument();
    });
  });

  it("should show empty state when no documents", async () => {
    vi.mocked(api.listRAGDocuments).mockResolvedValueOnce({ documents: [] });

    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText("No documents uploaded")).toBeInTheDocument();
    });
  });

  it("should call delete when delete button clicked", async () => {
    vi.mocked(api.deleteRAGDocument).mockResolvedValueOnce({ success: true });

    render(<DocumentList onDelete={mockOnDelete} />);

    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
    });

    // Mock confirm dialog
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    // Click delete button for first document
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteRAGDocument).toHaveBeenCalledWith("doc-1");
    });

    window.confirm = originalConfirm;
  });

  it("should not delete if user cancels confirmation", async () => {
    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
    });

    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(api.deleteRAGDocument).not.toHaveBeenCalled();

    window.confirm = originalConfirm;
  });

  it("should show loading state initially", () => {
    vi.mocked(api.listRAGDocuments).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DocumentList />);

    // Loading component renders an element with animate-spin class
    const loadingElement = document.querySelector(".animate-spin");
    expect(loadingElement).toBeInTheDocument();
  });

  it("should remove document from list after successful delete", async () => {
    vi.mocked(api.deleteRAGDocument).mockResolvedValueOnce({ success: true });

    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
    });

    // Delete first document
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("test1.txt")).not.toBeInTheDocument();
    });

    window.confirm = originalConfirm;
  });

  it("should handle delete error gracefully", async () => {
    vi.mocked(api.deleteRAGDocument).mockResolvedValueOnce({
      success: false,
      error: "Delete failed",
    });

    render(<DocumentList onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
    });

    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteRAGDocument).toHaveBeenCalled();
    });

    // Document should still be in list since delete failed
    expect(screen.getByText("test1.txt")).toBeInTheDocument();

    window.confirm = originalConfirm;
  });

  it("should be disabled when prop is set", async () => {
    render(<DocumentList disabled />);

    await waitFor(() => {
      expect(screen.getByText("test1.txt")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    deleteButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
