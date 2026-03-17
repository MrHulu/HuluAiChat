/**
 * SearchBar Tests
 *
 * Tests for knowledge center search bar component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

// Mock searchData module
vi.mock("@/data/searchData", () => ({
  createSearchIndex: vi.fn(),
  searchKnowledge: vi.fn(),
  getSearchResultTypeLabel: vi.fn((type: string) => `knowledge.search.type.${type}`),
}));

import { searchKnowledge, getSearchResultTypeLabel } from "@/data/searchData";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "knowledge.search.placeholder": "Search tips, FAQ...",
        "knowledge.search.resultsCount": `${options?.count ?? 0} results`,
        "knowledge.search.type.tip": "Tip",
        "knowledge.search.type.faq": "FAQ",
        "knowledge.search.type.model": "Model",
        "common.clear": "Clear",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("SearchBar", () => {
  const mockResults = [
    {
      id: "tip-1",
      type: "tip" as const,
      title: "Be Specific",
      description: "Use specific language for better results",
    },
    {
      id: "faq-1",
      type: "faq" as const,
      title: "How to use?",
      description: "Click and type your message",
    },
    {
      id: "model-1",
      type: "model" as const,
      title: "GPT-4",
      description: "Best for complex reasoning",
    },
  ];

  const defaultProps = {
    onNavigateToTip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchKnowledge).mockReturnValue([]);
    vi.mocked(getSearchResultTypeLabel).mockImplementation(
      (type: string) => `knowledge.search.type.${type}`
    );
  });

  describe("rendering", () => {
    it("should render search input with placeholder", () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByPlaceholderText("Search tips, FAQ...")).toBeInTheDocument();
    });

    it("should have search icon", () => {
      render(<SearchBar {...defaultProps} />);
      const searchIcon = document.querySelector(".lucide-search");
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe("search input", () => {
    it("should update query on input", () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test query" } });

      expect(input).toHaveValue("test query");
    });

    it("should show clear button when query has value", () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });

    it("should clear query when clear button clicked", () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByRole("button", { name: /clear/i }));

      expect(input).toHaveValue("");
    });
  });

  describe("search results", () => {
    it("should not show results dropdown for short queries", () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "a" } });

      expect(searchKnowledge).not.toHaveBeenCalled();
    });

    it("should search when query is at least 2 characters", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "te" } });

      await waitFor(() => {
        expect(searchKnowledge).toHaveBeenCalledWith("te");
      });
    });

    it("should show search results dropdown", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("Be Specific")).toBeInTheDocument();
      });

      expect(screen.getByText("How to use?")).toBeInTheDocument();
      expect(screen.getByText("GPT-4")).toBeInTheDocument();
    });

    it("should show results count", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("3 results")).toBeInTheDocument();
      });
    });

    it("should highlight search terms in results", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "specific" } });

      await waitFor(() => {
        const mark = document.querySelector("mark");
        expect(mark).toBeInTheDocument();
      });
    });
  });

  describe("result click", () => {
    it("should clear search when result clicked", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("Be Specific")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Be Specific"));

      expect(input).toHaveValue("");
    });

    it("should call onNavigateToTip when tip result clicked", async () => {
      vi.mocked(searchKnowledge).mockReturnValue(mockResults);
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText("Search tips, FAQ...");

      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByText("Be Specific")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Be Specific"));

      expect(defaultProps.onNavigateToTip).toHaveBeenCalled();
    });
  });

  describe("custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(<SearchBar {...defaultProps} className="custom-class" />);
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});
