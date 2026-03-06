/**
 * MermaidBlock Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MermaidBlock } from "./MermaidBlock";

// Mock mermaid
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg>test-svg</svg>" }),
  },
}));

// Mock useTheme hook
vi.mock("@/components/theme-provider", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}));

describe("MermaidBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render mermaid chart", async () => {
    const chart = `graph TD
    A[Start] --> B[End]`;

    render(<MermaidBlock chart={chart} />);

    await waitFor(() => {
      expect(screen.getByText("test-svg")).toBeInTheDocument();
    });
  });

  it("should render empty for empty chart", () => {
    const { container } = render(<MermaidBlock chart="" />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("should show error for invalid chart", async () => {
    const mermaid = await import("mermaid");
    vi.mocked(mermaid.default.render).mockRejectedValueOnce(
      new Error("Invalid syntax")
    );

    render(<MermaidBlock chart="invalid mermaid syntax" />);

    await waitFor(() => {
      expect(screen.getByText("Chart Error")).toBeInTheDocument();
    });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <MermaidBlock chart="graph TD\nA-->B" className="custom-class" />
    );

    const mermaidContainer = container.querySelector(".mermaid-container");
    expect(mermaidContainer).toHaveClass("custom-class");
  });
});
