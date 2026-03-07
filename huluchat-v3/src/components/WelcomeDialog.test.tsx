/**
 * WelcomeDialog Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeDialog } from "./WelcomeDialog";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "welcome.step1.title": "Welcome to HuluChat",
        "welcome.step1.description": "Your AI assistant for productivity",
        "welcome.step2.title": "Document Chat (RAG)",
        "welcome.step2.description": "Upload documents and chat with them",
        "welcome.step3.title": "Plugin System",
        "welcome.step3.description": "Extend functionality with plugins",
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
    expect(screen.getByText("Document Chat (RAG)")).toBeInTheDocument();
  });

  it("calls onComplete when Get Started is clicked", () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to last step
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
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

    // Should have 3 step indicators
    const indicators = document.querySelectorAll(".rounded-full");
    expect(indicators.length).toBe(3);
  });
});
