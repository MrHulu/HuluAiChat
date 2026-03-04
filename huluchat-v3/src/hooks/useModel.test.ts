import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useModel } from "./useModel";

// Mock the API client
vi.mock("@/api/client", () => ({
  getSettings: vi.fn(),
  getModels: vi.fn(),
}));

const mockGetSettings = vi.mocked(
  await import("@/api/client").then((m) => m.getSettings)
);
const mockGetModels = vi.mocked(
  await import("@/api/client").then((m) => m.getModels)
);

describe("useModel hook", () => {
  const mockModels = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast" },
    { id: "claude-3", name: "Claude 3", description: "Anthropic" },
  ];

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset mocks
    vi.clearAllMocks();
    // Setup default mock responses
    mockGetSettings.mockResolvedValue({
      openai_api_key: null,
      openai_base_url: null,
      openai_model: "gpt-3.5-turbo",
      has_api_key: false,
    });
    mockGetModels.mockResolvedValue(mockModels);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentModel).toBe("");
    expect(result.current.models).toEqual([]);
  });

  it("should load models and set default from settings", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.currentModel).toBe("gpt-3.5-turbo");
  });

  it("should prefer localStorage over settings", async () => {
    localStorage.setItem("huluchat-selected-model", "claude-3");

    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentModel).toBe("claude-3");
  });

  it("should fall back to first model if no settings", async () => {
    mockGetSettings.mockResolvedValue({
      openai_api_key: null,
      openai_base_url: null,
      openai_model: "",
      has_api_key: false,
    });

    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentModel).toBe("gpt-4");
  });

  it("should update model and save to localStorage", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setModel("gpt-4");
    });

    expect(result.current.currentModel).toBe("gpt-4");
    expect(localStorage.getItem("huluchat-selected-model")).toBe("gpt-4");
  });

  it("should not update model if not in model list", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const previousModel = result.current.currentModel;

    act(() => {
      result.current.setModel("invalid-model");
    });

    expect(result.current.currentModel).toBe(previousModel);
  });

  it("should return correct model name", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getModelName("gpt-4")).toBe("GPT-4");
    expect(result.current.getModelName("claude-3")).toBe("Claude 3");
  });

  it("should return model ID if model not found", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getModelName("unknown-model")).toBe("unknown-model");
  });

  it("should return current model name when no ID provided", async () => {
    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default from settings is gpt-3.5-turbo
    expect(result.current.getModelName()).toBe("GPT-3.5 Turbo");
  });

  it("should handle API errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSettings.mockRejectedValue(new Error("Network error"));
    mockGetModels.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.models).toEqual([]);
    expect(result.current.currentModel).toBe("");

    consoleErrorSpy.mockRestore();
  });
});
