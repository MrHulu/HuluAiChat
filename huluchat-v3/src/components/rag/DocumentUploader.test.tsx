/**
 * DocumentUploader Component Tests
 * Tests for RAG document upload functionality
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentUploader } from "./DocumentUploader";
import * as api from "@/api/client";

// Mock the API module
vi.mock("@/api/client", () => ({
  uploadRAGDocument: vi.fn(),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "rag.uploadDocument": "Upload Document",
        "rag.supportedFormats": "Supported formats: TXT, MD, PDF",
        "rag.maxSize": "Max size: 5MB",
        "rag.uploading": "Uploading...",
        "rag.uploadSuccess": "Document uploaded successfully",
        "rag.uploadError": "Upload failed",
        "rag.selectFile": "Select File",
        "rag.dragDrop": "Drag and drop a file here, or click to select",
      };
      return translations[key] || key;
    },
  }),
}));

describe("DocumentUploader", () => {
  const mockOnUploadSuccess = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render upload button", () => {
    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    expect(screen.getByText("Select File")).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop/)).toBeInTheDocument();
  });

  it("should show supported formats", () => {
    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    expect(screen.getByText(/TXT, MD, PDF/)).toBeInTheDocument();
    expect(screen.getByText(/5MB/)).toBeInTheDocument();
  });

  it("should accept valid file types", () => {
    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input).toHaveAttribute("accept", ".txt,.md,.pdf");
  });

  it("should upload file on selection", async () => {
    const mockResponse = {
      success: true,
      doc_id: "doc-123",
      filename: "test.txt",
      chunk_count: 5,
    };
    vi.mocked(api.uploadRAGDocument).mockResolvedValueOnce(mockResponse);

    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.uploadRAGDocument).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  it("should show uploading state during upload", async () => {
    let resolveUpload: (value: unknown) => void;
    vi.mocked(api.uploadRAGDocument).mockImplementation(
      () => new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );

    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    // Resolve the upload
    resolveUpload!({
      success: true,
      doc_id: "doc-1",
      filename: "test.txt",
      chunk_count: 1,
    });
  });

  it("should call onUploadError on failure", async () => {
    vi.mocked(api.uploadRAGDocument).mockRejectedValueOnce(new Error("File too large"));

    render(
      <DocumentUploader
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith("File too large");
    });
  });

  it("should reject unsupported file types", async () => {
    render(
      <DocumentUploader
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.exe", { type: "application/octet-stream" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalled();
      expect(api.uploadRAGDocument).not.toHaveBeenCalled();
    });
  });

  it("should be disabled when prop is set", () => {
    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} disabled />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it("should handle drag and drop", async () => {
    const mockResponse = {
      success: true,
      doc_id: "doc-123",
      filename: "dropped.txt",
      chunk_count: 3,
    };
    vi.mocked(api.uploadRAGDocument).mockResolvedValueOnce(mockResponse);

    render(<DocumentUploader onUploadSuccess={mockOnUploadSuccess} />);

    const dropZone = screen.getByText(/Drag and drop/).closest("div")!;
    const file = new File(["dropped content"], "dropped.txt", { type: "text/plain" });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(api.uploadRAGDocument).toHaveBeenCalledWith(file);
    });
  });
});
