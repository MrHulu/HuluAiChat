/**
 * WelcomeDialog Component Tests
 * 5 步引导流程测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeDialog } from "./WelcomeDialog";

// Mock i18next - 5 步流程翻译
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "welcome.step1.title": "Welcome to HuluChat",
        "welcome.step1.description": "Your privacy-first AI desktop assistant",
        "welcome.step2.title": "Multiple AI Models",
        "welcome.step2.description": "Choose from OpenAI, DeepSeek, or Ollama",
        "welcome.step3.title": "Document Chat (RAG)",
        "welcome.step3.description": "Upload documents and chat with them",
        "welcome.step4.title": "Quick Navigation",
        "welcome.step4.description": "Press Ctrl+K for command palette",
        "welcome.step5.title": "Knowledge Center",
        "welcome.step5.description": "Access prompt tips and FAQs",
        "welcome.skip": "Skip",
        "welcome.next": "Next",
        "welcome.getStarted": "Get Started",
      };
      return translations[key] || key;
    },
  }),
}));

describe("WelcomeDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("Welcome to HuluChat")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <WelcomeDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText("Welcome to HuluChat")).not.toBeInTheDocument();
  });

  it("navigates to next step when Next is clicked", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Multiple AI Models")).toBeInTheDocument();
  });

  it("calls onComplete when Get Started is clicked", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    // Navigate through all 5 steps (click Next 4 times to reach last step)
    fireEvent.click(screen.getByText("Next")); // Step 2
    fireEvent.click(screen.getByText("Next")); // Step 3
    fireEvent.click(screen.getByText("Next")); // Step 4
    fireEvent.click(screen.getByText("Next")); // Step 5
    // Click Get Started
    fireEvent.click(screen.getByText("Get Started"));

    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onComplete when Skip is clicked", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByText("Skip"));

    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows correct step indicators", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    // Should have 5 step indicators for 5-step onboarding
    const indicators = document.querySelectorAll(".rounded-full");
    expect(indicators.length).toBe(5);
  });
});
