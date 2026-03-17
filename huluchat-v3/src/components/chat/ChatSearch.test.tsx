/**
 * ChatSearch Component Tests - TASK-202
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatSearch } from "./ChatSearch";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "chat.searchInConversation": "Search in conversation",
        "chat.searchPlaceholder": "Search keywords...",
        "chat.searchQuery": "Search query",
        "chat.searchMatchCount": `${options?.current || 0} / ${options?.total || 0}`,
        "chat.searchNoMatch": "No match",
        "chat.searchCaseSensitive": "Case sensitive",
        "chat.searchPrev": "Previous match",
        "chat.searchNext": "Next match",
        "chat.searchClose": "Close search",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ChatSearch", () => {
  const mockOnSearch = vi.fn();
  const mockOnNavigate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(
      <ChatSearch
        isOpen={false}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search keywords...")).toBeInTheDocument();
  });

  it("should call onSearch when input changes", async () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(input, { target: { value: "test" } });

    expect(mockOnSearch).toHaveBeenCalledWith("test", false);
  });

  it("should toggle case sensitivity", async () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const caseButton = screen.getByLabelText("Case sensitive");
    fireEvent.click(caseButton);

    expect(mockOnSearch).toHaveBeenCalledWith("", true);
  });

  it("should display match count when query is present", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={5}
        currentMatch={2}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });

  it("should display no match when count is 0", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByText("No match")).toBeInTheDocument();
  });

  it("should call onNavigate when next button is clicked", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={3}
        currentMatch={0}
      />
    );

    const nextButton = screen.getByLabelText("Next match");
    fireEvent.click(nextButton);

    expect(mockOnNavigate).toHaveBeenCalledWith("next");
  });

  it("should call onNavigate when prev button is clicked", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={3}
        currentMatch={1}
      />
    );

    const prevButton = screen.getByLabelText("Previous match");
    fireEvent.click(prevButton);

    expect(mockOnNavigate).toHaveBeenCalledWith("prev");
  });

  it("should call onClose when close button is clicked", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const closeButton = screen.getByLabelText("Close search");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onNavigate on Enter key", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={3}
        currentMatch={0}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnNavigate).toHaveBeenCalledWith("next");
  });

  it("should call onNavigate prev on Shift+Enter", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={3}
        currentMatch={1}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(mockOnNavigate).toHaveBeenCalledWith("prev");
  });

  it("should call onClose on Escape key", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const input = screen.getByPlaceholderText("Search keywords...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should disable navigation buttons when no matches", () => {
    render(
      <ChatSearch
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onNavigate={mockOnNavigate}
        matchCount={0}
        currentMatch={0}
      />
    );

    const nextButton = screen.getByLabelText("Next match");
    const prevButton = screen.getByLabelText("Previous match");

    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeDisabled();
  });
});
