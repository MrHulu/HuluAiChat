/**
 * RAGPanel Component Tests
 * Tests for RAG panel integration
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RAGPanel } from "./RAGPanel";
import * as api from "@/api/client";

// Mock the API module
vi.mock("@/api/client", () => ({
  listRAGDocuments: vi.fn(),
  uploadRAGDocument: vi.fn(),
  deleteRAGDocument: vi.fn(),
}));

// Mock child components
vi.mock("./DocumentUploader", () => ({
  DocumentUploader: ({ onUploadSuccess, onUploadError }: {
    onUploadSuccess: (result: { doc_id: string }) => void;
    onUploadError?: (error: string) => void;
  }) => (
    <div data-testid="document-uploader">
      <button onClick={() => onUploadSuccess({ doc_id: "new-doc" })}>
        Mock Upload
      </button>
      <button onClick={() => onUploadError?.("Upload failed")}>
        Mock Error
      </button>
    </div>
  ),
}));

vi.mock("./DocumentList", () => ({
  DocumentList: ({ onDelete }: { onDelete?: (docId: string) => void }) => (
    <div data-testid="document-list">
      <button onClick={() => onDelete?.("deleted-doc")}>Mock Delete</button>
    </div>
  ),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "rag.title": "Document Chat (Experimental)",
        "rag.description": "Upload a document to chat with it",
      };
      return translations[key] || key;
    },
  }),
}));

describe("RAGPanel", () => {
  const mockDocuments = [
    { doc_id: "doc-1", filename: "test.txt", chunk_count: 5 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listRAGDocuments).mockResolvedValue({ documents: mockDocuments });
  });

  it("should render panel with uploader and list", () => {
    render(<RAGPanel />);

    expect(screen.getByTestId("document-uploader")).toBeInTheDocument();
    expect(screen.getByTestId("document-list")).toBeInTheDocument();
  });

  it("should show title and description", () => {
    render(<RAGPanel />);

    expect(screen.getByText("Document Chat (Experimental)")).toBeInTheDocument();
    expect(screen.getByText("Upload a document to chat with it")).toBeInTheDocument();
  });

  it("should call onDocumentChange when upload succeeds", async () => {
    const mockOnDocumentChange = vi.fn();

    render(<RAGPanel onDocumentChange={mockOnDocumentChange} />);

    const uploadButton = screen.getByText("Mock Upload");
    uploadButton.click();

    await waitFor(() => {
      expect(mockOnDocumentChange).toHaveBeenCalled();
    });
  });

  it("should call onDocumentChange when document is deleted", async () => {
    const mockOnDocumentChange = vi.fn();

    render(<RAGPanel onDocumentChange={mockOnDocumentChange} />);

    const deleteButton = screen.getByText("Mock Delete");
    deleteButton.click();

    await waitFor(() => {
      expect(mockOnDocumentChange).toHaveBeenCalledWith("deleted-doc");
    });
  });

  it("should apply custom className", () => {
    render(<RAGPanel className="custom-class" />);

    const panel = screen.getByText("Document Chat (Experimental)").closest("div");
    expect(panel?.parentElement).toHaveClass("custom-class");
  });
});
