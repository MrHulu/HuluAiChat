/**
 * TemplateSelector Tests
 *
 * TASK-197: Session Templates
 * Tests for template selector component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplateSelector, TemplateIcon } from "./TemplateSelector";
import * as apiClient from "@/api/client";

// Mock API client
vi.mock("@/api/client", () => ({
  listSessionTemplates: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        "templates.loading": "Loading templates...",
        "templates.loadError": "Failed to load templates",
        "templates.builtIn.general.name": "General Chat",
        "templates.builtIn.general.description": "A general purpose chat session",
        "templates.builtIn.code.name": "Code Assistant",
        "common.retry": "Retry",
      };
      return translations[key] ?? fallback ?? key;
    },
  }),
}));

const mockTemplates = [
  {
    id: "general",
    name: "General",
    description: "A general purpose chat",
    icon: "💬",
    is_builtin: true,
    default_model: null,
  },
  {
    id: "code",
    name: "Code",
    description: "Code assistance",
    icon: "💻",
    is_builtin: true,
    default_model: "gpt-4",
  },
  {
    id: "custom",
    name: "Custom Template",
    description: "A custom template",
    icon: "📝",
    is_builtin: false,
    default_model: "deepseek-chat",
  },
];

describe("TemplateSelector", () => {
  const defaultProps = {
    onSelectTemplate: vi.fn(),
    className: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show loading state initially", () => {
      vi.mocked(apiClient.listSessionTemplates).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<TemplateSelector {...defaultProps} />);
      expect(screen.getByText("Loading templates...")).toBeInTheDocument();
    });
  });

  describe("loaded state", () => {
    it("should render templates after loading", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockResolvedValue(mockTemplates);
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("General Chat")).toBeInTheDocument();
      });

      expect(screen.getByText("Code Assistant")).toBeInTheDocument();
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    it("should display template icons", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockResolvedValue(mockTemplates);
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("💬")).toBeInTheDocument();
      });

      expect(screen.getByText("💻")).toBeInTheDocument();
      expect(screen.getByText("📝")).toBeInTheDocument();
    });

    it("should display default model when available", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockResolvedValue(mockTemplates);
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("gpt-4")).toBeInTheDocument();
      });

      expect(screen.getByText("deepseek-chat")).toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("should call onSelectTemplate when template clicked", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockResolvedValue(mockTemplates);
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("General Chat")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("General Chat"));

      expect(defaultProps.onSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
    });
  });

  describe("error handling", () => {
    it("should show error message when loading fails", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockRejectedValue(new Error("Network error"));
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load templates")).toBeInTheDocument();
      });

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("should have retry button in error state", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockRejectedValue(new Error("Network error"));
      render(<TemplateSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe("custom className", () => {
    it("should apply custom className", async () => {
      vi.mocked(apiClient.listSessionTemplates).mockResolvedValue(mockTemplates);
      const { container } = render(
        <TemplateSelector {...defaultProps} className="custom-class" />
      );

      await waitFor(() => {
        expect(container.querySelector(".custom-class")).toBeInTheDocument();
      });
    });
  });

  describe("TemplateIcon", () => {
    it("should render with icon", () => {
      render(<TemplateIcon icon="📝" name="Test" />);
      expect(screen.getByText("📝")).toBeInTheDocument();
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should use default icon when not provided", () => {
      render(<TemplateIcon name="Test" />);
      expect(screen.getByText("📝")).toBeInTheDocument();
    });
  });
});
