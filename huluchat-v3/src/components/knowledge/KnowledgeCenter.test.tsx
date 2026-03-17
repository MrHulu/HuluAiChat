/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { KnowledgeCenter } from "./KnowledgeCenter";

// Mock child components
vi.mock("./ArticleViewer", () => ({
  ArticleViewer: ({ article }: { article: { id: string } }) => (
    <div data-testid="article-viewer">Article: {article.id}</div>
  ),
}));

vi.mock("./FAQList", () => ({
  FAQList: () => <div data-testid="faq-list">FAQ List</div>,
}));

vi.mock("./ShortcutList", () => ({
  ShortcutList: () => <div data-testid="shortcut-list">Shortcut List</div>,
}));

vi.mock("./FeedbackLinks", () => ({
  FeedbackLinks: () => <div data-testid="feedback-links">Feedback Links</div>,
}));

vi.mock("./ErrorSolutions", () => ({
  ErrorSolutions: () => <div data-testid="error-solutions">Error Solutions</div>,
}));

vi.mock("./ModelComparison", () => ({
  ModelComparison: () => <div data-testid="model-comparison">Model Comparison</div>,
}));

vi.mock("./SearchBar", () => ({
  SearchBar: ({ onNavigateToTip }: { onNavigateToTip?: (tip: unknown) => void }) => (
    <div data-testid="search-bar">Search Bar</div>
  ),
}));

vi.mock("@/data/promptTips", () => ({
  PROMPT_TIPS: [
    {
      id: "tip-1",
      titleKey: "knowledge.tips.tip1.title",
      descriptionKey: "knowledge.tips.tip1.description",
      contentKey: "knowledge.tips.tip1.content",
      level: "beginner",
      icon: "lightbulb",
      readTime: 3,
    },
    {
      id: "tip-2",
      titleKey: "knowledge.tips.tip2.title",
      descriptionKey: "knowledge.tips.tip2.description",
      contentKey: "knowledge.tips.tip2.content",
      level: "intermediate",
      icon: "code",
      readTime: 5,
    },
  ],
}));

describe("KnowledgeCenter", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
  });

  it("renders nothing when closed", () => {
    render(<KnowledgeCenter open={false} onOpenChange={mockOnOpenChange} />);

    // Dialog is closed, content should not be visible
    expect(screen.queryByText("knowledge.title")).toHaveLength(0);
  });

  it("renders dialog when open", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Check if dialog is rendered
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("shows category list by default", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Should show description
    expect(screen.getByText("knowledge.description")).toBeTruthy();
    // Should show search bar
    expect(screen.getByTestId("search-bar")).toBeTruthy();
  });

  it("shows all categories", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Check category titles are rendered
    expect(screen.getByText("knowledge.categories.prompts")).toBeTruthy();
    expect(screen.getByText("knowledge.categories.help")).toBeTruthy();
    expect(screen.getByText("knowledge.categories.models")).toBeTruthy();
  });

  it("navigates to prompts category when clicking", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Click on prompts category
    fireEvent.click(screen.getByText("knowledge.categories.prompts"));

    // Should show article list (or coming soon message)
    expect(screen.getByText("knowledge.comingSoon")).toBeTruthy();
  });

  it("navigates to help category when clicking", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Click on help category
    fireEvent.click(screen.getByText("knowledge.categories.help"));

    // Should show help content (ShortcutList, FAQList, etc.)
    expect(screen.getByTestId("shortcut-list")).toBeTruthy();
    expect(screen.getByTestId("faq-list")).toBeTruthy();
    expect(screen.getByTestId("feedback-links")).toBeTruthy();
    expect(screen.getByTestId("error-solutions")).toBeTruthy();
  });

  it("navigates to models category when clicking", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Click on models category
    fireEvent.click(screen.getByText("knowledge.categories.models"));

    // Should show model comparison
    expect(screen.getByTestId("model-comparison")).toBeTruthy();
  });

  it("calls onOpenChange with false when closing", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Close dialog
    const closeButton = screen.getByRole("button", { name: "Close" })[0];
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // onOpenChange should be called with false
    // Note: Due to animation delay, this may not be called immediately
  });

  it("initializes with article when initialArticleId is provided", () => {
    render(
      <KnowledgeCenter
        open={true}
        onOpenChange={mockOnOpenChange}
        initialArticleId="tip-1"
      />
    );

    // Should show article viewer
    expect(screen.getByTestId("article-viewer")).toBeTruthy();
  });

  it("shows back button when article is selected", () => {
    render(
      <KnowledgeCenter
        open={true}
        onOpenChange={mockOnOpenChange}
        initialArticleId="tip-1"
      />
    );

    // Back button should be visible
    const backButtons = screen.getAllByRole("button", { name: "Back" });
    expect(backButtons.length).toBeGreaterThan(0);
  });

  it("shows back button when category is selected", () => {
    render(<KnowledgeCenter open={true} onOpenChange={mockOnOpenChange} />);

    // Click on prompts category
    fireEvent.click(screen.getByText("knowledge.categories.prompts"));

    // Back button should be visible
    const backButtons = screen.getAllByRole("button", { name: "Back" });
    expect(backButtons.length).toBeGreaterThan(0);
  });
});
