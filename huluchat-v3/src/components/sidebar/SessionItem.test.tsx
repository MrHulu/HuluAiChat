import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionItem } from "./SessionItem";
import type { Session, Folder } from "@/api/client";

// Mock dropdown menu portal
vi.mock("@radix-ui/react-dropdown-menu", async () => {
  const actual = await vi.importActual("@radix-ui/react-dropdown-menu");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const createSession = (overrides?: Partial<Session>): Session => ({
  id: "session-1",
  title: "Test Session",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: new Date().toISOString(),
  folder_id: null,
  ...overrides,
});

const createFolder = (id: string, name: string): Folder => ({
  id,
  name,
  created_at: "2024-01-01T00:00:00Z",
});

describe("SessionItem", () => {
  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnMoveToFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render session title", () => {
    const session = createSession({ title: "My Chat Session" });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("My Chat Session")).toBeInTheDocument();
  });

  it("should render 'New Chat' when title is empty", () => {
    const session = createSession({ title: "" });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("New Chat")).toBeInTheDocument();
  });

  it("should show 'Today' for sessions updated today", () => {
    const session = createSession({ updated_at: new Date().toISOString() });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("should show 'Yesterday' for sessions updated yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const session = createSession({ updated_at: yesterday.toISOString() });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("should show 'X days ago' for sessions updated within a week", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const session = createSession({ updated_at: threeDaysAgo.toISOString() });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("3 days ago")).toBeInTheDocument();
  });

  it("should show date for sessions older than a week", () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const session = createSession({ updated_at: twoWeeksAgo.toISOString() });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    // Should show a date format
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Yesterday")).not.toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByText(session.title));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should apply active styling when isActive is true", () => {
    const session = createSession();
    const { container } = render(
      <SessionItem
        session={session}
        isActive={true}
        onClick={mockOnClick}
      />
    );

    expect(container.firstChild).toHaveClass("bg-accent");
  });

  it("should apply inactive styling when isActive is false", () => {
    const session = createSession();
    const { container } = render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(container.firstChild).not.toHaveClass("bg-accent");
    expect(container.firstChild).toHaveClass("hover:bg-muted/50");
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Find the delete button (it has a trash icon)
    const deleteButton = screen.getByTitle("Delete session");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should call onExport with markdown format", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    // Click the export button
    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);

    // Click the markdown option
    const markdownOption = screen.getByText("Markdown (.md)");
    await user.click(markdownOption);

    expect(mockOnExport).toHaveBeenCalledWith(session.id, "markdown");
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should call onExport with json format", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);

    const jsonOption = screen.getByText("JSON (.json)");
    await user.click(jsonOption);

    expect(mockOnExport).toHaveBeenCalledWith(session.id, "json");
  });

  it("should call onExport with txt format", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);

    const txtOption = screen.getByText("Plain Text (.txt)");
    await user.click(txtOption);

    expect(mockOnExport).toHaveBeenCalledWith(session.id, "txt");
  });

  it("should show folder options when folders are provided", async () => {
    const user = userEvent.setup();
    const session = createSession();
    const folders = [createFolder("folder-1", "Work")];

    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    // Click the move to folder button
    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    // Should show the folder option
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("should call onMoveToFolder with folder id", async () => {
    const user = userEvent.setup();
    const session = createSession();
    const folders = [createFolder("folder-1", "Work")];

    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    const workFolder = screen.getByText("Work");
    await user.click(workFolder);

    expect(mockOnMoveToFolder).toHaveBeenCalledWith(session.id, "folder-1");
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should call onMoveToFolder with null for uncategorized", async () => {
    const user = userEvent.setup();
    const session = createSession({ folder_id: "folder-1" });
    const folders = [createFolder("folder-1", "Work")];

    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    const uncategorized = screen.getByText("Uncategorized");
    await user.click(uncategorized);

    expect(mockOnMoveToFolder).toHaveBeenCalledWith(session.id, null);
  });

  it("should not show move to folder button when no folders", () => {
    const session = createSession();
    render(
      <SessionItem
        session={session}
        folders={[]}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    expect(screen.queryByTitle("Move to folder")).not.toBeInTheDocument();
  });

  it("should not show move to folder button when onMoveToFolder is not provided", () => {
    const session = createSession();
    const folders = [createFolder("folder-1", "Work")];

    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.queryByTitle("Move to folder")).not.toBeInTheDocument();
  });

  it("should handle long titles with truncation", () => {
    const longTitle = "A".repeat(100);
    const session = createSession({ title: longTitle });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass("truncate");
  });

  it("should handle special characters in title", () => {
    const session = createSession({ title: "Test <script> & 'quotes'" });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Test <script> & 'quotes'")).toBeInTheDocument();
  });

  it("should handle unicode in title", () => {
    const session = createSession({ title: "你好世界 🌍 مرحبا" });
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("你好世界 🌍 مرحبا")).toBeInTheDocument();
  });

  it("should stop propagation on export dropdown menu content click", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    // Open export dropdown
    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);

    // Click on the dropdown content area (not a menu item)
    const dropdownContent = screen.getByText("Markdown (.md)").closest("[role='menu']");
    if (dropdownContent) {
      fireEvent.click(dropdownContent);
    }

    // onClick should not be called because of stopPropagation
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should stop propagation on move to folder dropdown menu content click", async () => {
    const user = userEvent.setup();
    const session = createSession();
    const folders = [createFolder("folder-1", "Work")];
    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    // Open move to folder dropdown
    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    // Click on the dropdown content area (not a menu item)
    const dropdownContent = screen.getByText("Uncategorized").closest("[role='menu']");
    if (dropdownContent) {
      fireEvent.click(dropdownContent);
    }

    // onClick should not be called because of stopPropagation
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should highlight current folder in move menu", async () => {
    const user = userEvent.setup();
    const session = createSession({ folder_id: "folder-1" });
    const folders = [createFolder("folder-1", "Work")];
    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    // The current folder should have bg-muted class (highlighted)
    const workMenuItem = screen.getByText("Work").closest("[role='menuitem']");
    expect(workMenuItem).toHaveClass("bg-muted");
  });

  it("should show checkmark for current folder in move menu", async () => {
    const user = userEvent.setup();
    const session = createSession({ folder_id: "folder-1" });
    const folders = [createFolder("folder-1", "Work")];
    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    // Should show checkmark (lucide Check icon)
    const menuItems = document.querySelectorAll("[role='menuitem']");
    const workItem = Array.from(menuItems).find((item) =>
      item.textContent?.includes("Work")
    );
    // Checkmark SVG should be present (lucide-react Check icon has class containing "lucide-check")
    expect(workItem?.querySelector("svg[class*='lucide-check']")).toBeInTheDocument();
  });

  it("should handle export button click with stopPropagation", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    // Click the export button itself (not the menu item)
    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);

    // onClick should not be called because of stopPropagation on button
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should handle move button click with stopPropagation", async () => {
    const user = userEvent.setup();
    const session = createSession();
    const folders = [createFolder("folder-1", "Work")];
    render(
      <SessionItem
        session={session}
        folders={folders}
        isActive={false}
        onClick={mockOnClick}
        onMoveToFolder={mockOnMoveToFolder}
      />
    );

    // Click the move button itself
    const moveButton = screen.getByTitle("Move to folder");
    await user.click(moveButton);

    // onClick should not be called because of stopPropagation on button
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should prevent double export while exporting", async () => {
    const user = userEvent.setup();
    const session = createSession();
    render(
      <SessionItem
        session={session}
        isActive={false}
        onClick={mockOnClick}
        onExport={mockOnExport}
      />
    );

    // Click export button and then quickly click a format option
    const exportButton = screen.getByTitle("Export session");
    await user.click(exportButton);
    await user.click(screen.getByText("Markdown (.md)"));

    // Should have been called once
    expect(mockOnExport).toHaveBeenCalledTimes(1);

    // Click again quickly - the button should be disabled during export
    await user.click(exportButton);
    // The button should have disabled styling
    expect(exportButton).toHaveClass("cursor-wait");
  });
});
