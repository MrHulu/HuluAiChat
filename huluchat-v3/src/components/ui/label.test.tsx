import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Label } from "./label";

describe("Label", () => {
  describe("Rendering", () => {
    it("should render label with text", () => {
      render(<Label>Label Text</Label>);

      expect(screen.getByText("Label Text")).toBeInTheDocument();
    });

    it("should render as label element", () => {
      render(<Label>Label</Label>);

      const label = screen.getByText("Label");
      expect(label.tagName).toBe("LABEL");
    });

    it("should have data-slot attribute", () => {
      render(<Label>Label</Label>);

      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("data-slot", "label");
    });
  });

  describe("Default Classes", () => {
    it("should apply default classes", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("text-sm");
      expect(label.className).toContain("font-medium");
      expect(label.className).toContain("leading-none");
    });

    it("should have transition classes", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("transition-all");
      expect(label.className).toContain("duration-200");
    });

    it("should have peer-disabled classes", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("peer-disabled:cursor-not-allowed");
      expect(label.className).toContain("peer-disabled:opacity-70");
    });

    it("should have peer-focus-visible class", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("peer-focus-visible:text-foreground");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<Label className="custom-label">Label</Label>);

      expect(screen.getByText("Label")).toHaveClass("custom-label");
    });

    it("should merge custom className with default classes", () => {
      render(<Label className="text-lg">Label</Label>);

      const label = screen.getByText("Label");
      expect(label.className).toContain("text-lg");
      expect(label.className).toContain("font-medium");
    });
  });

  describe("HTML For Attribute", () => {
    it("should apply htmlFor attribute", () => {
      render(<Label htmlFor="email">Email</Label>);

      const label = screen.getByText("Email");
      expect(label).toHaveAttribute("for", "email");
    });

    it("should associate label with input", () => {
      render(
        <div>
          <Label htmlFor="username">Username</Label>
          <input id="username" type="text" />
        </div>
      );

      const label = screen.getByText("Username");
      expect(label).toHaveAttribute("for", "username");
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLLabelElement | null };
      render(<Label ref={ref}>Label</Label>);

      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });
  });

  describe("Accessibility", () => {
    it("should be focusable when associated with focusable input", () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" type="text" />
        </div>
      );

      const label = screen.getByText("Test Label");
      expect(label).toHaveAttribute("for", "test-input");
    });

    it("should support aria attributes", () => {
      render(
        <Label aria-label="Custom aria label">Label</Label>
      );

      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("aria-label", "Custom aria label");
    });

    it("should support aria-describedby", () => {
      render(
        <div>
          <Label aria-describedby="label-hint">Email</Label>
          <span id="label-hint">Enter your email address</span>
        </div>
      );

      const label = screen.getByText("Email");
      expect(label).toHaveAttribute("aria-describedby", "label-hint");
    });
  });

  describe("With Form Controls", () => {
    it("should work with text input", () => {
      render(
        <div>
          <Label htmlFor="name">Name</Label>
          <input id="name" type="text" />
        </div>
      );

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    it("should work with checkbox", () => {
      render(
        <div>
          <Label htmlFor="agree">I agree</Label>
          <input id="agree" type="checkbox" />
        </div>
      );

      expect(screen.getByLabelText("I agree")).toBeInTheDocument();
    });

    it("should work with select", () => {
      render(
        <div>
          <Label htmlFor="country">Country</Label>
          <select id="country">
            <option value="us">US</option>
            <option value="uk">UK</option>
          </select>
        </div>
      );

      expect(screen.getByLabelText("Country")).toBeInTheDocument();
    });

    it("should work with textarea", () => {
      render(
        <div>
          <Label htmlFor="message">Message</Label>
          <textarea id="message" />
        </div>
      );

      expect(screen.getByLabelText("Message")).toBeInTheDocument();
    });
  });

  describe("Peer State Styles", () => {
    it("should have peer-disabled cursor style", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("peer-disabled:cursor-not-allowed");
    });

    it("should have peer-disabled opacity style", () => {
      render(<Label data-testid="label">Label</Label>);

      const label = screen.getByTestId("label");
      expect(label.className).toContain("peer-disabled:opacity-70");
    });
  });

  describe("Display Name", () => {
    it("should have displayName", () => {
      // Label uses Radix UI's LabelPrimitive.Root.displayName
      expect(Label.displayName).toBeDefined();
    });
  });

  describe("Event Handling", () => {
    it("should handle onClick event", async () => {
      const handleClick = vi.fn();
      render(<Label onClick={handleClick}>Clickable Label</Label>);

      await userEvent.click(screen.getByText("Clickable Label"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle hover state", async () => {
      render(<Label data-testid="hover-label">Hover Label</Label>);

      const label = screen.getByTestId("hover-label");
      await userEvent.hover(label);

      expect(label).toBeInTheDocument();
    });
  });
});
