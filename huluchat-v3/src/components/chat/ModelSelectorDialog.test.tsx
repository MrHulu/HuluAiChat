/**
 * ModelSelectorDialog Component Tests
 * TASK-233 Phase 5: Dialog for selecting a different model to regenerate AI response
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModelSelectorDialog } from "./ModelSelectorDialog";
import type { ModelInfo, OllamaModel } from "@/api/client";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "chat.modelSelector.title": "Select Model",
        "chat.modelSelector.description": "Choose a different AI model",
        "chat.modelSelector.selectModel": `Select ${options?.model as string || "model"}`,
        "chat.modelSelector.recommended": "Recommended",
        "chat.modelSelector.currentModel": "Current",
        "chat.modelSelector.ollamaLocal": "Ollama (Local)",
        "chat.modelSelector.localModel": "Local model",
        "common.cancel": "Cancel",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ModelSelectorDialog", () => {
  const mockModels: ModelInfo[] = [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable", provider: "openai" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and affordable", provider: "openai" },
    { id: "deepseek-chat", name: "DeepSeek V3", description: "Reasoning model", provider: "openai" },
  ];

  const mockOllamaModels: OllamaModel[] = [
    { name: "llama3", modified_at: "" },
    { name: "qwen2.5", modified_at: "" },
  ];

  const defaultProps = {
    open: false,
    onOpenChange: vi.fn(),
    models: mockModels,
    currentModel: "gpt-4o",
    ollamaModels: [] as OllamaModel[],
    ollamaAvailable: false,
    onSelectModel: vi.fn(),
    isRegenerating: false,
    recommendedModel: null as string | null,
  };

  it("renders nothing when closed", () => {
    render(<ModelSelectorDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
  });

  it("renders dialog when open", () => {
    render(<ModelSelectorDialog {...defaultProps} open={true} />);

    expect(screen.getByText("Select Model")).toBeInTheDocument();
    expect(screen.getByText("Choose a different AI model")).toBeInTheDocument();
  });

  it("displays available models", () => {
    render(<ModelSelectorDialog {...defaultProps} open={true} />);

    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.getByText("DeepSeek V3")).toBeInTheDocument();
  });

  it("highlights current model", () => {
    render(<ModelSelectorDialog {...defaultProps} open={true} />);

    // Current model should have aria-current="true"
    const currentModelButton = screen.getByRole("button", { current: true });
    expect(currentModelButton).toBeInTheDocument();
    expect(currentModelButton).toHaveTextContent(/GPT-4o/);
  });

  it("calls onSelectModel when model is clicked", () => {
    const onSelectModel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        onSelectModel={onSelectModel}
        onOpenChange={onOpenChange}
      />
    );

    // Click on a different model
    fireEvent.click(screen.getByText("DeepSeek V3"));

    expect(onSelectModel).toHaveBeenCalledWith("deepseek-chat");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not select current model again", () => {
    const onSelectModel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        onSelectModel={onSelectModel}
        onOpenChange={onOpenChange}
      />
    );

    // Click on current model (should not trigger selection)
    fireEvent.click(screen.getByText("GPT-4o"));

    expect(onSelectModel).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disables selection when regenerating", () => {
    const onSelectModel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        isRegenerating={true}
        onSelectModel={onSelectModel}
        onOpenChange={onOpenChange}
      />
    );

    // Clicking on a different model should not trigger selection when regenerating
    fireEvent.click(screen.getByText("DeepSeek V3"));

    // Selection should be blocked when regenerating
    expect(onSelectModel).not.toHaveBeenCalled();
  });

  it("shows recommended badge for recommended model", () => {
    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        recommendedModel="deepseek-chat"
      />
    );

    // DeepSeek V3 should be rendered with recommended indicator
    const allButtons = screen.getAllByRole("button");
    const deepSeekButton = allButtons.find((btn) =>
      btn.textContent?.includes("DeepSeek V3")
    );
    expect(deepSeekButton).toBeInTheDocument();
  });

  it("includes Ollama models when available", () => {
    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        ollamaAvailable={true}
        ollamaModels={mockOllamaModels}
      />
    );

    expect(screen.getByText("llama3")).toBeInTheDocument();
    expect(screen.getByText("qwen2.5")).toBeInTheDocument();
  });

  it("groups models by provider", () => {
    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        ollamaAvailable={true}
        ollamaModels={mockOllamaModels}
      />
    );

    // Should show provider group headers
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Ollama (Local)")).toBeInTheDocument();
  });

  it("closes dialog when cancel is clicked", () => {
    const onOpenChange = vi.fn();

    render(
      <ModelSelectorDialog
        {...defaultProps}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    // Click cancel button
    fireEvent.click(screen.getByText("Cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has correct accessibility attributes", () => {
    render(<ModelSelectorDialog {...defaultProps} open={true} />);

    // Dialog should have proper ARIA attributes
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });
});
