/**
 * API Client Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  healthCheck,
  listSessions,
  createSession,
  getSession,
  deleteSession,
  searchSessions,
  getSessionMessages,
  createChatWebSocket,
  getSettings,
  updateSettings,
  getModels,
  testConnection,
  exportSession,
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveSessionToFolder,
  listSessionsByFolder,
  uploadRAGDocument,
  queryRAGDocuments,
  listRAGDocuments,
  deleteRAGDocument,
} from "./client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }

  send() {}
  close() {
    this.readyState = 3;
  }
}
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe("API Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("healthCheck", () => {
    it("should call health endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ status: "ok", version: "1.0.0" }),
      });

      const result = await healthCheck();

      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/health");
      expect(result).toEqual({ status: "ok", version: "1.0.0" });
    });
  });

  describe("Session APIs", () => {
    describe("listSessions", () => {
      it("should fetch all sessions with pagination", async () => {
        const mockSessions = [
          { id: "1", title: "Session 1", folder_id: null, source: "main", created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: "2", title: "Session 2", folder_id: "folder-1", source: "main", created_at: "2024-01-02", updated_at: "2024-01-02" },
        ];
        const mockResponse = {
          sessions: mockSessions,
          total: 2,
          limit: 50,
          offset: 0,
          has_more: false,
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await listSessions();

        // listSessions() returns paginated response
        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/?");
        expect(result).toEqual(mockResponse);
        expect(result.sessions).toEqual(mockSessions);
      });
    });

    describe("createSession", () => {
      it("should create a new session", async () => {
        const mockSession = {
          id: "new-id",
          title: "New Chat",
          folder_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockSession),
        });

        const result = await createSession();

        // createSession() uses default source="main"
        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "main" }),
        });
        expect(result).toEqual(mockSession);
      });
    });

    describe("getSession", () => {
      it("should fetch a session by ID", async () => {
        const mockSession = {
          id: "session-123",
          title: "Test Session",
          folder_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockSession),
        });

        const result = await getSession("session-123");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/session-123");
        expect(result).toEqual(mockSession);
      });
    });

    describe("deleteSession", () => {
      it("should delete a session", async () => {
        mockFetch.mockResolvedValueOnce({});

        await deleteSession("session-123");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/session-123", {
          method: "DELETE",
        });
      });
    });

    describe("searchSessions", () => {
      it("should search sessions with encoded query", async () => {
        const mockResults = [
          {
            session: { id: "1", title: "Test", folder_id: null, created_at: "", updated_at: "" },
            matched_messages: [],
            match_type: "title" as const,
          },
        ];
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResults),
        });

        const result = await searchSessions("test query");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/search/?q=test%20query");
        expect(result).toEqual(mockResults);
      });

      it("should encode special characters in search query", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve([]),
        });

        await searchSessions("test & query");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/search/?q=test%20%26%20query");
      });
    });
  });

  describe("Message APIs", () => {
    describe("getSessionMessages", () => {
      it("should fetch messages with default pagination", async () => {
        const mockMessages = {
          messages: [
            { id: "1", session_id: "session-123", role: "user" as const, content: "Hello", created_at: "2024-01-01" },
          ],
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockMessages),
        });

        const result = await getSessionMessages("session-123");

        expect(mockFetch).toHaveBeenCalledWith(
          "http://127.0.0.1:8765/api/chat/session-123/messages?limit=50&offset=0"
        );
        expect(result).toEqual(mockMessages);
      });

      it("should fetch messages with custom pagination", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ messages: [] }),
        });

        await getSessionMessages("session-123", 100, 50);

        expect(mockFetch).toHaveBeenCalledWith(
          "http://127.0.0.1:8765/api/chat/session-123/messages?limit=100&offset=50"
        );
      });
    });
  });

  describe("WebSocket", () => {
    describe("createChatWebSocket", () => {
      it("should create WebSocket with correct URL", () => {
        const ws = createChatWebSocket("session-123");

        expect(ws.url).toBe("ws://127.0.0.1:8765/api/chat/ws/session-123");
      });
    });
  });

  describe("Settings APIs", () => {
    describe("getSettings", () => {
      it("should fetch current settings", async () => {
        const mockSettings = {
          openai_api_key: null,
          openai_base_url: null,
          openai_model: "gpt-4",
          has_api_key: false,
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockSettings),
        });

        const result = await getSettings();

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/settings/");
        expect(result).toEqual(mockSettings);
      });
    });

    describe("updateSettings", () => {
      it("should update settings with POST request", async () => {
        const mockUpdatedSettings = {
          openai_api_key: "sk-test", // pragma: allowlist secret
          openai_base_url: null,
          openai_model: "gpt-4",
          has_api_key: true,
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockUpdatedSettings),
        });

        const result = await updateSettings({ openai_api_key: "sk-test" }); // pragma: allowlist secret

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/settings/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openai_api_key: "sk-test" }), // pragma: allowlist secret
        });
        expect(result).toEqual(mockUpdatedSettings);
      });

      it("should update model setting", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ openai_model: "gpt-4o" }),
        });

        await updateSettings({ openai_model: "gpt-4o" });

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/settings/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openai_model: "gpt-4o" }),
        });
      });
    });

    describe("getModels", () => {
      it("should fetch available models", async () => {
        const mockModels = [
          { id: "gpt-4", name: "GPT-4", description: "Most capable" },
          { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast" },
        ];
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockModels),
        });

        const result = await getModels();

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/settings/models");
        expect(result).toEqual(mockModels);
      });
    });

    describe("testConnection", () => {
      it("should test API connection", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: "success", message: "Connection OK" }),
        });

        const result = await testConnection();

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/settings/test", {
          method: "POST",
        });
        expect(result).toEqual({ status: "success", message: "Connection OK" });
      });
    });
  });

  describe("Export API", () => {
    describe("exportSession", () => {
      it("should export session as markdown by default", async () => {
        const mockBlob = new Blob(["# Test Export"], { type: "text/markdown" });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: {
            get: (name: string) => {
              if (name === "Content-Disposition") {
                return 'attachment; filename="session-test.md"';
              }
              return null;
            },
          },
        });

        const result = await exportSession("session-123");

        expect(mockFetch).toHaveBeenCalledWith(
          "http://127.0.0.1:8765/api/sessions/session-123/export?format=markdown"
        );
        expect(result.blob).toBe(mockBlob);
        expect(result.filename).toBe("session-test.md");
      });

      it("should export session as JSON", async () => {
        const mockBlob = new Blob(['{"test": true}'], { type: "application/json" });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: {
            get: (name: string) => {
              if (name === "Content-Disposition") {
                return 'attachment; filename="session-test.json"';
              }
              return null;
            },
          },
        });

        const result = await exportSession("session-123", "json");

        expect(mockFetch).toHaveBeenCalledWith(
          "http://127.0.0.1:8765/api/sessions/session-123/export?format=json"
        );
        expect(result.filename).toBe("session-test.json");
      });

      it("should export session as txt", async () => {
        const mockBlob = new Blob(["Test Export"], { type: "text/plain" });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: {
            get: (name: string) => {
              if (name === "Content-Disposition") {
                return 'attachment; filename="session-test.txt"';
              }
              return null;
            },
          },
        });

        const result = await exportSession("session-123", "txt");

        expect(mockFetch).toHaveBeenCalledWith(
          "http://127.0.0.1:8765/api/sessions/session-123/export?format=txt"
        );
        expect(result.filename).toBe("session-test.txt");
      });

      it("should throw error on failed export", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: "Not Found",
        });

        await expect(exportSession("invalid-id")).rejects.toThrow("Export failed: Not Found");
      });

      it("should use default filename if header is missing", async () => {
        const mockBlob = new Blob(["test"]);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: {
            get: () => null,
          },
        });

        const result = await exportSession("session-123");

        expect(result.filename).toBe("export.markdown");
      });
    });
  });

  describe("Folder APIs", () => {
    describe("listFolders", () => {
      it("should fetch all folders", async () => {
        const mockFolders = [
          { id: "folder-1", name: "Work", parent_id: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ];
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockFolders),
        });

        const result = await listFolders();

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/folders/");
        expect(result).toEqual(mockFolders);
      });
    });

    describe("createFolder", () => {
      it("should create a folder without parent", async () => {
        const mockFolder = {
          id: "new-folder",
          name: "New Folder",
          parent_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockFolder),
        });

        const result = await createFolder("New Folder");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/folders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Folder", parent_id: null }),
        });
        expect(result).toEqual(mockFolder);
      });

      it("should create a folder with parent", async () => {
        const mockFolder = {
          id: "child-folder",
          name: "Child",
          parent_id: "parent-folder",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockFolder),
        });

        const result = await createFolder("Child", "parent-folder");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/folders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Child", parent_id: "parent-folder" }),
        });
        expect(result).toEqual(mockFolder);
      });
    });

    describe("updateFolder", () => {
      it("should update folder name", async () => {
        const mockFolder = {
          id: "folder-1",
          name: "Updated Name",
          parent_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockFolder),
        });

        const result = await updateFolder("folder-1", "Updated Name");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/folders/folder-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Name" }),
        });
        expect(result).toEqual(mockFolder);
      });
    });

    describe("deleteFolder", () => {
      it("should delete a folder", async () => {
        mockFetch.mockResolvedValueOnce({});

        await deleteFolder("folder-1");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/folders/folder-1", {
          method: "DELETE",
        });
      });
    });

    describe("moveSessionToFolder", () => {
      it("should move session to a folder", async () => {
        const mockSession = {
          id: "session-1",
          title: "Test",
          folder_id: "folder-1",
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockSession),
        });

        const result = await moveSessionToFolder("session-1", "folder-1");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/session-1/folder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: "folder-1" }),
        });
        expect(result).toEqual(mockSession);
      });

      it("should move session to root (null folder)", async () => {
        const mockSession = {
          id: "session-1",
          title: "Test",
          folder_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockSession),
        });

        const result = await moveSessionToFolder("session-1", null);

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/session-1/folder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: null }),
        });
        expect(result.folder_id).toBeNull();
      });
    });

    describe("listSessionsByFolder", () => {
      it("should list sessions in a specific folder with pagination", async () => {
        const mockSessions = [
          { id: "1", title: "Session 1", folder_id: "folder-1", source: "main", created_at: "", updated_at: "" },
        ];
        const mockResponse = {
          sessions: mockSessions,
          total: 1,
          limit: 50,
          offset: 0,
          has_more: false,
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await listSessionsByFolder("folder-1");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/?folder_id=folder-1");
        expect(result).toEqual(mockResponse);
      });

      it("should list all sessions when folder is null", async () => {
        const mockSessions = [
          { id: "1", title: "Session 1", folder_id: null, source: "main", created_at: "", updated_at: "" },
          { id: "2", title: "Session 2", folder_id: "folder-1", source: "main", created_at: "", updated_at: "" },
        ];
        const mockResponse = {
          sessions: mockSessions,
          total: 2,
          limit: 50,
          offset: 0,
          has_more: false,
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await listSessionsByFolder(null);

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/sessions/?");
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("RAG APIs", () => {
    describe("uploadRAGDocument", () => {
      it("should upload a document with FormData", async () => {
        const mockResponse = {
          success: true,
          doc_id: "doc-123",
          filename: "test.txt",
          chunk_count: 5,
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const result = await uploadRAGDocument(file);

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/rag/upload", {
          method: "POST",
          body: expect.any(FormData),
        });
        expect(result).toEqual(mockResponse);
      });

      it("should throw error on upload failure", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "File too large" }),
        });

        const file = new File(["test"], "test.txt", { type: "text/plain" });
        await expect(uploadRAGDocument(file)).rejects.toThrow("File too large");
      });

      it("should handle upload error without detail", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.reject(new Error("Parse error")),
        });

        const file = new File(["test"], "test.txt", { type: "text/plain" });
        await expect(uploadRAGDocument(file)).rejects.toThrow("Upload failed");
      });
    });

    describe("queryRAGDocuments", () => {
      it("should query documents with default n_results", async () => {
        const mockResponse = {
          success: true,
          chunks: [
            { content: "Test content", source: "test.txt", chunk_index: 0, score: 0.9 },
          ],
          context: "[1] Test content (source: test.txt)",
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await queryRAGDocuments("test query");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/rag/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "test query", n_results: 5 }),
        });
        expect(result).toEqual(mockResponse);
      });

      it("should query documents with custom n_results", async () => {
        const mockResponse = {
          success: true,
          chunks: [],
          context: "",
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await queryRAGDocuments("test", 10);

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/rag/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "test", n_results: 10 }),
        });
      });

      it("should throw error on query failure", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
        });

        await expect(queryRAGDocuments("test")).rejects.toThrow("Query failed");
      });
    });

    describe("listRAGDocuments", () => {
      it("should list all indexed documents", async () => {
        const mockResponse = {
          documents: [
            { doc_id: "doc-1", filename: "test1.txt", chunk_count: 5 },
            { doc_id: "doc-2", filename: "test2.md", chunk_count: 3 },
          ],
        };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await listRAGDocuments();

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/rag/documents");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("deleteRAGDocument", () => {
      it("should delete a document", async () => {
        const mockResponse = { success: true };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await deleteRAGDocument("doc-123");

        expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8765/api/rag/documents/doc-123", {
          method: "DELETE",
        });
        expect(result).toEqual(mockResponse);
      });

      it("should return error on delete failure", async () => {
        const mockResponse = { success: false, error: "Document not found" };
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await deleteRAGDocument("invalid-id");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Document not found");
      });
    });
  });
});
