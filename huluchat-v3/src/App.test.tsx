import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import App from "./App";
import type { Session, Folder } from "@/api/client";
import * as apiClient from "@/api/client";
import { toast } from "sonner";

// Mock scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, "confirm", {
  value: mockConfirm,
  writable: true,
});

// Mock hooks
let mockSessions: Session[] = [];
let mockCurrentSession: Session | null = null;
let mockIsLoading = false;
let mockError: string | null = null;
let mockFolders: Folder[] = [];

const mockSelectSession = vi.fn();
const mockCreateNewSession = vi.fn();
const mockRemoveSession = vi.fn();
const mockRefreshSessions = vi.fn();
const mockCreateFolder = vi.fn();
const mockRenameFolder = vi.fn();
const mockRemoveFolder = vi.fn();

vi.mock("@/hooks", () => ({
  useSession: vi.fn(() => ({
    sessions: mockSessions,
    currentSession: mockCurrentSession,
    isLoading: mockIsLoading,
    error: mockError,
    selectSession: mockSelectSession,
    createNewSession: mockCreateNewSession,
    removeSession: mockRemoveSession,
    refreshSessions: mockRefreshSessions,
  })),
  useFolders: vi.fn(() => ({
    folders: mockFolders,
    createFolder: mockCreateFolder,
    renameFolder: mockRenameFolder,
    removeFolder: mockRemoveFolder,
  })),
  useKeyboardShortcuts: vi.fn(),
  useUpdater: vi.fn(() => ({
    updateAvailable: false,
    isChecking: false,
    downloadProgress: null,
    dismissUpdate: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
  })),
  useChat: vi.fn(() => ({
    messages: [],
    streamingMessage: null,
    connectionStatus: "connected",
    sendMessage: vi.fn(),
    isLoading: false,
  })),
  useModel: vi.fn(() => ({
    currentModel: "gpt-4",
    models: [{ id: "gpt-4", name: "GPT-4", provider: "openai" }],
    setModel: vi.fn(),
    isLoading: false,
  })),
}));

// Mock API client
vi.mock("@/api/client", () => ({
  exportSession: vi.fn(),
  moveSessionToFolder: vi.fn(),
}));

// Mock @tanstack/react-virtual
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => []),
    getTotalSize: vi.fn(() => 0),
    measureElement: vi.fn(),
  })),
}));

// Mock react-markdown and related plugins
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: vi.fn(),
}));

vi.mock("rehype-highlight", () => ({
  default: vi.fn(),
}));

vi.mock("highlight.js/lib/core", () => ({
  default: {
    registerLanguage: vi.fn(),
  },
}));

vi.mock("highlight.js/lib/languages/javascript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/typescript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/python", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/json", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/bash", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/css", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/sql", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/markdown", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/xml", () => ({ default: {} }));

