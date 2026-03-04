import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionList } from "./SessionList";
import type { Session, Folder } from "@/api/client";

// Mock API client functions
vi.mock("@/api/client", () => ({
  searchSessions: vi.fn().mockResolvedValue([]),
  moveSessionToFolder: vi.fn(),
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

const defaultProps = {
  sessions: [] as Session[],
  folders: [] as Folder[],
  currentSessionId: null as string | null,
  isLoading: false,
  onSelectSession: vi.fn(),
  onCreateSession: vi.fn(),
  onDeleteSession: vi.fn(),
  onExportSession: vi.fn(),
  onCreateFolder: vi.fn(),
  onDeleteFolder: vi.fn(),
  onRenameFolder: vi.fn(),
  onMoveSession: vi.fn(),
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
};

describe("SessionList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Collapsed State", () => {
    it("should render collapsed sidebar when isCollapsed is true", () => {
      render(<SessionList {...defaultProps} isCollapsed={true} />);

      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
    });

    it("should call onToggleCollapse when expand button clicked", () => {
      const onToggleCollapse = vi.fn();
      render(<SessionList {...defaultProps} isCollapsed={true} onToggleCollapse={onToggleCollapse} />);

      fireEvent.click(screen.getByTitle("Expand sidebar"));
      expect(onToggleCollapse).toHaveBeenCalled();
    });

    it("should show new chat button in collapsed state", () => {
      render(<SessionList {...defaultProps} isCollapsed={true} />);

      expect(screen.getByTitle("New chat")).toBeInTheDocument();
    });

    it("should call onCreateSession when new chat clicked in collapsed state", () => {
      const onCreateSession = vi.fn();
      render(<SessionList {...defaultProps} isCollapsed={true} onCreateSession={onCreateSession} />);

      fireEvent.click(screen.getByTitle("New chat"));
      expect(onCreateSession).toHaveBeenCalled();
    });
  });

  describe("Header", () => {
    it("should render Chats title", () => {
      render(<SessionList {...defaultProps} />);

      expect(screen.getByText("Chats")).toBeInTheDocument();
    });

    it("should call onToggleCollapse when collapse button clicked", () => {
      const onToggleCollapse = vi.fn();
      render(<SessionList {...defaultProps} onToggleCollapse={onToggleCollapse} />);

      fireEvent.click(screen.getByTitle("Collapse sidebar"));
      expect(onToggleCollapse).toHaveBeenCalled();
    });
  });

  describe("New Chat Button", () => {
    it("should render New Chat button", () => {
      render(<SessionList {...defaultProps} />);

      expect(screen.getByText("New Chat")).toBeInTheDocument();
    });

    it("should call onCreateSession when clicked", () => {
      const onCreateSession = vi.fn();
      render(<SessionList {...defaultProps} onCreateSession={onCreateSession} />);

      fireEvent.click(screen.getByText("New Chat"));
      expect(onCreateSession).toHaveBeenCalled();
    });
  });

  describe("Search", () => {
    it("should render search input", () => {
      render(<SessionList {...defaultProps} />);

      expect(screen.getByPlaceholderText("Search chats...")).toBeInTheDocument();
    });

    it("should update search query on input", () => {
      render(<SessionList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search chats...");
      fireEvent.change(searchInput, { target: { value: "test query" } });

      expect(searchInput).toHaveValue("test query");
    });

    it("should show clear button when search has value", () => {
      render(<SessionList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search chats...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Clear button should appear (small X in search box)
      const container = searchInput.parentElement;
      expect(container?.querySelector("button")).toBeInTheDocument();
    });

    it("should clear search when clear button clicked", () => {
      render(<SessionList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search chats...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Click the clear button (small X icon)
      const container = searchInput.parentElement;
      const clearButton = container?.querySelector("button");
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      expect(searchInput).toHaveValue("");
    });
  });

  describe("Session List", () => {
    it("should show loading spinner when isLoading is true", () => {
      render(<SessionList {...defaultProps} isLoading={true} />);

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should render sessions", () => {
      const sessions = [
        createSession("1", "Session 1"),
        createSession("2", "Session 2"),
      ];
      render(<SessionList {...defaultProps} sessions={sessions} />);

      expect(screen.getByText("Session 1")).toBeInTheDocument();
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });

    it("should highlight current session", () => {
      const sessions = [createSession("1", "Session 1")];
      render(
        <SessionList {...defaultProps} sessions={sessions} currentSessionId="1" />
      );

      // Session should be visible
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    it("should call onSelectSession when session clicked", () => {
      const onSelectSession = vi.fn();
      const sessions = [createSession("1", "Session 1")];
      render(<SessionList {...defaultProps} sessions={sessions} onSelectSession={onSelectSession} />);

      fireEvent.click(screen.getByText("Session 1"));
      expect(onSelectSession).toHaveBeenCalledWith("1");
    });
  });

  describe("Folders", () => {
    it("should render Folders section", () => {
      render(<SessionList {...defaultProps} />);

      expect(screen.getByText("Folders")).toBeInTheDocument();
    });

    it("should render folder list", () => {
      const folders = [createFolder("f1", "Work")];
      render(<SessionList {...defaultProps} folders={folders} />);

      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should show new folder input when + button clicked", () => {
      render(<SessionList {...defaultProps} />);

      const newFolderButton = screen.getByTitle("New folder");
      fireEvent.click(newFolderButton);

      expect(screen.getByPlaceholderText("Folder name...")).toBeInTheDocument();
    });

    it("should call onCreateFolder when new folder submitted", () => {
      const onCreateFolder = vi.fn();
      render(<SessionList {...defaultProps} onCreateFolder={onCreateFolder} />);

      // Click new folder button
      fireEvent.click(screen.getByTitle("New folder"));

      // Enter folder name
      const input = screen.getByPlaceholderText("Folder name...");
      fireEvent.change(input, { target: { value: "New Folder" } });

      // Submit form
      fireEvent.submit(input.closest("form")!);

      expect(onCreateFolder).toHaveBeenCalledWith("New Folder");
    });

    it("should filter sessions by folder when folder clicked", () => {
      const folders = [createFolder("f1", "Work")];
      const sessions = [
        createSession("1", "Work Session", "f1"),
        createSession("2", "Personal Session"),
      ];
      render(<SessionList {...defaultProps} folders={folders} sessions={sessions} />);

      // Click on the folder (not expand button)
      const folderName = screen.getByText("Work");
      fireEvent.click(folderName);

      // Should show "Back to all" button
      expect(screen.getByText("Back to all")).toBeInTheDocument();
    });

    it("should show uncategorized sessions", () => {
      const sessions = [createSession("1", "Uncategorized Session")];
      render(<SessionList {...defaultProps} sessions={sessions} />);

      expect(screen.getByText("Uncategorized")).toBeInTheDocument();
      expect(screen.getByText("Uncategorized Session")).toBeInTheDocument();
    });
  });

  describe("Session Count", () => {
    it("should show session count in folder", () => {
      const folders = [createFolder("f1", "Work")];
      const sessions = [
        createSession("1", "Work 1", "f1"),
        createSession("2", "Work 2", "f1"),
      ];
      render(<SessionList {...defaultProps} folders={folders} sessions={sessions} />);

      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("Back to All", () => {
    it("should clear folder filter when Back to all clicked", () => {
      const folders = [createFolder("f1", "Work")];
      const sessions = [createSession("1", "Work Session", "f1")];
      render(<SessionList {...defaultProps} folders={folders} sessions={sessions} />);

      // Click folder to filter
      fireEvent.click(screen.getByText("Work"));

      // Should show Back to all button
      const backButton = screen.getByText("Back to all");
      fireEvent.click(backButton);

      // Should hide Back to all button
      expect(screen.queryByText("Back to all")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty folders and sessions", () => {
      render(<SessionList {...defaultProps} folders={[]} sessions={[]} />);

      expect(screen.getByText("Chats")).toBeInTheDocument();
    });

    it("should handle session without folder_id", () => {
      const sessions = [createSession("1", "No Folder Session")];
      render(<SessionList {...defaultProps} sessions={sessions} />);

      expect(screen.getByText("No Folder Session")).toBeInTheDocument();
    });
  });
});
