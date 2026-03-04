import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSession } from "./useSession";

// Mock the API client
vi.mock("@/api/client", () => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

const mockListSessions = vi.mocked(
  await import("@/api/client").then((m) => m.listSessions)
);
const mockCreateSession = vi.mocked(
  await import("@/api/client").then((m) => m.createSession)
);
const mockDeleteSession = vi.mocked(
  await import("@/api/client").then((m) => m.deleteSession)
);
const mockGetSession = vi.mocked(
  await import("@/api/client").then((m) => m.getSession)
);

describe("useSession hook", () => {
  const mockSessions = [
    {
      id: "session-1",
      title: "First Chat",
      folder_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "session-2",
      title: "Second Chat",
      folder_id: "folder-1",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockListSessions.mockResolvedValue(mockSessions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading state and fetch sessions", async () => {
    const { result } = renderHook(() => useSession());

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.error).toBeNull();

    // After loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(mockListSessions).toHaveBeenCalledTimes(1);
  });

  it("should handle API errors when loading sessions", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockListSessions.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.sessions).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it("should create a new session", async () => {
    const newSession = {
      id: "session-3",
      title: "New Chat",
      folder_id: null,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z",
    };
    mockCreateSession.mockResolvedValue(newSession);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdSession: typeof newSession | null = null;
    await act(async () => {
      createdSession = await result.current.createNewSession();
    });

    expect(createdSession).toEqual(newSession);
    expect(result.current.currentSession).toEqual(newSession);
    expect(result.current.sessions[0]).toEqual(newSession);
    expect(mockCreateSession).toHaveBeenCalledTimes(1);
  });

  it("should handle errors when creating session", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateSession.mockRejectedValue(new Error("Create failed"));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let createdSession = null;
    await act(async () => {
      createdSession = await result.current.createNewSession();
    });

    expect(createdSession).toBeNull();
    expect(result.current.error).toBe("Create failed");

    consoleErrorSpy.mockRestore();
  });

  it("should select a session by ID", async () => {
    mockGetSession.mockResolvedValue(mockSessions[0]);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.selectSession("session-1");
    });

    expect(result.current.currentSession).toEqual(mockSessions[0]);
    expect(mockGetSession).toHaveBeenCalledWith("session-1");
  });

  it("should handle errors when selecting session", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSession.mockRejectedValue(new Error("Session not found"));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.selectSession("invalid-id");
    });

    expect(result.current.error).toBe("Session not found");
    expect(result.current.currentSession).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it("should delete a session", async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First select a session
    mockGetSession.mockResolvedValue(mockSessions[0]);
    await act(async () => {
      await result.current.selectSession("session-1");
    });

    // Then delete it
    await act(async () => {
      await result.current.removeSession("session-1");
    });

    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions.find((s) => s.id === "session-1")).toBeUndefined();
    expect(result.current.currentSession).toBeNull();
    expect(mockDeleteSession).toHaveBeenCalledWith("session-1");
  });

  it("should not clear current session when deleting different session", async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Select session-1
    mockGetSession.mockResolvedValue(mockSessions[0]);
    await act(async () => {
      await result.current.selectSession("session-1");
    });

    // Delete session-2 (different from current)
    await act(async () => {
      await result.current.removeSession("session-2");
    });

    // Current session should remain
    expect(result.current.currentSession).toEqual(mockSessions[0]);
    expect(result.current.sessions.length).toBe(1);
  });

  it("should handle errors when deleting session", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteSession.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeSession("session-1");
    });

    expect(result.current.error).toBe("Delete failed");
    // Sessions should not be modified
    expect(result.current.sessions).toEqual(mockSessions);

    consoleErrorSpy.mockRestore();
  });

  it("should refresh sessions", async () => {
    const newSessionsList = [
      ...mockSessions,
      {
        id: "session-3",
        title: "Third Chat",
        folder_id: null,
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      },
    ];
    mockListSessions.mockResolvedValueOnce(mockSessions);
    mockListSessions.mockResolvedValueOnce(newSessionsList);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);

    await act(async () => {
      await result.current.refreshSessions();
    });

    expect(result.current.sessions).toEqual(newSessionsList);
    expect(mockListSessions).toHaveBeenCalledTimes(2);
  });
});
