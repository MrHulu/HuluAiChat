import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useModel } from "./useModel";

// Mock the API client
vi.mock("@/api/client", () => ({
  getSettings: vi.fn(),
  getModels: vi.fn(),
  getOllamaStatus: vi.fn(),
  getOllamaModels: vi.fn(),
  recordModelUsage: vi.fn(),
  getRecommendedModel: vi.fn(),
}));

const mockGetSettings = vi.mocked(
  await import("@/api/client").then((m) => m.getSettings)
);
const mockGetModels = vi.mocked(
  await import("@/api/client").then((m) => m.getModels)
);
const mockGetOllamaStatus = vi.mocked(
  await import("@/api/client").then((m) => m.getOllamaStatus)
);
const mockGetOllamaModels = vi.mocked(
  await import("@/api/client").then((m) => m.getOllamaModels)
);
const mockRecordModelUsage = vi.mocked(
  await import("@/api/client").then((m) => m.recordModelUsage)
);
const mockGetRecommendedModel = vi.mocked(
  await import("@/api/client").then((m) => m.getRecommendedModel)
);

describe("useModel hook", () => {
  const mockOpenAIModels = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable", provider: "openai" as const },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast", provider: "openai" as const },
    { id: "claude-3", name: "Claude 3", description: "Anthropic", provider: "openai" as const },
  ];

  const mockOllamaModels = [
    { id: "ollama:llama3", name: "Llama 3", description: "Local (4.6GB)", provider: "ollama" as const },
    { id: "ollama:mistral", name: "Mistral", description: "Local (4.1GB)", provider: "ollama" as const },
  ];

  const mockMixedModels = [...mockOpenAIModels, ...mockOllamaModels];

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
    mockGetModels.mockResolvedValue(mockOpenAIModels);
    mockGetOllamaStatus.mockResolvedValue({ available: false, base_url: "http://localhost:11434" });
    mockGetOllamaModels.mockResolvedValue([]);
    mockRecordModelUsage.mockResolvedValue({ model_id: "", count: 1, last_used: null });
    mockGetRecommendedModel.mockResolvedValue({ model_id: null, reason: "No usage data available" });
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

    expect(result.current.models).toEqual(mockOpenAIModels);
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

  // Ollama 相关测试
  describe("Ollama integration", () => {
    it("should load Ollama models when available", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.models).toHaveLength(5);
      expect(result.current.models).toContainEqual(mockOllamaModels[0]);
      expect(result.current.models).toContainEqual(mockOllamaModels[1]);
    });

    it("should allow switching between OpenAI and Ollama models", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 切换到 Ollama 模型
      act(() => {
        result.current.setModel("ollama:llama3");
      });

      expect(result.current.currentModel).toBe("ollama:llama3");
      expect(localStorage.getItem("huluchat-selected-model")).toBe("ollama:llama3");

      // 切换回 OpenAI 模型
      act(() => {
        result.current.setModel("gpt-4");
      });

      expect(result.current.currentModel).toBe("gpt-4");
      expect(localStorage.getItem("huluchat-selected-model")).toBe("gpt-4");
    });

    it("should restore Ollama model selection from localStorage", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);
      localStorage.setItem("huluchat-selected-model", "ollama:mistral");

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentModel).toBe("ollama:mistral");
    });

    it("should handle empty Ollama model list", async () => {
      mockGetModels.mockResolvedValue(mockOpenAIModels); // 只有 OpenAI 模型

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 应该只有 OpenAI 模型
      expect(result.current.models).not.toContainEqual(
        expect.objectContaining({ provider: "ollama" })
      );
    });

    it("should return Ollama model names correctly", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getModelName("ollama:llama3")).toBe("Llama 3");
      expect(result.current.getModelName("ollama:mistral")).toBe("Mistral");
    });

    it("should set Ollama model as current when selected", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setModel("ollama:llama3");
      });

      expect(result.current.currentModel).toBe("ollama:llama3");

      // 验证 getModelName 返回正确的名称
      expect(result.current.getModelName()).toBe("Llama 3");
    });

    it("should handle models with provider property", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const openaiModel = result.current.models.find((m) => m.id === "gpt-4");
      const ollamaModel = result.current.models.find((m) => m.id === "ollama:llama3");

      expect(openaiModel?.provider).toBe("openai");
      expect(ollamaModel?.provider).toBe("ollama");
    });

    it("should prefer localStorage Ollama model over settings", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);
      mockGetSettings.mockResolvedValue({
        openai_api_key: null,
        openai_base_url: null,
        openai_model: "gpt-4", // 设置默认为 gpt-4
        has_api_key: false,
      });

      localStorage.setItem("huluchat-selected-model", "ollama:llama3");

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // localStorage 应该优先
      expect(result.current.currentModel).toBe("ollama:llama3");
    });

    it("should not allow selecting invalid Ollama model", async () => {
      mockGetModels.mockResolvedValue(mockMixedModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const previousModel = result.current.currentModel;

      act(() => {
        result.current.setModel("ollama:nonexistent-model");
      });

      // 模型不应该改变
      expect(result.current.currentModel).toBe(previousModel);
    });
  });

  describe("Model loading edge cases", () => {
    it("should handle models array with missing provider property", async () => {
      const modelsWithoutProvider = [
        { id: "gpt-4", name: "GPT-4", description: "Most capable" },
        { id: "ollama:llama3", name: "Llama 3", description: "Local" },
      ];
      mockGetModels.mockResolvedValue(modelsWithoutProvider);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.models).toHaveLength(2);
    });

    it("should handle duplicate model IDs across providers", async () => {
      const modelsWithDuplicates = [
        { id: "gpt-4", name: "GPT-4 (Cloud)", description: "OpenAI", provider: "openai" as const },
        { id: "gpt-4", name: "GPT-4 (Local)", description: "Ollama", provider: "ollama" as const },
      ];
      mockGetModels.mockResolvedValue(modelsWithDuplicates);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 两个模型都应该在列表中
      expect(result.current.models).toHaveLength(2);
    });

    it("should handle empty model list", async () => {
      mockGetSettings.mockResolvedValue({
        openai_api_key: null,
        openai_base_url: null,
        openai_model: null, // 无默认模型
        has_api_key: false,
      });
      mockGetModels.mockResolvedValue([]);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.models).toEqual([]);
      expect(result.current.currentModel).toBe(""); // 无可用模型时为空
    });

    it("should handle partial model data", async () => {
      const partialModels = [
        { id: "gpt-4", name: "GPT-4", description: "" },
        { id: "ollama:llama3", name: "", description: "Local" },
      ];
      mockGetModels.mockResolvedValue(partialModels);

      const { result } = renderHook(() => useModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.models).toHaveLength(2);
      expect(result.current.getModelName("gpt-4")).toBe("GPT-4");
      expect(result.current.getModelName("ollama:llama3")).toBe("ollama:llama3"); // 空名称时返回 id
    });
  });
});
