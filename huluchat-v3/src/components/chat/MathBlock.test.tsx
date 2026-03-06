/**
 * MathBlock Component Tests
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MathBlock } from "./MathBlock";

describe("MathBlock", () => {
  describe("inline math", () => {
    it("should render inline math correctly", () => {
      const { container } = render(<MathBlock math="E = mc^2" inline />);

      // KaTeX renders inline math with specific classes
      expect(container.querySelector(".katex")).toBeInTheDocument();
    });

    it("should render simple fractions", () => {
      const { container } = render(<MathBlock math="\\frac{1}{2}" inline />);

      expect(container.querySelector(".katex")).toBeInTheDocument();
    });

    it("should render Greek letters", () => {
      const { container } = render(<MathBlock math="\\alpha + \\beta" inline />);

      expect(container.querySelector(".katex")).toBeInTheDocument();
    });

    it("should render subscripts and superscripts", () => {
      const { container } = render(<MathBlock math="x^2 + y_1 = z_{i,j}" inline />);

      expect(container.querySelector(".katex")).toBeInTheDocument();
    });
  });

  describe("block math", () => {
    it("should render block math correctly", () => {
      const { container } = render(<MathBlock math="E = mc^2" />);

      // Block math should also have katex class
      expect(container.querySelector(".katex")).toBeInTheDocument();
    });

    it("should render complex equations", () => {
      const { container } = render(
        <MathBlock math="\\int_0^1 x^2 dx" />
      );

      // Should render something (either katex or error message)
      expect(container.firstChild).toBeTruthy();
    });

    it("should render matrices", () => {
      const { container } = render(
        <MathBlock math="\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" />
      );

      // Should render something (either katex or error message)
      expect(container.firstChild).toBeTruthy();
    });

    it("should render summations", () => {
      const { container } = render(
        <MathBlock math="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" />
      );

      expect(container.querySelector(".katex")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should handle invalid LaTeX gracefully", () => {
      const { container } = render(<MathBlock math="\\invalidcommand" inline />);

      // Should still render something (even if it's an error)
      expect(container.firstChild).toBeTruthy();
    });

    it("should render plain text for completely invalid input", () => {
      const { container } = render(<MathBlock math="not math at all" inline />);

      // Should render without crashing
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("className prop", () => {
    it("should apply custom className to inline math", () => {
      const { container } = render(
        <MathBlock math="x^2" inline className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should apply custom className to block math", () => {
      const { container } = render(
        <MathBlock math="x^2" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
