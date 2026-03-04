import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFolders } from "./useFolders";

// Mock the API client
vi.mock("@/api/client", () => ({
  listFolders: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
}));

const mockListFolders = vi.mocked(
  await import("@/api/client").then((m) => m.listFolders)
);
const mockCreateFolder = vi.mocked(
  await import("@/api/client").then((m) => m.createFolder)
);
const mockUpdateFolder = vi.mocked(
  await import("@/api/client").then((m) => m.updateFolder)
);
const mockDeleteFolder = vi.mocked(
  await import("@/api/client").then((m) => m.deleteFolder)
);

describe("useFolders hook", () => {
  const mockFolders = [
    {
      id: "folder-1",
      name: "Work",
      parent_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "folder-2",
      name: "Personal",
      parent_id: null,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
    {
      id: "folder-3",
      name: "Projects",
      parent_id: "folder-1",
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockListFolders.mockResolvedValue(mockFolders);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading state and fetch folders", async () => {
    const { result } = renderHook(() => useFolders());

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.folders).toEqual([]);
    expect(result.current.error).toBeNull();

    // After loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.folders).toEqual(mockFolders);
    expect(mockListFolders).toHaveBeenCalledTimes(1);
  });

  it("should handle API errors when loading folders", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockListFolders.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.folders).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it("should create a new folder", async () => {
    const newFolder = {
      id: "folder-4",
      name: "New Folder",
      parent_id: null,
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
    };
    mockCreateFolder.mockResolvedValue(newFolder);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdFolder = null;
    await act(async () => {
      createdFolder = await result.current.createFolder("New Folder");
    });

    expect(createdFolder).toEqual(newFolder);
    expect(result.current.folders).toContainEqual(newFolder);
    expect(mockCreateFolder).toHaveBeenCalledWith("New Folder", undefined);
  });

  it("should create a folder with parent", async () => {
    const childFolder = {
      id: "folder-5",
      name: "Child Folder",
      parent_id: "folder-1",
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-05T00:00:00Z",
    };
    mockCreateFolder.mockResolvedValue(childFolder);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdFolder = null;
    await act(async () => {
      createdFolder = await result.current.createFolder("Child Folder", "folder-1");
    });

    expect(createdFolder).toEqual(childFolder);
    expect(mockCreateFolder).toHaveBeenCalledWith("Child Folder", "folder-1");
  });

  it("should handle errors when creating folder", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateFolder.mockRejectedValue(new Error("Create failed"));

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdFolder = null;
    await act(async () => {
      createdFolder = await result.current.createFolder("Test");
    });

    expect(createdFolder).toBeNull();
    expect(result.current.error).toBe("Create failed");

    consoleErrorSpy.mockRestore();
  });

  it("should rename a folder", async () => {
    const renamedFolder = {
      ...mockFolders[0],
      name: "Renamed Work",
      updated_at: "2024-01-06T00:00:00Z",
    };
    mockUpdateFolder.mockResolvedValue(renamedFolder);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let result_folder = null;
    await act(async () => {
      result_folder = await result.current.renameFolder("folder-1", "Renamed Work");
    });

    expect(result_folder).toEqual(renamedFolder);
    const updated = result.current.folders.find((f) => f.id === "folder-1");
    expect(updated?.name).toBe("Renamed Work");
    expect(mockUpdateFolder).toHaveBeenCalledWith("folder-1", "Renamed Work");
  });

  it("should handle errors when renaming folder", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateFolder.mockRejectedValue(new Error("Rename failed"));

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let result_folder = null;
    await act(async () => {
      result_folder = await result.current.renameFolder("folder-1", "New Name");
    });

    expect(result_folder).toBeNull();
    expect(result.current.error).toBe("Rename failed");

    consoleErrorSpy.mockRestore();
  });

  it("should delete a folder", async () => {
    mockDeleteFolder.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.folders.length;

    await act(async () => {
      await result.current.removeFolder("folder-1");
    });

    expect(result.current.folders.length).toBe(initialCount - 1);
    expect(result.current.folders.find((f) => f.id === "folder-1")).toBeUndefined();
    expect(mockDeleteFolder).toHaveBeenCalledWith("folder-1");
  });

  it("should handle errors when deleting folder", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteFolder.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFolder("folder-1");
    });

    expect(result.current.error).toBe("Delete failed");
    // Folders should not be modified
    expect(result.current.folders).toEqual(mockFolders);

    consoleErrorSpy.mockRestore();
  });

  it("should refresh folders", async () => {
    const newFoldersList = [
      ...mockFolders,
      {
        id: "folder-4",
        name: "New",
        parent_id: null,
        created_at: "2024-01-07T00:00:00Z",
        updated_at: "2024-01-07T00:00:00Z",
      },
    ];
    mockListFolders.mockResolvedValueOnce(mockFolders);
    mockListFolders.mockResolvedValueOnce(newFoldersList);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.folders).toEqual(mockFolders);

    await act(async () => {
      await result.current.refreshFolders();
    });

    expect(result.current.folders).toEqual(newFoldersList);
    expect(mockListFolders).toHaveBeenCalledTimes(2);
  });

  it("should handle unknown error type", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockListFolders.mockRejectedValue("Unknown error string");

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load folders");

    consoleErrorSpy.mockRestore();
  });
});
