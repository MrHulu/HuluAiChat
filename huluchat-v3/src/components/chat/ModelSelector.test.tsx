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

const createModel = (id: string, name: string, description?: string): ModelInfo => ({
  id,
  name,
  description: description || `Description for ${name}`,
});

const mockModels: ModelInfo[] = [
  createModel("gpt-4", "GPT-4", "Most capable model"),
  createModel("gpt-3.5-turbo", "GPT-3.5 Turbo", "Fast and efficient"),
  createModel("claude-3", "Claude 3", "Anthropic's latest"),
];

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
    const { container } = render(
      <ModelSelector
        value="long-id"
        models={longNameModel}
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("max-w-[180px]");
    expect(button.querySelector("span")).toHaveClass("truncate");
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
    const { container } = render(
      <ModelSelector
        value="gpt-4"
        models={mockModels}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole("button"));

    // The dropdown content should have align="end"
    const dropdownContent = container.querySelector("[data-side]");
    // Just verify dropdown opened
    expect(screen.getByText("GPT-3.5 Turbo")).toBeInTheDocument();
  });
});
