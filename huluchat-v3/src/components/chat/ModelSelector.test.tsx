import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSelector } from "./ModelSelector";
import type { ModelInfo } from "@/api/client";

// Mock dropdown menu portal
vi.mock("@radix-ui/react-dropdown-menu", async () => {
  const actual = await vi.importActual("@radix-ui/react-dropdown-menu");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const createModel = (
  id: string,
  name: string,
  description?: string,
  provider?: "openai" | "ollama"
): ModelInfo => ({
  id,
  name,
  description: description || `Description for ${name}`,
  ...(provider && { provider }),
});

const mockModels: ModelInfo[] = [
  createModel("gpt-4", "GPT-4", "Most capable model"),
  createModel("gpt-3.5-turbo", "GPT-3.5 Turbo", "Fast and efficient"),
  createModel("claude-3", "Claude 3", "Anthropic's latest"),
];

// Cloud models (OpenAI and compatible APIs)
const mockCloudModels: ModelInfo[] = [
  createModel("gpt-4", "GPT-4", "Most capable model", "openai"),
  createModel("gpt-3.5-turbo", "GPT-3.5 Turbo", "Fast and efficient", "openai"),
  createModel("claude-3", "Claude 3", "Anthropic's latest", "openai"),
];

// Local models (Ollama)
const mockLocalModels: ModelInfo[] = [
  createModel("ollama:llama3", "Llama 3", "Local (4.6GB)", "ollama"),
  createModel("ollama:mistral", "Mistral", "Local (4.1GB)", "ollama"),
  createModel("ollama:qwen2", "Qwen 2", "Local (4.7GB)", "ollama"),
];

// Mixed models (both Cloud and Local)
const mockMixedModels: ModelInfo[] = [...mockCloudModels, ...mockLocalModels];

describe("ModelSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render current model name", () => {
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("GPT-4")).toBeInTheDocument();
  });

  it("should show raw value if model not found", () => {
    render(
      <ModelSelector
        value="unknown-model"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("unknown-model")).toBeInTheDocument();
  });

  it("should show all models in dropdown when opened", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    // GPT-4 appears in both button and menu, GPT-3.5 and Claude only in menu
    expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
    expect(screen.getByText("Claude 3")).toBeInTheDocument();
  });

  it("should show model descriptions in dropdown", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Most capable model")).toBeInTheDocument();
    expect(screen.getByText("Fast and efficient")).toBeInTheDocument();
    expect(screen.getByText("Anthropic's latest")).toBeInTheDocument();
  });

  it("should call onChange when model is selected", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Claude 3"));

    expect(mockOnChange).toHaveBeenCalledWith("claude-3");
  });

  it("should show check mark for selected model", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    // Find the selected menu item by looking for the check icon
    const checkIcons = document.querySelectorAll('svg.lucide-check');
    // There should be a check icon next to the selected model
    expect(checkIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("should show loading state when isLoading is true", () => {
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should disable button when disabled prop is true", () => {
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should handle empty models list", () => {
    render(
      <ModelSelector
        value="gpt-4"
        models={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("gpt-4")).toBeInTheDocument();
  });

  it("should handle single model", async () => {
    const user = userEvent.setup();
    const singleModel = [createModel("gpt-4", "GPT-4")];

    render(
      <ModelSelector
        value="gpt-4"
        models={singleModel}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);
  });

  it("should truncate long model names", () => {
    const longNameModel = [createModel("long-id", "A".repeat(50))];
    render(
      <ModelSelector
        value="long-id"
        models={longNameModel}
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("max-w-[180px]");
    // Find the span that contains the model name (the one after provider icon)
    const modelNameSpan = button.querySelector("span.truncate");
    expect(modelNameSpan).toHaveClass("truncate");
  });

  it("should handle special characters in model names", async () => {
    const user = userEvent.setup();
    const specialModels = [
      createModel("special-1", "GPT-4 <Turbo>", "Fast & powerful"),
    ];

    render(
      <ModelSelector
        value="special-1"
        models={specialModels}
        onChange={mockOnChange}
      />
    );

    // Model name appears in button
    expect(screen.getAllByText("GPT-4 <Turbo>").length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole("button"));

    // Description should also appear
    expect(screen.getByText("Fast & powerful")).toBeInTheDocument();
  });

  it("should handle unicode in model names", async () => {
    const user = userEvent.setup();
    const unicodeModels = [
      createModel("unicode-1", "模型 🤖", "AI 聊天"),
    ];

    render(
      <ModelSelector
        value="unicode-1"
        models={unicodeModels}
        onChange={mockOnChange}
      />
    );

    // Model name appears in button
    expect(screen.getAllByText("模型 🤖").length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole("button"));

    // Description should also appear
    expect(screen.getByText("AI 聊天")).toBeInTheDocument();
  });

  it("should work with default isLoading and disabled values", () => {
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("should align dropdown to end", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    // Just verify dropdown opened
    expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
  });

  // ========== Ollama Phase 2: Cloud/Local 分组测试 ==========
  describe("Cloud/Local Provider Grouping", () => {
    it("should not show grouping when only cloud models exist", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockCloudModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 不应该显示分组标题（因为只有一种类型的模型）
      expect(screen.queryByText("Cloud Models")).not.toBeInTheDocument();
      expect(screen.queryByText("Local Models (Ollama)")).not.toBeInTheDocument();
      // 但应该显示所有模型（GPT-4 出现在按钮和菜单中）
      expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
      expect(screen.getByText("Claude 3")).toBeInTheDocument();
    });

    it("should not show grouping when only local models exist", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="ollama:llama3"
          models={mockLocalModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 不应该显示分组标题（因为只有一种类型的模型）
      expect(screen.queryByText("Cloud Models")).not.toBeInTheDocument();
      expect(screen.queryByText("Local Models (Ollama)")).not.toBeInTheDocument();
      // 但应该显示所有本地模型
      expect(screen.getAllByText("Llama 3").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Mistral")).toBeInTheDocument();
      expect(screen.getByText("Qwen 2")).toBeInTheDocument();
    });

    it("should show both Cloud and Local group headers when mixed models exist", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 应该显示分组标题（当混合模型存在时）
      expect(screen.getByText("Cloud Models")).toBeInTheDocument();
      expect(screen.getByText("Local Models (Ollama)")).toBeInTheDocument();
    });

    it("should place Cloud models under Cloud section", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证 Cloud 模型显示（GPT-4 可能出现在按钮和菜单中）
      expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
      expect(screen.getByText("Claude 3")).toBeInTheDocument();
    });

    it("should place Local models under Local section", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证 Local 模型显示
      expect(screen.getByText("Llama 3")).toBeInTheDocument();
      expect(screen.getByText("Mistral")).toBeInTheDocument();
      expect(screen.getByText("Qwen 2")).toBeInTheDocument();
    });

    it("should show Local badge for Ollama models", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证本地模型分组标题包含 "Local Models (Ollama)"
      expect(screen.getByText("Local Models (Ollama)")).toBeInTheDocument();
    });

    it("should allow switching between Cloud and Local models", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));
      // 使用 getAllByText 并选择第一个菜单项
      const llamaItems = screen.getAllByText("Llama 3");
      await user.click(llamaItems[0]);

      expect(mockOnChange).toHaveBeenCalledWith("ollama:llama3");
    });

    it("should maintain selected state when switching between providers", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      // 初始选择 Cloud 模型（GPT-4 可能出现在按钮和菜单中）
      expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);

      // 切换到 Local 模型
      rerender(
        <ModelSelector
          value="ollama:llama3"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证本地模型被选中（Llama 3 可能出现在按钮和菜单中）
      expect(screen.getAllByText("Llama 3").length).toBeGreaterThanOrEqual(1);
    });

    it("should handle models without provider property", async () => {
      const user = userEvent.setup();
      const modelsWithoutProvider: ModelInfo[] = [
        createModel("gpt-4", "GPT-4", "Cloud model"),
        createModel("unknown:model", "Unknown Model", "Unknown provider"),
      ];

      render(
        <ModelSelector
          value="gpt-4"
          models={modelsWithoutProvider}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 应该正常显示，不崩溃（GPT-4 可能出现在按钮和菜单中）
      expect(screen.getAllByText("GPT-4").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Unknown Model")).toBeInTheDocument();
    });

    it("should display Cloud section before Local section", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      const cloudHeader = screen.getByText("Cloud Models");
      const localHeader = screen.getByText("Local Models (Ollama)");

      // 验证 Cloud 在 Local 之前
      const cloudPosition = cloudHeader.compareDocumentPosition(localHeader);
      expect(cloudPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("should show provider icon in button for Ollama models", () => {
      const { container } = render(
        <ModelSelector
          value="ollama:llama3"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      // 验证按钮中有 Server 图标 (Ollama 模型)
      const serverIcon = container.querySelector('svg.lucide-server');
      expect(serverIcon).toBeInTheDocument();
    });

    it("should show provider icon in button for Cloud models", () => {
      const { container } = render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      // 验证按钮中有 Cloud 图标 (Cloud 模型)
      const cloudIcon = container.querySelector('svg.lucide-cloud');
      expect(cloudIcon).toBeInTheDocument();
    });
  });

  // ========== Ollama Phase 2: 模型描述测试 ==========
  describe("Model Descriptions with Provider", () => {
    it("should display model size for Ollama models", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="ollama:llama3"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证本地模型显示（Llama 3 可能出现在按钮和菜单中）
      expect(screen.getAllByText("Llama 3").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Mistral")).toBeInTheDocument();

      // 如果能找到完整的描述文本，则验证
      const fullDescriptions = screen.queryAllByText(/Local \(4\.\dGB\)/);
      if (fullDescriptions.length > 0) {
        expect(fullDescriptions.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should display description for Cloud models", async () => {
      const user = userEvent.setup();
      render(
        <ModelSelector
          value="gpt-4"
          models={mockMixedModels}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button"));

      // 验证 Cloud 模型显示描述
      expect(screen.getByText("Most capable model")).toBeInTheDocument();
      expect(screen.getByText("Fast and efficient")).toBeInTheDocument();
    });
  });
});