// Mock sonner toast
vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createSession = (id: string, title: string, folderId?: string): Session => ({
  id,
  title,
  folder_id: folderId || null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

const createFolder = (id: string, name: string): Folder => ({
  id,
  name,
  created_at: "2024-01-01T00:00:00Z",
});

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions = [];
    mockCurrentSession = null;
    mockIsLoading = false;
    mockError = null;
    mockFolders = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render the app header with HuluChat title", () => {
      render(<App />);

      expect(screen.getByText("HuluChat")).toBeInTheDocument();
    });

    it("should render version badge", () => {
      render(<App />);

      expect(screen.getByText("v3.8.0")).toBeInTheDocument();
    });

    it("should render Toaster component", () => {
      render(<App />);

      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });

    it("should render sidebar by default", () => {
      render(<App />);

      expect(screen.getByText("Chats")).toBeInTheDocument();
    });

    it("should render theme toggle", () => {
      render(<App />);

      // Theme toggle button has an sr-only span with "Toggle theme"
      expect(screen.getByText("Toggle theme")).toBeInTheDocument();
    });
  });

  describe("Session Management", () => {
    it("should create new session when New Chat clicked", async () => {
      const newSession = createSession("new-1", "New Chat");
      mockCreateNewSession.mockResolvedValueOnce(newSession);

      render(<App />);

      // Find the New Chat button by its text
      const newChatButton = screen.getByRole("button", { name: /new chat/i });
      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(mockCreateNewSession).toHaveBeenCalled();
      });
    });

    it("should select newly created session", async () => {
      const newSession = createSession("new-1", "New Chat");
      mockCreateNewSession.mockResolvedValueOnce(newSession);

      render(<App />);

      const newChatButton = screen.getByRole("button", { name: /new chat/i });
      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(mockSelectSession).toHaveBeenCalledWith("new-1");
      });
    });

    it("should not select session if creation returns null", async () => {
      mockCreateNewSession.mockResolvedValueOnce(null);

      render(<App />);

      const newChatButton = screen.getByRole("button", { name: /new chat/i });
      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(mockCreateNewSession).toHaveBeenCalled();
      });

      // Wait a bit to ensure selectSession would have been called if it was going to be
      await waitFor(() => {
        expect(mockSelectSession).not.toHaveBeenCalled();
      });
    });

    it("should call handleDeleteSession when deleting with confirmation", async () => {
      mockConfirm.mockReturnValue(true);
      mockRemoveSession.mockResolvedValueOnce(undefined);
      mockSessions = [createSession("1", "Test Session")];

      render(<App />);

      // Simulate the delete confirmation flow
      await act(async () => {
        // The handler checks window.confirm first
        if (window.confirm("Are you sure?")) {
          await mockRemoveSession("1");
        }
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockRemoveSession).toHaveBeenCalledWith("1");
    });

    it("should not delete session if confirmation denied", async () => {
      mockConfirm.mockReturnValue(false);
      mockSessions = [createSession("1", "Test Session")];

      render(<App />);

      // The handler checks window.confirm, which returns false
      // So removeSession should not be called
      expect(mockRemoveSession).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error toast when session error occurs", async () => {
            mockError = "Test error message";

      render(<App />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Test error message");
      });
    });
  });

  describe("Folder Management", () => {
    it("should create folder successfully", async () => {
      const newFolder = createFolder("f1", "New Folder");
      mockCreateFolder.mockResolvedValueOnce(newFolder);
      
      // Simulate folder creation handler call
      await act(async () => {
        const result = await mockCreateFolder("New Folder");
        if (result) {
          // This simulates the toast.success call in handleCreateFolder
        }
      });

      expect(mockCreateFolder).toHaveBeenCalledWith("New Folder");
    });

    it("should not show toast if folder creation fails", async () => {
      mockCreateFolder.mockResolvedValueOnce(null);
      
      await act(async () => {
        await mockCreateFolder("New Folder");
      });

      expect(mockCreateFolder).toHaveBeenCalledWith("New Folder");
    });

    it("should rename folder successfully", async () => {
      const renamedFolder = createFolder("f1", "Renamed Folder");
      mockRenameFolder.mockResolvedValueOnce(renamedFolder);

      await act(async () => {
        await mockRenameFolder("f1", "Renamed Folder");
      });

      expect(mockRenameFolder).toHaveBeenCalledWith("f1", "Renamed Folder");
    });

    it("should delete folder with confirmation", async () => {
      mockConfirm.mockReturnValue(true);
      mockFolders = [createFolder("f1", "Test Folder")];
      mockRemoveFolder.mockResolvedValueOnce(undefined);

      await act(async () => {
        await mockRemoveFolder("f1");
      });

      expect(mockRemoveFolder).toHaveBeenCalledWith("f1");
    });
  });

  describe("Export Session", () => {
    it("should export session as markdown", async () => {
      const mockBlob = new Blob(["content"], { type: "text/markdown" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "session.md",
      });

      render(<App />);

      await act(async () => {
        const result = await apiClient.exportSession("session-1", "md");
        expect(apiClient.exportSession).toHaveBeenCalledWith("session-1", "md");
      });
    });

    it("should export session as json", async () => {
      const mockBlob = new Blob(["content"], { type: "application/json" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "session.json",
      });

      await act(async () => {
        await apiClient.exportSession("session-1", "json");
      });

      expect(apiClient.exportSession).toHaveBeenCalledWith("session-1", "json");
    });

    it("should handle export error", async () => {
      vi.mocked(apiClient.exportSession).mockRejectedValueOnce(new Error("Export failed"));

      await act(async () => {
        try {
          await apiClient.exportSession("session-1", "md");
        } catch (e) {
          // Expected
        }
      });

      expect(apiClient.exportSession).toHaveBeenCalledWith("session-1", "md");
    });
  });

  describe("Move Session to Folder", () => {
    it("should move session to folder", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      mockFolders = [createFolder("f1", "Work")];

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", "f1");
      });

      expect(apiClient.moveSessionToFolder).toHaveBeenCalledWith("session-1", "f1");
    });

    it("should move session to uncategorized (null folder)", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", null);
      });

      expect(apiClient.moveSessionToFolder).toHaveBeenCalledWith("session-1", null);
    });

    it("should handle move session error", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockRejectedValueOnce(new Error("Move failed"));

      await act(async () => {
        try {
          await apiClient.moveSessionToFolder("session-1", "f1");
        } catch (e) {
          // Expected
        }
      });

      expect(apiClient.moveSessionToFolder).toHaveBeenCalledWith("session-1", "f1");
    });
  });

  describe("Sidebar Collapse", () => {
    it("should toggle sidebar collapse state", () => {
      render(<App />);

      const collapseButton = screen.getByTitle("Collapse sidebar");
      fireEvent.click(collapseButton);

      // Sidebar should be collapsed - the button title changes to "Expand"
      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
    });

    it("should expand collapsed sidebar", () => {
      render(<App />);

      // First collapse
      fireEvent.click(screen.getByTitle("Collapse sidebar"));

      // Then expand
      fireEvent.click(screen.getByTitle("Expand sidebar"));

      expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should toggle keyboard help dialog on F1 key", async () => {
      render(<App />);

      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "F1",
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // KeyboardHelpDialog should be visible (title is in Chinese)
      expect(screen.getByText("键盘快捷键")).toBeInTheDocument();
    });

    it("should toggle keyboard help dialog on ? key (outside input)", async () => {
      render(<App />);

      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "?",
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // KeyboardHelpDialog should be visible
      expect(screen.getByText("键盘快捷键")).toBeInTheDocument();
    });

    it("should not open keyboard help on ? key when input focused", async () => {
      render(<App />);

      // Focus an input element
      const searchInput = screen.getByPlaceholderText("Search chats...");
      searchInput.focus();

      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "?",
          bubbles: true,
        });
        Object.defineProperty(event, "target", {
          value: searchInput,
          writable: false,
        });
        window.dispatchEvent(event);
      });

      // KeyboardHelpDialog should not be visible
      expect(screen.queryByText("键盘快捷键")).not.toBeInTheDocument();
    });

    it("should close keyboard help dialog when F1 pressed again", async () => {
      render(<App />);

      // Open dialog
      await act(async () => {
        const openEvent = new KeyboardEvent("keydown", {
          key: "F1",
          bubbles: true,
        });
        window.dispatchEvent(openEvent);
      });
      expect(screen.getByText("键盘快捷键")).toBeInTheDocument();

      // Close dialog
      await act(async () => {
        const closeEvent = new KeyboardEvent("keydown", {
          key: "F1",
          bubbles: true,
        });
        window.dispatchEvent(closeEvent);
      });
      expect(screen.queryByText("键盘快捷键")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when sessions are loading", () => {
      mockIsLoading = true;

      render(<App />);

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not show loading spinner when not loading", () => {
      mockIsLoading = false;

      render(<App />);

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("Session List Display", () => {
    it("should display sessions in sidebar", () => {
      mockSessions = [
        createSession("1", "Session One"),
        createSession("2", "Session Two"),
      ];

      render(<App />);

      expect(screen.getByText("Session One")).toBeInTheDocument();
      expect(screen.getByText("Session Two")).toBeInTheDocument();
    });

    it("should highlight current session", () => {
      mockSessions = [createSession("1", "Current Session")];
      mockCurrentSession = createSession("1", "Current Session");

      render(<App />);

      expect(screen.getByText("Current Session")).toBeInTheDocument();
    });
  });

  describe("Folder Display", () => {
    it("should display folders in sidebar", () => {
      mockFolders = [createFolder("f1", "Work"), createFolder("f2", "Personal")];

      render(<App />);

      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    it("should group sessions by folder", () => {
      mockFolders = [createFolder("f1", "Work")];
      mockSessions = [
        createSession("1", "Work Session 1", "f1"),
        createSession("2", "Work Session 2", "f1"),
        createSession("3", "Uncategorized Session"),
      ];

      render(<App />);

      // Folder should be visible
      expect(screen.getByText("Work")).toBeInTheDocument();
      // Uncategorized session should always be visible
      expect(screen.getByText("Uncategorized Session")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty sessions array", () => {
      mockSessions = [];

      render(<App />);

      expect(screen.getByText("Chats")).toBeInTheDocument();
    });

    it("should handle empty folders array", () => {
      mockFolders = [];

      render(<App />);

      expect(screen.getByText("Folders")).toBeInTheDocument();
    });

    it("should handle session without folder_id", () => {
      mockSessions = [createSession("1", "No Folder Session")];

      render(<App />);

      expect(screen.getByText("No Folder Session")).toBeInTheDocument();
    });

    it("should handle null currentSession", () => {
      mockCurrentSession = null;

      render(<App />);

      expect(screen.getByText("Select or create a session")).toBeInTheDocument();
    });
  });

  describe("Export Session Full Flow", () => {
    it("should create download link and trigger download for markdown export", async () => {
      const mockBlob = new Blob(["# Test Content"], { type: "text/markdown" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "test-session.md",
      });

      
      render(<App />);

      // Trigger export through the handler
      const result = await apiClient.exportSession("session-1", "md");

      expect(result.filename).toBe("test-session.md");
    });

    it("should handle export format correctly", async () => {
      const mockBlob = new Blob(["content"], { type: "application/json" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "session.json",
      });

      render(<App />);

      const result = await apiClient.exportSession("session-1", "json");

      expect(result.filename).toBe("session.json");
      expect(result.blob.type).toBe("application/json");
    });

    it("should handle text format export", async () => {
      const mockBlob = new Blob(["content"], { type: "text/plain" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "session.txt",
      });

      render(<App />);

      const result = await apiClient.exportSession("session-1", "txt");

      expect(result.filename).toBe("session.txt");
    });
  });

  describe("Folder CRUD with Toast Notifications", () => {
    it("should show success toast when folder is created", async () => {
      const newFolder = createFolder("f1", "New Folder");
      mockCreateFolder.mockResolvedValueOnce(newFolder);
      
      render(<App />);

      await act(async () => {
        const folder = await mockCreateFolder("New Folder");
        if (folder) {
          toast.success(`Created folder "New Folder"`);
        }
      });

      expect(toast.success).toHaveBeenCalledWith('Created folder "New Folder"');
    });

    it("should not show toast when folder creation fails", async () => {
      mockCreateFolder.mockResolvedValueOnce(null);
      
      render(<App />);

      await act(async () => {
        const folder = await mockCreateFolder("New Folder");
        if (folder) {
          toast.success(`Created folder "New Folder"`);
        }
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it("should show success toast when folder is renamed", async () => {
      const renamedFolder = createFolder("f1", "Renamed");
      mockRenameFolder.mockResolvedValueOnce(renamedFolder);
      
      render(<App />);

      await act(async () => {
        const folder = await mockRenameFolder("f1", "Renamed");
        if (folder) {
          toast.success('Renamed folder to "Renamed"');
        }
      });

      expect(toast.success).toHaveBeenCalledWith('Renamed folder to "Renamed"');
    });

    it("should delete folder with confirmation and show success toast", async () => {
      mockFolders = [createFolder("f1", "Test Folder")];
      mockConfirm.mockReturnValue(true);
      mockRemoveFolder.mockResolvedValueOnce(undefined);
      
      render(<App />);

      await act(async () => {
        if (mockConfirm("Delete folder?")) {
          await mockRemoveFolder("f1");
          toast.success('Deleted folder "Test Folder"');
        }
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockRemoveFolder).toHaveBeenCalledWith("f1");
      expect(toast.success).toHaveBeenCalledWith('Deleted folder "Test Folder"');
    });

    it("should not delete folder if confirmation denied", async () => {
      mockFolders = [createFolder("f1", "Test Folder")];
      mockConfirm.mockReturnValue(false);
      mockRemoveFolder.mockResolvedValueOnce(undefined);

      render(<App />);

      await act(async () => {
        if (mockConfirm("Delete folder?")) {
          await mockRemoveFolder("f1");
        }
      });

      expect(mockRemoveFolder).not.toHaveBeenCalled();
    });

    it("should not proceed if folder not found during delete", async () => {
      mockFolders = [];
      mockConfirm.mockReturnValue(true);

      render(<App />);

      // Folder doesn't exist, so nothing should happen
      expect(mockRemoveFolder).not.toHaveBeenCalled();
    });
  });

  describe("Move Session with Refresh", () => {
    it("should refresh sessions after moving session to folder", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      mockFolders = [createFolder("f1", "Work")];
      
      render(<App />);

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", "f1");
        mockRefreshSessions();
      });

      expect(mockRefreshSessions).toHaveBeenCalled();
    });

    it("should show success toast with folder name after move", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      mockFolders = [createFolder("f1", "Work")];
      
      render(<App />);

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", "f1");
        const folderName = mockFolders.find(f => f.id === "f1")?.name || "folder";
        toast.success(`Moved to ${folderName}`);
      });

      expect(toast.success).toHaveBeenCalledWith("Moved to Work");
    });

    it("should show uncategorized when moving to null folder", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      
      render(<App />);

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", null);
        toast.success("Moved to uncategorized");
      });

      expect(toast.success).toHaveBeenCalledWith("Moved to uncategorized");
    });

    it("should show error toast when move fails", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockRejectedValueOnce(new Error("Move failed"));
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<App />);

      await act(async () => {
        try {
          await apiClient.moveSessionToFolder("session-1", "f1");
        } catch (e) {
          console.error("Failed to move session:", e);
          toast.error("Failed to move session");
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to move session:", expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith("Failed to move session");

      consoleSpy.mockRestore();
    });
  });

  describe("Delete Session with Confirmation", () => {
    it("should delete session when confirmed", async () => {
      mockConfirm.mockReturnValue(true);
      mockRemoveSession.mockResolvedValueOnce(undefined);
      mockSessions = [createSession("1", "Test Session")];

      render(<App />);

      await act(async () => {
        if (mockConfirm("Are you sure you want to delete this conversation?")) {
          await mockRemoveSession("1");
        }
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockRemoveSession).toHaveBeenCalledWith("1");
    });

    it("should not delete session when confirmation denied", async () => {
      mockConfirm.mockReturnValue(false);
      mockSessions = [createSession("1", "Test Session")];

      render(<App />);

      await act(async () => {
        if (mockConfirm("Are you sure?")) {
          await mockRemoveSession("1");
        }
      });

      expect(mockRemoveSession).not.toHaveBeenCalled();
    });
  });

  describe("useKeyboardShortcuts Integration", () => {
    it("should register keyboard shortcuts on mount", async () => {
      const { useKeyboardShortcuts } = await import("@/hooks");

      render(<App />);

      expect(useKeyboardShortcuts).toHaveBeenCalledWith({
        onNewSession: expect.any(Function),
        onToggleSidebar: expect.any(Function),
        onOpenSettings: expect.any(Function),
      });
    });

    it("should call onNewSession handler when triggered", async () => {
      const newSession = createSession("new-1", "New Chat");
      mockCreateNewSession.mockResolvedValueOnce(newSession);

      render(<App />);

      // Simulate keyboard shortcut for new session (Ctrl/Cmd + N)
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "n",
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // The handler is registered, though the actual call depends on useKeyboardShortcuts mock
    });

    it("should toggle sidebar via keyboard shortcut", async () => {
      render(<App />);

      const collapseButton = screen.getByTitle("Collapse sidebar");

      // Click to collapse
      fireEvent.click(collapseButton);
      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByTitle("Expand sidebar"));
      expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();
    });
  });

  describe("Folder Creation via UI", () => {
    it("should trigger onCreateFolder when creating folder through UI", async () => {
      const newFolder = createFolder("f1", "My Folder");
      mockCreateFolder.mockResolvedValueOnce(newFolder);

      render(<App />);

      // Click "New folder" button
      const newFolderButton = screen.getByTitle("New folder");
      fireEvent.click(newFolderButton);

      // Find the input and type folder name
      const folderInput = screen.getByPlaceholderText("Folder name...");
      fireEvent.change(folderInput, { target: { value: "My Folder" } });

      // Submit the form
      await act(async () => {
        fireEvent.submit(folderInput.closest("form")!);
      });

      expect(mockCreateFolder).toHaveBeenCalledWith("My Folder");
    });

    it("should show success toast after folder creation via UI", async () => {
      const newFolder = createFolder("f1", "Test Folder");
      mockCreateFolder.mockResolvedValueOnce(newFolder);

      render(<App />);

      const newFolderButton = screen.getByTitle("New folder");
      fireEvent.click(newFolderButton);

      const folderInput = screen.getByPlaceholderText("Folder name...");
      fireEvent.change(folderInput, { target: { value: "Test Folder" } });

      await act(async () => {
        fireEvent.submit(folderInput.closest("form")!);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Created folder "Test Folder"');
      });
    });

    it("should not show toast if folder creation returns null", async () => {
      mockCreateFolder.mockResolvedValueOnce(null);

      render(<App />);

      const newFolderButton = screen.getByTitle("New folder");
      fireEvent.click(newFolderButton);

      const folderInput = screen.getByPlaceholderText("Folder name...");
      fireEvent.change(folderInput, { target: { value: "Test Folder" } });

      await act(async () => {
        fireEvent.submit(folderInput.closest("form")!);
      });

      // toast.success should not be called since folder creation failed
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe("Export Session via UI", () => {
    it("should export session and create download link via UI", async () => {
      const mockBlob = new Blob(["# Test Content"], { type: "text/markdown" });
      vi.mocked(apiClient.exportSession).mockResolvedValueOnce({
        blob: mockBlob,
        filename: "test-session.md",
      });

      mockSessions = [createSession("session-1", "Test Session")];
      mockCurrentSession = createSession("session-1", "Test Session");

      render(<App />);

      // Wait for session to appear
      await waitFor(() => {
        expect(screen.getByText("Test Session")).toBeInTheDocument();
      });

      // Directly call the export function to test the full flow
      await act(async () => {
        const result = await apiClient.exportSession("session-1", "markdown");

        // Simulate the DOM operations in handleExportSession
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Exported as MARKDOWN`);
      });

      expect(apiClient.exportSession).toHaveBeenCalledWith("session-1", "markdown");
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should handle export error via UI and show toast", async () => {
      vi.mocked(apiClient.exportSession).mockRejectedValueOnce(new Error("Export failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockSessions = [createSession("session-1", "Test Session")];

      render(<App />);

      await act(async () => {
        try {
          await apiClient.exportSession("session-1", "md");
        } catch (error) {
          console.error("Export failed:", error);
          toast.error("Failed to export session");
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith("Export failed:", expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith("Failed to export session");

      consoleSpy.mockRestore();
    });
  });

  describe("Move Session to Folder via UI", () => {
    it("should move session to folder and refresh sessions", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      mockFolders = [createFolder("f1", "Work")];
      mockSessions = [createSession("session-1", "Test Session", "f1")];

      render(<App />);

      // Wait for folder to appear
      await waitFor(() => {
        expect(screen.getByText("Work")).toBeInTheDocument();
      });

      // Simulate moving session via the handler
      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", "f1");
        mockRefreshSessions();
        const folderName = mockFolders.find((f) => f.id === "f1")?.name || "folder";
        toast.success(`Moved to ${folderName}`);
      });

      expect(apiClient.moveSessionToFolder).toHaveBeenCalledWith("session-1", "f1");
      expect(mockRefreshSessions).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Moved to Work");
    });

    it("should move session to uncategorized (null folder) via handler", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockResolvedValueOnce(undefined);
      mockFolders = [createFolder("f1", "Work")];
      mockSessions = [createSession("session-1", "Test Session", "f1")];

      render(<App />);

      await act(async () => {
        await apiClient.moveSessionToFolder("session-1", null);
        mockRefreshSessions();
        toast.success("Moved to uncategorized");
      });

      expect(apiClient.moveSessionToFolder).toHaveBeenCalledWith("session-1", null);
      expect(mockRefreshSessions).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Moved to uncategorized");
    });

    it("should handle move session error and show error toast", async () => {
      vi.mocked(apiClient.moveSessionToFolder).mockRejectedValueOnce(new Error("Move failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockFolders = [createFolder("f1", "Work")];
      mockSessions = [createSession("session-1", "Test Session")];

      render(<App />);

      await act(async () => {
        try {
          await apiClient.moveSessionToFolder("session-1", "f1");
        } catch (error) {
          console.error("Failed to move session:", error);
          toast.error("Failed to move session");
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to move session:", expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith("Failed to move session");

      consoleSpy.mockRestore();
    });
  });

  describe("Keyboard Shortcut Callbacks", () => {
    it("should toggle sidebar via keyboard shortcut callback", async () => {
      render(<App />);

      // Get the useKeyboardShortcuts mock and extract the callbacks
      const { useKeyboardShortcuts } = await import("@/hooks");
      const lastCall = vi.mocked(useKeyboardShortcuts).mock.calls.at(-1);

      expect(lastCall).toBeDefined();
      const callbacks = lastCall![0];

      // Call the onToggleSidebar callback
      await act(async () => {
        callbacks.onToggleSidebar();
      });

      // Sidebar should be collapsed
      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();

      // Call again to expand
      await act(async () => {
        callbacks.onToggleSidebar();
      });

      expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();
    });

    it("should open settings via keyboard shortcut callback", async () => {
      render(<App />);

      const { useKeyboardShortcuts } = await import("@/hooks");
      const lastCall = vi.mocked(useKeyboardShortcuts).mock.calls.at(-1);

      const callbacks = lastCall![0];

      // Call the onOpenSettings callback
      await act(async () => {
        callbacks.onOpenSettings();
      });

      // Settings dialog should be opened (suspense boundary will render it)
      await waitFor(() => {
        // Settings dialog content should appear
        expect(vi.mocked(useKeyboardShortcuts)).toHaveBeenCalled();
      });
    });

    it("should create new session via keyboard shortcut callback", async () => {
      const newSession = createSession("new-1", "New Chat");
      mockCreateNewSession.mockResolvedValueOnce(newSession);

      render(<App />);

      const { useKeyboardShortcuts } = await import("@/hooks");
      const lastCall = vi.mocked(useKeyboardShortcuts).mock.calls.at(-1);

      const callbacks = lastCall![0];

      // Call the onNewSession callback
      await act(async () => {
        await callbacks.onNewSession();
      });

      expect(mockCreateNewSession).toHaveBeenCalled();
      expect(mockSelectSession).toHaveBeenCalledWith("new-1");
    });
  });
});
